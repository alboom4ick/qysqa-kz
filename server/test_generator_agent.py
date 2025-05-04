from crewai import Agent
from typing import Dict, Any, List
import json
import uuid
from enum import Enum

class TestQuestion:
    def __init__(self, question: str, options: List[str], correct_answer: int):
        self.id = str(uuid.uuid4())
        self.question = question
        self.options = options
        self.correct_answer = correct_answer  # индекс правильного ответа (0-3)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "question": self.question,
            "options": self.options,
            "correct_answer": self.correct_answer
        }

class TestGeneratorAgent:
    def __init__(self):
        self.agent = Agent(
            role='Test Generator',
            goal='Generate multiple-choice test questions based on the provided content',
            backstory="""You are an expert in creating educational assessments and test questions.
            Your task is to analyze content and create engaging multiple-choice questions that test
            understanding of key concepts. Each question should have 4 options with only one correct answer.
            The incorrect options should be plausible but clearly wrong upon careful consideration.""",
            allow_delegation=False,
            verbose=True
        )

    def generate_test_json(self, content: str, num_questions: int = 5) -> Dict[str, Any]:
        """
        Генерирует JSON с тестовыми вопросами на основе предоставленного контента.
        
        Args:
            content (str): Контент для генерации вопросов
            num_questions (int): Количество вопросов для генерации
            
        Returns:
            Dict[str, Any]: Структурированный JSON с тестовыми вопросами
        """
        try:
            # Создаем структуру теста
            test_structure = {
                "id": str(uuid.uuid4()),
                "title": "Тест по материалу",
                "description": "Выберите один правильный ответ из предложенных вариантов",
                "questions": []
            }

            # Здесь будет логика создания вопросов с использованием LLM
            # Пока используем примеры для демонстрации структуры
            example_questions = [
                TestQuestion(
                    "Какой из перечисленных инструментов появился первым у древнего человека?",
                    [
                        "Каменное рубило",
                        "Металлический топор",
                        "Керамический горшок",
                        "Бронзовый меч"
                    ],
                    0  # Правильный ответ - "Каменное рубило"
                ),
                TestQuestion(
                    "Что послужило главным фактором развития речи у древних людей?",
                    [
                        "Увеличение размера мозга",
                        "Необходимость совместной охоты",
                        "Изменение климата",
                        "Появление письменности"
                    ],
                    1  # Правильный ответ - "Необходимость совместной охоты"
                )
            ]

            # Добавляем вопросы в структуру теста
            for question in example_questions:
                test_structure["questions"].append(question.to_dict())

            return test_structure

        except Exception as e:
            print(f"Ошибка при генерации теста: {str(e)}")
            return {
                "error": "Failed to generate test",
                "details": str(e)
            }

# Create instance
test_generator_agent = TestGeneratorAgent() 