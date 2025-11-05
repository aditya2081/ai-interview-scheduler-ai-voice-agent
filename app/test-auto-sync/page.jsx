"use client"
import React, { useState } from 'react';
import AutoPhotoSyncIndicator from '@/components/AutoPhotoSyncIndicator';

export default function AutoSyncTestPage() {
    const [interviewId, setInterviewId] = useState('');
    const [candidateEmail, setCandidateEmail] = useState('');
    const [showSync, setShowSync] = useState(false);

    const handleStartSync = () => {
        if (interviewId && candidateEmail) {
            setShowSync(true);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold mb-6 text-center">
                    Auto Photo Sync Test
                </h1>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Interview ID
                        </label>
                        <input
                            type="text"
                            value={interviewId}
                            onChange={(e) => setInterviewId(e.target.value)}
                            placeholder="e.g., 7b3e26b8-ef30-4d6f-a6eb-1ab25afa8456"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Candidate Email
                        </label>
                        <input
                            type="email"
                            value={candidateEmail}
                            onChange={(e) => setCandidateEmail(e.target.value)}
                            placeholder="e.g., candidate@gmail.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    
                    <button
                        onClick={handleStartSync}
                        disabled={!interviewId || !candidateEmail}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Test Auto Photo Sync
                    </button>
                    
                    {showSync && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-600 mb-2">
                                Auto-sync initiated for:
                            </p>
                            <ul className="text-sm">
                                <li><strong>Interview:</strong> {interviewId}</li>
                                <li><strong>Email:</strong> {candidateEmail}</li>
                            </ul>
                        </div>
                    )}
                    
                    <div className="mt-6 p-4 bg-blue-50 rounded-md">
                        <h3 className="font-semibold text-blue-800 mb-2">How it works:</h3>
                        <ol className="text-sm text-blue-700 space-y-1">
                            <li>1. Enter interview ID and candidate email above</li>
                            <li>2. Click "Test Auto Photo Sync"</li>
                            <li>3. Watch the sync indicator in the top-right corner</li>
                            <li>4. The system will automatically find matching photos in storage</li>
                            <li>5. URLs will be synced to the database candidate_photo_url column</li>
                        </ol>
                    </div>
                </div>
            </div>
            
            {/* Auto-sync indicator will appear here */}
            {showSync && (
                <AutoPhotoSyncIndicator 
                    interviewId={interviewId} 
                    candidateEmail={candidateEmail} 
                />
            )}
        </div>
    );
}