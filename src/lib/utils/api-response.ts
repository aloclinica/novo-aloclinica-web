import { NextResponse } from 'next/server';
import { APIResponse } from '@/types/api.types';

/**
 * Success response wrapper
 */
export const success = <T>(
  data: T,
  status: number = 200,
  pagination?: {
    page: number;
    limit: number;
    total: number;
  },
) => {
  const response: APIResponse<T> = {
    success: true,
    data,
    ...(pagination && {
      pagination: {
        ...pagination,
        pages: Math.ceil(pagination.total / pagination.limit),
      },
    }),
  };

  return NextResponse.json(response, { status });
};

/**
 * Error response wrapper
 */
export const error = (
  message: string,
  status: number = 400,
  code?: string,
  details?: Record<string, any>,
) => {
  const response: APIResponse = {
    success: false,
    error: {
      message,
      ...(code && { code }),
      ...(details && { details }),
    },
  };

  return NextResponse.json(response, { status });
};

/**
 * Paginate array/query results
 */
export const paginate = <T>(
  items: T[],
  page: number = 1,
  limit: number = 20,
  total?: number,
) => {
  const validPage = Math.max(1, page);
  const validLimit = Math.min(Math.max(1, limit), 100); // max 100 per page
  const start = (validPage - 1) * validLimit;
  const end = start + validLimit;

  return {
    data: items.slice(start, end),
    pagination: {
      page: validPage,
      limit: validLimit,
      total: total ?? items.length,
      pages: Math.ceil((total ?? items.length) / validLimit),
    },
  };
};
