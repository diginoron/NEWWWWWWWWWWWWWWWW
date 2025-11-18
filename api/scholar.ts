import { GoogleGenAI } from '@google/genai';
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
    return new Response(JSON.stringify({ error: 'خطای پیکربندی سرور: کلید API گوگل یافت نشد. لطفاً متغیر محیطی API_KEY را تنظیم کنید.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash';

  try {
    const { keywords: originalKeywords } = await request.json();

    if (!originalKeywords || typeof originalKeywords !== 'string' || originalKeywords.trim() === '') {
      return new Response(JSON.stringify({ error: 'کلیدواژه‌ها یک مقدار الزامی است.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // -- Step 1: Translate keywords to English for better search results --
    const translationPrompt = `
      Translate the following academic research keywords from Persian to English.
      Return ONLY the comma-separated English keywords. Do not add any extra text, explanation, or labels.
      Keywords: "${originalKeywords}"
    `;
    
    const translationResult = await ai.models.generateContent({
        model: model,
        contents: translationPrompt
    });

    const translatedKeywords = translationResult.text?.trim();
    if (!translatedKeywords) {
      throw new Error("ترجمه کلیدواژه‌ها با شکست مواجه شد.");
    }
    
    // -- Step 2: Search for articles using Google Search grounding --
    const articleSearchPrompt = `
      You are an expert academic research assistant.
      Based on the provided Google Search results for the query "${translatedKeywords}", identify 3 recent (published in the last 3 years), relevant, English-language academic articles.

      For each article, extract the following information *only from the search results*:
      - title: The full title of the article.
      - authors: An array of author names. If not available, use an empty array.
      - publicationYear: The publication year as a number.
      - summary: A short, concise summary (about 2 sentences). If not available, generate one based on the title and available metadata.
      - link: A direct, valid, and working URL to the article's page.

      Your final output must be **only** a valid JSON object with a single key "articles", which contains an array of the 3 article objects.
      Do not include any text, explanations, intros, conclusions, or Markdown formatting outside of the JSON object itself.
      Ensure the links are real and extracted from the search results.
    `;

    const searchResult = await ai.models.generateContent({
      model: model,
      contents: articleSearchPrompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });

    const jsonText = searchResult.text;
    if (!jsonText) {
      throw new Error("پاسخ دریافتی از API فاقد محتوای متنی است یا به دلیل خط‌مشی‌های ایمنی مسدود شده است.");
    }

    // Sanitize the response: Gemini might wrap it in markdown and newlines
    const sanitizedJsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    
    const parsedResponse = JSON.parse(sanitizedJsonText);

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
    
    if (error instanceof Error) {
        errorMessage = `خطا در پردازش: ${error.message}`;
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}