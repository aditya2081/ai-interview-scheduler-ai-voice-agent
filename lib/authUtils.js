import { supabase } from '@/services/supabaseClient';

export const checkAuthSession = async () => {
    try {
        // Check current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.error('Session error:', sessionError);
            return { success: false, error: sessionError, session: null };
        }

        // Check current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
            console.error('User error:', userError);
            return { success: false, error: userError, session, user: null };
        }

        console.log('Auth check results:', {
            hasSession: !!session,
            hasUser: !!user,
            sessionExpiry: session?.expires_at,
            userEmail: user?.email
        });

        return {
            success: true,
            session,
            user,
            isAuthenticated: !!(session && user)
        };
    } catch (error) {
        console.error('Auth check failed:', error);
        return { success: false, error, session: null, user: null };
    }
};

export const ensureAuthenticated = async () => {
    const authResult = await checkAuthSession();
    
    if (!authResult.success || !authResult.isAuthenticated) {
        throw new Error(`Authentication required: ${authResult.error?.message || 'No valid session'}`);
    }
    
    return authResult;
};