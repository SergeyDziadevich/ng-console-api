import 'dotenv/config';
import { googleAI } from '@genkit-ai/google-genai';
import { createMcpServer } from '@genkit-ai/mcp';
import { genkit, z } from 'genkit/beta';

/*
 * This is an example of how to use the MCP server with Genkit.
 */
const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
});

ai.defineTool(
  {
    name: 'calculateComplexityScore',
    description:
      'Calculates a proprietary complexity score for a given text string. Use this whenever a user asks for a complexity or audit score of a message.',
    inputSchema: z.object({ text: z.string() }),
    outputSchema: z.object({
      score: z.number(),
      level: z.string(),
    }),
  },
  ({ text }) => {
    console.error('Calculating complexity for:', text);
    const score = text.length * 1.5 + Math.random() * 10;
    return Promise.resolve({
      score: Math.round(score),
      level: score > 50 ? 'High' : 'Low',
    });
  },
);

ai.definePrompt(
  {
    name: 'happy',
    description: 'everybody together now',
    input: {
      schema: z.object({
        action: z.string().default('clap your hands').optional(),
      }),
    },
  },
  `If you're happy and you know it, {{action}}.`,
);

ai.defineResource(
  {
    name: 'my resouces',
    uri: 'my://resource',
  },
  () => {
    return Promise.resolve({
      content: [
        {
          text: 'my resource',
        },
      ],
    });
  },
);

ai.defineResource(
  {
    name: 'file',
    template: 'file://{path}',
  },
  ({ uri }) => {
    return Promise.resolve({
      content: [
        {
          text: `file contents for ${uri}`,
        },
      ],
    });
  },
);

const server = createMcpServer(ai, {
  name: 'example_server',
  version: '0.0.1',
});
// Start the server with stdio transport by default
void server.start();
