import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    try {
        const { rawPrompt } = req.body;

        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are an expert prompt engineer. 
      
      TASK: Rewrite the following simple user request into a highly detailed, professional design brief (2 sentences max).
      
      IMPORTANT: Detect the language of the User Input.
      You MUST output the enhanced prompt IN THE SAME LANGUAGE as the User Input.
      
      User Input: "${rawPrompt}"
      
      Output ONLY the enhanced prompt string.`,
        });

        res.status(200).json({ enhancedPrompt: response.text?.trim() || rawPrompt });

    } catch (error: any) {
        console.error("Enhance API Error:", error);
        res.status(500).json({ error: error.message || 'Enhancement failed' });
    }
}
