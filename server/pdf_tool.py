import os
from crewai import Agent, Task, Crew, Process
from crewai.tools import BaseTool
from PyPDF2 import PdfReader

class PDFReaderTool(BaseTool):
    name: str = "PDF Reader"
    description: str = "Reads the content of a PDF file and returns the text."

    def _run(self, pdf_path: str) -> str:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text

pdf_reader_tool = PDFReaderTool() 