import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client using anon key with special storage configuration
const supabaseForStorage = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        global: {
            headers: {
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
            }
        }
    }
);

export async function POST(request) {
    try {
        console.log('📸 Photo upload API called');
        
        const formData = await request.formData();
        const photo = formData.get('photo');
        const interviewId = formData.get('interviewId');
        const candidateEmail = formData.get('candidateEmail');

        if (!photo || !interviewId || !candidateEmail) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Convert File to ArrayBuffer
        const arrayBuffer = await photo.arrayBuffer();
        
        // Generate unique filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const sanitizedEmail = candidateEmail.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `photos/${interviewId}/${sanitizedEmail}_${timestamp}.jpg`;

        console.log('📸 Uploading photo to:', fileName);

        // Use existing candidate-photos bucket (no need to create)
        console.log('📦 Using existing candidate-photos bucket...');

        // Upload to Supabase Storage
        const { data, error } = await supabaseForStorage.storage
            .from('candidate-photos')
            .upload(fileName, arrayBuffer, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('❌ Upload error:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: urlData } = supabaseForStorage.storage
            .from('candidate-photos')  // Updated bucket name
            .getPublicUrl(fileName);

        console.log('✅ Photo uploaded successfully:', urlData.publicUrl);

        // AUTOMATIC PHOTO URL SAVING FOR FUTURE INTERVIEWS
        try {
            console.log('💾 AUTOMATICALLY saving photo URL for interview:', interviewId, 'email:', candidateEmail);
            console.log('📸 Photo URL to save:', urlData.publicUrl);
            
            // Strategy: Always try to update first, then create if no record exists
            let updateSuccess = false;
            
            // Method 1: Try updating existing record by email and interview (most common case)
            const { data: updateData, error: updateError } = await supabaseForStorage
                .from('interview-feedback')
                .update({ 
                    candidate_photo_url: urlData.publicUrl,
                    photo_status: 'completed',
                    photo_uploaded_at: new Date().toISOString()
                })
                .eq('candidate_email', candidateEmail)  // Use correct column name: candidate_email
                .eq('interview_session_id', interviewId)  // Use correct column name: interview_session_id
                .select();

            if (!updateError && updateData && updateData.length > 0) {
                console.log('✅ AUTOMATICALLY updated existing interview feedback with photo URL');
                updateSuccess = true;
            } else {
                console.log('⚠️ No existing record found, trying to create new one...');
                
                // Method 2: Create new feedback record with photo URL
                const { data: insertData, error: insertError } = await supabaseForStorage
                    .from('interview-feedback')
                    .insert({ 
                        interview_session_id: interviewId,  // Use correct column name: interview_session_id
                        candidate_email: candidateEmail,  // Use correct column name: candidate_email
                        candidate_photo_url: urlData.publicUrl,
                        photo_status: 'completed',
                        photo_uploaded_at: new Date().toISOString(),
                        created_at: new Date().toISOString()
                    })
                    .select();

                if (!insertError && insertData && insertData.length > 0) {
                    console.log('✅ AUTOMATICALLY created new interview feedback record with photo URL');
                    updateSuccess = true;
                } else {
                    console.log('⚠️ Insert failed, trying fallback method...');
                    
                    // Method 3: Fallback - update any record with this email (for existing interviews)
                    const { data: fallbackData, error: fallbackError } = await supabaseForStorage
                        .from('interview-feedback')
                        .update({ 
                            candidate_photo_url: urlData.publicUrl,
                            photo_status: 'completed',
                            photo_uploaded_at: new Date().toISOString()
                        })
                        .eq('candidate_email', candidateEmail)  // Use correct column name: candidate_email
                        .is('candidate_photo_url', null)
                        .select()
                        .limit(1);

                    if (!fallbackError && fallbackData && fallbackData.length > 0) {
                        console.log('✅ AUTOMATICALLY updated feedback record using fallback method');
                        updateSuccess = true;
                    }
                }
            }
            
            if (updateSuccess) {
                console.log('🎉 SUCCESS: Photo URL automatically saved to database!');
            } else {
                console.log('⚠️ Could not save to database, but photo is uploaded and URL generated');
            }
            
        } catch (feedbackError) {
            console.error('⚠️ Database update error (photo still uploaded successfully):', feedbackError);
        }

        return NextResponse.json({
            success: true,
            photoUrl: urlData.publicUrl,
            fileName: fileName,
            path: data.path
        });

    } catch (error) {
        console.error('❌ Server error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}