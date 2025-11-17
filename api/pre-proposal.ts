import OpenAI from "openai";
import type { PreProposalResponse } from '../types';

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
    const { topic }: { topic: string } = await request.json();

    if (!topic || typeof topic !== 'string' || topic.trim() === '') {
      return new Response(JSON.stringify({ error: 'موضوع پایان‌نامه یک مقدار الزامی است.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = `
      You are an expert academic advisor. Based on the following thesis topic, generate a pre-proposal in Persian.
      Thesis Topic: "${topic}"

      Follow these instructions precisely:
      1.  **Introduction (introduction):** Write a 250-word academic introduction in Persian. Do not use any subheadings. Start with general concepts, then narrow down to the specific challenges and problems related to the topic.
      2.  **Objectives (mainObjective, specificObjectives):**
          -   Generate one main objective (mainObjective) in Persian.
          -   Generate four specific objectives (specificObjectives) in Persian that derive from the main objective.
      3.  **Research Questions (mainQuestion, specificQuestions):**
          -   Generate one main question (mainQuestion) in Persian that directly corresponds to the main objective.
          -   Generate four specific questions (specificQuestions) in Persian that directly correspond to the four specific objectives. The mapping must be exact.
      4.  **Methodology (methodology):** Based on the research questions, describe the following in Persian:
          -   researchTypeAndDesign: The type and design of the research.
          -   populationAndSample: The target population and sampling method.
          -   dataCollectionTools: The tools for data collection (e.g., questionnaires, interviews).
          -   dataAnalysisMethod: The methods for data analysis (e.g., SPSS, regression, thematic analysis).
          -   potentialSoftware: Potential software to be used.

      Your output must be **only** a valid JSON object with the following structure. Do not include any text, explanations, intros, conclusions, or Markdown formatting like \`\`\`json. Only the raw JSON object.

      {
        "introduction": "string",
        "mainObjective": "string",
        "specificObjectives": ["string", "string", "string", "string"],
        "mainQuestion": "string",
        "specificQuestions": ["string", "string", "string", "string"],
        "methodology": {
          "researchTypeAndDesign": "string",
          "populationAndSample": "string",
          "dataCollectionTools": "string",
          "dataAnalysisMethod": "string",
          "potentialSoftware": "string"
        }
      }
    `;

    const completion = await client.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      top_p: 1.0,
    });

    const jsonText = completion.choices[0].message.content;
    if (!jsonText) {
      throw new Error("پاسخ دریافتی از API فاقد محتوای متنی است یا به دلیل خط‌مشی‌های ایمنی مسدود شده است.");
    }

    const parsedResponse = JSON.parse(jsonText.trim());
    
    return new Response(JSON.stringify(parsedResponse as PreProposalResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in pre-proposal API route:", error);

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