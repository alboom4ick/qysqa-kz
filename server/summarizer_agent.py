from crewai import Agent
from typing import Dict, Any, List
import json
import re
import uuid
from enum import Enum
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
import os

class FontSize(str, Enum):
    BIG = "BIG"
    MEDIUM = "MEDIUM"
    SMALL = "SMALL"

class TextAlign(str, Enum):
    LEFT = "LEFT"
    CENTER = "CENTER"
    RIGHT = "RIGHT"

class FontColor(str, Enum):
    PRIMARY = "PRIMARY"
    DEFAULT = "DEFAULT"
    SECONDARY = "SECONDARY"
    TERTIARY = "TERTIARY"

class FontWeight(str, Enum):
    BOLD = "BOLD"
    REGULAR = "REGULAR"
    THIN = "THIN"

class Background(str, Enum):
    PRIMARY = "PRIMARY"
    DEFAULT = "DEFAULT"
    SECONDARY = "SECONDARY"
    TERTIARY = "TERTIARY"

class BorderType(str, Enum):
    SOLID = "SOLID"
    DASHED = "DASHED"
    DOTTED = "DOTTED"
    NONE = "NONE"

class JustifyContent(str, Enum):
    SPACE_BETWEEN = "SPACE_BETWEEN"
    SPACE_AROUND = "SPACE_AROUND"
    CENTER = "CENTER"
    STRETCH = "STRETCH"

class AlignItems(str, Enum):
    START = "START"
    CENTER = "CENTER"
    END = "END"
    STRETCH = "STRETCH"

class FlexWrap(str, Enum):
    WRAP = "WRAP"
    NOWRAP = "NOWRAP"

class Icon(str, Enum):
    PEDESTRIAN = "🚶"
    PEDESTRIAN_W = "🚶‍♀️"
    FIRE = "🔥"
    SPEAK = "🗣️"
    HAMMER = "🔨"
    USERS = "👥"
    SNOW = "❄️"
    HAMMER_AND_WRENCH = "🛠️"
    TREE = "🌳"
    ROCK = "🪨"
    CAVE = "🏕️"
    BOW_AND_ARROW = "🏹"
    BOAT = "🛶"
    WHEAT = "🌾"
    HOUSES = "🏘️"
    COW = "🐄"
    LEAF = "🌿"
    PRAY = "🙏"

