/**
 * Shared — API Response Types
 * 
 * توحيد شكل كل API response في المشروع.
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * إنشاء response ناجح
 */
export function apiSuccess<T>(data: T, meta?: ApiResponse["meta"]): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: meta ?? { timestamp: new Date().toISOString() },
  };
}

/**
 * إنشاء response خطأ
 */
export function apiError(
  code: string,
  message: string,
  details?: unknown
): ApiResponse<never> {
  return {
    success: false,
    error: { code, message, details },
    meta: { timestamp: new Date().toISOString() },
  };
}

/**
 * تحويل ApiResponse لـ NextResponse
 */
export function toNextResponse<T>(
  response: ApiResponse<T>,
  status?: number
): Response {
  const httpStatus = status ?? (response.success ? 200 : 400);
  return new Response(JSON.stringify(response), {
    status: httpStatus,
    headers: { "Content-Type": "application/json" },
  });
}
