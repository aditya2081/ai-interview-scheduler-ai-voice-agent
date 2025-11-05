// Comprehensive photo URL sync script - runs automatically
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
    try {
        console.log('🔄 Starting comprehensive photo URL sync...');
        
        const body = await request.json();
        const { mode = 'auto-sync' } = body;
        
        // Step 1: Get all records with missing photo URLs
        const { data: recordsNeedingSync, error: fetchError } = await supabase
            .from('interview-feedback')
            .select('id, candidate_email, interview_session_id, candidate_photo_url, photo_status')
            .is('candidate_photo_url', null);
            
        if (fetchError) {
            console.error('❌ Error fetching records:', fetchError);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch records from database'
            }, { status: 500 });
        }
        
        console.log(`📊 Found ${recordsNeedingSync.length} records with missing photo URLs`);
        
        // Step 2: Get all photos from storage bucket
        const { data: allPhotos, error: storageError } = await supabase.storage
            .from('candidate-photos')
            .list('photos', { 
                limit: 1000,
                recursive: true 
            });
            
        if (storageError) {
            console.error('❌ Error fetching storage photos:', storageError);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch photos from storage'
            }, { status: 500 });
        }
        
        console.log(`📸 Found ${allPhotos.length} photos in storage`);
        
        // Step 3: Process each folder (interview ID) to find photos
        let totalUpdated = 0;
        let updateResults = [];
        
        for (const folder of allPhotos) {
            if (folder.name && folder.name !== 'photos') {
                const interviewId = folder.name;
                
                // Get photos in this interview folder
                const { data: interviewPhotos, error: folderError } = await supabase.storage
                    .from('candidate-photos')
                    .list(`photos/${interviewId}`, { limit: 100 });
                    
                if (folderError) {
                    console.log(`⚠️ Could not read folder ${interviewId}:`, folderError);
                    continue;
                }
                
                // Process each photo in this interview
                for (const photo of interviewPhotos) {
                    if (photo.name && photo.name.endsWith('.jpg')) {
                        const photoPath = `photos/${interviewId}/${photo.name}`;
                        
                        // Extract email from filename
                        const candidateEmail = extractEmailFromFilename(photo.name);
                        
                        if (candidateEmail) {
                            // Get public URL
                            const { data: { publicUrl } } = supabase.storage
                                .from('candidate-photos')
                                .getPublicUrl(photoPath);
                            
                            // Try to update database record
                            const updateResult = await updateDatabaseRecord(
                                candidateEmail,
                                interviewId,
                                publicUrl
                            );
                            
                            if (updateResult.success) {
                                totalUpdated++;
                                updateResults.push({
                                    email: candidateEmail,
                                    interviewId: interviewId,
                                    photoUrl: publicUrl,
                                    status: 'updated'
                                });
                                console.log(`✅ Updated: ${candidateEmail} -> ${publicUrl}`);
                            }
                        }
                    }
                }
            }
        }
        
        console.log(`🎉 Sync complete! Updated ${totalUpdated} records`);
        
        return NextResponse.json({
            success: true,
            message: `Successfully synced ${totalUpdated} photo URLs`,
            totalUpdated,
            recordsNeedingSync: recordsNeedingSync.length,
            photosInStorage: allPhotos.length,
            updateResults: updateResults
        });
        
    } catch (error) {
        console.error('❌ Comprehensive sync error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

// Helper function to extract email from filename
function extractEmailFromFilename(filename) {
    try {
        // Remove file extension
        const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|gif)$/i, '');
        
        // Try different patterns
        const patterns = [
            // Pattern: email_timestamp.jpg
            /^(.+)_\d{13,}$/,
            // Pattern: email_2025-timestamp.jpg  
            /^(.+)_\d{4}-\d{2}-\d{2}/,
            // Pattern: just email
            /^(.+)$/
        ];
        
        for (const pattern of patterns) {
            const match = nameWithoutExt.match(pattern);
            if (match) {
                let emailPart = match[1];
                
                // Convert underscores back to email format
                if (emailPart.includes('_gmail_com')) {
                    return emailPart.replace(/_gmail_com$/, '@gmail.com');
                } else if (emailPart.includes('_yahoo_com')) {
                    return emailPart.replace(/_yahoo_com$/, '@yahoo.com');
                } else if (emailPart.includes('_')) {
                    // Generic email pattern: name_domain_com -> name@domain.com
                    const parts = emailPart.split('_');
                    if (parts.length >= 3) {
                        const domain = parts.slice(-2).join('.');
                        const name = parts.slice(0, -2).join('_');
                        return `${name}@${domain}`;
                    }
                }
                
                // If it already looks like an email, return as is
                if (emailPart.includes('@')) {
                    return emailPart;
                }
            }
        }
        
        console.log(`⚠️ Could not extract email from filename: ${filename}`);
        return null;
    } catch (error) {
        console.error(`❌ Error extracting email from ${filename}:`, error);
        return null;
    }
}

// Helper function to update database record
async function updateDatabaseRecord(candidateEmail, interviewId, photoUrl) {
    try {
        // Try updating by candidate_email and interview_session_id
        const { data: updateData, error: updateError } = await supabase
            .from('interview-feedback')
            .update({
                candidate_photo_url: photoUrl,
                photo_status: 'completed',
                photo_uploaded_at: new Date().toISOString()
            })
            .eq('candidate_email', candidateEmail)
            .eq('interview_session_id', interviewId)
            .select();
            
        if (!updateError && updateData && updateData.length > 0) {
            return { success: true, method: 'exact_match', data: updateData[0] };
        }
        
        // Fallback: Try updating by candidate_email only (most recent record)
        const { data: fallbackData, error: fallbackError } = await supabase
            .from('interview-feedback')
            .update({
                candidate_photo_url: photoUrl,
                photo_status: 'completed',
                photo_uploaded_at: new Date().toISOString()
            })
            .eq('candidate_email', candidateEmail)
            .is('candidate_photo_url', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .select();
            
        if (!fallbackError && fallbackData && fallbackData.length > 0) {
            return { success: true, method: 'email_match', data: fallbackData[0] };
        }
        
        return { 
            success: false, 
            error: updateError?.message || fallbackError?.message || 'No matching record found' 
        };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// GET endpoint for easy testing
export async function GET() {
    return NextResponse.json({
        message: 'Comprehensive Photo URL Sync API',
        usage: 'POST request to sync all missing photo URLs automatically',
        endpoints: {
            sync: 'POST /',
            example: 'POST / with body: { "mode": "auto-sync" }'
        }
    });
}