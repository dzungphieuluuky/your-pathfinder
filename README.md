
# Intelligent RAG Assistant (TypeScript/Next.js/Supabase)

This project has been rewritten from Python/Streamlit to a modern TypeScript/React stack.

## Directory Structure
```text
/
├── components/          # Reusable UI components (Layout, Sidebar)
├── pages/               # Main application screens (Dashboard, Library, Auth)
├── services/            # Logic for Gemini API and Supabase
├── types.ts             # Global TypeScript interfaces
├── App.tsx              # Main routing and auth state
├── index.tsx            # Entry point
├── supabase_schema.sql  # SQL for database setup
└── README.md            # Documentation
```

## How to Deploy to Vercel

1. **Setup Supabase**:
   - Create a project at [supabase.com](https://supabase.com).
   - Run the contents of `supabase_schema.sql` in the SQL Editor.
   - Create a Storage bucket named `documents`.

2. **Configuration**:
   - You will need your `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
   - You will need a `GOOGLE_API_KEY` (Gemini API).

3. **Vercel Deployment**:
   - Push this code to a GitHub repository.
   - Link the repository to [Vercel](https://vercel.com).
   - Add the following Environment Variables in Vercel settings:
     - `API_KEY`: Your Gemini API Key.
     - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL.
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Key.
   - Click "Deploy".

## Local Development
- Run `npm install`.
- Set up a `.env.local` file with the variables above.
- Run `npm run dev`.
