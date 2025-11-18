import OpenAI from "openai";
import type { SummaryResponse } from '../types';

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
    const { content: articleContent } = await request.json();

    if (!articleContent || typeof articleContent !== 'string' || articleContent.trim().length < 100) {
      return new Response(JSON.stringify({ error: 'محتوای مقاله برای خلاصه‌سازی بسیار کوتاه یا نامعتبر است.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = `
      You are an expert academic researcher. Your task is to analyze the provided text of an academic article and generate a structured summary in Persian. The total summary should be around 500 words.

      ## Article Text:
      """
      ${articleContent}
      """

      ## Instructions:
      Read the article text carefully and extract the following information. Present your findings in Persian.

      1.  **title:** Identify the article's title.
      2.  **introduction:** Provide a concise summary of its introduction, outlining the research problem and its significance.
      3.  **researchMethod:** Describe the overall research methodology used (e.g., quantitative, qualitative, mixed, experimental, correlational).
      4.  **dataCollectionMethod:** Explain how the data was collected (e.g., surveys, interviews, experiments, observation).
      5.  **statisticalPopulation:** Describe the target population and the sample used in the study.
      6.  **dataAnalysisMethod:** Detail the methods used to analyze the data (e.g., statistical tests like t-test, regression, or qualitative methods like thematic analysis).
      7.  **results:** Summarize the main findings and conclusions of the article.

      Your entire output MUST be a single, valid JSON object with the following keys. Do not include any text, explanations, or markdown formatting outside of the JSON object.

      {
        "title": "string",
        "introduction": "string",
        "researchMethod": "string",
        "dataCollectionMethod": "string",
        "statisticalPopulation": "string",
        "dataAnalysisMethod": "string",
        "results": "string"
      }
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
    
    return new Response(JSON.stringify(parsedResponse as SummaryResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in summarize API route:", error);

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