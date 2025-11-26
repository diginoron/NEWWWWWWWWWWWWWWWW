
import OpenAI from "openai";
import type { ChatResponse, ChatMessage } from '../types';

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
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'تاریخچه پیام‌ها الزامی است.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `
      You are a knowledgeable, experienced, and strict but helpful university professor acting as a thesis supervisor (استاد راهنما).
      Your goal is to guide students with their academic research, thesis topics, methodology, and writing.
      
      Instructions:
      1. Answer in **Persian (Farsi)**.
      2. Be formal, academic, and precise.
      3. Do not do the student's work for them (e.g., don't write the whole thesis), but provide guidance, examples, and corrections.
      4. If the user asks about something non-academic, politely steer the conversation back to research and thesis topics.
    `;

    const completion = await client.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
    });

    const responseContent = completion.choices[0].message.content;

    if (!responseContent) {
      throw new Error("پاسخ دریافتی از API نامعتبر است.");
    }

    return new Response(JSON.stringify({ response: responseContent } as ChatResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in chat-bot API route:", error);
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
