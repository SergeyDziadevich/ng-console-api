import { z } from 'genkit';

export const SEARCH_DOCUMENTS_TOOL_NAME = 'searchDocuments';
export const SEARCH_DOCUMENTS_TOOL_DESCRIPTION =
  'Search the company knowledge base or uploaded documents for relevant information to answer questions about policies, manuals, or documents. Returns document snippets with their file names and IDs.';

export const searchDocumentsInputSchema = z.object({
  query: z.string().describe('The question or keywords to search for.'),
});

export const searchDocumentsOutputSchema = z.array(
  z.object({
    id: z.string().describe('The document ID'),
    filename: z.string().describe('The document filename'),
    snippet: z.string().describe('The relevant snippet from the document'),
    similarity: z.number().describe('Similarity score'),
  }),
);
