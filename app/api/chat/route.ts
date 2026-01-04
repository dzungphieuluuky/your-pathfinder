
import { GoogleGenAI, Type } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { query, context } = await req.json();

    if (!process.env.API_KEY) {
      return new Response(JSON.stringify({ error: "Gemini Intelligence API key missing from server environment." }), { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const contextText = context && context.length > 0
      ? context.map((node: any) => `[Source: ${node.metadata?.file || 'Unknown Asset'}, Category: ${node.category}, Page: ${node.metadata?.page || 1}]\n${node.content}`).join('\n\n---\n\n')
      : "No relevant documents found in the current intelligence vault sector.";

    const systemInstruction = `
      You are PathFinder, a formal and highly accurate Corporate AI Assistant. 
      Your primary goal is to provide information strictly based on the provided document context.
      
      CORE DIRECTIVES:
      1. FORMAL TONE: Maintain a professional, polite, and authoritative corporate voice.
      2. STRICT CONTEXT: Only use the provided context. If context is missing or irrelevant to the query, apologize formally and state that the vault does not contain that specific manifest.
      3. CITATIONS: When utilizing information, mention the relevant source file name clearly.
      
      OUTPUT FORMAT:
      You must return valid JSON:
      {
        "answer": "Your formal response",
        "alerts": []
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `User Inquiry: ${query}\n\nManifest Context:\n${contextText}`,
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

    if (!response.text) {
      throw new Error("Empty response from intelligence engine.");
    }

    return new Response(response.text, {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "An unexpected error occurred during intelligence processing." 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
