import React, { useState, useEffect } from 'react';
import {Link} from "react-router-dom";

const WelcomePage = () => {
    const [showRobot, setShowRobot] = useState(false);
    const [showMessage, setShowMessage] = useState(false);

    useEffect(() => {
        // Show robot after a short delay
        const robotTimer = setTimeout(() => {
            setShowRobot(true);
        }, 500);

        // Show message after robot appears
        const messageTimer = setTimeout(() => {
            setShowMessage(true);
        }, 1500);

        return () => {
            clearTimeout(robotTimer);
            clearTimeout(messageTimer);
        };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b bg-[#000] flex flex-col items-center justify-center p-4">
            <div className="text-center mb-12">
                <h1 className="text-6xl font-bold text-gray-400 mb-4">
                    <span className="text-blue-600">Qysqa</span> & <span className="text-blue-600">Qasqyr</span> AI
                </h1>
                <p className="text-2xl text-gray-400">
                    Сделай учебу легкой и простой
                </p>
            </div>

            <div className="fixed bottom-8 right-8">
                <div className={`transition-all duration-1000 transform ${showRobot ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                    <div className="relative">
                        {/* Robot */}
                        <div className="w-48 h-48 bg-blue-100 rounded-full flex items-center justify-center">
                            <div className="w-32 h-32 bg-blue-200 rounded-full flex items-center justify-center">
                                <div className="w-16 h-16 bg-blue-300 rounded-full flex items-center justify-center">
                                    <div className="w-8 h-8 bg-blue-400 rounded-full"></div>
                                </div>
                            </div>
                        </div>

                        {/* Speech Bubble */}
                        {showMessage && (
                            <div className="absolute bottom-0 right-0 mb-4 mr-4 bg-white p-4 rounded-lg shadow-lg max-w-xs transform transition-all duration-500">
                                <div className="text-sm text-gray-800">
                                    <Link to={'/profile'}>
                                        Ты вчера хорошо потрудились, но у вас горит дедлайн к 05.05.2025, можно поднажать !!!
                                    </Link>
                                </div>
                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-white transform rotate-45 translate-x-1/2 translate-y-1/2"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomePage; 