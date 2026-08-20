export const AI_PATTERNS = {
  GENERATE: 'ai.generate',
  FILES_ANALYTICS: 'ai.filesAnalytics',
} as const;

export interface AiGenerateCommand {
  prompt: string;
  userId: string;
  history?: Array<{ role: string; content: string }>;
  context?: Record<string, unknown>;
}

export interface AiGenerateResponseDto {
  response: string;
  toolsUsed?: string[];
}

export interface FilesAnalyticsCommand {
  userId: string;
}

export interface FilesAnalyticsResponseDto {
  totalFiles: number;
  totalStorageBytes: number;
  signedDocuments: number;
  fileTypes: Record<string, number>;
}
