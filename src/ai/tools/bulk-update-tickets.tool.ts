import { z } from 'genkit';

export const bulkUpdateTicketsInputSchema = z.object({
  ids: z.array(z.string()),
  status: z.enum(['todo', 'in progress', 'done']),
});
export const bulkUpdateTicketsOutputSchema = z.object({
  success: z.boolean(),
});

export const BULK_UPDATE_TICKETS_TOOL_NAME = 'bulkUpdateTickets';
export const BULK_UPDATE_TICKETS_TOOL_DESCRIPTION =
  'Updates the status of multiple tickets at once by their IDs. Requires Admin role.';
