import { InvitationSearchStore } from '../../../../../main/app/invite-service/InvitationSearchStore';
import { ExpiringStore } from '../../../../../main/app/store/ExpiringStore';

const mockUuidV4 = jest.fn();

jest.mock('uuid', () => ({
  __esModule: true,
  v4: () => mockUuidV4()
}));

describe('InvitationSearchStore', () => {
  const searchId = 'invitation-search-id';
  const email = 'john.smith@test.com';
  const ttlSeconds = 300;
  let expiringStore: jest.Mocked<ExpiringStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUuidV4.mockReturnValue(searchId);
    expiringStore = {
      set: jest.fn(),
      get: jest.fn(),
      delete: jest.fn()
    };
  });

  test('Should save invitation search context with ttl', async () => {
    const invitationSearchStore = new InvitationSearchStore(expiringStore, ttlSeconds);

    await expect(invitationSearchStore.save(email)).resolves.toEqual(searchId);
    expect(expiringStore.set).toHaveBeenCalledWith(
      'invitation-search:' + searchId,
      {email},
      ttlSeconds
    );
  });

  test('Should get invitation search context', async () => {
    const invitationSearchStore = new InvitationSearchStore(expiringStore, ttlSeconds);
    expiringStore.get.mockResolvedValue({email});

    await expect(invitationSearchStore.get(searchId)).resolves.toEqual({email});
    expect(expiringStore.get).toHaveBeenCalledWith('invitation-search:' + searchId);
  });

  test('Should return undefined when invitation search context has expired', async () => {
    const invitationSearchStore = new InvitationSearchStore(expiringStore, ttlSeconds);
    expiringStore.get.mockResolvedValue(undefined);

    await expect(invitationSearchStore.get(searchId)).resolves.toBeUndefined();
  });
});
