import { createClient } from '@supabase/supabase-js'

// Create a Supabase client specifically for storage operations without auth
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

// Create client with auth disabled for storage operations
export const supabaseStorage = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    }
)

console.log('✅ Storage-only Supabase client created (no auth required)');