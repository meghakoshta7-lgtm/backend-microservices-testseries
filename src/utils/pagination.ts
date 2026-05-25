import { Query } from 'express-serve-static-core';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export const parsePagination = (query: Query, defaults = { page: 1, limit: 20 }): PaginationParams => {
  const page = parseInt(query.page as string) || defaults.page;
  const limit = parseInt(query.limit as string) || defaults.limit;
  return { page, limit, skip: (page - 1) * limit };
};

export const paginatedResponse = <T>(items: T[], total: number, page: number, limit: number): PaginatedResult<T> => {
  return {
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  };
};

export const totalPages = (total: number, limit: number): number => {
  return Math.ceil(total / limit);
};
