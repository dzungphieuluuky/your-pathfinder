
import { GoogleGenAI, Type } from "@google/genai";

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

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

    return new Response(response.text, {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
