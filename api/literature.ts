
import { GoogleGenAI } from "@google/genai";
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

  // The API key must be obtained exclusively from the environment variable process.env.API_KEY.
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'خطای پیکربندی سرور: کلید API یافت نشد.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // Initialize with named parameter as required.
  const ai = new GoogleGenAI({ apiKey: apiKey });

  try {
    const { keywords } = await request.json();

    if (!keywords || typeof keywords !== 'string' || keywords.trim() === '') {
      return new Response(JSON.stringify({ error: 'کلیدواژه‌ها الزامی است.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = `
      You are an expert academic research assistant.
      
      **Task:** 
      Perform a grounded search using Google Search restricted to 'site:civilica.com' to find 5 REAL and DISTINCT research articles relevant to the keywords: "${keywords}".
      
      **Instructions:**
      1.  **Search:** Use the 'googleSearch' tool to find actual papers on Civilica.
      2.  **Extract:** For each found article, identify:
          -   Title
          -   Author(s)
          -   Year of publication
          -   Methodology (infer from abstract/snippet if explicit mention is missing)
          -   Results/Findings (infer from abstract/snippet)
          -   URL (Link)
      3.  **Synthesize:** Create a JSON response containing these details.
      
      **Output Format:**
      Return strictly a JSON object with the following structure. Do NOT include markdown code blocks.

      {
        "items": [
          {
            "paragraph": "A summary paragraph in Persian strictly following this template: [Authors] ([Year]) با عنوان «[Title]» به بررسی [Goal] پرداختند. از روش [Methodology] استفاده کردند و به این نتیجه رسیدند که [Results].",
            "reference": "Full APA citation (Persian or English depending on source).",
            "link": "The URL of the article on civilica.com"
          }
        ]
      }

      **Important:**
      - The articles MUST be real. Do not simulate or hallucinate papers.
      - If you cannot find exactly 5 from Civilica, find as many as possible (up to 5) from reputable Iranian academic sources.
      - The 'paragraph' text must be fluent Persian.
    `;

    // Use 'gemini-3-flash-preview' for basic text and search tasks.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Extract text directly via the .text property (not a method).
    let jsonString = response.text || "";
    // Clean up any markdown formatting if present to ensure valid JSON parsing.
    jsonString = jsonString.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();

    let parsedResponse;
    try {
        parsedResponse = JSON.parse(jsonString);
    } catch (e) {
        throw new Error("فرمت پاسخ مدل معتبر نیست (JSON). لطفا مجددا تلاش کنید.");
    }

    if (!parsedResponse || !Array.isArray(parsedResponse.items)) {
         throw new Error("ساختار پاسخ مدل معتبر نیست.");
    }

    return new Response(JSON.stringify(parsedResponse as LiteratureReviewResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in literature API route:", error);
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
