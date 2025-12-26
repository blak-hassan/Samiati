import { GoogleGenAI, Content } from "@google/genai";
import { Message } from "@/types";

export const sendMessageToGemini = async (currentMessage: string, history: Message[] = []): Promise<string> => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("API Key not found. Returning mock response.");
    return "I am Samiati. I can help you connect with your culture. (API Key missing)";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const modelId = "gemini-2.5-flash";

    const systemInstruction = "You are Samiati, a cultural assistant knowledgeable about African traditions, languages (specifically Swahili, Kikuyu, Yoruba, Igbo, etc.), proverbs, and stories. Your goal is to help users connect with their heritage. Be warm, respectful, and educational.";

    // Map history to Gemini format
    const contents: Content[] = history
      .filter(msg => msg.sender === 'user' || msg.sender === 'ai')
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: currentMessage }]
    });

    const response = await ai.models.generateContent({
      model: modelId,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "I didn't quite catch that. Could you rephrase?";
  } catch (error) {
    console.error("Error communicating with Gemini:", error);
    return "Sorry, I'm having trouble connecting to the spirits of knowledge right now. Please try again later.";
  }
};