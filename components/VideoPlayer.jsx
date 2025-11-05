'use client'
import React, { useState } from 'react';

function VideoPlayer({ videoUrl, candidateName, duration }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    if (!videoUrl) {
        return (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600">No interview video available</p>
            </div>
        );
    }

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Video Header */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                        🎥 Interview Recording - {candidateName}
                    </h4>
                    {duration && (
                        <span className="text-sm text-gray-600">
                            Duration: {formatTime(duration)}
                        </span>
                    )}
                </div>
            </div>

            {/* Video Player */}
            <div className="relative">
                <video
                    className="w-full h-auto max-h-96"
                    controls
                    preload="metadata"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                >
                    <source src={videoUrl} type="video/webm" />
                    <source src={videoUrl} type="video/mp4" />
                    Your browser does not support video playback.
                </video>

                {/* Video Overlay Info */}
                <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    {isPlaying ? '▶️ Playing' : '⏸️ Paused'}
                </div>
            </div>

            {/* Video Controls Footer */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Current: {formatTime(currentTime)}</span>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => {
                                const video = document.querySelector('video');
                                video.currentTime = 0;
                            }}
                            className="text-blue-600 hover:text-blue-800"
                        >
                            ⏮️ Restart
                        </button>
                        <a
                            href={videoUrl}
                            download={`interview-${candidateName}.webm`}
                            className="text-blue-600 hover:text-blue-800"
                        >
                            ⬇️ Download
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VideoPlayer;