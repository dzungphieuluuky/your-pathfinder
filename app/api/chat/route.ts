import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { generateEmbedding } from '@/lib/embeddings';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, category } = body;

    if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

    // 1. Embed the query
    const queryVector = await generateEmbedding(query);

    // 2. Search in Supabase (RPC call)
    const supabase = getServiceSupabase();
    const { data: chunks, error } = await supabase.rpc('match_embeddings', {
      query_embedding: queryVector,
      match_threshold: 0.2,
      match_count: 5,
      filter_category: category === 'All' ? null : category
    });

    if (error) throw error;

    // 3. Prepare Context
    const contextText = chunks?.map((c: any) => c.content).join("\n---\n") || "";
    const citations = chunks?.map((c: any) => ({
      file: c.metadata.file,
      page: c.metadata.page
    })) || [];

    if (!contextText) {
      return NextResponse.json({
        answer: "Tôi không tìm thấy thông tin này trong tài liệu hệ thống.",
        citations: []
      });
    }

    // 4. Generate Answer with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      Bạn là trợ lý AI thông minh cho doanh nghiệp.
      Dựa vào ngữ cảnh sau đây (Context), hãy trả lời câu hỏi của người dùng bằng tiếng Việt.
      Nếu không có thông tin trong ngữ cảnh, hãy nói là bạn không biết.

      Context:
      ${contextText}

      Câu hỏi: ${query}
      Trả lời:
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({
      answer: text,
      citations: citations
    });

  } catch (error: any) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}