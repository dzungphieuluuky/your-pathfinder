
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) return new Response("Text required", { status: 400 });

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using the text-embedding-004 model (768 dimensions)
    const result = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: [{ parts: [{ text }] }]
    });

    // The SDK returns an array of embeddings
    const embedding = result.embeddings[0].values;

    return new Response(JSON.stringify({ embedding }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("Embedding API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
