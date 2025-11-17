import OpenAI from "openai";
import type { PreProposalResponse, PreProposalRequest } from '../types';

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
    const { topic, level, methodology, targetPopulation }: PreProposalRequest = await request.json();

    if (!topic || typeof topic !== 'string' || topic.trim() === '') {
      return new Response(JSON.stringify({ error: 'موضوع پایان‌نامه یک مقدار الزامی است.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const levelText = level === 'arshad' ? 'کارشناسی ارشد' : 'دکتری';
    const methodTextMapping = {
        quantitative: 'کمی',
        qualitative: 'کیفی',
        mixed: 'ترکیبی'
    };
    const methodText = methodTextMapping[methodology];


    const prompt = `
      You are an expert academic advisor. Based on the following thesis details, generate a comprehensive pre-proposal in Persian.

      ## Thesis Details:
      - Topic: "${topic}"
      - Academic Level: "${levelText}"
      - Desired Research Method: "${methodText}"
      ${targetPopulation ? `- Target Population: "${targetPopulation}"` : ''}

      ## Instructions:
      Follow these instructions precisely to generate the content. Your entire output must be a single, valid JSON object.

      1.  **Introduction (introduction):** Write a 250-word academic introduction in Persian. Do not use any subheadings. Start with general concepts, then narrow down to the specific challenges and problems related to the topic.

      2.  **Objectives & Questions:**
          -   Generate one main objective (mainObjective) and four specific objectives (specificObjectives).
          -   Generate one main question (mainQuestion) and four specific questions (specificQuestions) that directly correspond to the objectives.
          -   **Crucially, the nature of these must align with the academic level.** For a **PhD (${levelText})**, they should be more exploratory, theoretical, and aim for model development or theory extension. For a **Master's (${levelText})**, they should be more focused on applying existing theories or examining relationships between variables.

      3.  **Methodology (methodology):** This section must be highly tailored to the provided details.
          -   **researchTypeAndDesign:** Must strictly reflect the chosen "${methodText}" method. Be specific (e.g., "تحقیق حاضر از نظر هدف، کاربردی و از نظر ماهیت و روش، توصیفی-همبستگی است.").
          -   **populationAndSample:** Must explicitly mention the target population. If "${targetPopulation}" is provided, use it. If not, suggest a relevant one for the topic. Describe a suitable sampling method (e.g., نمونه‌گیری تصادفی ساده، نمونه‌گیری هدفمند).
          -   **dataCollectionTools:** Suggest tools appropriate for the "${methodText}" method (e.g., پرسشنامه استاندارد for quantitative, مصاحبه نیمه‌ساختاریافته for qualitative).
          -   **dataAnalysisMethod:** Suggest analysis methods appropriate for the "${methodText}" method (e.g., رگرسیون چندمتغیره با نرم‌افزار SPSS for quantitative, تحلیل تماتیک با نرم‌افزار MAXQDA for qualitative).
          -   **potentialSoftware:** Suggest relevant software based on the analysis method.

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