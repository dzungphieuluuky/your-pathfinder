
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
  /**
   * Initialize the AI client using the mandatory process.env.API_KEY.
   */
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Simulated embedding dimension for Supabase schema compatibility
    return Array.from({ length: 768 }, () => Math.random());
  }

  async detectContradictions(nodes: KnowledgeNode[]): Promise<Contradiction[]> {
    if (nodes.length < 2) return [];

    const ai = this.getClient();
    const context = nodes.map(n => `[FILE: ${n.metadata.file}] Content: ${n.content}`).join('\n\n---\n\n');

    const systemInstruction = `
      You are an Integrity Auditor. Your task is to analyze document snippets and find direct factual contradictions.
      
      RULES:
      1. Only report TRUE contradictions (e.g., File A says 'Mon-Fri' but File B says 'Sun-Thu').
      2. Ignore minor wording differences that mean the same thing.
      3. Focus on: Dates, Numbers, Policy Rules, and Person names/roles.
      
      OUTPUT:
      You MUST return valid JSON:
      {
        "contradictions": [
          {
            "topic": "Short title of the conflict",
            "sourceA": { "file": "Filename A", "text": "Snippet of conflicting text from A" },
            "sourceB": { "file": "Filename B", "text": "Snippet of conflicting text from B" },
            "explanation": "Briefly why this is a problem",
            "severity": "high or medium"
          }
        ]
      }
    `;

    try {
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
    } catch (e) {
      console.error("Contradiction detection failed", e);
      return [];
    }
  }

  async generateResponse(
    query: string, 
    contextNodes: KnowledgeNode[]
  ): Promise<{ text: string, citations: Citation[], alerts: ClarificationAlert[] }> {
    const ai = this.getClient();
    const contextText = contextNodes
      .map(node => `[Source: ${node.metadata.file}, Category: ${node.category}, Page: ${node.metadata.page}]\n${node.content}`)
      .join('\n\n---\n\n');

    const systemInstruction = `
      You are a formal and highly accurate Corporate AI Assistant. 
      Your primary goal is to provide information strictly based on the provided document context.
      
      CORE DIRECTIVES:
      1. FORMAL TONE: Maintain a professional, polite, and formal tone.
      2. STRICT CONTEXT: Only use provided context. If context is missing, state: "I apologize, but I am unable to locate specific information regarding this request within our current indexed library."
      3. CITATIONS: Always mention source files and pages.
      4. SIMILARITY DETECTION: Identify if the context contains information that might be confused with the primary answer (e.g., a similar policy for a different department).
      
      OUTPUT FORMAT:
      You must return your response in a JSON structure:
      {
        "answer": "Your formal response with citations in-text",
        "alerts": [
          {
            "title": "Short title for the alert",
            "content": "Explanation of how this info differs from the primary answer to prevent confusion",
            "source": "Source Name (e.g. HR Handbook)"
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `User Query: ${query}\n\nContext:\n${contextText}`,
      config: {
        systemInstruction,
        temperature: 0.2,
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

    let result = { answer: "", alerts: [] };
    try {
      result = JSON.parse(response.text || "{}");
    } catch (e) {
      result.answer = response.text || "Error processing response.";
    }

    const citations: Citation[] = contextNodes.map(node => ({
      file: node.metadata.file,
      page: node.metadata.page,
      url: node.metadata.url
    }));

    const uniqueMap = new Map<string, Citation>();
    citations.forEach(c => {
      const key = `${c.file}-${c.page}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, c);
      }
    });

    return {
      text: result.answer,
      citations: Array.from(uniqueMap.values()),
      alerts: result.alerts || []
    };
  }
}

export const ragService = new RAGService();
