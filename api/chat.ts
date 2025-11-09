import { GoogleGenAI, Type } from "@google/genai";

export const config = {
  runtime: 'edge',
};

// Type definition is duplicated here to avoid pathing issues in Vercel build.
interface ThesisSuggestionResponse {
  keywords: string[];
  topics: string[];
}

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
    const { fieldOfStudy } = await request.json();

    if (!fieldOfStudy || typeof fieldOfStudy !== 'string' || fieldOfStudy.trim() === '') {
      return new Response(JSON.stringify({ error: 'رشته تحصیلی یک مقدار الزامی است.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("پاسخ دریافتی از API فاقد محتوای متنی است یا به دلیل خط‌مشی‌های ایمنی مسدود شده است.");
    }

    const parsedResponse = JSON.parse(jsonText.trim());

    // Basic validation of the parsed response structure
    if (
      !parsedResponse ||
      !Array.isArray(parsedResponse.keywords) ||
      !Array.isArray(parsedResponse.topics)
    ) {
      throw new Error("ساختار JSON دریافت شده از API نامعتبر است.");
    }

    return new Response(JSON.stringify(parsedResponse as ThesisSuggestionResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in API route:", error);

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