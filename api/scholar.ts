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
      You are an expert academic research assistant acting as an API.
      Your task is to find 3 recent (published in the last 3 years) and highly relevant international, English-language academic articles about "${translatedKeywords}".
      
      Instructions:
      1.  Search for real articles from reputable sources like Google Scholar, IEEE Xplore, ACM Digital Library, PubMed, etc.
      2.  For each article, extract the following information:
          - title: The full title of the article (in English).
          - authors: An array of author names.
          - publicationYear: The publication year as a number.
          - summary: A short, concise summary in English (about 2 sentences).
          - link: A direct, valid, and working URL to the article's abstract page. Verify the link is accessible.
      3.  Your final output must be **only** a valid JSON object with a single key "articles" which contains an array of the article objects. Do not include any text, explanations, intros, conclusions, or Markdown formatting like \`\`\`json. Your entire response should be the raw JSON object.

      Example output format:
      {
        "articles": [
          {
            "title": "Example Title 1",
            "authors": ["Author A", "Author B"],
            "publicationYear": 2024,
            "summary": "This is a summary of the first article.",
            "link": "https://example.com/article1"
          }
        ]
      }
    `;

    const articleCompletion = await client.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: articleSearchPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const jsonText = articleCompletion.choices[0].message.content;
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