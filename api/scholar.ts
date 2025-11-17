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

    // -- Step 1: Translate keywords to English --
    const translationPrompt = `
      Translate the following academic research keywords from Persian to English.
      Return ONLY the comma-separated English keywords. Do not add any extra text, explanation, or labels.
      Keywords: "${originalKeywords}"
    `;

    const translationCompletion = await client.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: translationPrompt }],
      temperature: 0.1,
    });

    const translatedKeywords = translationCompletion.choices[0].message.content?.trim();
    if (!translatedKeywords) {
      throw new Error("ترجمه کلیدواژه‌ها با شکست مواجه شد.");
    }
    
    // -- Step 2: Search for articles using the translated keywords --
    const articleSearchPrompt = `
      You are an API. Your task is to find 3 recent and relevant international, English-language academic articles from Google Scholar about "${translatedKeywords}". Do not search for Persian articles.
      Search the internet to find up-to-date information.
      For each article, extract the following information:
      - title: The full title of the article (in English)
      - authors: An array of author names
      - publicationYear: The publication year (number only)
      - summary: A short summary (about 2 sentences and in English)
      - link: A direct link to the article or its page

      Your response must be **only** a valid JSON array. Do not include any text, explanations, intros, conclusions, or Markdown formatting like \`\`\`json. Only the raw JSON array.

      Example output format:
      [
        {
          "title": "Example Title 1",
          "authors": ["Author A", "Author B"],
          "publicationYear": 2024,
          "summary": "This is a summary of the first article.",
          "link": "https://example.com/article1"
        }
      ]
    `;

    const articleCompletion = await client.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: articleSearchPrompt }],
      temperature: 0.5,
    });

    const jsonText = articleCompletion.choices[0].message.content;
    if (!jsonText) {
      throw new Error("پاسخ دریافتی از API فاقد محتوای متنی است یا به دلیل خط‌مشی‌های ایمنی مسدود شده است.");
    }
    
    // Extract JSON array from the response, as the model might add extra text
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