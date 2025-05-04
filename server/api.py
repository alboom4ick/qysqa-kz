from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel
from decouple import config
import os
import json
import boto3
from botocore.exceptions import ClientError
from crewai import Agent, Task, Crew, Process
from main import PDFReaderTool
from summarizer_agent import SummarizerAgent
from test_generator_agent import TestGeneratorAgent
from openai import OpenAI
import logging
import time

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Логируем информацию о запросе
        logger.info(f"Request: {request.method} {request.url.path}")
        logger.info(f"Headers: {dict(request.headers)}")
        
        # Получаем тело запроса
        body = await request.body()
        try:
            # Пытаемся декодировать JSON
            body_json = json.loads(body)
            logger.info(f"Request body: {json.dumps(body_json, indent=2)}")
        except json.JSONDecodeError:
            # Если не JSON, логируем как есть
            logger.info(f"Request body: {body.decode()}")
        
        # Замеряем время выполнения
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Логируем время выполнения
        logger.info(f"Request processed in {process_time:.2f} seconds")
        
        return response

class S3FileLocation(BaseModel):
    """
    Модель для указания расположения файла в S3
    """
    file_key: str
    folder_path: str = ""  # Опциональный путь к папке в bucket

class S3Response(BaseModel):
    """
    Модель для ответа с информацией о расположении файла в S3
    """
    bucket: str
    file_path: str
    url: str

class ProcessPDFResponse(BaseModel):
    ui_summary: S3Response

class TestGenerationRequest(BaseModel):
    content: str
    num_questions: int = 5

class TestGenerationResponse(BaseModel):
    s3_location: S3Response

class JSONProcessorAgent:
    def __init__(self):
        self.agent = Agent(
            role='JSON Processor',
            goal='Process and transform JSON data according to specific requirements',
            verbose=True,
            memory=True,
            backstory="""You are an expert in processing and transforming JSON data.
            Your task is to analyze incoming JSON and generate test from it according to the requirements.""",
            allow_delegation=True
        )

class JSONProcessRequest(BaseModel):
    json_data: dict

class JSONProcessResponse(BaseModel):
    processed_json: dict

app = FastAPI(
    title="PDF Summarizer API",
    description="API для обработки PDF файлов и генерации структурированного JSON",
    version="1.0.0"
)

# Добавляем middleware для логирования
app.add_middleware(RequestLoggingMiddleware)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешаем все источники
    allow_credentials=True,  # Разрешаем куки
    allow_methods=["*"],  # Разрешаем все методы
    allow_headers=["*"],  # Разрешаем все заголовки
    expose_headers=["*"],  # Разрешаем доступ ко всем заголовкам ответа
    max_age=600,  # Кэширование CORS на 10 минут
)

# Конфигурация OpenAI API
OPENAI_API_KEY = config('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    raise ValueError("Please set OPENAI_API_KEY in .env file")

# Устанавливаем API ключ для OpenAI
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
client = OpenAI(api_key=OPENAI_API_KEY)

# Конфигурация AWS
AWS_BUCKET_NAME = 'qysqa'

# Инициализация S3 клиента
s3_client = boto3.client('s3')

async def download_file_from_s3(bucket: str, file_location: S3FileLocation, local_path: str):
    """
    Загружает файл из S3 bucket
    """
    try:
        # Формируем полный путь к файлу в S3
        s3_path = os.path.join(file_location.folder_path, file_location.file_key).replace('\\', '/')
        s3_path = s3_path.lstrip('/')  # Убираем начальный слеш, если есть
        
        s3_client.download_file(bucket, s3_path, local_path)
        return True
    except ClientError as e:
        print(f"Error downloading file from S3: {str(e)}")
        return False

async def upload_json_to_s3(bucket: str, json_data: dict, folder_name: str, file_name: str) -> dict:
    """
    Загружает JSON в S3 bucket в папку summaries
    
    Args:
        bucket (str): Имя S3 bucket
        json_data (dict): JSON данные для загрузки
        folder_name (str): Имя папки в bucket
        file_name (str): Имя файла
        
    Returns:
        dict: Информация о загруженном файле
    """
    try:
        # Формируем путь для сохранения в папке summaries
        s3_path = f"{folder_name}/{file_name}.json"
        
        # Создаем временный файл для загрузки
        temp_json_path = f"temp_{file_name}.json"
        with open(temp_json_path, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, ensure_ascii=False, indent=2)
        
        # Загружаем файл в S3
        s3_client.upload_file(temp_json_path, bucket, s3_path)
        
        # Удаляем временный файл
        if os.path.exists(temp_json_path):
            os.remove(temp_json_path)
        
        # Получаем URL для доступа к файлу
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': s3_path},
            ExpiresIn=3600  # URL действителен 1 час
        )
        
        return {
            "bucket": bucket,
            "file_path": s3_path,
            "url": url
        }
        
    except ClientError as e:
        print(f"Error uploading JSON to S3: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload result to S3")

