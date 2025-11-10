import { GoogleGenAI, Type } from "@google/genai";

export const config = {
  runtime: 'edge',
};

// Type definition is duplicated here to avoid pathing issues in Vercel build.
interface ThesisSuggestionResponse {
  keywords: string[];
  topics: string[];
}
type AcademicLevel = 'arshad' | 'doctora';
type ResearchMethod = 'quantitative' | 'qualitative' | 'mixed';


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
    const { 
      fieldOfStudy, 
      keywords, 
      level, 
      methodology 
    }: { 
      fieldOfStudy: string; 
      keywords?: string;
      level?: AcademicLevel;
      methodology?: ResearchMethod;
    } = await request.json();

    if (!fieldOfStudy || typeof fieldOfStudy !== 'string' || fieldOfStudy.trim() === '') {
      return new Response(JSON.stringify({ error: 'رشته تحصیلی یک مقدار الزامی است.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isAdvanced = keywords || level || methodology;
    let prompt: string;

    if (isAdvanced) {
      const levelText = level === 'arshad' ? 'کارشناسی ارشد' : level === 'doctora' ? 'دکتری' : 'نامشخص';
      const methodTextMapping = {
        quantitative: 'کمی',
        qualitative: 'کیفی',
        mixed: 'ترکیبی'
      };
      const methodText = methodology ? methodTextMapping[methodology] : 'نامشخص';

      prompt = `
        به عنوان یک مشاور متخصص پایان‌نامه، برای رشته تحصیلی "${fieldOfStudy}" با توجه به اطلاعات تکمیلی زیر، موارد زیر را تولید کن:
        1.  یک لیست از 5 تا 10 کلیدواژه تخصصی و مهم.
        2.  یک لیست از 3 تا 5 موضوع پیشنهادی برای پایان‌نامه که جدید، خلاقانه و قابل تحقیق باشند.

        اطلاعات تکمیلی برای ایده پردازی:
        - کلیدواژه‌های اولیه مدنظر دانشجو: ${keywords || 'ارائه نشده'}
        - مقطع تحصیلی: ${levelText}
        - روش تحقیق مورد نظر: ${methodText}
      `;

      if (level === 'arshad') {
        prompt += "\n\nنکته مهم: چون مقطع کارشناسی ارشد است، موضوعات باید بیشتر ماهیت «رابطه‌ای» و کاربردی داشته باشند و از پیچیدگی بیش از حد پرهیز شود.";
      } else if (level === 'doctora') {
        prompt += "\n\nنکته مهم: چون مقطع دکتری است، موضوعات باید کاملاً نوآورانه، عمیق، دارای جنبه «مدل‌سازی» یا توسعه تئوری باشند و به ادبیات پژوهش اضافه کنند.";
      }
    } else {
      prompt = `
        برای رشته تحصیلی "${fieldOfStudy}"، لطفاً موارد زیر را تولید کن:
        1.  یک لیست از 5 تا 10 کلیدواژه تخصصی و مهم.
        2.  یک لیست از 3 تا 5 موضوع پیشنهادی برای پایان‌نامه که جدید و کاربردی باشند.
      `;
    }

    prompt += "\n\nخروجی باید دقیقاً با فرمت JSON و اسکیمای ارائه شده مطابقت داشته باشد. هیچ متن اضافی یا توضیحی خارج از ساختار JSON ارائه نده.";

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