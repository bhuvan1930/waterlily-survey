export type QuestionType = 'text' | 'number' | 'select';

export interface Question {
  id: string;
  title: string;
  description?: string;
  type: QuestionType;
  options?: string[];
}

export type Answers = Record<string, string>;
