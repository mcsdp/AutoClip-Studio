import { GoogleGenAI } from "@google/genai";

let aiInstance: any = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing. AI features will not work.");
    }
    aiInstance = new GoogleGenAI({ apiKey: apiKey || 'missing-key' });
  }
  return aiInstance;
};

export interface VideoAnalysisResult {
  startTime: number;
}

export const analyzeVideo = async (
  videoFile: File, 
  duration: number, 
  mode: 'smart' | 'fixed'
): Promise<VideoAnalysisResult[]> => {
  const ai = getAI();
  const base64Data = await fileToBase64(videoFile);
  
  const prompt = mode === 'smart' 
    ? `Analyze this video and identify the most interesting segments that would make good short-form clips (each approx ${duration} seconds).
       Return as a JSON array of start times in seconds: [number, number, ...].`
    : `This video needs to be cut into segments of exactly ${duration} seconds.
       Return a JSON array of start times in seconds for each segment: [number, number, ...].`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: videoFile.type,
                data: base64Data,
              },
            },
            {
              text: prompt,
            },
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return [];
    
    // Clean up markdown if AI returned it
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const startTimes: number[] = JSON.parse(cleanJson);
    return startTimes.map(startTime => ({ startTime }));
  } catch (e) {
    console.error("Failed to analyze video with Gemini:", e);
    return [];
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};