class SummarizerAgent:
    def __init__(self):
        # Загружаем и подготавливаем базу знаний
        with open('json_format.md', 'r', encoding='utf-8') as f:
            format_guide = f.read()

        # Создаем текстовый сплиттер
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )

        # Разбиваем документ на чанки
        texts = text_splitter.create_documents([format_guide])

        # Создаем векторное хранилище с явным указанием API ключа
        embeddings = OpenAIEmbeddings(
            model="text-embedding-ada-002",
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        self.knowledge_base = FAISS.from_documents(texts, embeddings)
            
        self.agent = Agent(
            role='UI Content Generator',
            goal='Generate well-structured UI content in JSON format based on the provided text. Use the following format: ',
            backstory='''
### 1. **BaseNode Class**

The `BaseNode` class serves as the base class for all UI components and contains several attributes that define the visual style, behavior, and layout of the node. It includes properties like `id`, `nodeType`, layout attributes (`padding`, `margin`, `height`, `width`), and other visual settings like `background`, `borderType`, `fontColor`, and `opacity`.

**Key Methods and Features:**

* `addLink(String to)`: Adds a link from the current node to another node.
* **Nested `Link` Class**: Represents a link between two nodes, identified by their IDs.
* The class is extended by other specialized components such as `Text`, `Stack`, `IconText`, etc.

### 2. **TitledContainer Class**

* Extends `BaseNode` and represents a container with a title.
* It includes a `titleText` (a `Text` object) and an optional `content` (another `BaseNode`).

### 3. **Text Class**

* Extends `BaseNode` and represents a text element.
* It contains properties for text formatting such as `fontSize`, `HTMLText`, `textAlign`, `fontColor`, and `fontWeight`.

### 4. **Stack Class**

* Extends `BaseNode` and represents a stack (a layout that can be vertical or horizontal).
* It includes properties such as `gap`, `flexWrap`, `justifyContent`, and `alignItems`, which control the layout and positioning of child nodes within the stack.

### 5. **IconText Class**

* Extends `BaseNode` and represents a node containing both text and an icon.
* The icon is represented using the `Icon` enum, and the text is a `Text` object.

### 6. **CenteredContainer Class**

* Extends `BaseNode` and represents a container with a single centered child node.

### 7. **NodeType Enum**

Defines different types of nodes that can be created from `BaseNode`:

* `TEXT`, `ICON_TEXT`, `TITLED_CONTAINER`, `CENTERED_CONTAINER`, and `STACK`.

### 8. **AlignItems Enum**

Defines possible alignments for items in a container:

* `START`, `CENTER`, `END`, and `STRETCH`.

### 9. **Background Enum**

Defines possible background styles for nodes:

* `PRIMARY`, `DEFAULT`, `SECONDARY`, and `TERTIARY`.

### 10. **BorderType Enum**

Defines possible border styles for nodes:

* `SOLID`, `DASHED`, `DOTTED`, and `NONE`.

### 11. **FlexWrap Enum**

Defines whether items in a container should wrap:

* `WRAP` and `NOWRAP`.

### 12. **FontColor Enum**

Defines font color options for nodes:

* `PRIMARY`, `DEFAULT`, `SECONDARY`, and `TERTIARY`.

### 13. **FontSize Enum**

Defines font size options for text:

* `BIG`, `MEDIUM`, and `SMALL`.

### 14. **FontWeight Enum**

Defines font weight options for text:

* `BOLD`, `REGULAR`, and `THIN`.

### 15. **Icon Enum**

Defines a list of available icons that can be used in `IconText` nodes. Each icon is represented by a unique string value, such as "🚶" for a pedestrian, "🔥" for fire, "📚" for books, and so on.

### 16. **JustifyContent Enum**

Defines how child elements are aligned within a container:

* `SPACE_BETWEEN`, `SPACE_AROUND`, `CENTER`, and `STRETCH`.

### 17. **TextAlign Enum**

Defines text alignment options:

* `LEFT`, `CENTER`, and `RIGHT`.

### JSON Serialization Annotations

* The `@JsonTypeInfo` and `@JsonSubTypes` annotations are used to handle serialization and deserialization of polymorphic objects, allowing for different types of `BaseNode` (such as `Stack`, `Text`, `IconText`, etc.) to be recognized and properly mapped when working with JSON.
''',
            allow_delegation=False,
            verbose=True
        )

    def get_relevant_context(self, query: str) -> str:
        # Получаем релевантные куски из базы знаний
        relevant_docs = self.knowledge_base.similarity_search(query, k=3)
        return "\n".join(doc.page_content for doc in relevant_docs)

    def generate_unique_id(self) -> str:
        return str(uuid.uuid4())

    def create_text_node(self, text: str, font_size: FontSize = None, 
                        align: TextAlign = None, 
                        color: FontColor = None, 
                        weight: FontWeight = None) -> Dict[str, Any]:
        node = {
            "nodeType": "TEXT",
            "id": self.generate_unique_id(),
            "htmltext": text  # Используем htmltext вместо HTMLText как в примере
        }
        
        if font_size:
            node["fontSize"] = font_size.value
        if align:
            node["textAlign"] = align.value
        if color:
            node["fontColor"] = color.value
        if weight:
            node["fontWeight"] = weight.value
            
        return node

    def create_stack_node(self, children: list, vertical: bool = True, 
                         gap: int = None, background: Background = None,
                         padding: str = None, border_radius: str = None,
                         justify_content: JustifyContent = None,
                         flex_wrap: FlexWrap = None) -> Dict[str, Any]:
        stack = {
            "nodeType": "STACK",
            "id": self.generate_unique_id(),
            "children": children,
            "vertical": vertical  # Используем vertical вместо isVertical как в примере
        }
        
        if gap is not None:
            stack["gap"] = gap
        if background:
            stack["background"] = background.value
        if padding:
            stack["padding"] = padding
        if border_radius:
            stack["borderRadius"] = border_radius
        if justify_content:
            stack["justifyContent"] = justify_content.value
        if flex_wrap:
            stack["flexWrap"] = flex_wrap.value
            
        return {k: v for k, v in stack.items() if v is not None}

    def create_titled_container(self, title: str, content: Dict[str, Any], 
                              divided: bool = False) -> Dict[str, Any]:
        return {
            "nodeType": "TITLED_CONTAINER",
            "id": self.generate_unique_id(),
            "titleText": self.create_text_node(
                title, 
                font_size=FontSize.MEDIUM, 
                color=FontColor.PRIMARY, 
                weight=FontWeight.BOLD,
                align=TextAlign.LEFT
            ),
            "content": content,
            "divided": divided  # Используем divided вместо isDivided как в примере
        }

    def create_icon_text(self, text: str, icon: str) -> Dict[str, Any]:
        return {
            "nodeType": "ICON_TEXT",
            "id": self.generate_unique_id(),
            "text": self.create_text_node(text),
            "icon": icon  # Передаем иконку напрямую как строку
        }

    def create_centered_container(self, child_node: Dict[str, Any],
                                background: Background = Background.SECONDARY,
                                border_type: BorderType = BorderType.DASHED,
                                border_color: FontColor = FontColor.PRIMARY,
                                padding: str = "20px 10px",
                                border_radius: str = "8px",
                                width: str = "300px") -> Dict[str, Any]:
        return {
            "nodeType": "CENTERED_CONTAINER",
            "id": self.generate_unique_id(),
            "background": background.value,
            "borderType": border_type.value,
            "borderColor": border_color.value,
            "padding": padding,
            "borderRadius": border_radius,
            "margin": "auto",
            "width": width,
            "childNode": child_node
        }

    def generate_ui_json(self, crew_result: str) -> Dict[str, Any]:
        """
        Преобразует результат от crew в правильный JSON формат для UI.
        
        Args:
            crew_result (str): Результат работы crew
            
        Returns:
            Dict[str, Any]: Структурированный JSON для UI
        """
        try:
            # Разбиваем текст на секции (предполагаем, что crew возвращает структурированный текст)
            sections = crew_result.split('\n\n')
            
            # Создаем основной стек
            main_stack = self.create_stack_node(
                children=[],
                vertical=True,
                padding="60px 40px",
                border_radius="8px",
                gap=102,
                justify_content=JustifyContent.SPACE_BETWEEN,
                background=Background.DEFAULT
            )
            
            content_stack = self.create_stack_node(
                children=[],
                vertical=True,
                gap=64
            )
            
            # Добавляем заголовок (первая секция)
            if sections:
                title = sections[0].strip()
                content_stack["children"].append(
                    self.create_text_node(
                        title,
                        font_size=FontSize.BIG,
                        align=TextAlign.CENTER,
                        color=FontColor.PRIMARY,
                        weight=FontWeight.BOLD
                    )
                )
            
            # Обрабатываем остальные секции
            current_section = None
            current_items = []
            
            for section in sections[1:]:
                if section.strip().endswith(':'):  # Это заголовок секции
                    # Если есть предыдущая секция, добавляем её
                    if current_section and current_items:
                        content_stack["children"].append(
                            self.create_titled_container(
                                current_section,
                                self.create_stack_node(
                                    children=current_items,
                                    vertical=True,
                                    gap=2
                                ),
                                divided=False
                            )
                        )
                        current_items = []
                    current_section = section.strip().rstrip(':')
                else:  # Это элемент секции
                    # Определяем иконку на основе контекста
                    icon = self.select_icon_for_content(section)
                    current_items.append(
                        self.create_icon_text(section.strip(), icon)
                    )
            
            # Добавляем последнюю секцию, если она есть
            if current_section and current_items:
                content_stack["children"].append(
                    self.create_titled_container(
                        current_section,
                        self.create_stack_node(
                            children=current_items,
                            vertical=True,
                            gap=2
                        ),
                        divided=False
                    )
                )
            
            # Добавляем контент-стек в основной стек
            main_stack["children"].append(content_stack)
            
            return main_stack
        except Exception as e:
            print(f"Ошибка при генерации UI JSON: {str(e)}")
            # Возвращаем базовую структуру в случае ошибки
            return self.create_stack_node(
                children=[
                    self.create_text_node(
                        "Ошибка обработки контента",
                        font_size=FontSize.MEDIUM,
                        align=TextAlign.CENTER,
                        color=FontColor.SECONDARY
                    )
                ],
                vertical=True,
                gap=20
            )

    def select_icon_for_content(self, content: str) -> str:
        """
        Выбирает подходящую иконку на основе содержимого текста.
        
        Args:
            content (str): Текст контента
            
        Returns:
            str: Иконка в виде эмодзи
        """
        content = content.lower()
        
        # Словарь ключевых слов и соответствующих им иконок
        icon_mapping = {
            'человек': Icon.PEDESTRIAN.value,
            'орудия': Icon.HAMMER_AND_WRENCH.value,
            'огонь': Icon.FIRE.value,
            'речь': Icon.SPEAK.value,
            'группы': Icon.USERS.value,
            'лед': Icon.SNOW.value,
            'дерево': Icon.TREE.value,
            'камень': Icon.ROCK.value,
            'пещера': Icon.CAVE.value,
            'охота': Icon.BOW_AND_ARROW.value,
            'лодка': Icon.BOAT.value,
            'земледелие': Icon.WHEAT.value,
            'поселение': Icon.HOUSES.value,
            'скот': Icon.COW.value,
            'растения': Icon.LEAF.value,
            'ритуал': Icon.PRAY.value
        }
        
        # Проверяем наличие ключевых слов в тексте
        for keyword, icon in icon_mapping.items():
            if keyword in content:
                return icon
                
        # Если не найдено соответствий, возвращаем общий значок
        return Icon.PEDESTRIAN.value

    def process_content_with_rag(self, content: str) -> Dict[str, Any]:
        """
        Обрабатывает контент с использованием RAG для определения структуры и форматирования.
        """
        # Получаем контекст для разных аспектов форматирования
        layout_context = self.get_relevant_context("layout and styling properties")
        text_formatting = self.get_relevant_context("text formatting and attributes")
        container_specs = self.get_relevant_context("container specifications")

        # Используем полученный контекст для принятия решений о форматировании
        # Это поможет нам генерировать JSON в точном соответствии с документацией

        # Создаем основной стек с учетом полученного контекста
        main_stack = self.create_stack_node(
            children=[
                self.create_stack_node(
                    children=[
                        self.create_text_node(
                            "Формирование древнего человека",
                            font_size=FontSize.BIG,
                            align=TextAlign.CENTER,
                            color=FontColor.PRIMARY,
                            weight=FontWeight.BOLD
                        ),
                        # ... (остальная структура остается без изменений)
                    ],
                    vertical=True,
                    gap=64
                )
            ],
            vertical=True,
            padding="60px 40px",
            border_radius="8px",
            gap=102,
            justify_content=JustifyContent.SPACE_BETWEEN,
            background=Background.DEFAULT
        )
        
        return main_stack

    def save_response(self, content: str, output_file: str):
        # Используем RAG для генерации JSON
        ui_json = self.process_content_with_rag(content)
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(ui_json, f, ensure_ascii=False, indent=2)
        return output_file

# Create instance
summarizer_agent = SummarizerAgent() 