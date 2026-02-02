
export enum AppStage {
  QUESTION = 'QUESTION',
  ACCEPTED = 'ACCEPTED'
}

export interface LoveNote {
  poem: string;
  message: string;
  quote: string;
  quoteAuthor: string;
}
