import { createMcpHost } from '@genkit-ai/mcp';
import { join } from 'path';

export const docsDir = join(process.cwd(), 'src/docs');

// Filesystem-only MCP host — schemas are well-formed, safe to pass to Gemini as-is.
export const fsMcpHost = createMcpHost({
  name: 'fsHost',
  mcpServers: {
    fs: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', docsDir],
    },
  },
  roots: [{ uri: `file://${docsDir}`, name: 'docs' }],
});

// MongoDB MCP host — kept separate because the server emits array parameters
// without `items`, which the Gemini API rejects. Tools are sanitized via
// sanitizeToolSchemas() before being passed to ai.generate().
export const mongoMcpHost = createMcpHost({
  name: 'mongoHost',
  mcpServers: {
    MongoDB: {
      command: 'npx',
      args: ['-y', 'mongodb-mcp-server@latest', '--readOnly'],
      env: {
        MDB_MCP_CONNECTION_STRING: 'mongodb://localhost:27017/nest_mongodb',
      },
    },
  },
});

export const exampleMcpHost = createMcpHost({
  name: 'exampleHost',
  mcpServers: {
    example: {
      // Use npx ts-node to run the TypeScript file directly
      command: 'npx',
      args: ['ts-node', join(process.cwd(), 'src/ai/mcp/mcp-server.ts')],
      env: {
        GOOGLE_GENAI_API_KEY: process.env.GOOGLE_GENAI_API_KEY!,
      },
    },
  },
});
