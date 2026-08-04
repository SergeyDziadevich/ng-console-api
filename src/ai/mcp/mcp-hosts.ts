import { createMcpHost } from '@genkit-ai/mcp';
import { join } from 'path';

const isProd = process.env.NODE_ENV === 'production';
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
        MDB_MCP_CONNECTION_STRING:
          process.env.MONGODB_URI || 'mongodb://localhost:27017/nest_mongodb',
      },
    },
  },
});

export const exampleMcpHost = createMcpHost({
  name: 'exampleHost',
  mcpServers: {
    example: {
      command: isProd ? 'node' : 'npx',
      args: isProd
        ? [join(process.cwd(), 'dist/ai/mcp/mcp-server.js')]
        : ['ts-node', join(process.cwd(), 'src/ai/mcp/mcp-server.ts')],
      env: { ...process.env } as Record<string, string>,
    },
  },
});
