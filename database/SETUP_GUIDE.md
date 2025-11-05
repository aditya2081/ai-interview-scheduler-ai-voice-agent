# Complete Photo Storage Setup Guide

Follow these steps **exactly** in order to set up photo storage in your Supabase database.

## Step 1: Remove Video Columns

Go to your **Supabase Dashboard → SQL Editor** and run these commands **one by one**:

### Command 1: Remove video_url
```sql
ALTER TABLE interview_feedback DROP COLUMN video_url;
```

### Command 2: Remove video_duration  
```sql
ALTER TABLE interview_feedback DROP COLUMN video_duration;
```

### Command 3: Remove video_status
```sql
ALTER TABLE interview_feedback DROP COLUMN video_status;
```

## Step 2: Add Photo Columns

### Command 4: Add photo URL column
```sql
ALTER TABLE interview_feedback ADD COLUMN candidate_photo_url TEXT;
```

### Command 5: Add photo status column
```sql
ALTER TABLE interview_feedback ADD COLUMN photo_status VARCHAR(20) DEFAULT 'pending';
```

## Step 3: Create Storage Bucket

### Command 6: Create storage bucket
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('candidate-photos', 'candidate-photos', true);
```

## Step 4: Create Storage Policies

### Command 7: Allow photo uploads
```sql
CREATE POLICY "Allow photo uploads" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'candidate-photos');
```

### Command 8: Allow photo access
```sql
CREATE POLICY "Allow photo access" ON storage.objects 
FOR SELECT USING (bucket_id = 'candidate-photos');
```

## Step 5: Verify Setup

After running all commands, verify your setup:

1. Go to **Table Editor → interview_feedback**
2. You should see columns: `candidate_photo_url`, `photo_status`
3. Go to **Storage** in Supabase dashboard
4. You should see a bucket named `candidate-photos`

## Important Notes:

- Run each command **separately** - don't run multiple commands at once
- If you get an error that a column doesn't exist, that's OK - just continue to the next command
- If you get an error that a column already exists, that's also OK - skip that command
- Make sure to run all commands in the exact order shown

## What Each Command Does:

- **Commands 1-3**: Remove old video columns we don't need
- **Commands 4-5**: Add new photo columns for storing photo URLs and status
- **Command 6**: Create a storage bucket to store the actual photo files
- **Commands 7-8**: Set up security policies so users can upload and view photos

After completing all steps, your photo storage system will be ready!