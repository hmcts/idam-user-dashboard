export class HTTPError extends Error {
  status: number;

  constructor(status: number, message?: string) {
    super(message);
    this.name = 'HTTPError';
    this.status = status;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HTTPError);
    }
  }
}
