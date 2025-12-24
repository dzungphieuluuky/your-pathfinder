import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export class VectorStore {
  async addEmbedding(
    documentId: string,
    content: string,
    embedding: number[],
    metadata: any
  ) {
    const { data, error } = await supabase.from('knowledge_embeddings').insert({
      document_id: documentId,
      content,
      embedding,
      metadata
    })

    if (error) {
      console.error('Error adding embedding:', error)
      throw error
    }

    return data
  }

  async search(
    queryEmbedding: number[],
    limit: number = 5,
    threshold: number = 0.2,
    category?: string
  ) {
    const { data, error } = await supabase.rpc('match_embeddings', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      filter_category: category || 'All'
    })

    if (error) {
      console.error('Error searching embeddings:', error)
      throw error
    }

    return data
  }

  async deleteByDocumentId(documentId: string) {
    const { error } = await supabase
      .from('knowledge_embeddings')
      .delete()
      .eq('document_id', documentId)

    if (error) {
      console.error('Error deleting embeddings:', error)
      throw error
    }
  }
}