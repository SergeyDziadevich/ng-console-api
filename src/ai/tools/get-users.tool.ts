import { z } from 'genkit';

export const getUsersInputSchema = z.object({});
export const getUsersOutputSchema = z.array(
  z.object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
    role: z.string(),
    displayName: z.string().optional(),
    avatarUrl: z.string().optional(),
  }),
);

export const GET_USERS_TOOL_NAME = 'getUsers';
export const GET_USERS_TOOL_DESCRIPTION =
  'Returns a list of all users from the database';
