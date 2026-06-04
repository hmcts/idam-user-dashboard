import { v4 as uuidv4 } from 'uuid';
import { ExpiringStore } from '../store/ExpiringStore';

export interface InvitationSearchContext {
  email: string;
}

export class InvitationSearchStore {
  private readonly keyPrefix = 'invitation-search:';

  public constructor(
    private readonly expiringStore: ExpiringStore,
    private readonly invitationSearchTtlSeconds: number
  ) {}

  public async save(email: string): Promise<string> {
    const searchId = uuidv4();
    await this.expiringStore.set(
      this.getKey(searchId),
      { email },
      this.invitationSearchTtlSeconds
    );
    return searchId;
  }

  public async get(searchId: string): Promise<InvitationSearchContext | undefined> {
    return this.expiringStore.get<InvitationSearchContext>(this.getKey(searchId));
  }

  private getKey(searchId: string): string {
    return this.keyPrefix + searchId;
  }
}
