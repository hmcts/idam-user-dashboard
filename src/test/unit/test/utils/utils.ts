import {
  convertISODateTimeToUTCFormat,
  hasProperty,
  isEmpty, isObjectEmpty,
  isValidEmailFormat,
  obfuscateEmail,
  sortRoles
} from '../../../../main/utils/utils';

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

  describe('isObjectEmpty', () => {
    test('Should return true if object is empty', async () => {
      const object = {};
      const results = isObjectEmpty(object);
      expect(results).toBe(true);
    });
    test('Should return false if object is not empty', async () => {
      const object = { test: 'test' };
      const results = isObjectEmpty(object);
      expect(results).toBe(false);
    });
  });

  describe('sortRoles', () => {
    test('Should sort IDAM super user role first', async () => {
      const roles = ['Other User', 'IDAM_SUPER_USER', 'Other User 2'];
      sortRoles(roles);
      expect(roles[0]).toBe('IDAM_SUPER_USER');
    });

    test('Should sort IDAM admin user role first', async () => {
      const roles = ['Other User', 'Other User 2', 'IDAM_ADMIN_USER'];
      sortRoles(roles);
      expect(roles[0]).toBe('IDAM_ADMIN_USER');
    });

    test('Should sort IDAM system owner role first', async () => {
      const roles = ['Other User', 'Other User 2', 'IDAM_SYSTEM_OWNER'];
      sortRoles(roles);
      expect(roles[0]).toBe('IDAM_SYSTEM_OWNER');
    });

    test('Should sort all other roles alphabetically', async () => {
      const roles = ['C', 'A', 'IDAM_SUPER_USER', 'B'];
      sortRoles(roles);
      expect(roles[0]).toBe('IDAM_SUPER_USER');
      expect(roles[1]).toBe('A');
      expect(roles[2]).toBe('B');
      expect(roles[3]).toBe('C');
    });
  });

  describe('convertISODateTimeToUTCFormat', () => {
    test('Should return valid date time', async () => {
      expect(convertISODateTimeToUTCFormat('2022-01-17T16:58:28.762Z')).toBe('Mon, 17 Jan 2022 16:58:28 GMT');
    });

    test('Should not return date time with invalid input', async () => {
      expect(convertISODateTimeToUTCFormat('20220117')).toBe('');
    });
  });

  describe('obfuscateEmail', () => {
    test('Should return obfuscated email', async () => {
      expect(obfuscateEmail('testUser@test.com')).toBe('tes*****@test.com');
      expect(obfuscateEmail('allTestUsers@test.com')).toBe('all*********@test.com');
    });

    test('Should not return obfuscated text if not an email', async () => {
      expect(obfuscateEmail('anything')).toBe('anything');
    });
  });
});
