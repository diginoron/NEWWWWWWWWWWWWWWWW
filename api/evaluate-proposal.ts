
import OpenAI from "openai";
import type { EvaluationResponse, ProposalContent } from '../types';

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
    const body: ProposalContent = await request.json();
    const { statement, significance, objectives, questions, methodology } = body;

    // Check if at least the statement and methodology are present
    if (!statement || !methodology || statement.trim().length < 10 || methodology.trim().length < 10) {
      return new Response(JSON.stringify({ error: 'لطفاً حداقل بخش‌های "بیان مسئله" و "روش‌شناسی" را تکمیل کنید.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = `
      You are a strict and expert academic professor and thesis supervisor. Your task is to evaluate a research proposal based on its specific sections provided below.
      
      ## Proposal Sections:
      
      1. **Statement of Problem (بیان مسئله):**
      "${statement}"

      2. **Significance of the Study (اهمیت و ضرورت):**
      "${significance}"

      3. **Objectives (اهداف تحقیق):**
      "${objectives}"

      4. **Research Questions/Hypotheses (سوالات و فرضیات):**
      "${questions}"

      5. **Methodology (روش‌شناسی - شامل روش، جامعه، ابزار و تحلیل):**
      "${methodology}"

      ## Task:
      1.  **Consistency Check:** Ensure the Objectives align with the Problem, and the Methodology is suitable for answering the Questions.
      2.  **Scientific Validity:** Analyze the academic tone and feasibility.
      3.  **Identify Weaknesses:** Find specific gaps or errors in these sections.
      4.  **Suggest Improvements:** Provide concrete scientific solutions.
      5.  **Score:** Assign a scientific score (1-100).

      ## Output Format:
      The output MUST be in **Persian** and formatted as a single, valid JSON object:

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
      
      Provide between 3 to 6 evaluation points.
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
