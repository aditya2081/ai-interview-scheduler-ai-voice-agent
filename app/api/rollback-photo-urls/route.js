import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST() {
    try {
        console.log('🔄 Starting comprehensive photo URL rollback and migration...');
        
        let migrationResults = {
            storageToDatabase: { success: 0, errors: 0, details: [] },
            photoUrlMigration: { success: 0, errors: 0, details: [] },
            summary: {}
        };

        // PART 1: Check if there's a photo_url column that needs migration to candidate_photo_url
        console.log('📋 Checking for photo_url column migration...');
        
        try {
            // First, check if photo_url column exists
            const { data: columnCheck, error: columnError } = await supabase
                .from('interview_feedback')
                .select('photo_url')
                .limit(1);

            if (!columnError) {
                console.log('📸 Found photo_url column, migrating to candidate_photo_url...');
                
                // Get all records with photo_url but no candidate_photo_url
                const { data: recordsToMigrate, error: fetchError } = await supabase
                    .from('interview_feedback')
                    .select('id, photo_url, candidate_photo_url, candidate_email, userEmail')
                    .not('photo_url', 'is', null)
                    .is('candidate_photo_url', null);

                if (!fetchError && recordsToMigrate && recordsToMigrate.length > 0) {
                    console.log(`🔄 Migrating ${recordsToMigrate.length} records from photo_url to candidate_photo_url...`);
                    
                    for (const record of recordsToMigrate) {
                        const { data: updateData, error: updateError } = await supabase
                            .from('interview_feedback')
                            .update({
                                candidate_photo_url: record.photo_url,
                                photo_status: 'completed',
                                photo_uploaded_at: new Date().toISOString()
                            })
                            .eq('id', record.id)
                            .select();

                        if (updateError) {
                            migrationResults.photoUrlMigration.errors++;
                            migrationResults.photoUrlMigration.details.push({
                                id: record.id,
                                email: record.candidate_email || record.userEmail,
                                status: 'error',
                                error: updateError.message
                            });
                        } else {
                            migrationResults.photoUrlMigration.success++;
                            migrationResults.photoUrlMigration.details.push({
                                id: record.id,
                                email: record.candidate_email || record.userEmail,
                                photoUrl: record.photo_url,
                                status: 'migrated'
                            });
                        }
                    }
                }
            } else {
                console.log('ℹ️ No photo_url column found, skipping column migration');
            }
        } catch (columnMigrationError) {
            console.log('ℹ️ photo_url column does not exist, proceeding with storage sync only');
        }

        // PART 2: Sync photos from candidate-photos storage bucket to database
        console.log('📁 Starting storage to database sync...');
        
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

        // Process each interview folder
        for (const folder of storageFiles) {
            if (folder.name && folder.name !== '.emptyFolderPlaceholder') {
                const interviewId = folder.name;
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

                // Process each photo in the folder
                for (const photo of interviewPhotos) {
                    if (photo.name && photo.name.endsWith('.jpg')) {
                        try {
                            // Extract email from filename (format: email_timestamp.jpg)
                            const filename = photo.name;
                            const emailPart = filename.split('_');
                            emailPart.pop(); // Remove timestamp
                            const candidateEmail = emailPart.join('_').replace(/_/g, '@').replace(/@@/g, '_');
                            
                            // Generate public URL
                            const { data: { publicUrl } } = supabase.storage
                                .from('candidate-photos')
                                .getPublicUrl(`photos/${interviewId}/${filename}`);

                            console.log(`📸 Processing: ${filename} -> ${candidateEmail}`);

                            // Try multiple update strategies
                            let updateSuccess = false;
                            let updateMethod = '';

                            // Strategy 1: Update by candidate_email and interview_session_id
                            const { data: updateData1, error: updateError1 } = await supabase
                                .from('interview_feedback')
                                .update({
                                    candidate_photo_url: publicUrl,
                                    photo_status: 'completed',
                                    photo_uploaded_at: new Date().toISOString()
                                })
                                .eq('candidate_email', candidateEmail)
                                .eq('interview_session_id', interviewId)
                                .select();

                            if (!updateError1 && updateData1 && updateData1.length > 0) {
                                updateSuccess = true;
                                updateMethod = 'candidate_email_with_interview_id';
                            }

                            // Strategy 2: Update by userEmail and interview_session_id
                            if (!updateSuccess) {
                                const { data: updateData2, error: updateError2 } = await supabase
                                    .from('interview_feedback')
                                    .update({
                                        candidate_photo_url: publicUrl,
                                        photo_status: 'completed',
                                        photo_uploaded_at: new Date().toISOString()
                                    })
                                    .eq('userEmail', candidateEmail)
                                    .eq('interview_session_id', interviewId)
                                    .select();

                                if (!updateError2 && updateData2 && updateData2.length > 0) {
                                    updateSuccess = true;
                                    updateMethod = 'userEmail_with_interview_id';
                                }
                            }

                            // Strategy 3: Update by email only (no interview constraint)
                            if (!updateSuccess) {
                                const { data: updateData3, error: updateError3 } = await supabase
                                    .from('interview_feedback')
                                    .update({
                                        candidate_photo_url: publicUrl,
                                        photo_status: 'completed',
                                        photo_uploaded_at: new Date().toISOString()
                                    })
                                    .or(`candidate_email.eq.${candidateEmail},userEmail.eq.${candidateEmail}`)
                                    .is('candidate_photo_url', null)
                                    .select()
                                    .limit(1);

                                if (!updateError3 && updateData3 && updateData3.length > 0) {
                                    updateSuccess = true;
                                    updateMethod = 'email_only_fallback';
                                }
                            }

                            if (updateSuccess) {
                                migrationResults.storageToDatabase.success++;
                                migrationResults.storageToDatabase.details.push({
                                    email: candidateEmail,
                                    interviewId: interviewId,
                                    photoUrl: publicUrl,
                                    status: 'success',
                                    method: updateMethod
                                });
                                console.log(`✅ Rollback successful for ${candidateEmail} via ${updateMethod}`);
                            } else {
                                migrationResults.storageToDatabase.errors++;
                                migrationResults.storageToDatabase.details.push({
                                    email: candidateEmail,
                                    interviewId: interviewId,
                                    photoUrl: publicUrl,
                                    status: 'error',
                                    error: 'No matching database record found'
                                });
                                console.log(`❌ No matching record found for ${candidateEmail}`);
                            }

                        } catch (error) {
                            console.error(`❌ Processing error for ${photo.name}:`, error);
                            migrationResults.storageToDatabase.errors++;
                            migrationResults.storageToDatabase.details.push({
                                filename: photo.name,
                                status: 'error',
                                error: error.message
                            });
                        }
                    }
                }
            }
        }

        // Compile summary
        migrationResults.summary = {
            totalStorageRollbacks: migrationResults.storageToDatabase.success + migrationResults.storageToDatabase.errors,
            successfulStorageRollbacks: migrationResults.storageToDatabase.success,
            storageRollbackErrors: migrationResults.storageToDatabase.errors,
            totalPhotoUrlMigrations: migrationResults.photoUrlMigration.success + migrationResults.photoUrlMigration.errors,
            successfulPhotoUrlMigrations: migrationResults.photoUrlMigration.success,
            photoUrlMigrationErrors: migrationResults.photoUrlMigration.errors,
            overallSuccess: (migrationResults.storageToDatabase.success + migrationResults.photoUrlMigration.success) > 0
        };

        return NextResponse.json({
            success: true,
            message: `🎉 Photo URL rollback and migration completed!`,
            description: 'Photos have been rolled back from candidate-photos storage to interview-feedback.candidate_photo_url, and any existing photo_url columns have been migrated.',
            summary: migrationResults.summary,
            details: migrationResults
        });

    } catch (error) {
        console.error('❌ Comprehensive rollback error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            message: 'Failed to complete photo URL rollback and migration'
        }, { status: 500 });
    }
}

// GET endpoint to check current photo URL status
export async function GET() {
    try {
        console.log('📊 Checking current photo URL status...');

        // Get photo status summary
        const { data: statusData, error: statusError } = await supabase
            .from('interview_feedback')
            .select('candidate_photo_url, photo_status, candidate_email, userEmail, created_at');

        if (statusError) {
            throw statusError;
        }

        const summary = {
            totalRecords: statusData.length,
            recordsWithPhotos: statusData.filter(r => r.candidate_photo_url).length,
            recordsWithoutPhotos: statusData.filter(r => !r.candidate_photo_url).length,
            completedStatus: statusData.filter(r => r.photo_status === 'completed').length,
            pendingStatus: statusData.filter(r => r.photo_status === 'pending').length,
            recentRecords: statusData
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 10)
                .map(r => ({
                    email: r.candidate_email || r.userEmail,
                    hasPhoto: !!r.candidate_photo_url,
                    status: r.photo_status,
                    created: r.created_at
                }))
        };

        return NextResponse.json({
            success: true,
            message: 'Photo URL status retrieved successfully',
            summary
        });

    } catch (error) {
        console.error('❌ Status check error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}