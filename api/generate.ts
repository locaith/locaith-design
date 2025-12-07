import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are an **Elite Creative Director** & **Senior UX/UI Designer** at **Locaith Design**.
Your goal is to design **World-Class, Commercial-Grade Documents** that look like they were made by a top-tier agency.

**CRITICAL: LANGUAGE ENFORCEMENT**
1.  **DETECT** the language of the user's prompt (e.g., Vietnamese, French, Japanese).
2.  **GENERATE** all content (Headings, Body Text, Labels, Placeholders) in that **EXACT SAME LANGUAGE**.
3.  If the prompt is in Vietnamese, the Output CV/Brochure MUST be in Vietnamese.
4.  Do NOT generate English content unless the prompt is in English.

**CORE INTELLIGENCE - DYNAMIC IMAGERY:**
You MUST select images that **MATCH THE CONTENT**.
Use this URL format for ALL decorative images (not user provided ones): 
\`https://image.pollinations.ai/prompt/{descriptive_keywords}?width={w}&height={h}&nologo=true\`

**OUTPUT ARCHITECTURE:**
1.  **Structure:** Return ONLY HTML strings wrapped in \`<div class="print-page">...</div>\`.
2.  **Pagination:** You MUST output the EXACT number of pages requested by the user.
3.  **Layout Engine (Tailwind CSS):** Use Bento Grids, Glassmorphism, and Premium Typography.

**USER IMAGE HANDLING - CRITICAL PROTOCOL:**
*   I will provide images with specific IDs formatted as: \`[[USER_IMG_...]]\`.
*   **YOU MUST USE THIS EXACT PLACEHOLDER AS THE SRC.**
*   **DO NOT** replace it with base64. The frontend handles replacement.
*   **DO NOT** use \`background-image\` for User Images. Use \`<img />\` tags.
*   **SYNTAX:** \`<img src="[[USER_IMG_{id}]]" class="..." />\`
*   **Logos:** Use \`object-contain\`. **Products:** Use \`object-cover\`.

**EXECUTION INSTRUCTION:**
*   Return **only** the HTML.
*   Start immediately with \`<div class="print-page">\`.
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    try {
        const { prompt, designType, uploadedImages, currentHTML, pageCount } = req.body;

        const ai = new GoogleGenAI({ apiKey });

        let imagePromptInfo = "";
        const imageParts: any[] = [];

        if (uploadedImages && uploadedImages.length > 0) {
            imagePromptInfo += "\n**USER PROVIDED IMAGES (STRICTLY USE THESE IDs):**\n";
            uploadedImages.forEach((img: any, index: number) => {
                const cleanBase64 = img.data.split(',')[1];
                imageParts.push({ inlineData: { mimeType: 'image/png', data: cleanBase64 } });

                imagePromptInfo += `- Image ${index + 1} ID: \`[[${img.id}]]\` (Context: **${img.context}**). `;
                if (img.description) {
                    imagePromptInfo += `Description: "${img.description}". `;
                }

                if (img.context === 'LOGO') {
                    imagePromptInfo += `Use \`src="[[${img.id}]]"\` for Logo. Class: \`object-contain\`.\n`;
                } else if (img.context === 'PRODUCT') {
                    imagePromptInfo += `Use \`src="[[${img.id}]]"\` for Product. Class: \`object-cover\`.\n`;
                } else {
                    imagePromptInfo += `Style Reference Only.\n`;
                }
            });
        }

        const languageInstruction = `
    **CRITICAL LANGUAGE RULE**: 
    Detect the language of the Topic/Brand prompt below. 
    You MUST write ALL headlines, paragraphs, and labels in that SAME language.
    (e.g. If input is Vietnamese -> Output Vietnamese).
    `;

        let userRequest = `
    ${languageInstruction}
    
    Task: Create a professional ${designType}.
    Topic/Brand: "${prompt}".
    PAGE COUNT: Exact ${pageCount} pages.
    ${imagePromptInfo}
    
    IMPORTANT INSTRUCTIONS: 
    1. **PLANNING**: Plan content for exactly ${pageCount} pages.
    2. **GENERATION**: Output exactly ${pageCount} distinct \`<div class="print-page">\` blocks.
    3. **IMAGERY**: For user images, use \`src="[[ID]]"\` exactly.
    `;

        const contents = [];

        if (currentHTML && currentHTML.length > 50) {
            const editPrompt = `
      ${languageInstruction}
      
      **EDIT MODE ACTIVATED**
      Refine the design based on user feedback.
      
      **CRITICAL: PAGE COUNT UPDATE**
      The user has requested **${pageCount} PAGES**.
      **YOU MUST RESTRUCTURE the entire HTML to fit exactly ${pageCount} pages.**
      - If the user increased pages: Generate NEW pages.
      - If the user decreased pages: Condense content.
      
      **EXISTING HTML:**
      \`\`\`html
      ${currentHTML}
      \`\`\`

      **CHANGE REQUEST:**
      "${prompt}"
      
      ${imagePromptInfo}
      `;

            contents.push({
                role: 'user',
                parts: [...imageParts, { text: editPrompt }]
            });
        } else {
            contents.push({
                role: 'user',
                parts: [...imageParts, { text: userRequest }]
            });
        }

        // Set headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 0.7,
            }
        });

        for await (const chunk of responseStream) {
            if (chunk.text) {
                res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
            }
        }

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error: any) {
        console.error("Generate API Error:", error);
        res.status(500).json({ error: error.message || 'Generation failed' });
    }
}
