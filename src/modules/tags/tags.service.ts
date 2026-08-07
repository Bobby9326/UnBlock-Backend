import { tagsRepository } from './tags.repository.js';
import type { ListTagsQuery } from './tags.validation.js';

export const tagsService = {
  list({ search, limit }: ListTagsQuery) {
    return tagsRepository.listWithCounts({ search, limit });
  },
};
