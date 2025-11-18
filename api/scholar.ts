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

  // Use AVALAI_API_KEY, same as chat.ts and pre-proposal.ts
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
      You are an expert academic research assistant with the ability to find real academic papers from sources like Google Scholar.
      Your task is to find 3 recent (published in the last 4 years), highly relevant, and REAL English-language academic articles for the following Persian keywords: "${originalKeywords}".

      Follow these steps with precision:
      1.  First, internally translate the Persian keywords into effective English search terms.
      2.  Then, find real articles from reputable academic sources.
      3.  For each article you find, extract the following information accurately:
          - title: The full and correct title.
          - authors: An array of the primary authors' names.
          - publicationYear: The publication year as a number.
          - summary: A concise one or two-sentence summary of the article's abstract.
          - link: The direct, verifiable, and working URL to the article's page (e.g., on Google Scholar, IEEE Xplore, ScienceDirect). **This is crucial. Do not fabricate links.**

      Your output must be **only** a valid JSON object with a single key "articles", which is an array of the 3 article objects.
      Do not include any text, explanations, or markdown formatting outside of the JSON object itself.
    `;

    const completion = await client.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.5, // Lower temperature for more factual results
    });

    const jsonText = completion.choices[0].message.content;
    if (!jsonText) {
      throw new Error("پاسخ دریافتی از API فاقد محتوای متنی است یا به دلیل خط‌مشی‌های ایمنی مسدود شده است.");
    }
    
    const parsedResponse = JSON.parse(jsonText.trim());

    if (!parsedResponse || !Array.isArray(parsedResponse.articles)) {
      throw new Error(`ساختار JSON دریافت شده از API نامعتبر است. پاسخ دریافت شده: ${jsonText}`);
    }
    
    // The prompt asks for { articles: [...] }, but the client-side expects an array directly.
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