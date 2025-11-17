import OpenAI from "openai";
import type { ThesisSuggestionResponse } from '../types';

export const config = {
  runtime: 'edge',
};

// Type definitions duplicated from types.ts to avoid pathing issues.
type AcademicLevel = 'arshad' | 'doctora';
type ResearchMethod = 'quantitative' | 'qualitative' | 'mixed';

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

    prompt += "\n\nخروجی باید دقیقاً یک آبجکت JSON معتبر باشد که شامل کلیدهای 'keywords' و 'topics' است. هیچ متن اضافی یا توضیحی خارج از ساختار JSON ارائه نده.";

    const completion = await client.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.8,
      top_p: 0.95,
    });

    const jsonText = completion.choices[0].message.content;
    if (!jsonText) {
      throw new Error("پاسخ دریافتی از API فاقد محتوای متنی است یا به دلیل خط‌مشی‌های ایمنی مسدود شده است.");
    }

    const parsedResponse = JSON.parse(jsonText.trim());

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