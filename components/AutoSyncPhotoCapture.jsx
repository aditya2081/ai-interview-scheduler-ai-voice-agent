"use client"
import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';

// Helper function to convert blob to file
const blobToFile = (blob, fileName) => {
    return new File([blob], fileName, { type: blob.type });
};

export default function AutoSyncPhotoCapture({ interviewId, candidateEmail, candidateName, onPhotoSynced }) {
    const [isCapturing, setIsCapturing] = useState(false);
    const [photoTaken, setPhotoTaken] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
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
            setUploadStatus('Camera ready. Please position yourself in the frame and click "Take Photo".');
        } catch (error) {
            console.error('Error accessing camera:', error);
            setUploadStatus('Error accessing camera. Please check permissions and try again.');
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

    const takePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        setPhotoTaken(true);
        stopCamera();
        setUploadStatus('Photo captured! Click "Save & Sync" to upload and sync to database.');
    }, [stopCamera]);

    const retakePhoto = useCallback(() => {
        setPhotoTaken(false);
        setUploadStatus('');
        startCamera();
    }, [startCamera]);

    const uploadAndSyncPhoto = useCallback(async () => {
        if (!canvasRef.current || !candidateEmail || !interviewId) {
            setUploadStatus('Missing required information for upload.');
            return;
        }

        try {
            setUploading(true);
            setUploadStatus('Uploading photo and syncing to database...');

            const canvas = canvasRef.current;
            
            // Convert canvas to blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/jpeg', 0.8);
            });

            if (!blob) {
                throw new Error('Failed to create photo blob');
            }

            // Create form data for upload
            const formData = new FormData();
            const fileName = `${candidateEmail.replace(/[@.]/g, '_')}_${Date.now()}.jpg`;
            const file = blobToFile(blob, fileName);
            
            formData.append('photo', file);
            formData.append('interviewId', interviewId);
            formData.append('candidateEmail', candidateEmail);

            console.log('📤 Uploading and syncing photo for:', candidateEmail);

            // Upload and sync in one API call
            const response = await fetch('/api/upload-and-sync-photo', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                setPhotoUrl(result.photoUrl);
                setUploadStatus(`✅ Success! Photo uploaded and database updated automatically.`);
                
                // Notify parent component
                if (onPhotoSynced) {
                    onPhotoSynced({
                        success: true,
                        photoUrl: result.photoUrl,
                        message: result.message
                    });
                }
            } else {
                console.error('Upload failed:', result.error);
                setUploadStatus(`❌ Error: ${result.error}`);
                
                if (onPhotoSynced) {
                    onPhotoSynced({
                        success: false,
                        error: result.error
                    });
                }
            }

        } catch (error) {
            console.error('Error uploading photo:', error);
            setUploadStatus(`❌ Upload failed: ${error.message}`);
            
            if (onPhotoSynced) {
                onPhotoSynced({
                    success: false,
                    error: error.message
                });
            }
        } finally {
            setUploading(false);
        }
    }, [candidateEmail, interviewId, onPhotoSynced]);

    return (
        <div className="w-full max-w-md mx-auto p-4 bg-white rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-center">
                Candidate Photo Capture
            </h3>
            
            {uploadStatus && (
                <div className={`mb-4 p-3 rounded-md text-sm ${
                    uploadStatus.includes('✅') ? 'bg-green-100 text-green-800' : 
                    uploadStatus.includes('❌') ? 'bg-red-100 text-red-800' : 
                    'bg-blue-100 text-blue-800'
                }`}>
                    {uploadStatus}
                </div>
            )}

            <div className="relative mb-4">
                {!photoTaken ? (
                    <video
                        ref={videoRef}
                        className="w-full h-64 bg-gray-200 rounded-lg object-cover"
                        playsInline
                        muted
                        style={{ display: isCapturing ? 'block' : 'none' }}
                    />
                ) : (
                    <canvas
                        ref={canvasRef}
                        className="w-full h-64 bg-gray-200 rounded-lg object-cover"
                    />
                )}
                
                {!isCapturing && !photoTaken && (
                    <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500">Camera preview</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2">
                {!isCapturing && !photoTaken && (
                    <Button onClick={startCamera} className="w-full">
                        📷 Start Camera
                    </Button>
                )}

                {isCapturing && (
                    <Button onClick={takePhoto} className="w-full">
                        📸 Take Photo
                    </Button>
                )}

                {photoTaken && !uploading && (
                    <div className="flex gap-2">
                        <Button onClick={retakePhoto} variant="outline" className="flex-1">
                            🔄 Retake
                        </Button>
                        <Button onClick={uploadAndSyncPhoto} className="flex-1">
                            💾 Save & Sync
                        </Button>
                    </div>
                )}

                {uploading && (
                    <Button disabled className="w-full">
                        ⏳ Uploading & Syncing...
                    </Button>
                )}
            </div>

            {photoUrl && (
                <div className="mt-4 p-3 bg-green-50 rounded-md">
                    <p className="text-sm text-green-800 font-medium">
                        Photo successfully synced to database!
                    </p>
                    <p className="text-xs text-green-600 mt-1 break-all">
                        URL: {photoUrl}
                    </p>
                </div>
            )}
        </div>
    );
}