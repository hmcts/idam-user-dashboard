export interface ApiErrorDetail {
  path: string;
  code: string;
  message: string;
}

export interface ApiError {
  status: number;
  method: string;
  path: string;
  message: string;
  details?: ApiErrorDetail[];
}

/**
 * Type guard to check if an object is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const candidate = error as Partial<ApiError>;
  return (
    typeof candidate.status === 'number' &&
    typeof candidate.method === 'string' &&
    typeof candidate.path === 'string' &&
    typeof candidate.message === 'string'
  );
}
