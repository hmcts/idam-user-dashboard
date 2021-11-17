import {isObjectEmpty, validateUrlFormat} from '../../../main/utils/utils';

describe('Utils', () => {
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

  describe('URL validation', () => {
    const validUrlParameters = [
      { url: 'http://test.com' }, // http protocol
      { url: 'https://www.Mysite.com' }, // https protocol
      { url: 'www.test.com' }, // Domain name only with no protocol
      { url: 'www.my-test.com' }, // Domain name including a hyphen
      { url: 'test123.uk' }, // Alphanumeric domain name
      { url: 'www.test.com:8080' }, // With port
      { url: 'http://uk.testing.com?q=testing' }, // With a query parameter
      { url: 'http://employeeInfo.com?name=peter&id=D%20123' }, // With multiple query parameters
      { url: 'www.gov.uk/tax-tribunal' }, // valid gok uk site
      { url: 'gov.uk/tax-tribunal' }, // gov uk site without 'www'
      { url: 'https://www.gov.uk/government/collections/female-genital-mutilation' } // multiple levels of path
    ];

    validUrlParameters.forEach((parameter) => {
      it('Should return true for valid URL format \'' + parameter.url + '\'', () => {
        expect(validateUrlFormat(parameter.url)).toBeTruthy();
      });
    });

    const inValidUrlParameters = [
      { url: 'test' }, // single-label alphabetic domain name
      { url: '123' }, // single-label numeric domain name
      { url: '204.120. 0.15' }, // IPV4 address
      { url: '2001:db8:3333:4444:5555:6666:7777:8888' }, // IPV6 address
      { url: '' }, // Empty string
      { url: null }, // Null string
      { url: 'test*123.com' }, // With invalid character in domain name
      { url: '-test.com' }, // Domain name starts with a hyphen
      { url: 'httpss://www.test.com' }, // Invalid protocol
      { url: 'http:://test.com' }, // Invalid separator between protocol and domain name
      { url: 'ftp://example.ftp-servers.gov.uk/dir/file.txt' } // Not acceptable protocol
    ];

    inValidUrlParameters.forEach((parameter) => {
      it('Should return false for invalid URL format \'' + parameter.url + '\'', () => {
        expect(validateUrlFormat(parameter.url)).toBeFalsy();
      });
    });
  });
});
