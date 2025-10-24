import { GoogleGenAI, Modality } from "@google/genai";

const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await fileToBase64(file);
  return {
    inlineData: { data: base64EncodedData, mimeType: file.type },
  };
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });
};

export const editImageWithPrompt = async (
  imageFile: File,
  prompt: string,
  numberOfResults: number
): Promise<string[]> => {
  if (!process.env.API_KEY) {
    throw new Error("The API_KEY environment variable is not set.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const imagePart = await fileToGenerativePart(imageFile);

  const generationPromises = [];
  for (let i = 0; i < numberOfResults; i++) {
    generationPromises.push(
      ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            imagePart,
            { text: prompt },
          ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
      })
    );
  }

  const responses = await Promise.all(generationPromises);
  
  const results: string[] = [];
  responses.forEach(response => {
    const generatedPart = response.candidates?.[0]?.content?.parts?.[0];
    if (generatedPart?.inlineData?.data) {
      const base64ImageBytes: string = generatedPart.inlineData.data;
      results.push(`data:${generatedPart.inlineData.mimeType};base64,${base64ImageBytes}`);
    }
  });

  if (results.length === 0) {
    throw new Error("No images were generated. The prompt may have been blocked or the model could not fulfill the request.");
  }
  
  return results;
};