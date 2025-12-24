import { pipeline } from '@xenova/transformers';

// Singleton to prevent reloading model on every request
class EmbeddingPipeline {
  // FIX: Add 'as const' so TypeScript treats this as the literal 'feature-extraction' 
  // instead of a generic string.
  static task = 'feature-extraction' as const; 
  
  static model = 'Xenova/all-MiniLM-L6-v2';
  static instance: any = null;

  static async getInstance() {
    if (this.instance === null) {
      // Now TypeScript knows exactly what task this is
      this.instance = await pipeline(this.task, this.model);
    }
    return this.instance;
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const generate = await EmbeddingPipeline.getInstance();
  
  // 'mean' pooling and 'normalize' are specific to sentence-transformers
  const output = await generate(text, { pooling: 'mean', normalize: true });
  
  // output.data is a Float32Array, convert to standard number array
  return Array.from(output.data);
}