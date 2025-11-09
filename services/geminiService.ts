
import { GoogleGenAI, Type } from "@google/genai";
import type { ThesisSuggestionResponse } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set. Please set it in your Vercel project settings.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    keywords: {
      type: Type.ARRAY,
      description: "فهرستی از 5 تا 10 کلیدواژه اصلی و تخصصی مرتبط با رشته تحصیلی.",
      items: { type: Type.STRING },
    },
    topics: {
      type: Type.ARRAY,
      description: "فهرستی از 3 تا 5 موضوع جدید، خلاقانه و قابل تحقیق برای پایان‌نامه در آن رشته.",
      items: { type: Type.STRING },
    },
  },
  required: ["keywords", "topics"],
};

export async function generateThesisSuggestions(fieldOfStudy: string): Promise<ThesisSuggestionResponse> {
  try {
    const prompt = `
      برای رشته تحصیلی "${fieldOfStudy}"، لطفاً موارد زیر را تولید کن:
      1.  یک لیست از کلیدواژه‌های تخصصی و مهم.
      2.  یک لیست از موضوعات پیشنهادی برای پایان‌نامه که جدید و کاربردی باشند.

      خروجی باید دقیقاً با فرمت JSON و اسکیمای ارائه شده مطابقت داشته باشد.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.8,
        topP: 0.95,
      },
    });
    
    const jsonText = response.text.trim();
    const parsedResponse = JSON.parse(jsonText);
    
    // Validate the parsed response structure
    if (
      !parsedResponse ||
      !Array.isArray(parsedResponse.keywords) ||
      !Array.isArray(parsedResponse.topics)
    ) {
      throw new Error("Invalid JSON structure received from API.");
    }

    return parsedResponse as ThesisSuggestionResponse;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error(
      error instanceof Error ? error.message : "An unknown error occurred during API call."
    );
  }
}
