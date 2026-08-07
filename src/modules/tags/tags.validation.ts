import { z } from 'zod';

export const listTagsSchema = {
  query: z.object({
    // Optional prefix/substring filter for autocomplete.
    search: z.string().trim().optional(),
    // Cap results (autocomplete dropdowns don't need everything).
    limit: z.coerce.number().int().min(1).max(200).default(50),
  }),
};

export type ListTagsQuery = z.infer<typeof listTagsSchema.query>;
