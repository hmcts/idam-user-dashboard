interface ErrorCode {
  code: string;
}
export type ErrorType = ErrorCode & Error;
