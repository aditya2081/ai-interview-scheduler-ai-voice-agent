'use client'
import React, { useState, useRef, useEffect } from 'react';
import { uploadInterviewVideo, updateFeedbackWithVideo } from '@/lib/videoStorage';

function VideoRecorder({ interviewId, candidateEmail, onVideoSaved }) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [recordingTime, setRecordingTime] = useState(0);
    
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const timerRef = useRef(null);
    const chunksRef = useRef([]);

    // Format time display
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Start recording timer
    const startTimer = () => {
        timerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);
    };

    // Stop recording timer
    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    // Start video recording
    const startRecording = async () => {
        try {
            console.log('🎥 Starting video recording...');
            
            // Get user media (video + audio)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            streamRef.current = stream;
            chunksRef.current = [];

            // Create MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9,opus'
            });

            mediaRecorderRef.current = mediaRecorder;

            // Handle data available
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            // Handle recording stop
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                setRecordedBlob(blob);
                console.log('✅ Recording stopped, blob size:', blob.size);
            };

            // Start recording
            mediaRecorder.start(1000); // Record in 1-second chunks
            setIsRecording(true);
            setRecordingTime(0);
            startTimer();
            
            console.log('✅ Recording started');

        } catch (error) {
            console.error('❌ Error starting recording:', error);
            alert('Failed to start recording: ' + error.message);
        }
    };

    // Stop video recording
    const stopRecording = () => {
        try {
            if (mediaRecorderRef.current && isRecording) {
                mediaRecorderRef.current.stop();
                setIsRecording(false);
                stopTimer();

                // Stop all tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }

                console.log('✅ Recording stopped');
            }
        } catch (error) {
            console.error('❌ Error stopping recording:', error);
        }
    };

    // Upload recorded video
    const uploadVideo = async () => {
        if (!recordedBlob) {
            alert('No recording available to upload');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            console.log('📤 Uploading video...');

            // Create File object from blob
            const videoFile = new File([recordedBlob], 'interview-recording.webm', {
                type: 'video/webm'
            });

            // Upload to Supabase
            const result = await uploadInterviewVideo(
                videoFile,
                interviewId,
                candidateEmail,
                (progress) => setUploadProgress(progress)
            );

            if (result.success) {
                console.log('✅ Video uploaded successfully:', result.videoUrl);
                
                // Notify parent component
                if (onVideoSaved) {
                    onVideoSaved(result.videoUrl, recordingTime);
                }

                alert('✅ Video uploaded successfully!');
                setRecordedBlob(null);
                setRecordingTime(0);
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('❌ Error uploading video:', error);
            alert('Failed to upload video: ' + error.message);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopTimer();
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🎥 Interview Recording
            </h3>

            {/* Recording Status */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
                    <span className="text-sm font-medium text-gray-700">
                        {isRecording ? 'Recording...' : 'Ready to Record'}
                    </span>
                </div>
                
                {(isRecording || recordingTime > 0) && (
                    <div className="text-lg font-mono text-gray-900">
                        {formatTime(recordingTime)}
                    </div>
                )}
            </div>

            {/* Recording Controls */}
            <div className="flex items-center space-x-3 mb-4">
                {!isRecording ? (
                    <button
                        onClick={startRecording}
                        disabled={isUploading}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 flex items-center space-x-2"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <circle cx="10" cy="10" r="8" />
                        </svg>
                        <span>Start Recording</span>
                    </button>
                ) : (
                    <button
                        onClick={stopRecording}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center space-x-2"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <rect x="6" y="6" width="8" height="8" />
                        </svg>
                        <span>Stop Recording</span>
                    </button>
                )}

                {recordedBlob && !isRecording && (
                    <button
                        onClick={uploadVideo}
                        disabled={isUploading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center space-x-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span>{isUploading ? 'Uploading...' : 'Upload Video'}</span>
                    </button>
                )}
            </div>

            {/* Upload Progress */}
            {isUploading && (
                <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Recording Info */}
            <div className="text-sm text-gray-500">
                <p>• Video will be automatically saved to your interview records</p>
                <p>• Recording includes both video and audio</p>
                <p>• Supported format: WebM (VP9 + Opus)</p>
            </div>
        </div>
    );
}

export default VideoRecorder;