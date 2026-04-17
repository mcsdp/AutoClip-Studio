import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface VideoAnalysisResult {
  startTime: number;
}

export const analyzeVideo = async (
  videoFile: File, 
  duration: number, 
  mode: 'smart' | 'fixed'
): Promise<VideoAnalysisResult[]> => {
  const base64Data = await fileToBase64(videoFile);
  
  const prompt = mode === 'smart' 
    ? `Analyze this video and identify the most interesting segments that would make good short-form clips (each approx ${duration} seconds).
       Return as a JSON array of start times in seconds: [number, number, ...].`
    : `This video needs to be cut into segments of exactly ${duration} seconds.
       Return a JSON array of start times in seconds for each segment: [number, number, ...].`;

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

  try {
    const text = response.text;
    if (!text) return [];
    
    const startTimes: number[] = JSON.parse(text);
    return startTimes.map(startTime => ({ startTime }));
  } catch (e) {
    console.error("Failed to parse Gemini response:", e);
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
