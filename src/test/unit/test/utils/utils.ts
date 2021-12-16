import {hasProperty, isEmpty, isValidEmailFormat} from '../../../../main/utils/utils';

describe('utils', () => {
  describe('hasProperty', () => {
    const property = 'testProperty';
    test('Should return true if property present', async () => {
      const container = {'anotherProperty' : '1', 'testProperty': '2'};
      expect(hasProperty(container, property)).toBe(true);
    });

    test('Should return false if property missing', async () => {
      const container = {'anotherProperty' : '1', 'anotherProperty2': '2'};
      expect(hasProperty(container, property)).toBe(false);
    });

    test('Should return false if object is undefined', async () => {
      const container: any = undefined;
      expect(hasProperty(container, property)).toBe(false);
    });
  });

  describe('isEmpty', () => {
    test('Should return true if input is empty string', async () => {
      expect(isEmpty('')).toBe(true);
    });

    test('Should return true if input is undefined', async () => {
      const input: any = undefined;
      expect(isEmpty(input)).toBe(true);
    });

    test('Should return false if input has value', async () => {
      expect(isEmpty('123')).toBe(false);
    });
  });

  describe('isValidEmailFormat', () => {
    const parameters = [
      { email: 'test_123@test.com', isValid: true },
      { email: 'test-123@test.co.uk', isValid: true },
      { email: 'test.test@best-test.com', isValid: true },
      { email: 'test..test@test.com', isValid: false },
      { email: '.test@test.com', isValid: false },
      { email: 'test@test_com', isValid: false },
      { email: 'test@testcom', isValid: false },
      { email: 'test.com', isValid: false }
    ];

    parameters.forEach((parameter) => {
      it('Should return ' + parameter.isValid + ' for email \'' + parameter.email + '\'', async () => {
        expect(isValidEmailFormat(parameter.email)).toBe(parameter.isValid);
      });
    });
  });
});
