import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
    try {
        // List files in the photos subfolder where candidate photos are stored
        const { data: photoFiles, error: listError } = await supabase.storage
            .from('candidate-photos')
            .list('photos', { limit: 20 });
        
        if (listError) {
            return NextResponse.json({
                success: false,
                error: `Cannot list candidate photos: ${listError.message}`
            });
        }
        
        const candidateUrls = [];
        
        // Generate URLs for candidate photos
        for (const file of photoFiles || []) {
            if (file.name && file.name !== '.emptyFolderPlaceholder') {
                const { data: urlData } = supabase.storage
                    .from('candidate-photos')
                    .getPublicUrl(`photos/${file.name}`);
                
                candidateUrls.push({
                    fileName: file.name,
                    publicUrl: urlData.publicUrl,
                    fileSize: file.metadata?.size || 'unknown',
                    lastModified: file.updated_at
                });
            }
        }
        
        return NextResponse.json({
            success: true,
            message: `Found ${candidateUrls.length} candidate photo URLs`,
            candidatePhotoUrls: candidateUrls,
            sampleUrls: candidateUrls.slice(0, 5).map(item => item.publicUrl),
            urlPattern: 'https://yjagcayfqmmqcomktors.supabase.co/storage/v1/object/public/candidate-photos/photos/[FILENAME]'
        });
        
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message
        });
    }
}