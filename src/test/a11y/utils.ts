import { config as testConfig } from '../config';
import pa11y from 'pa11y';

interface PallyIssue {
  code: string;
  context: string;
  message: string;
  selector: string;
  type: string;
  typeCode: number;
}

export const expectNoErrors = (messages: PallyIssue[]): void => {
  const errors = messages.filter(m => m.type === 'error');

  if (errors.length > 0) {
    const errorsAsJson = `${JSON.stringify(errors, null, 2)}`;
    throw new Error(`There are accessibility issues: \n${errorsAsJson}\n`);
  }
};

export const prettifyUrl = (url: string) => {
  if (!url.includes('?')) {
    return url;
  }

  return url.substring(0, url.indexOf('?'));
};

export const testAccessibilityPost = (url: string, data: any, options: any = {}): void => {
  describe('Page ' + prettifyUrl(url), () => {
    test(options.customTestName || 'should have no accessibility errors when posting', async () => {

      const dataObj = {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        postData: JSON.stringify(data),
      };

      const results = await pa11y(
        testConfig.TEST_URL + url,
        dataObj
      );

      expect(results.issues).toEqual(expect.any(Array));
      expectNoErrors(results.issues);
    });
  });
};


export const testAccessibilityGet = (url: string, options: any = {}): void => {
  describe('Page ' + prettifyUrl(url), () => {
    test(options.customTestName || 'should have no accessibility errors', async () => {
      const results = await pa11y(testConfig.TEST_URL + url, options);

      expect(results.issues).toEqual(expect.any(Array));
      expectNoErrors(results.issues);
    });
  });
};

export const createParameterisedUrl = (url: string, params: Record<string, any>) => {
  if (!Object.keys(params).length) {
    return url;
  }

  return url + '?' + new URLSearchParams(params).toString();
};