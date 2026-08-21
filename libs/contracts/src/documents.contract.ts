export const DOCUMENT_PATTERNS = {
  FIND_ALL: 'documents.findAll',
  FIND_BY_ID: 'documents.findById',
  UPLOAD: 'documents.upload',
  GENERATE: 'documents.generate',
  SIGN: 'documents.sign',
  GET_BY_TOKEN: 'documents.getByToken',
  SEARCH_CHUNKS: 'documents.searchChunks',
} as const;

export interface UploadDocumentCommand {
  title: string;
  filename: string;
  mimetype: string;
  size: number;
  bufferBase64: string;
  ownerId: string;
  externalEmail?: string;
}

export interface GenerateDocumentCommand {
  type: 'invoice' | 'contract' | 'report';
  title: string;
  ownerId: string;
  data: Record<string, unknown>;
}

export interface SignDocumentCommand {
  documentId: string;
  signerEmail: string;
  signatureBase64: string;
  token?: string;
}

export interface SearchChunksCommand {
  query: string;
  limit?: number;
}

export interface DocumentDto {
  id: string;
  title: string;
  filename: string;
  mimetype: string;
  size: number;
  url?: string;
  ownerId: string;
  signedUrl?: string;
  isSigned: boolean;
  signedAt?: string;
  externalToken?: string;
  externalEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunkDto {
  id: string;
  documentId: string;
  text: string;
  score?: number;
}
