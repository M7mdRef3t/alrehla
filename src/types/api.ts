/**
 * API Types
 * أنواع الـ API
 */

// Generic API Response wrapper
export type ApiResponse<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: ApiError };

// API Error structure
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode?: number;
}

// Common API error codes
export const API_ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT"
} as const;

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}

// Sorting and filtering
export type SortDirection = "asc" | "desc";

export interface SortParams<T extends string = string> {
  field: T;
  direction: SortDirection;
}

export interface FilterParams {
  [key: string]: string | number | boolean | string[] | undefined;
}

// Common entity timestamps
export interface Timestamps {
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// API request metadata
export interface RequestMeta {
  requestId: string;
  timestamp: string;
  duration?: number;
  retryCount?: number;
}
