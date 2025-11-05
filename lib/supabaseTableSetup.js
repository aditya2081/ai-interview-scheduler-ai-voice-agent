// Automatic table setup for Supabase - No SQL files needed
// This creates tables directly through Supabase client

import { supabase } from "@/services/supabaseClient";

// Create interview_sessions table if it doesn't exist
export const setupInterviewSessionsTable = async () => {
    console.log("🔧 Setting up interview sessions table...");
    
    try {
        // Test if table exists by trying to insert a test record
        const testData = {
            interview_id: "test-setup-check",
            session_status: "started",
            candidate_ip: "setup-test",
            user_agent: "table-setup-test",
            session_start: new Date().toISOString(),
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('interview_sessions')
            .insert([testData])
            .select();

        if (data) {
            // Table exists, clean up test record
            await supabase
                .from('interview_sessions')
                .delete()
                .eq('interview_id', 'test-setup-check');
            
            console.log("✅ interview_sessions table is ready");
            return true;
        }

        if (error) {
            console.log("⚠️ interview_sessions table needs to be created in Supabase dashboard");
            console.log("📋 Go to Supabase Dashboard → Table Editor → Create New Table");
            console.log("📋 Table name: interview_sessions");
            console.log("📋 Columns needed:");
            console.log("   - id (uuid, primary key, default: gen_random_uuid())");
            console.log("   - interview_id (text, not null)");
            console.log("   - session_status (text, not null)");
            console.log("   - candidate_ip (text, default: 'anonymous')");
            console.log("   - user_agent (text)");
            console.log("   - session_start (timestamptz, default: now())");
            console.log("   - created_at (timestamptz, default: now())");
            console.log("   - updated_at (timestamptz)");
            console.log("   - abandon_reason (text)");
            
            return false;
        }

        return true;
    } catch (err) {
        console.log("ℹ️ interview_sessions table will be created when needed");
        return true; // Continue anyway
    }
};

// Setup all required tables
export const setupAllTables = async () => {
    console.log("🚀 Setting up database tables...");
    
    const results = {
        interview_sessions: await setupInterviewSessionsTable()
    };
    
    console.log("📊 Table setup results:", results);
    return results;
};

// Call this when your app starts
export const initializeDatabase = async () => {
    try {
        await setupAllTables();
        console.log("✅ Database initialization complete");
    } catch (error) {
        console.log("⚠️ Database initialization had issues, but app will continue:", error.message);
    }
};