@app.post("/process-pdf/")
async def process_pdf(file_location: S3FileLocation):
    """
    Принимает информацию о расположении PDF файла в S3 bucket,
    обрабатывает его и возвращает информацию о расположении результата UI JSON
    
    Args:
        file_location (S3FileLocation): Информация о расположении файла в S3
    """
    try:
        # Проверяем расширение файла
        if not file_location.file_key.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Файл должен быть в формате PDF")

        # Создаем временный путь для файла
        temp_path = f"temp_{os.path.basename(file_location.file_key)}"
        print(f"Created temporary path: {temp_path}")

        # Загружаем файл из S3
        print(f"Downloading file from S3: {file_location.folder_path}/{file_location.file_key}")
        success = await download_file_from_s3(AWS_BUCKET_NAME, file_location, temp_path)
        if not success:
            raise HTTPException(
                status_code=404, 
                detail=f"Файл не найден в S3 bucket по пути: {os.path.join(file_location.folder_path, file_location.file_key)}"
            )
        print(f"File downloaded successfully to: {temp_path}")
        print(f"File exists: {os.path.exists(temp_path)}")
        print(f"File size: {os.path.getsize(temp_path)} bytes")

        try:
            # Инициализируем инструменты и агентов
            print("Initializing PDFReaderTool...")
            pdf_reader_tool = PDFReaderTool()
            print("PDFReaderTool initialized successfully")
            
            print("Creating Reader Agent...")
            reader_agent = Agent(
                role='Reader',
                goal='Extract text from PDF documents and prepare it for processing.',
                verbose=True,
                memory=True,
                backstory="""You are an expert in extracting and structuring text from PDF documents.
                Your task is to extract text and organize it into clear sections.""",
                tools=[pdf_reader_tool],
                allow_delegation=True
            )
            print("Reader Agent created successfully")

            # Создаем UI Summarizer агента
            print("Creating Summarizer Agent...")
            summarizer = SummarizerAgent()
            summarizer_agent = summarizer.agent
            print("Summarizer Agent created successfully")

            # Определяем задачи
            print("Creating tasks...")
            read_pdf_task = Task(
                description=f"""Read the content of the PDF document located at {temp_path}.
                Extract the text and organize it into clear sections with titles and bullet points.""",
                expected_output="Structured text extracted from the PDF document, organized into sections.",
                tools=[pdf_reader_tool],
                agent=reader_agent
            )
            print(f"PDF reading task created with ID: {read_pdf_task.id}")

            summarize_text_task = Task(
                description=f"""Using the content extracted by the Reader agent, generate a UI JSON representation.
                The content you need to process is: {{result_{read_pdf_task.id}}}
                
                Follow the defined structure to create a properly formatted UI JSON.
                Include appropriate node types, styling, and hierarchy as specified in the format guide.""",
                expected_output='''{
  "nodeType": "STACK", // This defines the layout type, a stack container
  "id": "c8b4c8e2-f851-435f-bbaf-82b28cbdbbc0", // Unique identifier for this node
  "background": "DEFAULT", // Background style applied to this stack
  "padding": "60px 40px", // Padding inside the stack
  "borderRadius": "8px", // Rounds the corners of the stack
  "gap": 32, // Gap between child nodes inside the stack
  "justifyContent": "SPACE_BETWEEN", // Space between child elements
  "children": [ // Array of child nodes inside the stack
    {
      "nodeType": "STACK", // A nested stack container inside the first stack
      "id": "5791a646-10d7-4c84-b5c3-8dd23e82a18e", // Unique identifier for the nested stack
      "gap": 64, // Gap between children inside the nested stack
      "children": [
        {
          "nodeType": "TEXT", // Text node containing content
          "id": "f5c1e645-ddb1-4c1c-97ea-e321e2db30ea", // Unique identifier for the text node
          "fontSize": "BIG", // Font size for the text
          "textAlign": "CENTER", // Text alignment (centered)
          "fontColor": "PRIMARY", // Text color (primary color in the theme)
          "fontWeight": "BOLD", // Font weight (bold)
          "htmltext": "ALGORITHM II" // The text content in HTML format
        },
        {
          "nodeType": "TITLED_CONTAINER", // Container with a title and content
          "id": "0f6aea71-ed36-4649-b89d-dd299528c1a3", // Unique identifier for the titled container
          "titleText": { // Title of the container
            "nodeType": "TEXT", // Text node for the title
            "id": "84d35e0b-60ae-488f-bb84-c2445de3235b", // Unique identifier for the title text
            "fontSize": "MEDIUM", // Font size for the title
            "textAlign": "LEFT", // Align the title to the left
            "fontColor": "PRIMARY", // Title font color
            "fontWeight": "BOLD", // Title font weight
            "htmltext": "COURSE DETAILS" // Title text content
          },
          "content": { // Content inside the container
            "nodeType": "STACK", // Stack layout for content
            "id": "7de92892-69aa-4e39-9585-cc1a9b5e1f72", // Unique identifier for content stack
            "gap": 2, // Gap between child nodes in the content stack
            "children": [ // Child elements inside the content stack
              {
                "nodeType": "ICON_TEXT", // Icon-text combination
                "id": "e0b5187c-8b37-4be4-bf55-cd690c9c165e", // Unique identifier for this icon-text combination
                "text": {
                  "nodeType": "TEXT", // Text node
                  "id": "241027e2-e247-4c54-86a4-b5b0c65246b9", // Unique identifier for the text node
                  "htmltext": "<b>Department:</b> Computer Science" // HTML formatted text
                },
                "icon": "🏫" // Icon associated with the text (school icon)
              },
              {
                "nodeType": "ICON_TEXT", // Another icon-text combination
                "id": "c88f2ae2-b86b-4736-9160-5484e0c5380f", // Unique identifier
                "text": {
                  "nodeType": "TEXT",
                  "id": "9cb3ec64-e163-49b9-a556-39c67e329d1e",
                  "htmltext": "<b>Course Code:</b> CSS -228"
                },
                "icon": "📚"
              }
              // Other ICON_TEXT nodes like "Instructor", "Office", etc. would go here
            ],
            "vertical": true // Stack the content children vertically
          },
          "divided": false // Whether the container is divided into sections (false means no division)
        }
      ],
      "vertical": true // This stack arranges children vertically
    },
    {
      "nodeType": "STACK", // Another stack container
      "id": "d0e024e3-ad5e-4870-84b7-c9f82f88af1c", // Unique identifier for the second stack
      "background": "DEFAULT", // Background style
      "gap": 32, // Gap between child nodes
      "children": [
        {
          "nodeType": "TEXT", // Text node for a title
          "id": "aad75ba0-9aa4-4d0e-bb5e-ffb74ae4b22d", // Unique identifier for the text
          "fontSize": "BIG", // Font size for the title
          "textAlign": "CENTER", // Text alignment (centered)
          "fontColor": "PRIMARY", // Font color (primary theme color)
          "fontWeight": "BOLD", // Font weight (bold)
          "htmltext": "UNION -FIND" // Text content
        },
        {
          "nodeType": "ICON_TEXT", // Icon and text combination
          "id": "b25085d9-1191-4ec6-8352-15f706a1b56f", // Unique identifier
          "text": {
            "nodeType": "TEXT", // Text node
            "id": "5d8c215d-5875-4961-87d9-8e5f99fd19d2",
            "htmltext": "<b>Dynamic Connectivity.</b>" // HTML formatted text
          },
          "icon": "🔗" // Icon associated with the text (link icon)
        }
        // More ICON_TEXT nodes like "Quick Find", "Quick Union", etc.
      ],
      "vertical": true // Stack the content children vertically
    },
    // Additional sections like "DYNAMIC CONNECTIVITY", "MODELING THE OBJECTS" can go here
    {
      "nodeType": "STACK",
      "id": "1881d644-e094-4e5f-96e7-15256be4a511", // Unique identifier for this stack
      "background": "DEFAULT", // Background style for this stack
      "gap": 32, // Gap between child nodes
      "children": [
        {
          "nodeType": "TEXT",
          "id": "546e63fb-02d5-4444-b592-d62f47995229",
          "fontSize": "BIG",
          "textAlign": "CENTER",
          "fontColor": "PRIMARY",
          "fontWeight": "BOLD",
          "htmltext": "DYNAMIC CONNECTIVITY" // Title for this section
        },
        {
          "nodeType": "ICON_TEXT",
          "id": "25029919-2512-4e83-abda-96e4cfd77990", // Unique identifier for this icon-text combination
          "text": {
            "nodeType": "TEXT", // Text node for the icon-text
            "id": "9bc7cb12-3b0d-4e86-b285-b6e3090bc942",
            "htmltext": "<b>Given a set of n objects.</b>" // HTML formatted text content
          },
          "icon": "📦" // Icon (box icon)
        }
        // Additional ICON_TEXT nodes like "Union command", "Find/connected query", etc.
      ],
      "vertical": true // Stack content vertically
    }
  ],
  "vertical": true // The top-level stack arranges its children vertically
}''',
                agent=summarizer_agent
            )
            print(f"Summarize task created with ID: {summarize_text_task.id}")

            # Создаем и выполняем crew
            print("Creating Crew...")
            crew = Crew(
                agents=[reader_agent, summarizer_agent],
                tasks=[read_pdf_task, summarize_text_task],
                process=Process.sequential,
                verbose=True
            )
            
            # Запуск crew
            print("Starting Crew execution...")
            result = crew.kickoff(inputs={'pdf_path': temp_path})
            print("Crew execution completed")
            
            try:
                # Преобразуем результат в строку для обработки
                result_str = str(result)
                print(f"Results received, total length: {len(result_str)}")
                
                # Удаляем маркеры форматирования Markdown
                clean_result = result_str.replace("```json", "").replace("```", "")
                
                # Находим JSON в результате
                json_start = clean_result.find('{')
                if json_start == -1:
                    raise ValueError("No JSON object found in result")
                
                # Ищем соответствующую закрывающую скобку
                open_braces = 0
                json_end = -1
                
                for i, char in enumerate(clean_result[json_start:]):
                    if char == '{':
                        open_braces += 1
                    elif char == '}':
                        open_braces -= 1
                        if open_braces == 0:
                            json_end = json_start + i + 1
                            break
                
                if json_end == -1:
                    raise ValueError("Could not find closing brace for JSON object")
                
                # Извлекаем JSON строку
                json_str = clean_result[json_start:json_end]
                
                # Парсим JSON
                try:
                    ui_json = json.loads(json_str)
                    print(f"Successfully parsed UI JSON, length: {len(json_str)}")
                except json.JSONDecodeError as e:
                    print(f"Error parsing JSON: {str(e)}")
                    ui_json = {"error": "Failed to parse UI JSON", "raw_text": json_str[:1000]}
                
                # Получаем имя файла без расширения для сохранения результатов
                # result_file_name = os.path.splitext(file_location.file_key)[0]
                
                # # Сохраняем результат в S3
                # ui_s3_info = await upload_json_to_s3(
                #     bucket=AWS_BUCKET_NAME,
                #     json_data=ui_json,
                #     folder_name="summaries",
                #     file_name=result_file_name
                # )
                
                # # Удаляем временный файл PDF
                # if os.path.exists(temp_path):
                #     os.remove(temp_path)

                return (ui_json)

            except Exception as e:
                print(f"Error processing results: {str(e)}")
                print(f"Error type: {type(e)}")
                import traceback
                print(f"Error traceback: {traceback.format_exc()}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error processing results: {str(e)}"
                )

        except Exception as e:
            print(f"Error processing PDF: {str(e)}")
            print(f"Error type: {type(e)}")
            import traceback
            print(f"Error traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=500,
                detail=f"Error processing PDF: {str(e)}"
            )

    except Exception as e:
        # Если временный файл существует, удаляем его
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-test/")
async def generate_test(file_location: S3FileLocation):
    """
    Принимает информацию о расположении PDF файла в S3 bucket,
    обрабатывает его и возвращает информацию о расположении результата теста
    
    Args:
        file_location (S3FileLocation): Информация о расположении файла в S3
    """
    try:
        # Проверяем расширение файла
        if not file_location.file_key.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Файл должен быть в формате PDF")

        # Создаем временный путь для файла
        temp_path = f"temp_{os.path.basename(file_location.file_key)}"
        print(f"Created temporary path: {temp_path}")

        # Загружаем файл из S3
        print(f"Downloading file from S3: {file_location.folder_path}/{file_location.file_key}")
        success = await download_file_from_s3(AWS_BUCKET_NAME, file_location, temp_path)
        if not success:
            raise HTTPException(
                status_code=404, 
                detail=f"Файл не найден в S3 bucket по пути: {os.path.join(file_location.folder_path, file_location.file_key)}"
            )
        print(f"File downloaded successfully to: {temp_path}")
        print(f"File exists: {os.path.exists(temp_path)}")
        print(f"File size: {os.path.getsize(temp_path)} bytes")

        try:
            # Инициализируем инструменты и агентов
            print("Initializing PDFReaderTool...")
            pdf_reader_tool = PDFReaderTool()
            print("PDFReaderTool initialized successfully")
            
            print("Creating Reader Agent...")
            reader_agent = Agent(
                role='Reader',
                goal='Extract text from PDF documents and prepare it for processing.',
                verbose=True,
                memory=True,
                backstory="""You are an expert in extracting and structuring text from PDF documents.
                Your task is to extract text and organize it into clear sections.""",
                tools=[pdf_reader_tool],
                allow_delegation=True
            )
            print("Reader Agent created successfully")

            # Создаем Test Generator агента
            print("Creating Test Generator Agent...")
            test_generator = TestGeneratorAgent()
            test_generator_agent = test_generator.agent
            print("Test Generator Agent created successfully")

            # Определяем задачи
            print("Creating tasks...")
            read_pdf_task = Task(
                description=f"""Read the content of the PDF document located at {temp_path}.
                Extract the text and organize it into clear sections with titles and bullet points.""",
                expected_output="Structured text extracted from the PDF document, organized into sections.",
                tools=[pdf_reader_tool],
                agent=reader_agent
            )
            print(f"PDF reading task created with ID: {read_pdf_task.id}")

            generate_test_task = Task(
                description=f"""Using the content extracted by the Reader agent, generate a test with multiple-choice questions.""",
                expected_output="""{
  "title": "History of Kazakhstan - Introductory Test", // The title of the test
  "description": "This test covers the basic topics of the history of Kazakhstan", // A brief description of the test
  "showQuestions": true, // Determines whether the questions should be displayed
  "language": "KAZ", // Language of the test content (KAZ is for Kazakh)
  "questionCreateRequests": [ // Array containing question creation requests
    {
      "questionCreate": {
        "question": "When did the rebellion of Kenesary Kasymov occur?", // The question being asked
        "level": "MEDIUM", // The difficulty level of the question
        "durationInSeconds": 90, // Time limit for answering the question in seconds
        "variants": [ // Possible answer choices
          {
            "text": "1837-1847 years", // Answer choice text
            "correct": true // Indicates that this is the correct answer
          },
          {
            "text": "1916 year", // Incorrect answer choice
            "correct": false // Indicates that this is not the correct answer
          }
        ]
      }
    },
    {
      "questionCreate": {
        "question": "When did the rebellion of Kenesary Kasymov occur?", // The question being asked (repeated for another question)
        "level": "MEDIUM", // The difficulty level of the question
        "durationInSeconds": 90, // Time limit for answering the question in seconds
        "variants": [ // Possible answer choices
          {
            "text": "1837-1847 years", // Correct answer choice
            "correct": true // This is the correct answer
          },
          {
            "text": "1916 year", // Incorrect answer choice
            "correct": false // This is an incorrect answer
          }
        ]
      }
    }
  ]
}""",
                agent=test_generator_agent
            )
            print(f"Test generation task created with ID: {generate_test_task.id}")

            # Создаем и выполняем crew
            print("Creating Crew...")
            crew = Crew(
                agents=[reader_agent, test_generator_agent],
                tasks=[read_pdf_task, generate_test_task],
                process=Process.sequential,
                verbose=True
            )
            
            # Запуск crew
            print("Starting Crew execution...")
            result = crew.kickoff(inputs={'pdf_path': temp_path})
            print("Crew execution completed")
            
            try:
                # Преобразуем результат в строку для обработки
                result_str = str(result)
                print(f"Results received, total length: {len(result_str)}")
                
                # Удаляем маркеры форматирования Markdown
                clean_result = result_str.replace("```json", "").replace("```", "")
                
                # Находим JSON в результате
                json_start = clean_result.find('{')
                if json_start == -1:
                    raise ValueError("No JSON object found in result")
                
                # Ищем соответствующую закрывающую скобку
                open_braces = 0
                json_end = -1
                
                for i, char in enumerate(clean_result[json_start:]):
                    if char == '{':
                        open_braces += 1
                    elif char == '}':
                        open_braces -= 1
                        if open_braces == 0:
                            json_end = json_start + i + 1
                            break
                
                if json_end == -1:
                    raise ValueError("Could not find closing brace for JSON object")
                
                # Извлекаем JSON строку
                json_str = clean_result[json_start:json_end]
                
                try:
                    test_json = json.loads(json_str)
                    print(f"Successfully parsed test JSON, length: {len(json_str)}")
                except json.JSONDecodeError as e:
                    print(f"Error parsing JSON: {str(e)}")
                    test_json = {"error": "Failed to parse test JSON", "raw_text": json_str[:1000]}
                
                # Получаем имя файла без расширения для сохранения результатов
                # result_file_name = os.path.splitext(file_location.file_key)[0]
                
                # # Сохраняем результат в S3
                # test_s3_info = await upload_json_to_s3(
                #     bucket=AWS_BUCKET_NAME,
                #     json_data=test_json,
                #     folder_name="tests",
                #     file_name=result_file_name
                # )
                
                # Удаляем временный файл PDF
                # if os.path.exists(temp_path):
                #     os.remove(temp_path)

                return (test_json)

            except Exception as e:
                print(f"Error processing results: {str(e)}")
                print(f"Error type: {type(e)}")
                import traceback
                print(f"Error traceback: {traceback.format_exc()}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error processing results: {str(e)}"
                )

        except Exception as e:
            print(f"Error processing PDF: {str(e)}")
            print(f"Error type: {type(e)}")
            import traceback
            print(f"Error traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=500,
                detail=f"Error processing PDF: {str(e)}"
            )

    except Exception as e:
        # Если временный файл существует, удаляем его
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-json/", response_model=JSONProcessResponse)
async def process_json(request: JSONProcessRequest):
    """
    Принимает JSON данные, обрабатывает их через агента и возвращает результат
    """
    try:
        # Инициализируем агента
        json_processor = JSONProcessorAgent()
        # Создаем задачу
        process_json_task = Task(
            description="""You are tasked with transforming the provided JSON input into a structured output that converts node-based information into a format for a question-based test structure. Here’s the process:
	1.	Translate the content from the original format into English where applicable.
	2.	Extract key properties like title, description, language, questionCreateRequests, etc.
	3.	For each “questionCreate” node, preserve its structure but ensure:
	•	Translate question text into English.
	•	Maintain the difficulty level and other attributes as is.
	•	Keep the list of variants, ensuring the correct answers are marked accordingly.
	4.	The final output should have:
	•	A title field describing the test.
	•	A description explaining the content of the test.
	•	A showQuestions field indicating whether the questions should be displayed.
	•	A language field that is adjusted to the test’s language (use “ENG” for English).
	•	A questionCreateRequests array containing the translated question and its variants.""",
        expected_output="""{
  "title": "History of Kazakhstan - Introductory Test", // The title of the test
  "description": "This test covers the basic topics of the history of Kazakhstan", // A brief description of the test
  "showQuestions": true, // Determines whether the questions should be displayed
  "language": "KAZ", // Language of the test content (KAZ is for Kazakh)
  "questionCreateRequests": [ // Array containing question creation requests
    {
      "questionCreate": {
        "question": "When did the rebellion of Kenesary Kasymov occur?", // The question being asked
        "level": "MEDIUM", // The difficulty level of the question
        "durationInSeconds": 90, // Time limit for answering the question in seconds
        "variants": [ // Possible answer choices
          {
            "text": "1837-1847 years", // Answer choice text
            "correct": true // Indicates that this is the correct answer
          },
          {
            "text": "1916 year", // Incorrect answer choice
            "correct": false // Indicates that this is not the correct answer
          }
        ]
      }
    },
    {
      "questionCreate": {
        "question": "When did the rebellion of Kenesary Kasymov occur?", // The question being asked (repeated for another question)
        "level": "MEDIUM", // The difficulty level of the question
        "durationInSeconds": 90, // Time limit for answering the question in seconds
        "variants": [ // Possible answer choices
          {
            "text": "1837-1847 years", // Correct answer choice
            "correct": true // This is the correct answer
          },
          {
            "text": "1916 year", // Incorrect answer choice
            "correct": false // This is an incorrect answer
          }
        ]
      }
    }
  ]
}""",
            agent=json_processor.agent
        )
        
        # Создаем и запускаем crew
        crew = Crew(
            agents=[json_processor.agent],
            tasks=[process_json_task],
            verbose=True
        )
        
        # Запускаем crew с входными данными
        result = crew.kickoff(inputs={'json_data': request.json_data})
        
        # Парсим JSON из результата
        try:
            processed_data = json.loads(result)
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=500, detail=f"Ошибка при парсинге JSON: {str(e)}")
        
        return JSONProcessResponse(processed_json=processed_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    """
    Корневой эндпоинт для проверки работоспособности API
    """
    return {"status": "ok", "message": "PDF Summarizer API is running"} 