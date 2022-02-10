import { isEmpty, isValidEmailFormat } from './utils';
import { INVALID_EMAIL_FORMAT_ERROR, MISSING_EMAIL_ERROR } from './error';

export function validateEmail(email: string): string | void {
  if (isEmpty(email)) {
    return MISSING_EMAIL_ERROR;
  }
  if (!isValidEmailFormat(email)) {
    return INVALID_EMAIL_FORMAT_ERROR;
  }

  return;
}
