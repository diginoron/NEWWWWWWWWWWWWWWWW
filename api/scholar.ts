import { GoogleGenAI, Type } from "@google/genai";
import type { ArticleResponse } from '../types';

export const config = {
  runtime: 'edge',
};

const articleSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "عنوان کامل مقاله" },
    authors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "لیست نویسندگان مقاله" },
    publicationYear: { type: Type.NUMBER, description: "سال انتشار مقاله، باید 2024 یا 2025 باشد" },
    summary: { type: Type.STRING, description: "خلاصه ای کوتاه (2-3 جمله) از مقاله" },
    link: { type: Type.STRING, description: "لینک مستقیم و قابل دسترسی به صفحه مقاله در Google Scholar یا منبع اصلی" },
  },
  required: ["title", "authors", "publicationYear", "summary", "link"],
};

const responseSchema = {
    type: Type.ARRAY,
    items: articleSchema,
};


export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!process.env.API_KEY) {
    return new Response(JSON.stringify({ error: 'خطای پیکربندی سرور: کلید API یافت نشد.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const { keywords } = await request.json();

    if (!keywords || typeof keywords !== 'string' || keywords.trim() === '') {
      return new Response(JSON.stringify({ error: 'کلیدواژه‌ها یک مقدار الزامی است.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = `
      به عنوان یک دستیار تحقیق حرفه‌ای، 5 مقاله علمی انگلیسی جدید از Google Scholar بر اساس کلیدواژه‌های زیر پیدا کن: "${keywords}".
      شرایط:
      1. مقالات باید در سال 2024 یا 2025 منتشر شده باشند.
      2. برای هر مقاله، عنوان، لیست نویسندگان، سال انتشار، خلاصه‌ای کوتاه و یک لینک مستقیم به صفحه مقاله را ارائه بده.
      3. از ابزار جستجوی گوگل برای یافتن اطلاعات واقعی و به‌روز استفاده کن.

      خروجی باید دقیقاً با فرمت JSON و اسکیمای ارائه شده مطابقت داشته باشد.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("پاسخ دریافتی از API فاقد محتوای متنی است یا به دلیل خط‌مشی‌های ایمنی مسدود شده است.");
    }
    
    const parsedResponse = JSON.parse(jsonText.trim());

    if (!Array.isArray(parsedResponse)) {
        throw new Error("ساختار JSON دریافت شده از API یک آرایه نیست.");
    }
    
    return new Response(JSON.stringify(parsedResponse as ArticleResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in scholar API route:", error);
    const errorMessage = error instanceof Error ? error.message : "یک خطای ناشناخته رخ داد.";
    return new Response(JSON.stringify({ error: `فراخوانی API با شکست مواجه شد: ${errorMessage}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}