import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const generatePixelSkin = async (description: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Generate a pixel art sprite of a pug based on this description: "${description}". 
            The style must be 8-bit, retro, pixelated. 
            The background must be a solid, single color (preferably white or transparent logic implied) so it looks like a game sprite.
            Keep it simple and cute. Side view or 3/4 view facing right.`
          }
        ]
      },
      config: {
        // No specific image config needed for basic generation in flash-image, 
        // but we ensure we handle the response correctly.
      }
    });

    // Extract image from response
    // The response structure for images in generateContent often puts the image in inlineData
    // We iterate through parts to find the image.
    const parts = response.candidates?.[0]?.content?.parts;
    
    if (!parts) {
      throw new Error("No content generated");
    }

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        // Found the image
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    throw error;
  }
};
