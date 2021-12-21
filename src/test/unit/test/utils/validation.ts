import {validateEmail} from '../../../../main/utils/validation';
import {invalidEmailFormat, missingEmail} from '../../../../main/utils/error';

describe('validation', () => {
  describe('validateEmail', () => {
    test('Should return empty string if email is valid', async () => {
      expect(validateEmail('test@test.com')).toBe('');
    });

    test('Should return error message if email is empty', async () => {
      expect(validateEmail('')).toBe(missingEmail);
    });

    test('Should return error message if email is in incorrect format', async () => {
      expect(validateEmail('test')).toBe(invalidEmailFormat);
    });
  });
});
