import type { ThesisSuggestionResponse, ArticleResponse, ThesisSuggestionRequest, PreProposalResponse, PreProposalRequest } from '../types';

export async function generateThesisSuggestions(params: ThesisSuggestionRequest): Promise<ThesisSuggestionResponse> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
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

export async function translateText(text: string): Promise<string> {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'پاسخ خطا از سرور قابل خواندن نبود' }));
      throw new Error(errorData.error || `درخواست با کد وضعیت ${response.status} با شکست مواجه شد`);
    }

    const data: { translation: string } = await response.json();
    return data.translation;
  } catch (error) {
    console.error("خطا در ترجمه:", error);
    throw new Error(
      error instanceof Error ? error.message : "یک خطای ناشناخته در شبکه رخ داد."
    );
  }
}


export async function generatePreProposal(params: PreProposalRequest): Promise<PreProposalResponse> {
  try {
    const response = await fetch('/api/pre-proposal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'پاسخ خطا از سرور قابل خواندن نبود' }));
      throw new Error(errorData.error || `درخواست با کد وضعیت ${response.status} با شکست مواجه شد`);
    }

    const data: PreProposalResponse = await response.json();
    return data;
  } catch (error) {
    console.error("خطا در ایجاد پیش پروپوزال:", error);
    throw new Error(
      error instanceof Error ? error.message : "یک خطای ناشناخته در شبکه رخ داد."
    );
  }
}
