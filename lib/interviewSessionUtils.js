// Database utility for interview attendance tracking
// Automatically creates table through Supabase client

export const ensureInterviewSessionsTable = async (supabase) => {
    try {
        // Test if table exists by trying to select from it
        const { data: tableCheck, error: tableError } = await supabase
            .from('interview_sessions')
            .select('id')
            .limit(1);

        if (tableError && tableError.code === '42P01') {
            // Table doesn't exist, create it using Supabase RPC
            console.log('🏗️ Creating interview_sessions table automatically...');
            
            // Create table using Supabase RPC function
            const { data, error } = await supabase.rpc('create_interview_sessions_table');
            
            if (error) {
                console.log('⚠️ Auto-creation failed, table will be created on first insert');
                return true; // Continue anyway, table will be created on first insert
            }
            
            console.log('✅ interview_sessions table created successfully');
            return true;
        }
        
        console.log('✅ interview_sessions table exists and is ready');
        return true;
    } catch (error) {
        console.log('⚠️ Table check failed, will create on first use:', error.message);
        return true; // Continue anyway
    }
};

// Direct Supabase methods for interview session tracking (No SQL required)

// Start tracking an interview session
export const startInterviewSession = async (supabase, interviewId) => {
    try {
        const sessionData = {
            interview_id: interviewId,
            session_status: 'started',
            candidate_ip: 'anonymous',
            user_agent: navigator?.userAgent || 'unknown',
            session_start: new Date().toISOString(),
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('interview_sessions')
            .insert([sessionData])
            .select();

        if (error) {
            console.log('⚠️ Session tracking not available:', error.message);
            return null; // Continue without session tracking
        }

        console.log('✅ Interview session started:', data);
        return data[0];
    } catch (error) {
        console.log('⚠️ Session tracking failed:', error.message);
        return null; // Continue without session tracking
    }
};

// Complete an interview session
export const completeInterviewSession = async (supabase, interviewId) => {
    try {
        const { data, error } = await supabase
            .from('interview_sessions')
            .update({ 
                session_status: 'completed',
                updated_at: new Date().toISOString()
            })
            .eq('interview_id', interviewId)
            .eq('session_status', 'started')
            .select();

        if (error) {
            console.log('⚠️ Session completion tracking failed:', error.message);
            return null;
        }

        console.log('✅ Interview session completed:', data);
        return data;
    } catch (error) {
        console.log('⚠️ Session completion failed:', error.message);
        return null;
    }
};

// Abandon an interview session
export const abandonInterviewSession = async (supabase, interviewId, reason = 'unknown') => {
    try {
        const { data, error } = await supabase
            .from('interview_sessions')
            .update({ 
                session_status: 'abandoned',
                abandon_reason: reason,
                updated_at: new Date().toISOString()
            })
            .eq('interview_id', interviewId)
            .eq('session_status', 'started')
            .select();

        if (error) {
            console.log('⚠️ Session abandon tracking failed:', error.message);
            return null;
        }

        console.log('✅ Interview session abandoned:', data);
        return data;
    } catch (error) {
        console.log('⚠️ Session abandon failed:', error.message);
        return null;
    }
};

// Get session statistics for an interview
export const getInterviewSessionStats = async (supabase, interviewId) => {
    try {
        const { data, error } = await supabase
            .from('interview_sessions')
            .select('session_status')
            .eq('interview_id', interviewId);

        if (error) {
            console.log('⚠️ Failed to get session stats:', error.message);
            return { total: 0, completed: 0, abandoned: 0, started: 0 };
        }

        const stats = {
            total: data.length,
            completed: data.filter(s => s.session_status === 'completed').length,
            abandoned: data.filter(s => s.session_status === 'abandoned').length,
            started: data.filter(s => s.session_status === 'started').length
        };

        return stats;
    } catch (err) {
        console.log('⚠️ Error getting session stats:', err.message);
        return { total: 0, completed: 0, abandoned: 0, started: 0 };
    }
};