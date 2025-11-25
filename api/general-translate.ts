
import OpenAI from "openai";
import type { GeneralTranslateResponse, GeneralTranslateRequest } from '../types';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!process.env.AVALAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'خطای پیکربندی سرور: کلید API یافت نشد.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const client = new OpenAI({
    apiKey: process.env.AVALAI_API_KEY,
    baseURL: "https://api.avalai.ir/v1",
  });

  try {
    const body: GeneralTranslateRequest = await request.json();
    const { text, tone, direction } = body;

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return new Response(JSON.stringify({ error: 'متن ورودی الزامی است.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Word count check
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount > 500) {
        return new Response(JSON.stringify({ error: 'متن ورودی نباید بیشتر از 500 کلمه باشد.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    let prompt = "";
    
    const toneInstructions = {
        formal: "Official, formal, and professional. Suitable for business or legal documents.",
        informal: "Conversational, friendly, and casual. Suitable for chats or blog posts.",
        academic: "Scholarly, precise, and sophisticated. Suitable for research papers or essays."
    };

    if (direction === 'fa-en') {
        prompt = `
        Act as a professional bi-lingual translator.
        Translate the following text from **Persian (Farsi)** to **English**.
        
        Target Tone: **${toneInstructions[tone]}**
        
        Text to translate:
        "${text}"
        
        Return ONLY the translated text. Do not add any explanations.
        `;
    } else {
        prompt = `
        Act as a professional bi-lingual translator.
        Translate the following text from **English** to **Persian (Farsi)**.
        
        Target Tone: **${toneInstructions[tone]}**
        
        Text to translate:
        "${text}"
        
        Return ONLY the translated text. Do not add any explanations. Ensure the Persian output flows naturally and respects the requested tone.
        `;
    }

    const completion = await client.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3, // Lower temperature for more accurate translation
    });

    const translation = completion.choices[0].message.content?.trim();
    
    if (!translation) {
      throw new Error("ترجمه با شکست مواجه شد.");
    }

    return new Response(JSON.stringify({ translation } as GeneralTranslateResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in general-translate API route:", error);
    let errorMessage = "یک خطای ناشناخته در سرور رخ داد.";
    let statusCode = 500;
    
    if (error instanceof OpenAI.APIError) {
        errorMessage = `فراخوانی API با شکست مواجه شد: ${error.message}`;
        statusCode = error.status || 500;
    } else if (error instanceof Error) {
        errorMessage = `خطا در پردازش: ${error.message}`;
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
