
export interface Impression {
  id: string;
  handle: string;
  vibe: string;
  imageUrl: string;
  timestamp: number;
  description: string;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface UserVibe {
  description: string;
  keywords: string[];
  visualPrompt: string;
}
