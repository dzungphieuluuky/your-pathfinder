
-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. WORKSPACES TABLE
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. DOCUMENTS TABLE (Metadata)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    category TEXT NOT NULL DEFAULT 'General',
    url TEXT,
    storage_path TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ENSURE MISSING COLUMNS EXIST (Fixes "column not found in schema cache" errors)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='file_size') THEN
        ALTER TABLE public.documents ADD COLUMN file_size BIGINT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='storage_path') THEN
        ALTER TABLE public.documents ADD COLUMN storage_path TEXT;
    END IF;
END $$;

-- 4. KNOWLEDGE EMBEDDINGS (The RAG Data)
CREATE TABLE IF NOT EXISTS public.knowledge_embeddings (
    id BIGSERIAL PRIMARY KEY,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding VECTOR(768),
    category TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON public.knowledge_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 5. MEMBERS & INVITATIONS
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'End-User',
    joined_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'End-User',
    status TEXT DEFAULT 'Pending',
    invited_at TIMESTAMPTZ DEFAULT now(),
    accepted_at TIMESTAMPTZ
);

-- 6. MATCH EMBEDDINGS FUNCTION
CREATE OR REPLACE FUNCTION match_embeddings (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_category text default null,
  filter_workspace_id uuid default null
)
returns table (id bigint, content text, metadata jsonb, category text, similarity float)
language plpgsql as $$
begin
  return query
  select
    knowledge_embeddings.id,
    knowledge_embeddings.content,
    knowledge_embeddings.metadata,
    knowledge_embeddings.category,
    1 - (knowledge_embeddings.embedding <=> query_embedding) as similarity
  from knowledge_embeddings
  where (filter_category is null or knowledge_embeddings.category = filter_category)
    and (filter_workspace_id is null or knowledge_embeddings.workspace_id = filter_workspace_id)
    and 1 - (knowledge_embeddings.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 8. TABLE ACCESS POLICIES (Development Mode)
DROP POLICY IF EXISTS "Enable all access for workspaces" ON public.workspaces;
CREATE POLICY "Enable all access for workspaces" ON public.workspaces FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for documents" ON public.documents;
CREATE POLICY "Enable all access for documents" ON public.documents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for knowledge_embeddings" ON public.knowledge_embeddings;
CREATE POLICY "Enable all access for knowledge_embeddings" ON public.knowledge_embeddings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for workspace_members" ON public.workspace_members;
CREATE POLICY "Enable all access for workspace_members" ON public.workspace_members FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for invitations" ON public.invitations;
CREATE POLICY "Enable all access for invitations" ON public.invitations FOR ALL USING (true) WITH CHECK (true);

-- 9. STORAGE BUCKET SETUP
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true) 
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow Public Upload" ON storage.objects;
CREATE POLICY "Allow Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "Allow Public Read" ON storage.objects;
CREATE POLICY "Allow Public Read" ON storage.objects FOR SELECT USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Allow Public Delete" ON storage.objects;
CREATE POLICY "Allow Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'documents');

-- FORCE CACHE RELOAD
NOTIFY pgrst, 'reload schema';
