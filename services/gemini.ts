
import { GoogleGenAI, Type } from "@google/genai";
import { Citation, KnowledgeNode, ClarificationAlert } from "../types";

export interface Contradiction {
  topic: string;
  sourceA: { file: string; text: string };
  sourceB: { file: string; text: string };
  explanation: string;
  severity: 'high' | 'medium';
}

export class RAGService {
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  // Model fallback chain (priority order)
  private readonly PRIMARY_MODEL = "gemini-3-flash-preview";
  private readonly FALLBACK_MODEL = "gemini-2.5-flash-lite";
  private readonly EMBEDDING_MODEL = "text-embedding-004";

  // Track quota status
  private modelQuotaExceeded = {
    [this.PRIMARY_MODEL]: false,
    [this.FALLBACK_MODEL]: false
  };

  private isQuotaError(error: any): boolean {
    const errorMessage = error?.message || error?.toString() || '';
    return errorMessage.includes('RESOURCE_EXHAUSTED') || 
           errorMessage.includes('quota') || 
           errorMessage.includes('limit') ||
           errorMessage.includes('429') ||
           errorMessage.includes('Too Many Requests');
  }

  private getActiveModel(): string {
    if (!this.modelQuotaExceeded[this.PRIMARY_MODEL]) {
      return this.PRIMARY_MODEL;
    }
    return this.FALLBACK_MODEL;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const ai = this.getClient();
      const result = await ai.models.embedContent({
        model: this.EMBEDDING_MODEL,
        contents: [{ parts: [{ text }] }]
      });
      return result.embeddings[0].values;
    } catch (e) {
      console.error("Embedding failed:", e);
      return Array.from({ length: 768 }, () => Math.random());
    }
  }

  async detectContradictions(nodes: KnowledgeNode[]): Promise<Contradiction[]> {
    if (nodes.length < 2) return [];

    const ai = this.getClient();
    const context = nodes.map(n => `[FILE: ${n.metadata.file}] Content: ${n.content}`).join('\n\n---\n\n');

    const systemInstruction = `
      You are an Integrity Auditor. Your task is to analyze document snippets and find direct factual contradictions.
      Only report TRUE contradictions. Return JSON.
    `;

    let activeModel = this.getActiveModel();
    let lastError: any = null;

    // Try primary model first
    try {
      const response = await ai.models.generateContent({
        model: activeModel,
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

      // Reset quota flag on success
      this.modelQuotaExceeded[activeModel] = false;

      const data = JSON.parse(response.text || '{"contradictions": []}');
      return data.contradictions;
    } catch (e) {
      lastError = e;
      
      // Check if it's a quota error
      if (this.isQuotaError(e)) {
        console.warn(`⚠️ Model ${activeModel} quota exceeded. Switching to fallback...`);
        this.modelQuotaExceeded[activeModel] = true;

        // If primary failed with quota, try fallback
        if (activeModel === this.PRIMARY_MODEL) {
          try {
            const fallbackResponse = await ai.models.generateContent({
              model: this.FALLBACK_MODEL,
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

            const data = JSON.parse(fallbackResponse.text || '{"contradictions": []}');
            return data.contradictions;
          } catch (fallbackError) {
            console.error("Fallback model also failed:", fallbackError);
          }
        }
      }

      console.error("Contradiction detection failed", lastError);
      return [];
    }
  }

  async generateResponse(
    query: string, 
    contextNodes: KnowledgeNode[]
  ): Promise<{ answer: string, alerts: ClarificationAlert[] }> {
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

    let activeModel = this.getActiveModel();
    let lastError: any = null;

    // Try primary model first
    try {
      const response = await ai.models.generateContent({
        model: activeModel,
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
        }
      });

      // Reset quota flag on success
      this.modelQuotaExceeded[activeModel] = false;
      console.log(`✓ Using model: ${activeModel}`);

      return JSON.parse(response.text || '{"answer": "Error parsing response", "alerts": []}');
    } catch (e) {
      lastError = e;

      // Check if it's a quota error
      if (this.isQuotaError(e)) {
        console.warn(`⚠️ Model ${activeModel} quota exceeded. Switching to fallback...`);
        this.modelQuotaExceeded[activeModel] = true;

        // If primary failed with quota, try fallback
        if (activeModel === this.PRIMARY_MODEL) {
          try {
            console.log(`🔄 Switching to fallback model: ${this.FALLBACK_MODEL}`);
            
            const fallbackResponse = await ai.models.generateContent({
              model: this.FALLBACK_MODEL,
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
              }
            });

            console.log(`✓ Successfully using fallback model: ${this.FALLBACK_MODEL}`);
            return JSON.parse(fallbackResponse.text || '{"answer": "Error parsing response", "alerts": []}');
          } catch (fallbackError) {
            console.error("Fallback model also failed:", fallbackError);
            return {
              answer: "Both primary and fallback models are unavailable. Please check your API quota and try again later.",
              alerts: []
            };
          }
        }
      }

      console.error("Gemini generation failed", lastError);
      return { 
        answer: "I apologize, but I encountered an error while generating your response. Please ensure your API key is valid.", 
        alerts: [] 
      };
    }
  }
}

export const ragService = new RAGService();