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
        const { prompt } = req.body;

        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze this design request: "${prompt}".
      
      Generate a short, professional, catchy Project Title (3-6 words maximum).
      The title should be in the SAME LANGUAGE as the prompt.
      Do not use quotes.
      
      Example Input: "Thiết kế CV cho lập trình viên"
      Example Output: Hồ Sơ Năng Lực Developer
      `,
        });

        res.status(200).json({ title: response.text?.trim() || "Untitled Project" });

    } catch (error: any) {
        console.error("Title API Error:", error);
        res.status(500).json({ error: error.message || 'Title generation failed' });
    }
}
