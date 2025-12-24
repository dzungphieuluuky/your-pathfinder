# simpleRAG

A simple Retrieval-Augmented Generation (RAG) assistant built with **Next.js**, **Supabase**, and **TypeScript**.

---

## Project Structure

```
simpleRAG/
├── frontend/                # Next.js 14 App (UI)
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Login (Screen A)
│   │   ├── dashboard/
│   │   │   ├── chat/page.tsx       # Chat (Screen B)
│   │   │   ├── library/page.tsx    # Library (Screen C)
│   │   │   └── settings/page.tsx   # Settings (Screen D)
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
├── backend/                 # Node.js Services (API & Logic)
│   ├── services/
│   │   ├── rag_core.ts
│   │   ├── doc_manager.ts
│   │   └── auth_service.ts
│   ├── utils/
│   │   ├── supabase_client.ts
│   │   └── embeddings.ts
│   └── main.ts
└── .env.local               # Environment Variables
```

---

## Getting Started

### 1. Clone the Repository

```sh
git clone https://github.com/your-username/simpleRAG.git
cd simpleRAG
```

### 2. Install Dependencies

#### Frontend (Next.js)

```sh
cd frontend
npm install
```

#### Backend (Node.js)

```sh
cd ../backend
npm install
```

---

## Library Reference

### Frontend

- **Framework:** Next.js 14, React
- **UI:** Tailwind CSS, Framer Motion, Lucide React
- **API:** Supabase, OpenAI
- **TypeScript:** Types, type safety

### Backend

- **API:** Supabase, OpenAI
- **PDF Parsing:** pdf-parse
- **Email:** nodemailer
- **Environment:** dotenv
- **TypeScript:** Types, type safety

---

## Environment Variables

Create a `.env.local` file in the root directory and add your Supabase and OpenAI credentials.

---

## Scripts

### Frontend

```sh
npm run dev      # Start Next.js development server
```

### Backend

```sh
npx ts-node main.ts   # Run backend services
```

---

## Screens

- **Screen A:** Login
- **Screen B:** Chat
- **Screen C:** Library
- **Screen D:** Settings

---

## License

Apache License 2.0
