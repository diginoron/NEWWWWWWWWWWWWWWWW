import { GoogleGenAI } from "@google/genai";
import type { ArticleResponse } from '../types';

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
      2. برای هر مقاله، اطلاعات زیر را استخراج کن:
         - title: عنوان کامل مقاله
         - authors: لیست نویسندگان مقاله
         - publicationYear: سال انتشار مقاله (فقط عدد)
         - summary: خلاصه‌ای کوتاه (2-3 جمله) از مقاله
         - link: لینک مستقیم و قابل دسترسی به صفحه مقاله
      3. از ابزار جستجوی گوگل برای یافتن اطلاعات واقعی و به‌روز استفاده کن.

      خروجی باید یک رشته JSON معتبر باشد که یک آرایه از اشیاء مقاله را در خود جای داده است. از هیچ قالب‌بندی دیگری مانند Markdown (مثلا \`\`\`json) استفاده نکن. فقط خود آرایه JSON خام را برگردان.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("پاسخ دریافتی از API فاقد محتوای متنی است یا به دلیل خط‌مشی‌های ایمنی مسدود شده است.");
    }
    
    const cleanedJsonText = jsonText.trim().replace(/^```json\s*/, '').replace(/```$/, '');
    const parsedResponse = JSON.parse(cleanedJsonText);


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
