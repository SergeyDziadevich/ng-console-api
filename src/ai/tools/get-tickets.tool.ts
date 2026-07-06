import { z } from 'genkit';

export const getTicketsInputSchema = z.object({});
export const getTicketsOutputSchema = z.array(
  z.object({
    id: z.number(),
    title: z.string(),
    description: z.string(),
    status: z.string(),
    priority: z.string(),
  }),
);

export const GET_TICKETS_TOOL_NAME = 'getTickets';
export const GET_TICKETS_TOOL_DESCRIPTION =
  'Returns a list of all tickets from the database';
