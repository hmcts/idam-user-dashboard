import {isEmpty, isValidEmailFormat} from './utils';
import {invalidEmailFormat, missingEmail} from './error';

export function validateEmail(email: string): string {
  if (isEmpty(email)) {
    return missingEmail;
  }
  if (!isValidEmailFormat(email)) {
    return invalidEmailFormat;
  }
  return '';
}
