# Copilot Instructions for Your PathFinder

## Project Overview
- **Your PathFinder** is a Vite/React/TypeScript app for managing knowledge assets (documents) in workspaces, with Supabase as backend and Gemini for AI embedding.
- Main UI pages: `pages/DocumentLibrary.tsx`, `pages/ChatDashboard.tsx`, `pages/Workspaces.tsx`, `pages/Settings.tsx`, `pages/AuthScreen.tsx`.
- API routes and logic: `app/api/*/route.ts`.
- Document upload, parsing, and chunking logic is centralized in `pages/DocumentLibrary.tsx` and `utils/supabase/pdfParser.ts`.
- Supabase service logic is in `services/supabase.ts` (deprecated: `lib/supabase.ts`).
- Gemini AI embedding logic is in `services/gemini.ts`.

## Key Workflows
- **Start dev server:** `npm run dev` (Vite, port 3000)
- **Build:** `npm run build`
- **Run tests:** `npx playwright test tests/upload.test.ts` (see test file for more options)
- **Supabase setup:** Run SQL from `supabase_setup.txt` in Supabase SQL Editor to enable RLS and storage policies.
- **Environment:** Set keys in `.env.local` (see README for required variables).

## Document Handling Patterns
- **File types supported:** PDF, DOCX, DOC, TXT, MD, HTML, RTF, CSV, JSON, XLSX/XLS (see `SUPPORTED_FILE_TYPES` in `DocumentLibrary.tsx`).
- **Parsing:** Each file type has a dedicated async parser function in `DocumentLibrary.tsx` (PDF uses `extractTextFromPDF` from `utils/supabase/pdfParser.ts`).
- **Chunking:** Text is chunked for embedding using `chunkText` and `chunkContentByType`.
- **Embeddings:** Chunks are embedded via Gemini (`ragService.generateEmbedding`).
- **Category management:** Categories are tracked in local state and updated on upload; new categories are added dynamically.
- **Filtering:** Documents can be filtered by category and search term (see `filteredDocs` in `DocumentLibrary.tsx`).
- **Delete:** Document deletion uses a button with `title="Delete document"` and confirmation dialog.

## UI/Component Conventions
- **Category filter:** Button with `title="Filter by category"` opens dropdown for category selection.
- **Upload modal:** Category selection and creation is handled in modal with local state.
- **Document row:** Category badge is editable (click to edit), delete/download buttons appear on hover.

## Testing Patterns
- **Playwright tests:** Located in `tests/` (see `upload.test.ts`, `chat.test.ts`, `invite.test.ts`).
- **Selectors:** Use role, text, and `title` attributes for reliable element targeting (e.g., `button[title="Delete document"]`).
- **Test fixtures:** Test files are in `tests/fixtures/`.

## Integration Points
- **Supabase:** Used for document storage, metadata, and RLS policies. See `services/supabase.ts` and `supabase_setup.txt`.
- **Gemini AI:** Used for text embedding. See `services/gemini.ts`.
- **PDF.js:** Local worker file is used for PDF parsing (`pdfjs-dist/build/pdf.worker.min.js`).

## Project-Specific Patterns
- **All category and document logic is centralized in `DocumentLibrary.tsx` for maintainability.**
- **Deprecated files:** `lib/supabase.ts` is a stub; use `services/supabase.ts`.
- **Vite config:** Aliases `@` to project root; includes `pdfjs-dist` for PDF parsing.

---

If any section is unclear or missing, please provide feedback for further refinement.
