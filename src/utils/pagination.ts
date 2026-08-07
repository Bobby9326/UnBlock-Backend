// Normalizes page/limit query params and builds Prisma skip/take + meta.

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export interface PaginationInput {
  page?: number | string;
  limit?: number | string;
}

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function parsePagination(query: PaginationInput = {}): Pagination {
  let page = parseInt(String(query.page), 10);
  let limit = parseInt(String(query.limit), 10);

  if (!Number.isFinite(page) || page < 1) page = DEFAULT_PAGE;
  if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  return { page, limit, skip: (page - 1) * limit, take: limit };
}

export function buildMeta({
  page,
  limit,
  total,
}: {
  page: number;
  limit: number;
  total: number;
}): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
