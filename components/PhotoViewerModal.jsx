"use client"
import React from 'react';

export default function PhotoViewerModal({ photoUrl, candidateName, isOpen, onClose }) {
    if (!isOpen || !photoUrl) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
            <div className="relative max-w-4xl max-h-full p-4" onClick={e => e.stopPropagation()}>
                <div className="bg-white rounded-lg shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">
                            📸 {candidateName} - Photo
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    {/* Photo Display */}
                    <div className="p-4">
                        <div className="flex justify-center">
                            <img 
                                src={photoUrl} 
                                alt={`${candidateName} photo`}
                                className="max-w-full max-h-96 rounded-lg shadow-lg object-contain"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'block';
                                }}
                            />
                            <div className="hidden text-center text-gray-500 p-8">
                                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p>Failed to load photo</p>
                            </div>
                        </div>
                        
                        {/* Photo URL Display */}
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Photo URL:</p>
                            <div className="flex items-center space-x-2">
                                <input 
                                    type="text" 
                                    value={photoUrl} 
                                    readOnly 
                                    className="flex-1 text-xs bg-white border border-gray-300 rounded px-2 py-1 font-mono"
                                />
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(photoUrl);
                                        // You could add a toast notification here
                                        alert('Photo URL copied to clipboard!');
                                    }}
                                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                >
                                    📋 Copy
                                </button>
                                <a
                                    href={photoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                >
                                    🔗 Open
                                </a>
                            </div>
                        </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="flex justify-end p-4 border-t bg-gray-50">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}