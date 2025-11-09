import type { ThesisSuggestionResponse, ArticleResponse } from '../types';

export async function generateThesisSuggestions(fieldOfStudy: string): Promise<ThesisSuggestionResponse> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fieldOfStudy }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'پاسخ خطا از سرور قابل خواندن نبود' }));
      throw new Error(errorData.error || `درخواست با کد وضعیت ${response.status} با شکست مواجه شد`);
    }

    const data: ThesisSuggestionResponse = await response.json();
    return data;
  } catch (error) {
    console.error("خطا در دریافت پیشنهادها:", error);
    throw new Error(
      error instanceof Error ? error.message : "یک خطای ناشناخته در شبکه رخ داد."
    );
  }
}

export async function findRelevantArticles(keywords: string): Promise<ArticleResponse> {
  try {
    const response = await fetch('/api/scholar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keywords }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'پاسخ خطا از سرور قابل خواندن نبود' }));
      throw new Error(errorData.error || `درخواست با کد وضعیت ${response.status} با شکست مواجه شد`);
    }

    const data: ArticleResponse = await response.json();
    return data;
  } catch (error) {
    console.error("خطا در یافتن مقالات:", error);
    throw new Error(
      error instanceof Error ? error.message : "یک خطای ناشناخته در شبکه رخ داد."
    );
  }
}