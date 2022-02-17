import { validateEmail, validateInputPresent } from '../../../../main/utils/validation';
import { INVALID_EMAIL_FORMAT_ERROR, MISSING_INPUT_ERROR } from '../../../../main/utils/error';

describe('validation', () => {
  describe('validateInputPresent', () => {
    test('Should return undefined if input present', async () => {
      expect(validateInputPresent('test@test.com')).toBe(undefined);
    });

    test('Should return error message if input is empty', async () => {
      expect(validateInputPresent('')).toBe(MISSING_INPUT_ERROR);
    });
  });

  describe('validateEmail', () => {
    test('Should return undefined if email is valid', async () => {
      expect(validateEmail('test@test.com')).toBe(undefined);
    });

    test('Should return error message if email is in incorrect format', async () => {
      expect(validateEmail('test')).toBe(INVALID_EMAIL_FORMAT_ERROR);
    });
  });
});
