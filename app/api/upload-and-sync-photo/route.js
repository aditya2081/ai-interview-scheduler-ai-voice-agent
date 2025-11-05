import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
    try {
        console.log('🔄 Starting photo upload and sync process...');
        
        const formData = await request.formData();
        const file = formData.get('photo');
        const interviewId = formData.get('interviewId');
        const candidateEmail = formData.get('candidateEmail');
        
        if (!file || !interviewId || !candidateEmail) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields: photo, interviewId, or candidateEmail'
            }, { status: 400 });
        }

        console.log(`📸 Uploading photo for: ${candidateEmail}, Interview: ${interviewId}`);

        // Step 1: Upload photo to storage
        const timestamp = Date.now();
        const emailForFilename = candidateEmail.replace(/[@.]/g, '_');
        const fileName = `${emailForFilename}_${timestamp}.jpg`;
        const filePath = `photos/${interviewId}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('candidate-photos')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('❌ Upload error:', uploadError);
            return NextResponse.json({
                success: false,
                error: 'Failed to upload photo: ' + uploadError.message
            }, { status: 500 });
        }

        console.log('✅ Photo uploaded successfully:', uploadData.path);

        // Step 2: Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('candidate-photos')
            .getPublicUrl(filePath);

        console.log('🔗 Public URL generated:', publicUrl);

        // Step 3: Immediately update database with photo URL
        const { data: updateData, error: updateError } = await supabase
            .from('interview-feedback')
            .update({
                candidate_photo_url: publicUrl,
                photo_status: 'completed'
            })
            .eq('candidate_email', candidateEmail)  // Use correct column name
            .eq('interview_session_id', interviewId)  // Use correct column name
            .select();

        if (updateError) {
            console.error('❌ Database update error:', updateError);
            // Photo was uploaded but DB update failed - try alternative approaches
            
            // Try updating by candidate_email only (in case interview_session_id doesn't match exactly)
            const { data: fallbackData, error: fallbackError } = await supabase
                .from('interview-feedback')
                .update({
                    candidate_photo_url: publicUrl,
                    photo_status: 'completed'
                })
                .eq('candidate_email', candidateEmail)  // Use correct column name
                .is('candidate_photo_url', null)
                .order('created_at', { ascending: false })
                .limit(1)
                .select();

            if (fallbackError || !fallbackData || fallbackData.length === 0) {
                console.error('❌ Fallback update also failed:', fallbackError);
                return NextResponse.json({
                    success: true,
                    photoUrl: publicUrl,
                    warning: 'Photo uploaded but database update failed. Manual sync may be required.',
                    uploadPath: uploadData.path
                });
            } else {
                console.log('✅ Fallback database update successful');
                return NextResponse.json({
                    success: true,
                    message: 'Photo uploaded and database updated successfully (via fallback)',
                    photoUrl: publicUrl,
                    uploadPath: uploadData.path,
                    databaseUpdate: fallbackData[0]
                });
            }
        }

        console.log('✅ Database updated successfully:', updateData);

        return NextResponse.json({
            success: true,
            message: 'Photo uploaded and database updated successfully',
            photoUrl: publicUrl,
            uploadPath: uploadData.path,
            databaseUpdate: updateData[0]
        });

    } catch (error) {
        console.error('❌ Upload and sync error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}