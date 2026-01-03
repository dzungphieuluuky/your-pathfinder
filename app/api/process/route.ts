
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { documentId, content, workspaceId, category } = await req.json();
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Fetch original file metadata
    const { data: doc } = await supabase.from('documents').select('file_name, url').eq('id', documentId).single();

    // Python-style chunking (by paragraph)
    const chunks = content.split('\n\n').filter((c: string) => c.trim().length > 20);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const result = await ai.models.embedContent({
        model: 'text-embedding-004',
        contents: [{ parts: [{ text: chunk }] }]
      });

      const embedding = result.embeddings[0].values;

      await supabase.from('knowledge_embeddings').insert({
        document_id: documentId,
        workspace_id: workspaceId,
        content: chunk,
        embedding: embedding,
        category: category,
        metadata: {
          file: doc?.file_name || "Unknown",
          page: i + 1,
          url: doc?.url
        }
      });
    }

    return new Response(JSON.stringify({ success: true }));
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
