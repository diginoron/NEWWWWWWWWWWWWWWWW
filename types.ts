export interface ThesisSuggestionResponse {
  keywords: string[];
  topics: string[];
}

export interface Article {
  title: string;
  authors: string[];
  publicationYear: number;
  summary: string;
  link: string;
}

export type ArticleResponse = Article[];