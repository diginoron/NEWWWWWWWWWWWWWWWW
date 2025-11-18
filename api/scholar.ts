import OpenAI from "openai";
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
    const { keywords: originalKeywords } = await request.json();

    if (!originalKeywords || typeof originalKeywords !== 'string' || originalKeywords.trim() === '') {
      return new Response(JSON.stringify({ error: 'کلیدواژه‌ها یک مقدار الزامی است.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = `
      You are an academic research assistant. Your task is to find 3 relevant English-language academic articles based on the Persian keywords: "${originalKeywords}".

      ## Instructions
      1.  **Analyze Keywords**: Understand the core concepts in the Persian keywords.
      2.  **Find Articles**: Based on your knowledge, identify 3 real, relevant academic articles published in the last 4 years.
      3.  **Format Output**: Structure the result as a JSON object.

      ## Output Requirements
      - The entire output MUST be a single, valid JSON object.
      - The JSON object must have a single root key: "articles".
      - The value of "articles" must be an array of 3 article objects.
      - Each article object must have the following keys:
          - \`title\` (string): The full article title.
          - \`authors\` (array of strings): List of main authors.
          - \`publicationYear\` (number): The year of publication.
          - \`summary\` (string): A brief, one-sentence summary.
          - \`link\` (string): A plausible URL to the article, preferably a Google Scholar link. It's okay if you have to construct the link, but it should be realistic.

      Example of a valid link: "https://scholar.google.com/scholar?q=..."

      Do not include any text, explanations, or markdown formatting outside of the main JSON object.
    `;

    const completion = await client.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const jsonText = completion.choices[0].message.content;
    if (!jsonText) {
      throw new Error("پاسخ دریافتی از API فاقد محتوای متنی است یا به دلیل خط‌مشی‌های ایمنی مسدود شده است.");
    }
    
    const parsedResponse = JSON.parse(jsonText.trim());

    if (!parsedResponse || !Array.isArray(parsedResponse.articles)) {
      throw new Error(`ساختار JSON دریافت شده از API نامعتبر است. پاسخ دریافت شده: ${jsonText}`);
    }
    
    return new Response(JSON.stringify(parsedResponse.articles as ArticleResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in scholar API route:", error);

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
