
import { GoogleGenAI, Type } from "@google/genai";

const PRIMARY_MODEL = "gemini-3-flash-preview";
const FALLBACK_MODEL = "gemini-2.5-flash-lite";

function isQuotaError(error: any): boolean {
  const errorMessage = error?.message || error?.toString() || '';
  return errorMessage.includes('RESOURCE_EXHAUSTED') || 
         errorMessage.includes('quota') || 
         errorMessage.includes('limit') ||
         errorMessage.includes('429') ||
         errorMessage.includes('Too Many Requests');
}

export async function POST(req: Request) {
  try {
    const { query, context } = await req.json();

    if (!process.env.API_KEY) {
      return new Response(JSON.stringify({ error: "Gemini API key missing" }), { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const contextText = context && context.length > 0
      ? context.map((node: any) => `[Source: ${node.metadata?.file || 'Unknown'}, Category: ${node.category}, Page: ${node.metadata?.page || 1}]\n${node.content}`).join('\n\n---\n\n')
      : "No relevant documents found in the vault.";

    const systemInstruction = `
      You are PathFinder, a formal and highly accurate Corporate AI Assistant. 
      Your primary goal is to provide information strictly based on the provided document context.
      
      CORE DIRECTIVES:
      1. FORMAL TONE: Maintain a professional, polite, and formal tone.
      2. STRICT CONTEXT: Only use the provided context. If context is missing or irrelevant, apologize formally and say you don't have that information in your vault.
      3. CITATIONS: When using information from a source, mention the file name.
      
      OUTPUT FORMAT:
      You must return valid JSON:
      {
        "answer": "Your formal response",
        "alerts": []
      }
    `;

    let modelToUse = PRIMARY_MODEL;

    try {
      const response = await ai.models.generateContent({
        model: modelToUse,
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

      return new Response(response.text, {
        headers: { "Content-Type": "application/json" }
      });
    } catch (primaryError: any) {
      // Log detailed error information
      console.error("❌ PRIMARY MODEL ERROR:", {
        message: primaryError?.message,
        status: primaryError?.status,
        code: primaryError?.code,
        fullError: JSON.stringify(primaryError, null, 2)
      });

      if (isQuotaError(primaryError)) {
        console.warn(`⚠️ Primary model (${PRIMARY_MODEL}) quota exceeded. Using fallback...`);
        modelToUse = FALLBACK_MODEL;

        try {
          const fallbackResponse = await ai.models.generateContent({
            model: modelToUse,
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

          console.log(`✓ Successfully switched to fallback model: ${modelToUse}`);
          return new Response(fallbackResponse.text, {
            headers: { "Content-Type": "application/json" }
          });
        } catch (fallbackError: any) {
          // Log fallback error details
          console.error("❌ FALLBACK MODEL ERROR:", {
            message: fallbackError?.message,
            status: fallbackError?.status,
            code: fallbackError?.code,
            fullError: JSON.stringify(fallbackError, null, 2)
          });
          
          return new Response(JSON.stringify({ 
            answer: "Both models are unavailable. Please check your API quota.",
            alerts: []
          }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      } else {
        // NOT a quota error - could be API key, syntax, or connection issue
        console.error("❌ NON-QUOTA ERROR (might be API key, syntax, or connection):", primaryError?.message);
        return new Response(JSON.stringify({ 
          error: `API Error: ${primaryError?.message || 'Unknown error'}`,
          details: primaryError?.message
        }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }
  } catch (error: any) {
    console.error("❌ CHAT API ERROR:", {
      message: error?.message,
      stack: error?.stack,
      fullError: JSON.stringify(error, null, 2)
    });
    return new Response(JSON.stringify({ 
      error: error?.message || 'Internal server error',
      type: error?.constructor?.name 
    }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}