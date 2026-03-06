import { APIRequestContext, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { BuildInfoHelper } from './build-info';

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'testadmin@admin.local';
const ADMIN_ROLE_NAME = 'iud-test-admin';
const WORKER_ROLE_NAME = 'iud-test-worker';
const ACCESS_ROLE_NAME = 'idam-user-dashboard--access';

type Identity = { email: string; secret: string };
type AdminRole = { name: string; assignableRoleNames: string[] };
type WorkerRole = { name: string };
type Invitation = { email: string; invitationType: string; invitationStatus: string };
type UserOverrides = {
  password?: string;
  id?: string;
  email?: string;
  forename?: string;
  surname?: string;
  roleNames?: string[];
  ssoId?: string;
  ssoProvider?: string;
  accountStatus?: string;
  recordType?: string;
};
type ServiceOverrides = {
  clientId?: string;
  clientSecret?: string;
  serviceLabel?: string;
  description?: string;
  redirectUris?: string[];
  onboardingRoleNames?: string[];
};
type TestUser = {
  id: string;
  forename: string;
  surname: string;
  email: string;
  roleNames: string[];
  ssoId?: string;
  ssoProvider?: string;
  accountStatus?: string;
  recordType?: string;
  password: string;
};

export class SetupDao {
  private readonly idamApi: APIRequestContext;
  private readonly testingSupportApi: APIRequestContext;
  private readonly clientSecret?: string;

  private testingToken?: string;
  private adminIdentity?: Identity;
  private adminRole?: AdminRole;
  private workerRole?: WorkerRole;

  constructor(idamApi: APIRequestContext, testingSupportApi: APIRequestContext) {
    this.idamApi = idamApi;
    this.testingSupportApi = testingSupportApi;
    this.clientSecret = process.env.FUNCTIONAL_TEST_SERVICE_CLIENT_SECRET;
  }

  async getToken(): Promise<string> {
    if (this.testingToken) {
      return this.testingToken;
    }
    if (!this.clientSecret) {
      throw new Error('FUNCTIONAL_TEST_SERVICE_CLIENT_SECRET is not set');
    }
    const tokenRsp = await this.idamApi.post('/o/token', {
      form: {
        grant_type: 'client_credentials',
        client_id: 'idam-functional-test-service',
        client_secret: this.clientSecret,
        scope: 'profile roles',
      },
    });
    await expect(tokenRsp.ok(), `Token request failed: ${tokenRsp.status()} ${tokenRsp.statusText()}`).toBeTruthy();
    const tokenBody = await tokenRsp.json();
    if (!tokenBody?.access_token) {
      throw new Error('Unable to initialise testing token');
    }
    this.testingToken = tokenBody.access_token;
    return this.testingToken;
  }

  async setupAdmin(): Promise<void> {
    if (this.adminIdentity) {
      return;
    }
    await this.setupAdminRole();
    const secret = process.env.SMOKE_TEST_USER_PASSWORD || 'Pa55word11';
    const createRsp = await this.postWithBearer('/test/idam/users', {
      password: secret,
      user: {
        email: ADMIN_EMAIL,
        forename: 'admin',
        surname: 'test',
        roleNames: [ACCESS_ROLE_NAME, ADMIN_ROLE_NAME],
      },
    });
    await this.expectOkOrConflict(createRsp, 'setup admin user');
    this.adminIdentity = { email: ADMIN_EMAIL, secret };
  }

  async setupAdminRole(): Promise<void> {
    if (this.adminRole) {
      return;
    }
    await this.setupWorkerRole();
    const createRsp = await this.postWithBearer('/test/idam/roles', {
      name: ADMIN_ROLE_NAME,
      assignableRoleNames: [WORKER_ROLE_NAME],
    });
    await this.expectOkOrConflict(createRsp, 'setup admin role');
    this.adminRole = {
      name: ADMIN_ROLE_NAME,
      assignableRoleNames: [WORKER_ROLE_NAME],
    };
  }

  async setupWorkerRole(): Promise<void> {
    if (this.workerRole) {
      return;
    }
    const createRsp = await this.postWithBearer('/test/idam/roles', {
      name: WORKER_ROLE_NAME,
    });
    await this.expectOkOrConflict(createRsp, 'setup worker role');
    this.workerRole = { name: WORKER_ROLE_NAME };
  }

  getAdminIdentity(): Identity {
    if (!this.adminIdentity) {
      throw new Error('adminIdentity is not initialised. Run setupAdmin() first.');
    }
    return this.adminIdentity;
  }

  getWorkerRole(): WorkerRole {
    if (!this.workerRole) {
      throw new Error('workerRole is not initialised. Run setupWorkerRole() or setupAdminRole() first.');
    }
    return this.workerRole;
  }

  getAdminRole(): AdminRole {
    if (!this.adminRole) {
      throw new Error('adminRole is not initialised. Run setupAdminRole() first.');
    }
    return this.adminRole;
  }

  async createRole(role: { name: string; assignableRoleNames?: string[] }): Promise<void> {
    const createRsp = await this.postWithBearer('/test/idam/roles', {
      name: role.name,
      assignableRoleNames: role.assignableRoleNames || [],
    });
    await this.expectOkOrConflict(createRsp, `create role ${role.name}`);
  }

  async createService(overrides: ServiceOverrides = {}) {
    const clientId = overrides.clientId || `iud-service-${BuildInfoHelper.getBuildInfo(faker.word.verb())}-${faker.word.noun()}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const clientSecret = overrides.clientSecret || clientId;
    const serviceLabel = overrides.serviceLabel || clientId;
    const description = overrides.description || 'playwright-generated service';
    const redirectUris = overrides.redirectUris || [`http://${clientId}`];
    const onboardingRoleNames = overrides.onboardingRoleNames || [];

    const rsp = await this.postWithBearer('/test/idam/services', {
      clientId,
      clientSecret,
      serviceLabel,
      description,
      hmctsAccess: {
        mfaRequired: true,
        selfRegistrationAllowed: true,
        postActivationRedirectUrl: 'http://postactivation',
        onboardingRoleNames,
      },
      oauth2: {
        redirectUris,
        scopes: ['openid', 'profile', 'roles'],
      },
    });
    await expect(rsp.ok(), `create service failed: ${rsp.status()} ${rsp.statusText()}`).toBeTruthy();
    return {
      clientId,
      clientSecret,
      serviceLabel,
      description,
      redirectUris,
      onboardingRoleNames,
    };
  }

  async createUser(overrides: UserOverrides = {}): Promise<TestUser> {
    await this.setupWorkerRole();
    const password = overrides.password || faker.internet.password({ prefix: 'T1a' });
    const forename = overrides.forename || faker.person.firstName();
    const surname = overrides.surname || faker.person.lastName();
    const email = overrides.email || faker.internet.email({
      firstName: forename,
      lastName: surname,
      provider: `iud.${BuildInfoHelper.getBuildInfo('test')}.local`,
    }).normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const userPayload: Record<string, any> = {
      forename,
      surname,
      email,
      roleNames: overrides.roleNames || [WORKER_ROLE_NAME],
      ...overrides,
      password: undefined,
    };

    const createRsp = await this.postWithBearer('/test/idam/users', {
      password,
      user: userPayload,
    });
    await expect(createRsp.ok(), `create user failed: ${createRsp.status()} ${createRsp.statusText()}`).toBeTruthy();
    const createBody = await createRsp.json();
    const createdUser = createBody.user || createBody;
    return {
      id: createdUser.id || userPayload.id,
      forename: createdUser.forename || forename,
      surname: createdUser.surname || surname,
      email: createdUser.email || email,
      roleNames: createdUser.roleNames || userPayload.roleNames,
      ssoId: createdUser.ssoId || userPayload.ssoId,
      ssoProvider: createdUser.ssoProvider || userPayload.ssoProvider,
      accountStatus: createdUser.accountStatus || userPayload.accountStatus,
      recordType: createdUser.recordType || userPayload.recordType,
      password,
    };
  }

  async lockTestUser(email: string): Promise<void> {
    if (!this.clientSecret) {
      throw new Error('FUNCTIONAL_TEST_SERVICE_CLIENT_SECRET is not set');
    }
    for (let i = 0; i < 5; i++) {
      await this.idamApi.post('/o/token', {
        form: {
          grant_type: 'password',
          client_id: 'idam-functional-test-service',
          client_secret: this.clientSecret,
          scope: 'profile roles',
          username: email,
          password: 'invalid',
        },
      });
    }
  }

  async archiveExistingTestUser(user: TestUser): Promise<void> {
    const token = await this.getToken();
    const rsp = await this.testingSupportApi.put(`/test/idam/users/${user.id}`, {
      headers: {
        Authorization: `bearer ${token}`,
      },
      data: {
        password: 'redundant',
        user: {
          ...user,
          recordType: 'ARCHIVED',
        },
      },
    });
    await expect(rsp.ok(), `archive existing user failed: ${rsp.status()} ${rsp.statusText()}`).toBeTruthy();
  }

  async getSingleInvite(email: string): Promise<Invitation> {
    const token = await this.getToken();
    const rsp = await this.testingSupportApi.get(`/test/idam/invitations?email=${encodeURIComponent(email)}`, {
      headers: {
        Authorization: `bearer ${token}`,
      },
    });
    await expect(rsp.ok(), `getSingleInvite request failed: ${rsp.status()} ${rsp.statusText()}`).toBeTruthy();
    const invitations = await rsp.json();
    const pendingInvites = invitations.filter(invitation => invitation.invitationStatus === 'PENDING');
    expect(pendingInvites).toHaveLength(1);
    return pendingInvites[0];
  }

  private async postWithBearer(path: string, data: unknown) {
    const token = await this.getToken();
    return this.testingSupportApi.post(path, {
      headers: {
        Authorization: `bearer ${token}`,
      },
      data,
    });
  }

  private async expectOkOrConflict(response, operation: string): Promise<void> {
    const status = response.status();
    if (status === 409 || response.ok()) {
      return;
    }
    const body = await response.text();
    throw new Error(`${operation} failed with status ${status}: ${body}`);
  }
}
