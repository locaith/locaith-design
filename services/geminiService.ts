
import { UploadedImage } from "../types";

export const streamDesignGeneration = async (
    prompt: string,
    designType: string,
    uploadedImages: UploadedImage[],
    currentHTML: string | null,
    pageCount: number,
    onChunk: (chunk: string) => void
) => {
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt,
                designType,
                uploadedImages,
                currentHTML,
                pageCount,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Generation failed');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error('No response body');
        }

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                        return;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.text) {
                            onChunk(parsed.text);
                        }
                    } catch {
                        // Skip invalid JSON lines
                    }
                }
            }
        }
    } catch (error) {
        console.error("Locaith Generation Error:", error);
        throw error;
    }
};

export const enhancePrompt = async (rawPrompt: string): Promise<string> => {
    try {
        const response = await fetch('/api/enhance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ rawPrompt }),
        });

        if (!response.ok) {
            return rawPrompt;
        }

        const data = await response.json();
        return data.enhancedPrompt || rawPrompt;
    } catch (error) {
        return rawPrompt;
    }
};

export const generateProjectTitle = async (prompt: string): Promise<string> => {
    try {
        const response = await fetch('/api/title', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
            return "Untitled Project";
        }

        const data = await response.json();
        return data.title || "Untitled Project";
    } catch (error) {
        return "Untitled Project";
    }
};
