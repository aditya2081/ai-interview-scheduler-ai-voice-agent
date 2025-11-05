"use client"
import { useState, useEffect } from 'react';
import { uploadInterviewVideo } from '@/lib/videoStorage';
import { checkAuthSession } from '@/lib/authUtils';
import { Button } from '@/components/ui/button';

export default function ClientVideoUpload({ interviewId, candidateEmail = 'test@example.com' }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [authStatus, setAuthStatus] = useState('Checking...');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        checkAuthentication();
    }, []);

    const checkAuthentication = async () => {
        try {
            const authResult = await checkAuthSession();
            if (authResult.success && authResult.isAuthenticated) {
                setAuthStatus(`✅ Authenticated as ${authResult.user?.email}`);
            } else {
                setAuthStatus(`❌ Not authenticated: ${authResult.error?.message || 'Unknown error'}`);
            }
        } catch (error) {
            setAuthStatus(`❌ Auth check failed: ${error.message}`);
        }
    };

    if (!mounted) {
        return <div>Loading video upload...</div>;
    }

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setUploadStatus('');
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setUploadStatus('Please select a file first');
            return;
        }

        setUploading(true);
        setUploadStatus('Uploading...');

        try {
            // Using the correct function signature: (videoFile, interviewId, candidateEmail)
            const result = await uploadInterviewVideo(file, interviewId, candidateEmail);
            
            if (result.success) {
                setUploadStatus(`Upload successful! URL: ${result.videoUrl || result.publicUrl}`);
                setFile(null);
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            setUploadStatus(`Upload failed: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Video Upload Test</h3>
            
            {/* Authentication Status */}
            <div className="mb-4 p-3 rounded bg-blue-50">
                <strong>Auth Status:</strong> {authStatus}
                <Button 
                    onClick={checkAuthentication}
                    variant="outline" 
                    size="sm" 
                    className="ml-2"
                >
                    Refresh
                </Button>
            </div>
            
            <div className="space-y-4">
                <div>
                    <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>

                <Button 
                    onClick={handleUpload} 
                    disabled={!file || uploading}
                    className="w-full"
                >
                    {uploading ? 'Uploading...' : 'Upload Video'}
                </Button>

                {uploadStatus && (
                    <div className={`p-3 rounded ${
                        uploadStatus.includes('successful') 
                            ? 'bg-green-100 text-green-700' 
                            : uploadStatus.includes('failed') 
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                    }`}>
                        {uploadStatus}
                    </div>
                )}
            </div>
        </div>
    );
}