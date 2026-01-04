import { GoogleGenAI, Type } from "@google/genai";
import { Citation, KnowledgeNode, ClarificationAlert } from "../types";

/**
 * Lấy API Key an toàn
 */
const getGeminiKey = () => {
  let key: string | undefined;
  
  // Try environment variables first
  try {
    key = process.env.VITE_GEMINI_API_KEY || 
          process.env.API_KEY || 
          process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  } catch (e) {
    console.warn("Environment variable access failed:", e);
  }

  // Fallback to window object (client-side)
  if (!key && typeof window !== 'undefined') {
    key = (window as any).VITE_GEMINI_API_KEY || 
          (window as any).API_KEY || 
          localStorage.getItem('GEMINI_API_KEY_OVERRIDE') || 
          undefined;
  }

  if (!key) {
    console.error("❌ Gemini API Key not found. Check your .env.local file.");
  }
  
  return key;
};

export interface Contradiction {
  topic: string;
  sourceA: { file: string; text: string };
  sourceB: { file: string; text: string };
  explanation: string;
  severity: 'high' | 'medium';
}

export class RAGService {
  private getClient() {
    const apiKey = getGeminiKey();
    if (!apiKey) {
      throw new Error(
        "Gemini API Key is missing.\n\n" +
        "✓ Check .env.local has: VITE_GEMINI_API_KEY=your_key\n" +
        "✓ Restart dev server: npm run dev\n" +
        "✓ Verify key is valid at https://aistudio.google.com"
      );
    }
    return new GoogleGenAI({ apiKey });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const ai = this.getClient();
      const result = await ai.models.embedContent({
        model: 'text-embedding-004',
        contents: [{ parts: [{ text }] }]
      });
      return result.embeddings[0].values;
    } catch (e: any) {
      console.error("❌ Embedding generation failed:", e.message);
      throw new Error(`Failed to generate intelligence embedding: ${e.message}`);
    }
  }

  async detectContradictions(nodes: KnowledgeNode[]): Promise<Contradiction[]> {
    if (nodes.length < 2) return [];

    try {
      const ai = this.getClient();
      const context = nodes.map(n => `[FILE: ${n.metadata.file}] Content: ${n.content}`).join('\n\n---\n\n');

      const systemInstruction = `
        You are an Integrity Auditor. Your task is to analyze document snippets and find direct factual contradictions.
        Only report TRUE contradictions. Return JSON.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze these snippets for contradictions:\n\n${context}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              contradictions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: { type: Type.STRING },
                    sourceA: {
                      type: Type.OBJECT,
                      properties: { file: { type: Type.STRING }, text: { type: Type.STRING } },
                      required: ["file", "text"]
                    },
                    sourceB: {
                      type: Type.OBJECT,
                      properties: { file: { type: Type.STRING }, text: { type: Type.STRING } },
                      required: ["file", "text"]
                    },
                    explanation: { type: Type.STRING },
                    severity: { type: Type.STRING }
                  },
                  required: ["topic", "sourceA", "sourceB", "explanation", "severity"]
                }
              }
            },
            required: ["contradictions"]
          }
        }
      });

      const data = JSON.parse(response.text || '{"contradictions": []}');
      return data.contradictions;
    } catch (e: any) {
      console.error("❌ Contradiction detection failed:", e.message);
      return [];
    }
  }

  async generateResponse(
    query: string, 
    contextNodes: KnowledgeNode[]
  ): Promise<{ answer: string, alerts: ClarificationAlert[] }> {
    try {
      const ai = this.getClient();
      const contextText = contextNodes.length > 0
        ? contextNodes
            .map(node => `[Source: ${node.metadata.file}, Category: ${node.category}, Page: ${node.metadata.page}]\n${node.content}`)
            .join('\n\n---\n\n')
        : "No relevant documents found in the vault.";

      const systemInstruction = `
        You are PathFinder, a formal and highly accurate Corporate AI Assistant. 
        Your primary goal is to provide information strictly based on the provided document context.
        
        CORE DIRECTIVES:
        1. FORMAL TONE: Professional and polite.
        2. STRICT CONTEXT: Only use provided context. 
        3. CITATIONS: Mention source files.
        
        OUTPUT FORMAT:
        You must return valid JSON:
        {
          "answer": "Your response text",
          "alerts": []
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash",
        contents: `User Query: ${query}\n\nContext:\n${contextText}`,
        config: {
          systemInstruction,
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              answer: { type: Type.STRING },
              alerts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    source: { type: Type.STRING }
                  },
                  required: ["title", "content", "source"]
                }
              }
            },
            required: ["answer", "alerts"]
          }
        },
      });

      return JSON.parse(response.text || '{"answer": "Error parsing response", "alerts": []}');
    } catch (e: any) {
      console.error("❌ Gemini generation failed:", e.message);
      throw new Error(`Failed to generate response: ${e.message}`);
    }
  }
}

export const ragService = new RAGService();