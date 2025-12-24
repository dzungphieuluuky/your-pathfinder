import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { generateEmbedding } from '@/lib/embeddings';

// FIX: Use require() instead of import to avoid "no default export" error
const pdfParse = require('pdf-parse');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'General';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 1. Upload to Supabase Storage
    const supabaseAdmin = getServiceSupabase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create a unique file path
    const filePath = `public/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    
    const { error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(filePath, buffer, { 
        contentType: 'application/pdf',
        upsert: true 
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(filePath);

    // 2. Extract Text from PDF
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;
    
    // Simple chunking strategy (split by double newlines)
    const rawChunks = text.split(/\n\s*\n/);
    const chunks = rawChunks
      .map((c: string) => c.trim())
      .filter((c: string) => c.length > 50); // Filter out noise

    // 3. Generate Embeddings & Store
    const insertData = [];

    for (let i = 0; i < chunks.length; i++) {
      const content = chunks[i];
      // Generate vector
      const embedding = await generateEmbedding(content);

      insertData.push({
        content: content,
        embedding: embedding,
        category: category,
        metadata: {
          file: file.name,
          page: i + 1, // Approximation
          url: urlData.publicUrl
        }
      });
    }

    if (insertData.length > 0) {
      const { error: dbError } = await supabaseAdmin
        .from('knowledge_embeddings')
        .insert(insertData);
      
      if (dbError) throw dbError;
    }

    return NextResponse.json({ success: true, count: insertData.length });

  } catch (error: any) {
    console.error("Ingest Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}