import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(req: NextRequest) {
  const { prompt, category } = await req.json()

  // 1. Create embedding
  const embeddingRes = await openai.embeddings.create({
    input: [prompt],
    model: 'text-embedding-ada-002'
  })
  const queryVector = embeddingRes.data[0].embedding

  // 2. Search in Supabase
  const { data: chunks } = await supabase.rpc('match_embeddings', {
    query_embedding: queryVector,
    match_threshold: 0.2,
    match_count: 5,
    filter_category: category
  })

  if (!chunks || chunks.length === 0) {
    return NextResponse.json({
      answer: 'Không tìm thấy thông tin phù hợp trong tài liệu.',
      citations: []
    })
  }

  const context = chunks.map((c: any) => c.content).join('\n')
  const citations = chunks.map((c: any) => ({
    file: c.metadata.file,
    page: c.metadata.page
  }))

  // 3. Generate answer
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Bạn là trợ lý AI trả lời dựa trên tài liệu nội bộ.' },
      { role: 'user', content: `Dựa vào: ${context}\n\nCâu hỏi: ${prompt}\nTrả lời bằng tiếng Việt:` }
    ]
  })

  return NextResponse.json({
    answer: completion.choices[0].message.content,
    citations
  })
}