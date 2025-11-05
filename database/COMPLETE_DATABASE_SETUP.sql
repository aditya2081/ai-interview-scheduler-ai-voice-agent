-- COMPLETE DATABASE SETUP FOR AI INTERVIEW SCHEDULER
-- Run this script in your Supabase SQL Editor to recreate the entire database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create interview_sessions table
CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position VARCHAR(100) NOT NULL,
    job_description TEXT,
    experience_level VARCHAR(50),
    tech_stack TEXT,
    questions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    company_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active'
);

-- Create interview_feedback table
CREATE TABLE IF NOT EXISTS interview_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
    candidate_name VARCHAR(100),
    candidate_email VARCHAR(255),
    candidate_phone VARCHAR(20),
    feedback_text TEXT,
    ai_rating DECIMAL(3,1),
    ai_recommendations TEXT,
    conversation_data JSONB,
    interview_duration INTEGER, -- in seconds
    questions_answered INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    completion_rate DECIMAL(3,2), -- 0.00 to 1.00
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Photo storage columns
    candidate_photo_url TEXT,
    photo_status VARCHAR(20) DEFAULT 'pending',
    photo_uploaded_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional metadata
    user_agent TEXT,
    ip_address INET,
    interview_status VARCHAR(20) DEFAULT 'pending'
);

-- Create profiles table (for user management if needed)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    company VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interview_sessions_created_by ON interview_sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_created_at ON interview_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_session_id ON interview_feedback(interview_session_id);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_created_at ON interview_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_email ON interview_feedback(candidate_email);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_photo_status ON interview_feedback(photo_status);

-- Create storage bucket for candidate photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'candidate-photos', 
    'candidate-photos', 
    true, 
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for storage bucket
CREATE POLICY IF NOT EXISTS "Public read access for candidate photos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'candidate-photos');

CREATE POLICY IF NOT EXISTS "Authenticated upload for candidate photos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'candidate-photos' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated update for candidate photos" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'candidate-photos' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated delete for candidate photos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'candidate-photos' AND auth.role() = 'authenticated');

-- Enable Row Level Security
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tables

-- Interview Sessions: Allow users to manage their own sessions
CREATE POLICY IF NOT EXISTS "Users can view their own interview sessions"
ON interview_sessions FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY IF NOT EXISTS "Users can create interview sessions"
ON interview_sessions FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY IF NOT EXISTS "Users can update their own interview sessions"
ON interview_sessions FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY IF NOT EXISTS "Users can delete their own interview sessions"
ON interview_sessions FOR DELETE
USING (auth.uid() = created_by);

-- Interview Feedback: Allow public access for candidates to submit feedback
CREATE POLICY IF NOT EXISTS "Anyone can view interview feedback"
ON interview_feedback FOR SELECT
USING (true);

CREATE POLICY IF NOT EXISTS "Anyone can insert interview feedback"
ON interview_feedback FOR INSERT
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can update interview feedback"
ON interview_feedback FOR UPDATE
USING (auth.role() = 'authenticated');

-- Profiles: Users can manage their own profile
CREATE POLICY IF NOT EXISTS "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_interview_sessions_updated_at 
    BEFORE UPDATE ON interview_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_feedback_updated_at 
    BEFORE UPDATE ON interview_feedback 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the setup
SELECT 
    'interview_sessions' as table_name,
    COUNT(*) as row_count
FROM interview_sessions
UNION ALL
SELECT 
    'interview_feedback' as table_name,
    COUNT(*) as row_count
FROM interview_feedback
UNION ALL
SELECT 
    'candidate-photos' as bucket_name,
    COUNT(*) as policy_count
FROM (
    SELECT name FROM storage.buckets WHERE name = 'candidate-photos'
    UNION ALL
    SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%candidate photos%'
) AS bucket_info;