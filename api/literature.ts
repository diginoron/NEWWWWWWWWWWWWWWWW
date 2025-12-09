
import OpenAI from "openai";
import type { LiteratureReviewResponse } from '../types';

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
    const { keywords } = await request.json();

    if (!keywords || typeof keywords !== 'string' || keywords.trim() === '') {
      return new Response(JSON.stringify({ error: 'کلیدواژه‌ها الزامی است.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = `
      You are an expert academic research assistant familiar with Iranian academic databases like 'Civilica' (civilica.com).

      Task:
      Search for (or simulate) 5 high-quality research articles relevant to the keywords: "${keywords}" that would be found in Civilica.

      For EACH of the 5 articles, provide the following two elements in a structured JSON format:

      1.  **Paragraph (paragraph)**: A summary paragraph in Persian that EXACTLY follows this template:
          "[Author Last Name] [and colleagues (if >2 authors)] in [Year], with the title "[Title]", examined [Goal/Purpose]. They used [Methodology] and concluded that [Results]."
          
          Persian Template Rule:
          - If 1 author: "نام خانوادگی (سال)"
          - If 2 authors: "نام خانوادگی1 و نام خانوادگی2 (سال)"
          - If >2 authors: "نام خانوادگی نفر اول و همکاران (سال)"
          - Text structure: "... با عنوان «...» به بررسی ... پرداختند. از روش ... استفاده کردند و به این نتیجه رسیدند که ..."

      2.  **Reference (reference)**: The full citation in APA format (American Psychological Association). Use Persian citation format if the article is Persian (which is likely for Civilica).

      Output JSON Structure:
      {
        "items": [
          {
            "paragraph": "string",
            "reference": "string"
          },
          ...
        ]
      }

      Do not include any other text, just the JSON object.
    `;

    const completion = await client.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    const jsonText = completion.choices[0].message.content;
    if (!jsonText) {
      throw new Error("پاسخ دریافتی از API نامعتبر است.");
    }

    const parsedResponse = JSON.parse(jsonText.trim());

    if (!parsedResponse || !Array.isArray(parsedResponse.items)) {
         throw new Error("ساختار پاسخ API معتبر نیست.");
    }

    return new Response(JSON.stringify(parsedResponse as LiteratureReviewResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in literature API route:", error);
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
