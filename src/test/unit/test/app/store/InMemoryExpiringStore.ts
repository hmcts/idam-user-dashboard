import { InMemoryExpiringStore } from '../../../../../main/app/store/InMemoryExpiringStore';

describe('InMemoryExpiringStore', () => {
  const key = 'test-key';
  const value = { email: 'test@example.com' };
  let dateNowSpy: jest.SpyInstance<number, []>;

  afterEach(() => {
    dateNowSpy?.mockRestore();
  });

  test('Should get stored value before it expires', async () => {
    dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1000);
    const store = new InMemoryExpiringStore();

    await store.set(key, value, 5);

    await expect(store.get(key)).resolves.toEqual(value);
  });

  test('Should return undefined after stored value expires', async () => {
    dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1000);
    const store = new InMemoryExpiringStore();

    await store.set(key, value, 5);
    dateNowSpy.mockReturnValue(6001);

    await expect(store.get(key)).resolves.toBeUndefined();
  });

  test('Should delete stored value', async () => {
    const store = new InMemoryExpiringStore();

    await store.set(key, value, 5);
    await store.delete(key);

    await expect(store.get(key)).resolves.toBeUndefined();
  });
});
