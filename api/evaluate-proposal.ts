
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

    // Build prompt content dynamically based on what is provided
    let sectionsToEvaluate = "";
    
    if (statement && statement.trim()) {
        sectionsToEvaluate += `\n1. **Statement of Problem (بیان مسئله):**\n"${statement}"\n`;
    }
    if (significance && significance.trim()) {
        sectionsToEvaluate += `\n2. **Significance of the Study (اهمیت و ضرورت):**\n"${significance}"\n`;
    }
    if (objectives && objectives.trim()) {
        sectionsToEvaluate += `\n3. **Objectives (اهداف تحقیق):**\n"${objectives}"\n`;
    }
    if (questions && questions.trim()) {
        sectionsToEvaluate += `\n4. **Research Questions/Hypotheses (سوالات و فرضیات):**\n"${questions}"\n`;
    }
    if (methodology && methodology.trim()) {
        sectionsToEvaluate += `\n5. **Methodology (روش‌شناسی - شامل روش، جامعه، ابزار و تحلیل):**\n"${methodology}"\n`;
    }

    // Check if at least one section is present
    if (!sectionsToEvaluate.trim()) {
      return new Response(JSON.stringify({ error: 'لطفاً حداقل یک بخش از پروپوزال را تکمیل کنید.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = `
      You are a strict and expert academic professor and thesis supervisor. Your task is to evaluate a research proposal. 
      The user may have provided only specific sections of their proposal.
      
      **CRITICAL INSTRUCTION:** 
      Evaluate **ONLY** the sections provided below. Do NOT penalize the user for missing sections (e.g., if they didn't provide "Significance", do not mention it as a weakness). Focus entirely on the quality, academic tone, and scientific validity of the text that *is* present.

      ## Provided Proposal Sections:
      ${sectionsToEvaluate}

      ## Task:
      1.  **Consistency Check (if applicable):** If multiple related sections are provided (e.g., Objectives and Questions), check if they align. If a dependency is missing, evaluate the section on its own merit.
      2.  **Scientific Validity:** Analyze the academic tone and feasibility of the provided text.
      3.  **Identify Weaknesses:** Find specific gaps or errors in the *provided* content.
      4.  **Suggest Improvements:** Provide concrete scientific solutions for the *provided* content.
      5.  **Score:** Assign a scientific score (1-100) based on the quality of the provided content.

      ## Output Format:
      The output MUST be in **Persian** and formatted as a single, valid JSON object:

      {
        "score": number, // 1 to 100
        "overallComment": "string", // A brief summary in Persian evaluating what was submitted.
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
