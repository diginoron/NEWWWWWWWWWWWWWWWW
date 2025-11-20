export interface ThesisSuggestionResponse {
  keywords: string[];
  topics: string[];
}

export type AcademicLevel = 'arshad' | 'doctora';
export type ResearchMethod = 'quantitative' | 'qualitative' | 'mixed';

export interface ThesisSuggestionRequest {
  fieldOfStudy: string;
  keywords?: string;
  level?: AcademicLevel;
  methodology?: ResearchMethod;
  targetPopulation?: string;
}

export interface Article {
  title: string;
  authors: string[];
  publicationYear: number;
  summary: string;
  link: string;
}

export type ArticleResponse = Article[];

export interface Methodology {
  researchTypeAndDesign: string;
  populationAndSample: string;
  dataCollectionTools: string;
  dataAnalysisMethod: string;
  potentialSoftware: string;
}

export interface PreProposalResponse {
  introduction: string;
  mainObjective: string;
  specificObjectives: string[];
  mainQuestion: string;
  specificQuestions: string[];
  methodology: Methodology;
}

export interface PreProposalRequest {
    topic: string;
    level: AcademicLevel;
    methodology: ResearchMethod;
    targetPopulation?: string;
}

export interface SummaryResponse {
  title: string;
  introduction: string;
  researchMethod: string;
  dataCollectionMethod: string;
  statisticalPopulation: string;
  dataAnalysisMethod: string;
  results: string;
}

export interface EvaluationPoint {
  weakness: string;
  improvement: string;
}

export interface EvaluationResponse {
  score: number;
  points: EvaluationPoint[];
  overallComment: string;
}