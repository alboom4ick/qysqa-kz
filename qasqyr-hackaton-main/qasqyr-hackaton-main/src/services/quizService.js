const mockQuizData = {
    id: 1,
    content: [
        {
            title: "What is the primary focus of the lecture titled 'Algorithm II'?",
            variants: [
                "Data Structures",
                "Dynamic Connectivity",
                "Sorting Algorithms",
                "Graph Theory"
            ],
            correctVariantIndex: 1
        },
        {
            title: "Which of the following methods is used to connect two objects in the Dynamic-Connectivity Client?",
            variants: [
                "connect()",
                "union()",
                "link()",
                "merge()",
                "join()"
            ],
            correctVariantIndex: [1, 2]
        },
        {
            title: "Match the following terms with their definitions:",
            variants: [
                "Quick-Union",
                "Quick-Find",
                "Dynamic Connectivity",
                "Union-Find"
            ],
            correctVariantIndex: [0, 1, 2, 3],
            matchWith: [
                "A method to connect components using tree structures.",
                "A method to find components using an array.",
                "A system to manage connections between objects dynamically.",
                "A data structure that supports union and find operations."
            ]
        }
    ]
};

export const quizService = {
    getQuiz: async (quizId) => {
        // In the future, this will be a real API call
        // const response = await axios.get(`/api/quiz/${quizId}`);
        // return response.data;
        
        // For now, return mock data
        return mockQuizData;
    },

    submitQuizResults: async (quizId, results) => {
        // In the future, this will be a real API call
        // const response = await axios.post('/api/quiz/pass', {
        //     quizId,
        //     ...results
        // });
        // return response.data;
        
        // For now, simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true });
            }, 1000);
        });
    }
}; 