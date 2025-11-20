import OpenAI from "openai";
import type { EvaluationResponse } from '../types';

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
    const { content: proposalContent } = await request.json();

    if (!proposalContent || typeof proposalContent !== 'string' || proposalContent.trim().length < 100) {
      return new Response(JSON.stringify({ error: 'محتوای فایل برای ارزیابی بسیار کوتاه یا نامعتبر است.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = `
      You are a strict and expert academic professor and thesis supervisor. Your task is to evaluate the provided research proposal text critically.
      
      ## Task:
      1.  Analyze the text for scientific validity, coherence, methodology, and academic writing style.
      2.  Identify specific **Weaknesses** in the proposal.
      3.  Provide concrete **Improvements** for each weakness.
      4.  Assign an overall scientific **Score** from 1 to 100 based on the quality of the proposal.
      5.  Write a short **Overall Comment** summarizing your view.

      ## Proposal Text:
      """
      ${proposalContent}
      """

      ## Instructions:
      -   Be professional, academic, yet critical.
      -   The output MUST be in **Persian**.
      -   Provide at least 3 and at most 6 key points of evaluation.

      ## Output Format:
      Your entire output MUST be a single, valid JSON object with the following structure. Do not include any text outside the JSON.

      {
        "score": number, // 1 to 100
        "overallComment": "string", // A brief summary in Persian
        "points": [
          {
            "weakness": "string", // Describe the problem in Persian
            "improvement": "string" // Describe the solution in Persian
          }
        ]
      }
    `;

    const completion = await client.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const jsonText = completion.choices[0].message.content;
    if (!jsonText) {
      throw new Error("پاسخ دریافتی از API فاقد محتوای متنی است.");
    }
    
    const parsedResponse = JSON.parse(jsonText.trim());
    
    return new Response(JSON.stringify(parsedResponse as EvaluationResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in evaluate API route:", error);
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