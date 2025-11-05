import { supabase } from '@/services/supabaseClient';
import { supabaseStorage } from '@/lib/supabaseStorage';

/**
 * Upload video using server-side API (alternative method)
 * @param {File} videoFile - The video file to upload
 * @param {string} interviewId - Interview ID for organizing files
 * @param {string} candidateEmail - Candidate email for file naming
 * @returns {Promise<{success: boolean, videoUrl?: string, error?: string}>}
 */
export async function uploadVideoViaAPI(videoFile, interviewId, candidateEmail) {
    try {
        console.log('📤 Using server-side upload API');
        
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('interviewId', interviewId);
        formData.append('candidateEmail', candidateEmail);

        const response = await fetch('/api/upload-video', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Upload failed');
        }

        console.log('✅ Server upload successful:', result);
        return result;

    } catch (error) {
        console.error('❌ API upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Use the API upload as the primary method now
export async function uploadInterviewVideo(videoFile, interviewId, candidateEmail, onProgress = null) {
    console.log('🚀 Attempting video upload...');
    
    // Try API upload first (more reliable)
    const apiResult = await uploadVideoViaAPI(videoFile, interviewId, candidateEmail);
    
    if (apiResult.success) {
        console.log('✅ API upload successful');
        
        // Automatically update feedback table with video URL
        if (apiResult.videoUrl) {
            console.log('📝 Updating feedback table with video URL...');
            const updateResult = await updateFeedbackWithVideoByInterview(
                interviewId, 
                candidateEmail, 
                apiResult.videoUrl, 
                null // Duration will be calculated separately if needed
            );
            
            if (updateResult.success) {
                console.log('✅ Feedback table updated with video URL');
            } else {
                console.log('⚠️ Failed to update feedback table:', updateResult.error);
            }
        }
        
        return apiResult;
    }
    
    console.log('⚠️ API upload failed, trying direct client upload...');
    
    // Fallback to direct client upload
    return uploadInterviewVideoDirect(videoFile, interviewId, candidateEmail, onProgress);
}

/**
 * Direct client upload (original method - keep as fallback)
 */
async function uploadInterviewVideoDirect(videoFile, interviewId, candidateEmail, onProgress = null) {
    try {
        if (!videoFile) {
            throw new Error('No video file provided');
        }

        // Generate unique filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const sanitizedEmail = candidateEmail.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${interviewId}/${sanitizedEmail}_${timestamp}.webm`;

        console.log('📹 Direct upload:', fileName);

        // Use the auth-free storage client
        const { data, error } = await supabaseStorage.storage
            .from('interview-candidate')
            .upload(fileName, videoFile, {
                cacheControl: '3600',
                upsert: false,
                contentType: videoFile.type || 'video/webm'
            });

        if (error) {
            console.error('❌ Direct upload error:', error);
            throw error;
        }

        // Get public URL using auth-free client
        const { data: urlData } = supabaseStorage.storage
            .from('interview-candidate')
            .getPublicUrl(fileName);

        const result = {
            success: true,
            videoUrl: urlData.publicUrl,
            fileName: fileName,
            path: data.path
        };

        // Automatically update feedback table with video URL
        console.log('📝 Updating feedback table with video URL...');
        const updateResult = await updateFeedbackWithVideoByInterview(
            interviewId, 
            candidateEmail, 
            urlData.publicUrl, 
            null // Duration will be calculated separately if needed
        );
        
        if (updateResult.success) {
            console.log('✅ Feedback table updated with video URL');
        } else {
            console.log('⚠️ Failed to update feedback table:', updateResult.error);
        }

        return result;

    } catch (error) {
        console.error('❌ Direct upload failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Update interview feedback with video URL by interview ID and candidate email
 * @param {string} interviewId - Interview ID
 * @param {string} candidateEmail - Candidate email
 * @param {string} videoUrl - URL of uploaded video
 * @param {number} videoDuration - Duration in seconds
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateFeedbackWithVideoByInterview(interviewId, candidateEmail, videoUrl, videoDuration = null) {
    try {
        const updateData = {
            video_url: videoUrl,
            video_status: 'completed'
        };

        if (videoDuration) {
            updateData.video_duration = videoDuration;
        }

        const { error } = await supabase
            .from('interview-feedback')
            .update(updateData)
            .eq('interview_id', interviewId)
            .eq('userEmail', candidateEmail);

        if (error) {
            throw error;
        }

        console.log('✅ Feedback updated with video URL for interview:', interviewId);
        return { success: true };

    } catch (error) {
        console.error('❌ Error updating feedback with video:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Update interview feedback with video URL
 * @param {string} feedbackId - Feedback record ID
 * @param {string} videoUrl - URL of uploaded video
 * @param {number} videoDuration - Duration in seconds
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateFeedbackWithVideo(feedbackId, videoUrl, videoDuration = null) {
    try {
        const updateData = {
            video_url: videoUrl,
            video_status: 'completed',
            video_duration: videoDuration
        };

        const { error } = await supabase
            .from('interview-feedback')
            .update(updateData)
            .eq('id', feedbackId);

        if (error) {
            throw error;
        }

        console.log('✅ Feedback updated with video URL');
        return { success: true };

    } catch (error) {
        console.error('❌ Error updating feedback with video:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Delete video from Supabase Storage
 * @param {string} videoPath - Path to video file in storage
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteInterviewVideo(videoPath) {
    try {
        const { error } = await supabaseStorage.storage
            .from('interview-candidate')
            .remove([videoPath]);

        if (error) {
            throw error;
        }

        console.log('✅ Video deleted successfully');
        return { success: true };

    } catch (error) {
        console.error('❌ Error deleting video:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get video metadata and URL
 * @param {string} videoPath - Path to video file in storage
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getVideoInfo(videoPath) {
    try {
        // Get file info
        const { data: fileData, error: fileError } = await supabaseStorage.storage
            .from('interview-candidate')
            .list(videoPath.split('/')[0], {
                search: videoPath.split('/')[1]
            });

        if (fileError) {
            throw fileError;
        }

        // Get public URL
        const { data: urlData } = supabaseStorage.storage
            .from('interview-candidate')
            .getPublicUrl(videoPath);

        return {
            success: true,
            data: {
                ...fileData[0],
                publicUrl: urlData.publicUrl
            }
        };

    } catch (error) {
        console.error('❌ Error getting video info:', error);
        return {
            success: false,
            error: error.message
        };
    }
}