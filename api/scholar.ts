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

  if (!process.env.AVALAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'خطای پیکربندی سرور: کلید API یافت نشد.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.AVALAI_API_KEY });

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

    const translationResult = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: translationPrompt,
        config: {
            temperature: 0.1,
        }
    });

    const translatedKeywords = translationResult.text?.trim();
    if (!translatedKeywords) {
      throw new Error("ترجمه کلیدواژه‌ها با شکست مواجه شد.");
    }
    
    // -- Step 2: Search for articles using the translated keywords --
    const articleSearchPrompt = `
      You are an expert academic research assistant acting as an API.
      Your task is to find 3 recent (published in the last 3 years) and highly relevant international, English-language academic articles about "${translatedKeywords}".
      
      Instructions:
      1.  Use your search tool to find real articles from reputable sources like Google Scholar, IEEE Xplore, ACM Digital Library, PubMed, etc.
      2.  For each article, extract the following information:
          - title: The full title of the article (in English).
          - authors: An array of author names.
          - publicationYear: The publication year as a number.
          - summary: A short, concise summary in English (about 2 sentences).
          - link: A direct, valid, and working URL to the article's abstract page. Verify the link is accessible.
      3.  Your final output must be **only** a valid JSON array of objects. Do not include any text, explanations, introductions, conclusions, or Markdown formatting like \`\`\`json. Your entire response should be the raw JSON array.

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

    const articleResult = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: articleSearchPrompt,
      config: {
        tools: [{googleSearch: {}}],
        temperature: 0.5,
      }
    });

    const jsonText = articleResult.text;
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
    if (error instanceof Error) {
        errorMessage = `خطا در پردازش: ${error.message}`;
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}