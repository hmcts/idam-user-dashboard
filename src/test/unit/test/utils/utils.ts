import {
  convertISODateTimeToUTCFormat,
  hasProperty,
  isArrayEmpty,
  isEmpty,
  isObjectEmpty,
  isValidEmailFormat,
  obfuscateEmail,
  possiblyEmail,
  sortRoles,
  isString,
  getObjectVariation,
  convertToArray,
  arrayContainsSubstring,
  findDifferentElements,
  computeTimeDifferenceInMinutes,
  constructOptionsStringFromArray, convertISODateTimeToUTCFormatTrimSeconds
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

  describe('isArrayEmpty', () => {
    test('Should return true if array is empty', async () => {
      const array: any[] = [];
      const results = isArrayEmpty(array);
      expect(results).toBe(true);
    });

    test('Should return false if array is not empty', async () => {
      const array = ['test'];
      const results = isArrayEmpty(array);
      expect(results).toBe(false);
    });

    test('Should return true if array is undefined', async () => {
      const array: any = undefined;
      const results = isArrayEmpty(array as any);
      expect(results).toBe(true);
    });
  });

  describe('isString', () => {
    test('Should return true if its a string', async () => {
      const results = isString('string');
      expect(results).toBe(true);
    });

    test('Should return false if its not a string', async () => {
      const results = isString(7);
      expect(results).toBe(false);
    });

    test('Should return false if string is undefined', async () => {
      const results = isString(undefined);
      expect(results).toBe(false);
    });
  });

  describe('getObjectVariation', () => {
    test('Should return empty arrays  if objects are same', async () => {
      const obj1 = { prop1: 'test', prop2: 'test2' };
      const obj2 = obj1;
      const results = getObjectVariation(obj1, obj2);

      expect(results).toStrictEqual({
        'added': [],
        'changed': [],
        'removed': []
      });
    });

    test('Should return empty arrays if objects are same (deep comparison)', async () => {
      const obj1 = { prop1: 'test', prop2: 'test2' };
      const obj2 = { prop1: 'test', prop2: 'test2' };

      const results = getObjectVariation(obj1, obj2);
      expect(results).toStrictEqual({
        'added': [],
        'changed': [],
        'removed': []
      });
    });

    test('Should return object with added array if properties are added', async () => {
      const obj1 = { prop1: 'test', prop2: 'test2' };
      const obj2 = { prop1: 'test', prop2: 'test2', prop3: 'test3' };

      const results = getObjectVariation(obj1, obj2);
      expect(results).toStrictEqual({
        'added': ['prop3'],
        'changed': [],
        'removed': []
      });
    });

    test('Should return object with removed array if properties are removed', async () => {
      const obj1 = { prop1: 'test', prop2: 'test2', prop3: 'test3' };
      const obj2 = { prop1: 'test', prop2: 'test2' };

      const results = getObjectVariation(obj1, obj2);
      expect(results).toStrictEqual({
        'added': [],
        'changed': [],
        'removed': ['prop3']
      });
    });

    test('Should return all changed properties', async () => {
      const obj1 = { prop1: 'test', prop2: 'test2', prop3: 'changed' };
      const obj2 = { prop1: 'test', prop2: 'test2', prop3: 'test3' };

      const results = getObjectVariation(obj1, obj2);
      expect(results).toStrictEqual({
        'added': [],
        'changed': ['prop3'],
        'removed': []
      });
    });

    test('Should return both removed and added properties', async () => {
      const obj1 = { prop1: 'test', prop2: 'test2', prop3: 'test3' };
      const obj2 = { prop1: 'test', prop2: 'changed', prop4: 'test4'};

      const results = getObjectVariation(obj1, obj2);
      expect(results).toStrictEqual({
        'added': ['prop4'],
        'changed': ['prop2'],
        'removed': ['prop3']
      });
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

    test('Should return valid date time without seconds', async () => {
      expect(convertISODateTimeToUTCFormatTrimSeconds('2022-01-17T16:58:28.762Z')).toBe('Mon, 17 Jan 2022 16:58 GMT');
    });

    test('Should not return date time with invalid input', async () => {
      expect(convertISODateTimeToUTCFormat('20220117')).toBe('');
    });
  });

  describe('computeTimeDifferenceInMinutes', () => {
    test('Should return time different in minutes', async () => {
      const date1 = new Date();
      const date2 = new Date(date1);
      date2.setMinutes(date2.getMinutes() - 5);
      expect(computeTimeDifferenceInMinutes(date1, date2)).toBe(5);
    });

    test('Should return time different in minutes for more than an hour difference', async () => {
      const date1 = new Date();
      const date2 = new Date(date1);
      date2.setHours(date2.getHours() - 1);
      date2.setMinutes(date2.getMinutes() - 2);
      date2.setSeconds(date2.getSeconds() - 50);
      expect(computeTimeDifferenceInMinutes(date1, date2)).toBe(63);
    });

    test('Should return no time difference for very short time difference', async () => {
      const date1 = new Date();
      const date2 = new Date(date1);
      date2.setSeconds(date2.getSeconds() - 5);
      expect(computeTimeDifferenceInMinutes(date1, date2)).toBe(0);
    });

    test('Should return negative time difference if comparing earlier date to later', async () => {
      const date1 = new Date();
      const date2 = new Date(date1);
      date2.setMinutes(date2.getMinutes() + 5);
      expect(computeTimeDifferenceInMinutes(date1, date2)).toBe(-5);
    });
  });

  describe('obfuscateEmail', () => {
    test('Should return obfuscated email', async () => {
      expect(obfuscateEmail('a@test.com')).toBe('*@test.com');
      expect(obfuscateEmail('abc@test.com')).toBe('a**@test.com');
      expect(obfuscateEmail('test@test.com')).toBe('te**@test.com');
      expect(obfuscateEmail('tests@test.com')).toBe('te***@test.com');
      expect(obfuscateEmail('testUser@test.com')).toBe('tes*****@test.com');
      expect(obfuscateEmail('allTestUsers@test.com')).toBe('all*********@test.com');
    });

    test('Should not return obfuscated text if not an email', async () => {
      expect(obfuscateEmail('anything')).toBe('anything');
    });
  });

  describe('possiblyEmail', () => {
    test('Should return true if input contains \'@\'', async () => {
      expect(possiblyEmail('test@test.com')).toBe(true);
    });

    test('Should return false if input does not contain \'@\'', async () => {
      expect(possiblyEmail('f5a15ced-0189-4b84-ab95-15c2a5fee728')).toBe(false);
    });
  });

  describe('convertToArray', () => {
    test('Should return the input value if already an array', async () => {
      const value = ['a', 'b', 'c'];
      expect(convertToArray(value)).toStrictEqual(value);
    });

    test('Should convert to array if input is string', async () => {
      expect(convertToArray('a')).toStrictEqual(['a']);
    });
  });

  describe('arrayContainsSubstring', () => {
    const array = ['test', 'testing', 'tested', 'My test'];

    test('Should return true if one of the array items contains the substring', async () => {
      expect(arrayContainsSubstring(array, 'testin')).toBeTruthy();
    });

    test('Should return true if multiple array items contain the substring', async () => {
      expect(arrayContainsSubstring(array, 'test')).toBeTruthy();
    });

    test('Should return false if none of the array items contains the substring', async () => {
      expect(arrayContainsSubstring(array, 'a new string')).toBeFalsy();
    });
  });

  describe('findDifferentElements', () => {
    test('Should return new added elements only', async () => {
      expect(findDifferentElements(['a', 'c', 'd'], ['a', 'b', 'd'])).toStrictEqual(['c']);
    });

    test('Should return all new elements if all elements are new', async () => {
      expect(findDifferentElements(['d', 'e'], ['a', 'b', 'c'])).toStrictEqual(['d', 'e']);
    });

    test('Should return nothing if no existing elements added', async () => {
      expect(findDifferentElements(['a', 'b'], ['a', 'b', 'd'])).toStrictEqual([]);
    });

    test('Should return removed elements only', async () => {
      expect(findDifferentElements(['a', 'b', 'd'], ['a', 'c', 'd'])).toStrictEqual(['b']);
    });

    test('Should return all existing elements if all new elements are different', async () => {
      expect(findDifferentElements(['a', 'b', 'c'], ['d', 'e'])).toStrictEqual(['a', 'b', 'c']);
    });

    test('Should return nothing if no existing elements removed', async () => {
      expect(findDifferentElements(['a', 'b', 'd'], ['a', 'b', 'c', 'd'])).toStrictEqual([]);
    });
  });

  describe('composeOptionsStringFromArray', () => {
    test('Should return options string from a single option array', async () => {
      expect(constructOptionsStringFromArray(['option1'])).toStrictEqual('option1');
    });

    test('Should return options string from 2 options', async () => {
      expect(constructOptionsStringFromArray(['option1', 'option2'])).toStrictEqual('option1 or option2');
    });

    test('Should return options string from multiple options', async () => {
      expect(constructOptionsStringFromArray(['option1', 'option2', 'option3', 'option4'])).toStrictEqual('option1, option2, option3 or option4');
    });
  });
});
