import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function chatbot(message) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: message,
  });
  return response.text;
}

