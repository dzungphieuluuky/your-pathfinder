# Your PathFinder Setup Guide

To run this project, you need to configure your Supabase environment correctly.

## 1. Get Your API Keys
1. Go to **Project Settings** > **API**.
2. **NEXT_PUBLIC_SUPABASE_URL**: Use your Project URL.
3. **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Use your `anon` `public` key.

## 2. Storage Setup (IMPORTANT)
1. Go to **Storage** > Create bucket named `documents`.
2. Ensure the bucket is **Public** (or configure RLS policies for authenticated access).
3. Recommended RLS for the `documents` bucket:
   - SELECT: Allow all (or authenticated).
   - INSERT: Allow authenticated.

## 3. Database Setup (FIXES CONNECTION ERROR)
1. Open the **SQL Editor** in Supabase.
2. Open the file `supabase_setup.txt` in this project.
3. **Copy the entire text** and paste it into a new query in the SQL Editor.
4. Click **Run**.
5. This creates the tables and the `match_embeddings` function used for RAG.

## 4. Local Environment
Create `.env.local`:
```env
API_KEY=your_gemini_key
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```