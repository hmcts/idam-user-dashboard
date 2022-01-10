import { validateEmail } from '../../../../main/utils/validation';
import { INVALID_EMAIL_FORMAT_ERROR, MISSING_EMAIL_ERROR } from '../../../../main/utils/error';

describe('validation', () => {
  describe('validateEmail', () => {
    test('Should return empty string if email is valid', async () => {
      expect(validateEmail('test@test.com')).toBe('');
    });

    test('Should return error message if email is empty', async () => {
      expect(validateEmail('')).toBe(MISSING_EMAIL_ERROR);
    });

    test('Should return error message if email is in incorrect format', async () => {
      expect(validateEmail('test')).toBe(INVALID_EMAIL_FORMAT_ERROR);
    });
  });
});
