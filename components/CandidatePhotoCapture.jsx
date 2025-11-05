"use client"
import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { uploadCandidatePhoto } from '@/lib/photoStorage';

// Helper function to convert blob to file
const blobToFile = (blob, fileName) => {
    return new File([blob], fileName, { type: blob.type });
};

export default function CandidatePhotoCapture({ interviewId, candidateEmail, candidateName, onPhotoSaved }) {
    const [isCapturing, setIsCapturing] = useState(false);
    const [photoTaken, setPhotoTaken] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);

    const startCamera = useCallback(async () => {
        try {
            setIsCapturing(true);
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: 640, 
                    height: 480,
                    facingMode: 'user' // Front camera for selfie
                } 
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.play();
            }
            setStream(mediaStream);
            setUploadStatus('Camera ready. Please position yourself in the frame.');
        } catch (error) {
            console.error('Error accessing camera:', error);
            setUploadStatus('Error accessing camera. Please check permissions.');
            setIsCapturing(false);
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCapturing(false);
    }, [stream]);

    const capturePhoto = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');

        // Set canvas dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to blob
        canvas.toBlob(async (blob) => {
            if (!blob) {
                setUploadStatus('Failed to capture photo');
                return;
            }

            setPhotoTaken(true);
            setUploading(true);
            setUploadStatus('Uploading photo...');

            try {
                // Convert blob to file and upload using our utility
                const photoFile = blobToFile(blob, `candidate_${interviewId}_${Date.now()}.jpg`);
                const uploadResult = await uploadCandidatePhoto(photoFile, interviewId, candidateEmail);

                if (!uploadResult.success) {
                    throw new Error(uploadResult.error);
                }

                setUploadStatus(`✅ Photo saved successfully to Supabase Storage!`);
                stopCamera();
                
                if (onPhotoSaved) {
                    onPhotoSaved(uploadResult.photoUrl);
                }

            } catch (error) {
                console.error('Photo upload error:', error);
                setUploadStatus(`❌ Upload failed: ${error.message}`);
            } finally {
                setUploading(false);
            }
        }, 'image/jpeg', 0.8);
    }, [interviewId, candidateEmail, stopCamera, onPhotoSaved]);

    const retakePhoto = () => {
        setPhotoTaken(false);
        setUploadStatus('');
        startCamera();
    };

    return (
        <div className="p-6 border rounded-lg bg-white shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-center">📸 Candidate Photo Verification</h3>
            <p className="text-sm text-gray-600 mb-4 text-center">
                Please take a clear photo of yourself before starting the interview
            </p>
            
            <div className="space-y-4">
                {/* Camera Preview */}
                <div className="flex justify-center">
                    <div className="relative">
                        <video
                            ref={videoRef}
                            className={`border rounded-lg ${isCapturing ? 'block' : 'hidden'}`}
                            width="320"
                            height="240"
                            playsInline
                            muted
                        />
                        <canvas
                            ref={canvasRef}
                            className="hidden"
                        />
                        {!isCapturing && !photoTaken && (
                            <div className="w-80 h-60 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                <div className="text-center text-gray-500">
                                    <div className="text-4xl mb-2">📷</div>
                                    <div>Click "Start Camera" to begin</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Control Buttons */}
                <div className="flex justify-center gap-3">
                    {!isCapturing && !photoTaken && (
                        <Button onClick={startCamera} className="px-6 py-2">
                            📷 Start Camera
                        </Button>
                    )}

                    {isCapturing && !photoTaken && (
                        <>
                            <Button 
                                onClick={capturePhoto} 
                                disabled={uploading}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700"
                            >
                                📸 Capture Photo
                            </Button>
                            <Button 
                                onClick={stopCamera} 
                                variant="outline"
                                className="px-6 py-2"
                            >
                                ❌ Cancel
                            </Button>
                        </>
                    )}

                    {photoTaken && !uploading && (
                        <Button 
                            onClick={retakePhoto}
                            variant="outline" 
                            className="px-6 py-2"
                        >
                            🔄 Retake Photo
                        </Button>
                    )}
                </div>

                {/* Status Message */}
                {uploadStatus && (
                    <div className={`text-center p-3 rounded ${
                        uploadStatus.includes('✅') 
                            ? 'bg-green-100 text-green-700' 
                            : uploadStatus.includes('❌') 
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                    }`}>
                        {uploadStatus}
                    </div>
                )}

                {/* Instructions */}
                <div className="text-sm text-gray-600 text-center">
                    <p><strong>Tips for a good photo:</strong></p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Face the camera directly</li>
                        <li>Ensure good lighting</li>
                        <li>Keep a neutral expression</li>
                        <li>Remove sunglasses or hats</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}