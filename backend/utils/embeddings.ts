import OpenAI from 'openai'
import { config } from 'dotenv'

config()

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export class EmbeddingService {
  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        input: [text],
        model: 'text-embedding-ada-002'
      })

      return response.data[0].embedding
    } catch (error) {
      console.error('Error creating embedding:', error)
      throw error
    }
  }

  async createBatchEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await openai.embeddings.create({
        input: texts,
        model: 'text-embedding-ada-002'
      })

      return response.data.map(d => d.embedding)
    } catch (error) {
      console.error('Error creating batch embeddings:', error)
      throw error
    }
  }
}