import { generateEmbedding } from './embeddings';
import { supabase } from './supabase';

interface Citation {
  file: string;
  page: number;
  url?: string;
}

export class RAGService {
  async generateResponse(
    query: string,
    category: string = 'All'
  ): Promise<{ answer: string; citations: Citation[] }> {
    try {
      // 1. Generate query embedding
      const queryEmbedding = await generateEmbedding(query);

      // 2. Search for similar documents
      let rpcQuery = supabase.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 5,
      });

      // Filter by category if not "All"
      if (category !== 'All') {
        rpcQuery = rpcQuery.eq('category', category);
      }

      const { data: matches, error } = await rpcQuery;

      if (error) throw error;

      if (!matches || matches.length === 0) {
        return {
          answer: 'Xin lỗi, tôi không tìm thấy thông tin phù hợp trong cơ sở dữ liệu.',
          citations: [],
        };
      }

      // 3. Build context from matches
      const context = matches
        .map((m: any) => m.content)
        .join('\n\n');

      // 4. Generate answer (you can integrate with Google AI API here)
      const answer = await this.generateAnswerWithAI(query, context);

      // 5. Extract citations
      const citations: Citation[] = matches.map((m: any) => ({
        file: m.metadata?.file || 'Unknown',
        page: m.metadata?.page || 1,
        url: m.metadata?.url,
      }));

      return { answer, citations };
    } catch (error) {
      console.error('RAG Error:', error);
      return {
        answer: 'Đã xảy ra lỗi khi xử lý câu hỏi của bạn.',
        citations: [],
      };
    }
  }

  private async generateAnswerWithAI(query: string, context: string): Promise<string> {
    // TODO: Integrate with Google Generative AI
    // For now, return a simple response based on context
    return `Dựa trên tài liệu, đây là câu trả lời cho "${query}":\n\n${context.substring(0, 500)}...`;
  }
}