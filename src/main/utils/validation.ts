import { isEmpty, isValidEmailFormat } from './utils';
import { INVALID_EMAIL_FORMAT_ERROR, MISSING_INPUT_ERROR } from './error';

export function validateInputPresent(input: string): string | void {
  if (isEmpty(input)) {
    return MISSING_INPUT_ERROR;
  }
  return;
}

export function validateEmail(email: string): string | void {
  if (!isValidEmailFormat(email)) {
    return INVALID_EMAIL_FORMAT_ERROR;
  }
  return;
}
