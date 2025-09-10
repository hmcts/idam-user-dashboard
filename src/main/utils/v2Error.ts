import { AxiosError } from 'axios';
import { ApiError, ApiErrorDetail } from '../interfaces/ApiError';
import logger from '../modules/logging';
import { PageError } from '../interfaces/PageData';

const ERROR_CODE_MESSAGES: Record<string, string> = {
  'user.username+NOT_UNIQUE': 'A user with this email address already exists',
};

const GENERIC_ERROR = 'Unable to save user';

export function mapApiErrorToPageError(apiError: ApiError, mainLocation: string): PageError {
  const pageError: PageError = {};

  if (!apiError) {
    pageError[mainLocation] = { message: GENERIC_ERROR };
    return pageError;
  }

  if (apiError.details && apiError.details.length > 0) {
    apiError.details.forEach((detail: ApiErrorDetail) => {
      const message = ERROR_CODE_MESSAGES[detail.path + '+' + detail.code] || detail.message || GENERIC_ERROR;
      pageError[mainLocation] = { message };
    });
  } else {
    pageError[mainLocation] = { message: apiError.message || GENERIC_ERROR };
  }

  return pageError;
}

/**
 * Normalizes different error types (Axios, generic Error, string) into ApiError.
 * Defaults status to 500 for unexpected errors (timeouts, network issues, etc.).
 */
export function handleApiError(error: unknown, fallbackMessage = 'Unknown error'): ApiError {
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;

    const status = axiosError.response?.status ?? 500;
    const method = axiosError.config?.method?.toUpperCase() ?? 'UNKNOWN';
    const path = axiosError.config?.url ?? 'UNKNOWN';
    const message =
      axiosError.response?.data?.message ||
      axiosError.message ||
      fallbackMessage;

    const details: ApiErrorDetail[] | undefined = axiosError.response?.data?.details;

    const apiError: ApiError = {
      status,
      method,
      path,
      message,
      details,
    };

    logger.error(
      `API error: ${status} ${method} ${path} - ${message}` +
      (details ? ` | details: ${JSON.stringify(details)}` : '')
    );

    return apiError;
  }

  // Fallback: generic error or string
  const apiError: ApiError = {
    status: 500,
    method: 'UNKNOWN',
    path: 'UNKNOWN',
    message: error instanceof Error ? error.message : String(error ?? fallbackMessage),
  };

  logger.error(`Non-Axios error: ${JSON.stringify(apiError)}`);
  return apiError;
}

/**
 * Type guard for AxiosError.
 */
function isAxiosError(error: any): error is AxiosError {
  return !!error?.isAxiosError;
}
