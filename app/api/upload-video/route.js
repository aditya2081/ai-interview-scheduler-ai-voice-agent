import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Server-side Supabase client (has elevated permissions)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
    try {
        console.log('📤 Server-side video upload started');
        
        const formData = await request.formData();
        const videoFile = formData.get('video');
        const interviewId = formData.get('interviewId');
        const candidateEmail = formData.get('candidateEmail');

        if (!videoFile) {
            return NextResponse.json({
                success: false,
                error: 'No video file provided'
            }, { status: 400 });
        }

        // Generate unique filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const sanitizedEmail = candidateEmail?.replace(/[^a-zA-Z0-9]/g, '_') || 'anonymous';
        const fileName = `${interviewId || 'test'}/${sanitizedEmail}_${timestamp}.webm`;

        console.log('📹 Uploading to:', fileName);
        console.log('📁 File size:', videoFile.size);

        // Convert File to ArrayBuffer
        const arrayBuffer = await videoFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('interview-candidate')
            .upload(fileName, uint8Array, {
                contentType: videoFile.type || 'video/webm',
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('❌ Upload error:', error);
            throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('interview-candidate')
            .getPublicUrl(fileName);

        console.log('✅ Upload successful:', urlData.publicUrl);

        return NextResponse.json({
            success: true,
            videoUrl: urlData.publicUrl,
            fileName: fileName,
            path: data.path
        });

    } catch (error) {
        console.error('❌ Server upload error:', error);
        
        return NextResponse.json({
            success: false,
            error: error.message || 'Upload failed'
        }, { status: 500 });
    }
}