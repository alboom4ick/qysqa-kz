import os
from decouple import config
import json
from crewai import Agent, Task, Crew, Process
from crewai.tools import BaseTool
from PyPDF2 import PdfReader
from summarizer_agent import SummarizerAgent

# Configure OpenAI API key from .env file
OPENAI_API_KEY = config('OPENAI_API_KEY', default=None)
if not OPENAI_API_KEY:
    raise ValueError("Please set OPENAI_API_KEY in .env file")

os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

class PDFReaderTool(BaseTool):
    name: str = "PDF Reader"
    description: str = "Reads the content of a PDF file and returns the text."

    def _run(self, pdf_path: str) -> str:
        try:
            print(f"PDFReaderTool: Attempting to read file at {pdf_path}")
            print(f"File exists: {os.path.exists(pdf_path)}")
            print(f"File size: {os.path.getsize(pdf_path)} bytes")
            
            reader = PdfReader(pdf_path)
            print(f"PDF loaded successfully. Number of pages: {len(reader.pages)}")
            
            text = ""
            for i, page in enumerate(reader.pages):
                print(f"Processing page {i+1}/{len(reader.pages)}")
                page_text = page.extract_text()
                text += page_text
                print(f"Page {i+1} extracted: {len(page_text)} characters")
            
            print(f"Total text extracted: {len(text)} characters")
            return text
            
        except Exception as e:
            error_msg = f"Error reading PDF file: {str(e)}"
            print(error_msg)
            print(f"Error type: {type(e)}")
            import traceback
            print(f"Error traceback: {traceback.format_exc()}")
            raise Exception(error_msg)

def main():
    # Initialize tools and agents
    pdf_reader_tool = PDFReaderTool()
    
    reader_agent = Agent(
        role='Reader',
        goal='Extract text from PDF documents and prepare it for UI conversion.',
        verbose=True,
        memory=True,
        backstory="""You are an expert in extracting and structuring text from PDF documents.
        Your task is to extract text and organize it into clear sections that can be converted to summary""",
        tools=[pdf_reader_tool],
        allow_delegation=True
    )

    # Create UI Summarizer agent with RAG context
    summarizer = SummarizerAgent()
    summarizer_agent = summarizer.agent

    # Define tasks
    read_pdf_task = Task(
        description="""Read the content of the PDF document located at {pdf_path}.
        Extract the text and organize it into clear sections with titles and bullet points.""",
        expected_output="Structured text extracted from the PDF document, organized into sections.",
        tools=[pdf_reader_tool],
        agent=reader_agent,
    )

    summarize_text_task = Task(
        description="""Generate a UI JSON representation of the document content.
        Follow the defined structure to create a properly formatted UI JSON.
        Include appropriate node types, styling, and hierarchy as specified in the format guide.""",
        expected_output='''A JSON structure representing the document's content in UI format, following the specified schema: 
{
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
}

''',
        agent=summarizer_agent
    )

    # Create and execute crew
    crew = Crew(
        agents=[reader_agent, summarizer_agent],
        tasks=[read_pdf_task, summarize_text_task],
        process=Process.sequential
    )

    # Execute the crew
    result = crew.kickoff(inputs={'pdf_path': 'Lecture 6.pdf'})
    
    # Get the string content from CrewOutput
    result_str = str(result)
    
    # Remove ```json markers if present
    result_str = result_str.replace('```json', '').replace('```', '').strip()
    
    # Parse the cleaned string to JSON
    try:
        result_json = json.loads(result_str)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {str(e)}")
        result_json = {"error": "Failed to parse JSON"}
    
    # Save the result
    output_file = 'response_output.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result_json, f, ensure_ascii=False, indent=2)
    
    print(f"Result saved to {output_file}")

if __name__ == "__main__":
    main() 