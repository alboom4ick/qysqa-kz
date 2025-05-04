import React, { useState, useEffect } from 'react';
import { quizService } from '../../services/quizService';

const PassingQuiz = ({ quizId, onComplete }) => {
    const [quizData, setQuizData] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [selectedAnswers, setSelectedAnswers] = useState([]);
    const [selectedMatches, setSelectedMatches] = useState({});
    const [score, setScore] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [answers, setAnswers] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                setIsLoading(true);
                const data = await quizService.getQuiz(quizId);
                setQuizData(data);
                if (data.content.some(q => q.matchWith)) {
                    setSelectedMatches({});
                }
            } catch (err) {
                setError('Failed to load quiz');
                console.error('Error loading quiz:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuiz();
    }, [quizId]);

    const handleAnswerSelect = (index) => {
        setSelectedAnswer(index);
    };

    const handleMultipleAnswerSelect = (index) => {
        setSelectedAnswers(prev => {
            if (prev.includes(index)) {
                return prev.filter(i => i !== index);
            } else {
                return [...prev, index];
            }
        });
    };

    const handleMatchSelect = (termIndex, definitionIndex) => {
        setSelectedMatches(prev => ({
            ...prev,
            [termIndex]: definitionIndex
        }));
    };

    const isMatchingQuestionComplete = () => {
        const currentQuestion = quizData.content[currentQuestionIndex];
        if (!currentQuestion.matchWith) return true;
        
        const selectedCount = Object.keys(selectedMatches).length;
        return selectedCount === currentQuestion.variants.length;
    };

    const isMultipleChoiceQuestion = (question) => {
        return Array.isArray(question.correctVariantIndex);
    };

    const handleNextQuestion = () => {
        const currentQuestion = quizData.content[currentQuestionIndex];
        let isCorrect = false;

        if (currentQuestion.matchWith) {
            // Check if all matches are correct
            isCorrect = Object.entries(selectedMatches).every(([termIndex, defIndex]) => 
                currentQuestion.correctVariantIndex[parseInt(termIndex)] === defIndex
            );
        } else if (isMultipleChoiceQuestion(currentQuestion)) {
            // Check if all selected answers are correct and no incorrect answers are selected
            const correctAnswers = currentQuestion.correctVariantIndex;
            isCorrect = selectedAnswers.length === correctAnswers.length &&
                       selectedAnswers.every(answer => correctAnswers.includes(answer));
        } else {
            isCorrect = selectedAnswer === currentQuestion.correctVariantIndex;
        }

        setAnswers([...answers, { 
            questionIndex: currentQuestionIndex, 
            selectedAnswer: currentQuestion.matchWith 
                ? selectedMatches 
                : isMultipleChoiceQuestion(currentQuestion)
                    ? selectedAnswers
                    : selectedAnswer,
            isCorrect 
        }]);
        
        if (isCorrect) {
            setScore(score + 1);
        }

        if (currentQuestionIndex < quizData.content.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedAnswer(null);
            setSelectedAnswers([]);
            setSelectedMatches({});
        } else {
            setShowResults(true);
        }
    };

    const handleSubmitResults = async () => {
        setIsSubmitting(true);
        try {
            await quizService.submitQuizResults(quizId, {
                score,
                totalQuestions: quizData.content.length,
                answers
            });
            onComplete();
        } catch (error) {
            console.error('Error submitting quiz results:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg">
                <div className="text-center text-red-600">
                    <p className="text-xl font-semibold">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (showResults) {
        return (
            <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Quiz Results</h2>
                <p className="text-xl text-gray-700 mb-4 text-center">
                    Your score: {score} out of {quizData.content.length}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {answers.map((answer, index) => (
                        <div 
                            key={index} 
                            className={`p-4 rounded-lg text-center ${
                                answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                        >
                            <p className="font-medium">Question {index + 1}</p>
                            <span className="text-2xl">{answer.isCorrect ? '✓' : '✗'}</span>
                        </div>
                    ))}
                </div>
                <button
                    onClick={handleSubmitResults}
                    disabled={isSubmitting}
                    className={`mt-8 w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                        isSubmitting 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                    {isSubmitting ? 'Submitting...' : 'Complete Quiz'}
                </button>
            </div>
        );
    }

    const currentQuestion = quizData.content[currentQuestionIndex];

    if (currentQuestion.matchWith) {
        return (
            <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg">
                <div className="text-right text-gray-600 mb-4">
                    Question {currentQuestionIndex + 1} of {quizData.content.length}
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">{currentQuestion.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="font-medium text-gray-700">Terms</h3>
                        {currentQuestion.variants.map((term, termIndex) => (
                            <div
                                key={termIndex}
                                className={`p-4 rounded-lg border-2 ${
                                    selectedMatches[termIndex] !== undefined
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200'
                                }`}
                            >
                                {term}
                            </div>
                        ))}
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-medium text-gray-700">Definitions</h3>
                        {currentQuestion.matchWith.map((definition, defIndex) => (
                            <div
                                key={defIndex}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                                    Object.values(selectedMatches).includes(defIndex)
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => {
                                    const termIndex = Object.entries(selectedMatches).find(
                                        ([_, index]) => index === defIndex
                                    )?.[0];
                                    if (termIndex) {
                                        handleMatchSelect(parseInt(termIndex), null);
                                    }
                                }}
                            >
                                {definition}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-4">
                    {currentQuestion.variants.map((term, termIndex) => (
                        <div key={termIndex} className="space-y-2">
                            <p className="font-medium">{term}</p>
                            <select
                                className="w-full p-2 border rounded-lg"
                                value={selectedMatches[termIndex] ?? ''}
                                onChange={(e) => handleMatchSelect(termIndex, parseInt(e.target.value))}
                            >
                                <option value="">Select definition</option>
                                {currentQuestion.matchWith.map((_, defIndex) => (
                                    <option 
                                        key={defIndex} 
                                        value={defIndex}
                                        disabled={Object.values(selectedMatches).includes(defIndex)}
                                    >
                                        {currentQuestion.matchWith[defIndex]}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
                <button
                    className={`mt-8 w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                        !isMatchingQuestionComplete()
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onClick={handleNextQuestion}
                    disabled={!isMatchingQuestionComplete()}
                >
                    {currentQuestionIndex === quizData.content.length - 1 ? 'Finish' : 'Next'}
                </button>
            </div>
        );
    }

    if (isMultipleChoiceQuestion(currentQuestion)) {
        return (
            <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg">
                <div className="text-right text-gray-600 mb-4">
                    Question {currentQuestionIndex + 1} of {quizData.content.length}
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">{currentQuestion.title}</h2>
                <div className="space-y-4 mb-8">
                    {currentQuestion.variants.map((variant, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-lg cursor-pointer transition-colors ${
                                selectedAnswers.includes(index)
                                    ? 'bg-blue-50 border-2 border-blue-500'
                                    : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleMultipleAnswerSelect(index)}
                        >
                            {variant}
                        </div>
                    ))}
                </div>
                <button
                    className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                        selectedAnswers.length === 0
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onClick={handleNextQuestion}
                    disabled={selectedAnswers.length === 0}
                >
                    {currentQuestionIndex === quizData.content.length - 1 ? 'Finish' : 'Next'}
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg">
            <div className="text-right text-gray-600 mb-4">
                Question {currentQuestionIndex + 1} of {quizData.content.length}
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">{currentQuestion.title}</h2>
            <div className="space-y-4 mb-8">
                {currentQuestion.variants.map((variant, index) => (
                    <div
                        key={index}
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${
                            selectedAnswer === index
                                ? 'bg-blue-50 border-2 border-blue-500'
                                : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleAnswerSelect(index)}
                    >
                        {variant}
                    </div>
                ))}
            </div>
            <button
                className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                    selectedAnswer === null
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                }`}
                onClick={handleNextQuestion}
                disabled={selectedAnswer === null}
            >
                {currentQuestionIndex === quizData.content.length - 1 ? 'Finish' : 'Next'}
            </button>
        </div>
    );
};

export default PassingQuiz;
