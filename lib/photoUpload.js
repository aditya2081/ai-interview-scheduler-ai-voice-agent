// Simple photo storage utility for candidate photos

/**
 * Upload candidate photo using server-side API
 * @param {string} base64Photo - Base64 encoded photo data
 * @param {string} interviewId - Interview ID
 * @param {string} candidateEmail - Candidate email
 * @returns {Promise<{success: boolean, photoUrl?: string, error?: string}>}
 */
export async function uploadCandidatePhoto(base64Photo, interviewId, candidateEmail) {
    try {
        console.log('📤 Uploading candidate photo...');
        
        const formData = new FormData();
        formData.append('photo', base64Photo);
        formData.append('interviewId', interviewId);
        formData.append('candidateEmail', candidateEmail);

        const response = await fetch('/api/upload-photo-new', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Upload failed');
        }

        console.log('✅ Photo uploaded successfully:', result.photoUrl);
        return {
            success: true,
            photoUrl: result.photoUrl,
            fileName: result.fileName
        };

    } catch (error) {
        console.error('❌ Photo upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}