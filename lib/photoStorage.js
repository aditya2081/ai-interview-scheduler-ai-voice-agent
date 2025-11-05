import { supabaseStorage } from '@/lib/supabaseStorage';

/**
 * Upload candidate photo to Supabase Storage via server-side API (bypasses RLS)
 * @param {File} photoFile - The photo file to upload
 * @param {string} interviewId - Interview ID for organizing files
 * @param {string} candidateEmail - Candidate email for file naming
 * @returns {Promise<{success: boolean, photoUrl?: string, error?: string}>}
 */
export async function uploadCandidatePhoto(photoFile, interviewId, candidateEmail) {
    try {
        console.log('📸 Starting photo upload...', {
            fileName: photoFile.name,
            fileSize: photoFile.size,
            fileType: photoFile.type,
            interviewId,
            candidateEmail
        });
        
        const formData = new FormData();
        formData.append('photo', photoFile);
        formData.append('interviewId', interviewId);
        formData.append('candidateEmail', candidateEmail);

        console.log('📤 Sending request to /api/upload-photo...');
        
        const response = await fetch('/api/upload-photo', {
            method: 'POST',
            body: formData
        });

        console.log('📋 Response status:', response.status, response.statusText);
        
        const result = await response.json();
        console.log('📋 Response data:', result);
        
        if (!response.ok) {
            throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        console.log('✅ Photo uploaded successfully:', result);
        return result;

    } catch (error) {
        console.error('❌ Photo upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Convert blob/canvas to File object for upload
 * @param {Blob} blob - The photo blob
 * @param {string} filename - Desired filename
 * @returns {File}
 */
export function blobToFile(blob, filename = 'candidate-photo.jpg') {
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}

/**
 * Capture photo from video stream and upload to Supabase Storage
 * @param {HTMLVideoElement} videoElement - Video element to capture from
 * @param {string} interviewId - Interview ID
 * @param {string} candidateEmail - Candidate email
 * @returns {Promise<{success: boolean, photoUrl?: string, error?: string}>}
 */
export async function captureAndUploadPhoto(videoElement, interviewId, candidateEmail) {
    try {
        // Create canvas to capture photo
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas size to video dimensions
        canvas.width = videoElement.videoWidth || 640;
        canvas.height = videoElement.videoHeight || 480;
        
        // Draw current video frame to canvas
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob
        return new Promise((resolve, reject) => {
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    reject(new Error('Failed to capture photo'));
                    return;
                }

                try {
                    // Convert blob to file
                    const photoFile = blobToFile(blob);
                    
                    // Upload to Supabase Storage
                    const result = await uploadCandidatePhoto(photoFile, interviewId, candidateEmail);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            }, 'image/jpeg', 0.8);
        });

    } catch (error) {
        console.error('❌ Photo capture failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Delete candidate photo from Supabase Storage
 * @param {string} photoPath - Path to photo file in storage
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteCandidatePhoto(photoPath) {
    try {
        const { error } = await supabaseStorage.storage
            .from('interview-candidate')
            .remove([photoPath]);

        if (error) {
            throw error;
        }

        console.log('✅ Photo deleted successfully');
        return { success: true };

    } catch (error) {
        console.error('❌ Error deleting photo:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Update feedback record with candidate photo URL
 * @param {string} interviewId - Interview ID
 * @param {string} userEmail - User email
 * @param {string} photoUrl - Photo URL
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateFeedbackWithPhoto(interviewId, userEmail, photoUrl) {
    try {
        console.log('📝 Updating feedback with photo:', { interviewId, userEmail, photoUrl });
        
        // Import supabase here to avoid circular imports
        const { supabase } = await import('@/services/supabaseClient');
        
        // First check if the photo columns exist in the table
        const { data: tableInfo, error: tableError } = await supabase
            .from('interview-feedback')
            .select('candidate_photo, photo_status')
            .limit(1);
        
        if (tableError && tableError.message.includes('column')) {
            console.log('⚠️ Photo columns not found in database. Please run the migration first.');
            return {
                success: false,
                error: 'Photo columns not found in database. Please add them first using the SQL migration script.'
            };
        }
        
        const { data, error } = await supabase
            .from('interview-feedback')
            .update({ 
                candidate_photo: photoUrl,
                photo_status: 'completed'
            })
            .eq('interview_id', interviewId)
            .eq('userEmail', userEmail)
            .select();

        if (error) {
            console.error('❌ Error updating feedback with photo:', error);
            return {
                success: false,
                error: error.message
            };
        }

        console.log('✅ Feedback updated with photo URL:', data);
        return { success: true, data };

    } catch (error) {
        console.error('❌ Error in updateFeedbackWithPhoto:', error);
        return {
            success: false,
            error: error.message
        };
    }
}