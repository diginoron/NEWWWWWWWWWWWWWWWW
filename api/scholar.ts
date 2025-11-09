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
      5 مقاله علمی جدید از Google Scholar در مورد "${keywords}" که در سال 2024 یا 2025 منتشر شده‌اند، پیدا کن.
      از ابزار جستجوی گوگل استفاده کن.
      برای هر مقاله، این موارد را ارائه بده: title, authors (به صورت لیست رشته‌ها), publicationYear (به صورت عدد), summary (خلاصه 2-3 جمله‌ای), و یک link مستقیم.
      کل پاسخ تو باید فقط و فقط یک آرایه JSON خام از اشیاء باشد، بدون هیچ متن اضافی، توضیح یا قالب‌بندی Markdown.
      مثال فرمت: [{"title": "t", "authors": ["a", "b"], "publicationYear": 2024, "summary": "s", "link": "l"}]
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.5,
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("پاسخ دریافتی از API فاقد محتوای متنی است یا به دلیل خط‌مشی‌های ایمنی مسدود شده است.");
    }
    
    // Use a regular expression to find the JSON array within the response text.
    // This is more robust against extra text or markdown code fences.
    const jsonMatch = jsonText.match(/(\[[\s\S]*\])/);

    if (!jsonMatch || !jsonMatch[0]) {
        throw new Error(`آرایه JSON معتبر در پاسخ مدل یافت نشد. پاسخ دریافت شده: ${jsonText}`);
    }
    
    const jsonString = jsonMatch[0];
    const parsedResponse = JSON.parse(jsonString);

    if (!Array.isArray(parsedResponse)) {
        throw new Error("ساختار JSON دریافت شده از API یک آرایه نیست.");
    }
    
    return new Response(JSON.stringify(parsedResponse as ArticleResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in scholar API route:", error);

    let errorMessage = "یک خطای ناشناخته در سرور رخ داد.";
    let statusCode = 500;

    if (error instanceof Error) {
        // The Gemini SDK can throw an error where the message is a JSON string from the API.
        if (error.message.includes('"code"') && error.message.includes('"message"')) {
             try {
                const apiErrorBody = JSON.parse(error.message);
                const apiError = apiErrorBody.error;

                if (apiError.code === 503 || apiError.status === 'UNAVAILABLE') {
                    errorMessage = "سرویس هوش مصنوعی در حال حاضر با ترافیک بالایی مواجه است. لطفاً چند لحظه بعد دوباره تلاش کنید.";
                    statusCode = 503;
                } else {
                    errorMessage = `سرویس هوش مصنوعی با خطا مواجه شد: ${apiError.message}`;
                    statusCode = typeof apiError.code === 'number' ? apiError.code : 500;
                }
             } catch(e) {
                 // Fallback if parsing fails for some reason
                 errorMessage = `فراخوانی API با شکست مواجه شد: ${error.message}`;
             }
        } else {
            errorMessage = `فراخوانی API با شکست مواجه شد: ${error.message}`;
        }
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}