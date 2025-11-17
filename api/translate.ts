import OpenAI from "openai";

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
    const { text } = await request.json();

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return new Response(JSON.stringify({ error: 'متن برای ترجمه الزامی است.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = `
      Translate the following academic thesis topic from Persian to English.
      Return ONLY the translated English text. Do not add any extra text, explanation, labels, or quotation marks.
      Persian Text: "${text}"
    `;

    const completion = await client.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const translation = completion.choices[0].message.content?.trim();
    if (!translation) {
      throw new Error("ترجمه با شکست مواجه شد.");
    }

    return new Response(JSON.stringify({ translation }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in translate API route:", error);
    let errorMessage = "یک خطای ناشناخته در سرور رخ داد.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
