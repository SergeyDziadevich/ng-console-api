import { z } from 'genkit';

export const getPostsInputSchema = z.object({});
export const getPostsOutputSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    contents: z.string(),
  }),
);

export const GET_POSTS_TOOL_NAME = 'getPosts';
export const GET_POSTS_TOOL_DESCRIPTION =
  'Returns a list of all posts from the database';
