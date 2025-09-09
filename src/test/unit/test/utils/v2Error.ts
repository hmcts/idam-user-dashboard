// src/test/unit/utils/v2Error.test.ts
import { ApiError } from '../../../../main/interfaces/ApiError';
import { PageError } from '../../../../main/interfaces/PageData';
import { handleApiError, mapApiErrorToPageError } from '../../../../main/utils/v2Error';
import { AxiosError } from 'axios';

describe('handleApiError', () => {
  it('should return a default 500 ApiError for a generic error', () => {
    const genericError = new Error('Something went wrong');
    const apiError = handleApiError(genericError);

    expect(apiError.status).toBe(500);
    expect(apiError.message).toBe('Something went wrong');
    expect(apiError.details).toBeUndefined();
  });

  it('should return ApiError from axios error with response data', () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 409,
        statusText: 'Conflict',
        headers: {},
        config: {},
        data: {
          message: 'USERNAME_ALREADY_EXISTS',
          details: [
            { path: 'user.username', code: 'NOT_UNIQUE', message: 'USERNAME_ALREADY_EXISTS' }
          ]
        },
        // top-level path/method
        request: {},
      },
      config: { url: '/api/v2/users/123', method: 'PUT' }
    } as unknown as AxiosError;

    const apiError: ApiError = handleApiError(axiosError);

    expect(apiError.status).toBe(409);
    expect(apiError.message).toBe('USERNAME_ALREADY_EXISTS');
    expect(apiError.path).toBe('/api/v2/users/123');
    expect(apiError.method).toBe('PUT'); 
    expect(apiError.details).toHaveLength(1);
    expect(apiError.details?.[0].path).toBe('user.username');
  });

  it('should return a 500 ApiError if axios error has no response', () => {
    const axiosError: Partial<AxiosError> = { isAxiosError: true };
    const apiError = handleApiError(axiosError);

    expect(apiError.status).toBe(500);
    expect(apiError.message).toBe('Unknown error');
    expect(apiError.details).toBeUndefined();
  });

  it('should use fallback message if Axios response has no message', () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: {},
        data: {} // no message
      },
      config: { url: '/api/v2/users/123', method: 'GET' }
    } as unknown as AxiosError;

    const fallback = 'Something went wrong';
    const apiError: ApiError = handleApiError(axiosError, fallback);

    expect(apiError.status).toBe(500);
    expect(apiError.message).toBe(fallback);
    expect(apiError.path).toBe('/api/v2/users/123');
    expect(apiError.method).toBe('GET');
    expect(apiError.details).toBeUndefined();
  });

  it('should handle Axios error with no response (network/timeout)', () => {
    const axiosError = {
      isAxiosError: true,
      message: 'Network Error',
      config: { url: '/api/v2/users/456', method: 'POST' }
    } as unknown as AxiosError;

    const fallback = 'Network fallback';
    const apiError: ApiError = handleApiError(axiosError, fallback);

    expect(apiError.status).toBe(500);
    expect(apiError.message).toBe(axiosError.message);
    expect(apiError.path).toBe('/api/v2/users/456');
    expect(apiError.method).toBe('POST');
    expect(apiError.details).toBeUndefined();
  });

  it('should handle non-Axios errors and use fallback message', () => {
    const error = new Error('Something bad happened');
    const fallback = 'Generic fallback';
    const apiError: ApiError = handleApiError(error, fallback);

    expect(apiError.status).toBe(500);
    expect(apiError.message).toBe(error.message);
    expect(apiError.path).toBe('UNKNOWN');
    expect(apiError.method).toBe('UNKNOWN');
    expect(apiError.details).toBeUndefined();
  });
  
});

describe('mapApiErrorToPageError', () => {
  const mainLocation = 'userEditForm';

  it('should return generic error if apiError is undefined', () => {
    const result: PageError = mapApiErrorToPageError(undefined as unknown as ApiError, mainLocation);
    expect(result).toEqual({
      [mainLocation]: { message: 'Unable to save user' }
    });
  });

  it('should map a single ApiErrorDetail using the ERROR_CODE_MESSAGES map', () => {
    const apiError: ApiError = {
      status: 409,
      message: 'Conflict',
      path: '/api/v2/users/123',
      method: 'PUT',
      details: [
        {
          code: 'NOT_UNIQUE',
          path: 'user.username',
          message: 'USERNAME_ALREADY_EXISTS'
        }
      ]
    };

    const result: PageError = mapApiErrorToPageError(apiError, mainLocation);

    expect(result).toEqual({
      [mainLocation]: { message: 'A user with this email already exists' }
    });
  });

  it('should use detail message if code is not in ERROR_CODE_MESSAGES', () => {
    const apiError: ApiError = {
      status: 400,
      message: 'Bad Request',
      path: '/api/v2/users/123',
      method: 'PUT',
      details: [
        {
          code: 'SOME_UNKNOWN_CODE',
          path: 'user.email',
          message: 'Email is invalid'
        }
      ]
    };

    const result: PageError = mapApiErrorToPageError(apiError, mainLocation);

    expect(result).toEqual({
      [mainLocation]: { message: 'Email is invalid' }
    });
  });

  it('should fallback to GENERIC_ERROR if detail has no code or message', () => {
    const apiError: ApiError = {
      status: 400,
      message: 'Bad Request',
      path: '/api/v2/users/123',
      method: 'PUT',
      details: [
        { code: '', path: 'user.username', message: '' }
      ]
    };

    const result: PageError = mapApiErrorToPageError(apiError, mainLocation);

    expect(result).toEqual({
      [mainLocation]: { message: 'Unable to save user' }
    });
  });

  it('should fallback to apiError.message if no details are present', () => {
    const apiError: ApiError = {
      status: 500,
      message: 'Internal Server Error',
      path: '/api/v2/users/123',
      method: 'PUT',
      details: []
    };

    const result: PageError = mapApiErrorToPageError(apiError, mainLocation);

    expect(result).toEqual({
      [mainLocation]: { message: 'Internal Server Error' }
    });
  });
});