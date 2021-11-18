import {isObjectEmpty} from '../../../main/utils/utils';

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
});
