
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { UserVibe } from "../types";

export const analyzeVibe = async (handle: string, bio: string): Promise<UserVibe> => {
  // Always initialize inside the function to use the latest API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following Farcaster bio for user ${handle}: "${bio}". 
    Determine their social "vibe" on the Base network. 
    Return a visual prompt that captures their personality in an abstract, futuristic, and artistic way.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          keywords: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          visualPrompt: { type: Type.STRING }
        },
        required: ["description", "keywords", "visualPrompt"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
};

export const generateImpressionImage = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `A high-quality, professional digital artwork representing the concept: ${prompt}. Style: Abstract, futuristic, vibrant blue and white accents (Base network colors), 8k resolution, cinematic lighting, sleek lines.`
        }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  let imageUrl = '';
  // The response might contain both image and text parts; iterate through all parts to find the image part.
  if (response.candidates && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  if (!imageUrl) throw new Error("Failed to generate image data");
  return imageUrl;
};
