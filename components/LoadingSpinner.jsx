import React from 'react';

export default function LoadingSpinner({ message = "Loading...", fullScreen = false }) {
    const containerClass = fullScreen 
        ? "fixed inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-50"
        : "flex flex-col items-center justify-center p-8";

    return (
        <div className={containerClass}>
            <div className="relative">
                {/* Outer ring */}
                <div className="w-16 h-16 border-4 border-gray-200 rounded-full animate-spin"></div>
                {/* Inner ring */}
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            
            <div className="mt-4 text-center">
                <p className="text-lg font-medium text-gray-700">{message}</p>
                <div className="flex items-center justify-center mt-2">
                    <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}