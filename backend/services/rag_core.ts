import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { OpenAI } from 'openai';

config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export class RAGCore {
  async generateResponse(query: string, category: string = "All") {
    // 1. Embed the query
    const embeddingRes = await openai.embeddings.create({
      input: [query],
      model: "text-embedding-ada-002"
    });
    const queryVector = embeddingRes.data[0].embedding;

    // 2. Search in Supabase (vector search)
    const { data: chunks } = await supabase.rpc('match_embeddings', {
      query_embedding: queryVector,
      match_threshold: 0.2,
      match_count: 5,
      filter_category: category
    });

    if (!chunks || chunks.length === 0) {
      return {
        answer: "Tôi không tìm thấy thông tin này trong tài liệu hệ thống.",
        citations: []
      };
    }

    const context = chunks.map((c: any) => c.content).join('\n');
    const citations = chunks.map((c: any) => ({
      file: c.metadata.file,
      page: c.metadata.page
    }));

    // 3. Generate answer using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Bạn là trợ lý AI trả lời dựa trên tài liệu nội bộ." },
        { role: "user", content: `Dựa vào nội dung: ${context}\n\nCâu hỏi: ${query}\nTrả lời bằng tiếng Việt:` }
      ]
    });

    return {
      answer: completion.choices[0].message.content,
      citations
    };
  }
}