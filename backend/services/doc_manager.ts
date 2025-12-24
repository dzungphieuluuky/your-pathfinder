import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import pdfParse from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export class DocumentManager {
  async uploadAndIndex(filePath: string, category: string) {
    const buffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(buffer);
    const fileName = path.basename(filePath);

    // Insert document record
    const { data: docData } = await supabase.from('documents').insert({
      file_name: fileName,
      category,
      status: 'Processing'
    }).select().single();
    const docId = docData.id;

    // For each page (here, all text as one chunk for simplicity)
    // For per-page, use a better PDF parser
    const text = pdfData.text;
    if (text && text.trim()) {
      const embedding = (await openai.embeddings.create({
        input: [text],
        model: "text-embedding-ada-002"
      })).data[0].embedding;

      await supabase.from('knowledge_embeddings').insert({
        document_id: docId,
        content: text,
        embedding,
        metadata: { page: 1, file: fileName, category }
      });
    }

    await supabase.from('documents').update({ status: 'Completed' }).eq('id', docId);
    return docId;
  }
}