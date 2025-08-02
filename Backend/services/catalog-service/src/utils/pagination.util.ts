export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function createPaginationResult<T>(
  data: T[],
  totalCount: number,
  options: PaginationOptions,
): PaginationResult<T> {
  const { page, limit } = options;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function validatePaginationParams(page?: number, limit?: number): { page: number; limit: number } {
  const validPage = page && page > 0 ? page : 1;
  const validLimit = limit && limit > 0 && limit <= 100 ? limit : 20;

  return { page: validPage, limit: validLimit };
}