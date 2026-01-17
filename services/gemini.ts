
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const solveMathProblem = async (problem: string, imageBase64?: string) => {
  const ai = getAI();
  const parts: any[] = [{ text: `Solve this high school level math problem step-by-step. Use LaTeX for all mathematical expressions. Format the response as JSON.` }];
  
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: imageBase64
      }
    });
  }
  
  parts.push({ text: problem });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          solution: { type: Type.STRING, description: 'Summary of the solution' },
          steps: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: 'Detailed steps with LaTeX' 
          },
          finalAnswer: { type: Type.STRING, description: 'The final simplified answer' },
          relatedFormulas: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: 'Key formulas used' 
          }
        },
        required: ['solution', 'steps', 'finalAnswer']
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateQuiz = async (topic: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate 5 multiple choice questions for high school math on the topic: ${topic}. Use LaTeX for math.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ['question', 'options', 'correctAnswer', 'explanation']
        }
      }
    }
  });

  return JSON.parse(response.text);
};

export const getMathExplanation = async (concept: string) => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Explain the math concept '${concept}' clearly for a high school student. Use LaTeX.`,
    });
    return response.text;
};
