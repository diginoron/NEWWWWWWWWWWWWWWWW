
import type { ThesisSuggestionResponse, ArticleResponse, ThesisSuggestionRequest, PreProposalResponse, PreProposalRequest, SummaryResponse, EvaluationResponse, ProposalContent, GeneralTranslateRequest, GeneralTranslateResponse, ChatMessage, ChatResponse, LiteratureReviewRequest, LiteratureReviewResponse } from '../types';

async function handleResponseError(response: Response): Promise<string> {
    let errorMsg = `درخواست با کد وضعیت ${response.status} با شکست مواجه شد`;
    try {
        const errorText = await response.text();
        try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.error) return errorJson.error;
        } catch {
            if (errorText.length < 500) {
                errorMsg += `: ${errorText}`;
            } else {
                errorMsg += '. (پاسخ سرور فرمت نامعتبر دارد)';
            }
        }
    } catch (e) {
        // response.text() failed
    }
    return errorMsg;
}

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
      const errorMessage = await handleResponseError(response);
      throw new Error(errorMessage);
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
      const errorMessage = await handleResponseError(response);
      throw new Error(errorMessage);
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
      const errorMessage = await handleResponseError(response);
      throw new Error(errorMessage);
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
      const errorMessage = await handleResponseError(response);
      throw new Error(errorMessage);
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

export async function summarizeArticle(content: string): Promise<SummaryResponse> {
  try {
    const response = await fetch('/api/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const errorMessage = await handleResponseError(response);
      throw new Error(errorMessage);
    }
    
    const data: SummaryResponse = await response.json();
    return data;
  } catch (error) {
    console.error("خطا در خلاصه‌سازی مقاله:", error);
    throw new Error(
      error instanceof Error ? error.message : "یک خطای ناشناخته در شبکه رخ داد."
    );
  }
}

export async function evaluateProposal(data: ProposalContent): Promise<EvaluationResponse> {
  try {
    const response = await fetch('/api/evaluate-proposal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorMessage = await handleResponseError(response);
      throw new Error(errorMessage);
    }
    
    const responseData: EvaluationResponse = await response.json();
    return responseData;
  } catch (error) {
    console.error("خطا در ارزیابی پروپوزال:", error);
    throw new Error(
      error instanceof Error ? error.message : "یک خطای ناشناخته در شبکه رخ داد."
    );
  }
}

export async function translateGeneralText(params: GeneralTranslateRequest): Promise<GeneralTranslateResponse> {
    try {
        const response = await fetch('/api/general-translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            const errorMessage = await handleResponseError(response);
            throw new Error(errorMessage);
        }

        const data: GeneralTranslateResponse = await response.json();
        return data;
    } catch (error) {
        console.error("خطا در ترجمه متن:", error);
        throw new Error(
            error instanceof Error ? error.message : "یک خطای ناشناخته در شبکه رخ داد."
        );
    }
}

export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
    try {
        const response = await fetch('/api/chat-bot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages }),
        });

        if (!response.ok) {
            const errorMessage = await handleResponseError(response);
            throw new Error(errorMessage);
        }

        const data: ChatResponse = await response.json();
        return data.response;
    } catch (error) {
        console.error("خطا در دریافت پاسخ چت:", error);
        throw new Error(
            error instanceof Error ? error.message : "یک خطای ناشناخته در شبکه رخ داد."
        );
    }
}

export async function generateLiteratureReview(keywords: string): Promise<LiteratureReviewResponse> {
    try {
        const response = await fetch('/api/literature', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ keywords }),
        });

        if (!response.ok) {
            const errorMessage = await handleResponseError(response);
            throw new Error(errorMessage);
        }

        const data: LiteratureReviewResponse = await response.json();
        return data;
    } catch (error) {
        console.error("خطا در تولید پیشینه پژوهش:", error);
        throw new Error(
            error instanceof Error ? error.message : "یک خطای ناشناخته در شبکه رخ داد."
        );
    }
}