import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
    try {
        // Parse request body for filtering options
        let filterOptions = {};
        try {
            const body = await request.text();
            if (body) {
                filterOptions = JSON.parse(body);
            }
        } catch (e) {
            // If no body or invalid JSON, proceed with full sync
        }

        const { interviewId: targetInterviewId, candidateEmail: targetEmail, autoSync } = filterOptions;
        
        console.log('🔄 Starting photo URL sync...', { 
            targetInterviewId, 
            targetEmail, 
            autoSync,
            mode: targetInterviewId || targetEmail ? 'filtered' : 'full'
        });
        
        // Step 1: Get all photos from candidate-photos bucket
        const { data: storageFiles, error: storageError } = await supabase.storage
            .from('candidate-photos')
            .list('photos', {
                limit: 1000,
                sortBy: { column: 'created_at', order: 'desc' }
            });

        if (storageError) {
            console.error('❌ Storage error:', storageError);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch storage files: ' + storageError.message
            });
        }

        console.log(`📁 Found ${storageFiles.length} items in storage`);
        
        const syncResults = [];
        let successCount = 0;
        let errorCount = 0;

        // Step 2: Process each interview folder (with optional filtering)
        for (const folder of storageFiles) {
            if (folder.name && folder.name !== '.emptyFolderPlaceholder') {
                const interviewId = folder.name;
                
                // Skip if we're filtering by interview ID and this doesn't match
                if (targetInterviewId && interviewId !== targetInterviewId) {
                    continue;
                }
                
                console.log(`📂 Processing interview folder: ${interviewId}`);
                
                // Get photos in this interview folder
                const { data: interviewPhotos, error: photoError } = await supabase.storage
                    .from('candidate-photos')
                    .list(`photos/${interviewId}`, {
                        limit: 100,
                        sortBy: { column: 'created_at', order: 'desc' }
                    });

                if (photoError) {
                    console.error(`❌ Error listing photos for ${interviewId}:`, photoError);
                    continue;
                }

                // Step 3: Process each photo in the folder
                for (const photo of interviewPhotos) {
                    if (photo.name && photo.name.endsWith('.jpg')) {
                        try {
                            // Extract email from filename (format: email_timestamp.jpg)
                            const filename = photo.name;
                            const emailPart = filename.split('_');
                            emailPart.pop(); // Remove timestamp
                            
                            // Better email reconstruction - handle the _gmail_com format
                            let candidateEmail = emailPart.join('_');
                            
                            // Convert specific patterns: email_gmail_com -> email@gmail.com
                            candidateEmail = candidateEmail.replace(/_gmail_com$/, '@gmail.com');
                            candidateEmail = candidateEmail.replace(/_yahoo_com$/, '@yahoo.com');
                            candidateEmail = candidateEmail.replace(/_hotmail_com$/, '@hotmail.com');
                            candidateEmail = candidateEmail.replace(/_outlook_com$/, '@outlook.com');
                            
                            // Fallback: if no specific domain pattern, use general replacement
                            if (!candidateEmail.includes('@')) {
                                candidateEmail = candidateEmail.replace(/_/g, '@');
                                candidateEmail = candidateEmail.replace(/@+/g, '@'); // Fix multiple @
                            }
                            
                            // Skip if we're filtering by email and this doesn't match
                            if (targetEmail && candidateEmail !== targetEmail) {
                                continue;
                            }
                            
                            // Generate public URL
                            const { data: { publicUrl } } = supabase.storage
                                .from('candidate-photos')
                                .getPublicUrl(`photos/${interviewId}/${filename}`);

                            console.log(`📸 Processing: ${filename} -> ${candidateEmail}`);
                            console.log(`🔗 URL: ${publicUrl}`);

                            // Step 4: Update database record - Rolling back photo_url to candidate_photo_url
                            // Try multiple email field approaches since the exact schema might vary
                            let updateSuccess = false;
                            let updateMethod = '';
                            
                            // Strategy 1: Try candidate_email field (correct column name from schema)
                            try {
                                const { data: updateData1, error: updateError1 } = await supabase
                                    .from('interview-feedback')
                                    .update({
                                        candidate_photo_url: publicUrl,
                                        photo_status: 'completed'
                                    })
                                    .eq('candidate_email', candidateEmail)
                                    .is('candidate_photo_url', null)
                                    .order('created_at', { ascending: false })
                                    .limit(1)
                                    .select();

                                if (!updateError1 && updateData1 && updateData1.length > 0) {
                                    updateSuccess = true;
                                    updateMethod = 'candidate_email';
                                    console.log(`✅ Rollback successful via candidate_email for ${candidateEmail}`);
                                }
                            } catch (e1) {
                                console.log(`❌ candidate_email strategy failed: ${e1.message}`);
                            }

                            // Strategy 2: Try userEmail field if candidate_email failed (legacy fallback)
                            if (!updateSuccess) {
                                try {
                                    const { data: updateData2, error: updateError2 } = await supabase
                                        .from('interview-feedback')
                                        .update({
                                            candidate_photo_url: publicUrl,
                                            photo_status: 'completed'
                                        })
                                        .eq('userEmail', candidateEmail)
                                        .is('candidate_photo_url', null)
                                        .order('created_at', { ascending: false })
                                        .limit(1)
                                        .select();

                                    if (!updateError2 && updateData2 && updateData2.length > 0) {
                                        updateSuccess = true;
                                        updateMethod = 'userEmail (legacy)';
                                        console.log(`✅ Rollback successful via userEmail legacy fallback for ${candidateEmail}`);
                                    }
                                } catch (e2) {
                                    console.log(`❌ candidate_email strategy failed: ${e2.message}`);
                                }
                            }

                            if (updateSuccess) {
                                successCount++;
                                syncResults.push({
                                    email: candidateEmail,
                                    interviewId: interviewId,
                                    photoUrl: publicUrl,
                                    status: 'success',
                                    method: updateMethod
                                });
                            } else {
                                console.log(`❌ No matching record found for ${candidateEmail}`);
                                errorCount++;
                                syncResults.push({
                                    email: candidateEmail,
                                    interviewId: interviewId,
                                    photoUrl: publicUrl,
                                    status: 'no_match',
                                    error: 'No matching database record found or all photo URLs already populated'
                                });
                            }

                        } catch (error) {
                            console.error(`❌ Processing error for ${photo.name}:`, error);
                            errorCount++;
                            syncResults.push({
                                filename: photo.name,
                                status: 'error',
                                error: error.message
                            });
                        }
                    }
                }
            }
        }

        const syncMode = targetInterviewId || targetEmail ? 'filtered' : 'full';
        const syncDescription = targetInterviewId || targetEmail ? 
            `Filtered sync for ${targetInterviewId ? `interview ${targetInterviewId}` : ''}${targetInterviewId && targetEmail ? ' and ' : ''}${targetEmail ? `email ${targetEmail}` : ''}` :
            'Full sync of all photos';

        return NextResponse.json({
            success: true,
            message: `🎉 Photo URL sync completed! ${autoSync ? '(Auto-sync)' : ''}`,
            summary: {
                totalProcessed: syncResults.length,
                successfulRollbacks: successCount,
                errors: errorCount,
                mode: syncMode,
                description: syncDescription,
                filtering: { targetInterviewId, targetEmail }
            },
            results: syncResults
        });

    } catch (error) {
        console.error('❌ Photo URL rollback error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            message: 'Failed to rollback photo URLs from storage to database'
        }, { status: 500 });
    }
}