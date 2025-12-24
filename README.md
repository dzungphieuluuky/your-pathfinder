# simpleRAG
Simple RAG assistant built with Next.js, Supabase and TypeScript

intelligent-rag/
├── frontend/                    # Next.js 14 App
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Login (Screen A)
│   │   ├── dashboard/
│   │   │   ├── chat/page.tsx   # Screen B
│   │   │   ├── library/page.tsx # Screen C
│   │   │   └── settings/page.tsx # Screen D
│   │   └── api/
│   │       ├── auth/route.ts
│   │       ├── upload/route.ts
│   │       └── rag/route.ts
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   └── AnimatedButton.tsx
│   ├── lib/
│   │   └── supabase.ts
│   └── package.json
├── backend/                     # Node.js Services
│   ├── services/
│   │   ├── rag_core.ts
│   │   ├── doc_manager.ts
│   │   └── auth_service.ts
│   ├── utils/
│   │   ├── supabase_client.ts
│   │   └── embeddings.ts
│   └── main.ts
└── .env.local

## Setup libraries
# Frontend (Next.js)
cd frontend
npm install next@latest react@latest react-dom@latest
npm install @supabase/supabase-js openai
npm install tailwindcss postcss autoprefixer
npm install framer-motion lucide-react
npm install @types/node @types/react typescript

# Backend (Node.js)
cd ../backend
npm install @supabase/supabase-js openai pdf-parse nodemailer dotenv
npm install @types/node typescript ts-node