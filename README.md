
# Your PathFinder Setup Guide

To fix "Row-Level Security (RLS)" errors, you must apply the policies to your Supabase project.

## 1. Database & Table Policies
1. Open the **SQL Editor** in your Supabase dashboard.
2. Paste the contents of `supabase_setup.txt` and run it.
3. This creates the tables AND enables public RLS policies for development.

## 2. Storage Bucket Policies
Supabase Storage uses its own RLS. If you get errors uploading files:
1. Go to **Storage** > **Policies**.
2. For the `documents` bucket, create a "New Policy".
3. Select **"Allow all operations for all users"** (For Dev) or use this SQL:
```sql
-- Allow anyone to upload to 'documents' bucket
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');
-- Allow anyone to read from 'documents' bucket
CREATE POLICY "Public View" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
```

## 3. Local Environment
Ensure your `.env.local` contains:
```env
API_KEY=your_gemini_key
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
