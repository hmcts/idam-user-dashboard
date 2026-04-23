import { get } from 'lodash';

const mockConfig: any = {};
mockConfig.has = jest.fn((key: string) => get(mockConfig, key) !== undefined);

const mockExecSync = jest.fn();
const mockReaddirSync = jest.fn();
const mockStatSync = jest.fn();
const mockReadFileSync = jest.fn();

jest.mock('config', () => ({
  __esModule: true,
  default: mockConfig,
}));

jest.mock('child_process', () => ({
  execSync: (...args: any[]) => mockExecSync(...args),
}));

jest.mock('fs', () => ({
  readdirSync: (...args: any[]) => mockReaddirSync(...args),
  statSync: (...args: any[]) => mockStatSync(...args),
  readFileSync: (...args: any[]) => mockReadFileSync(...args),
}));

import { PropertiesVolume } from '../../../../../main/modules/properties-volume';

const resetMockConfig = () => {
  Object.keys(mockConfig).forEach(key => {
    if (key !== 'has') {
      delete mockConfig[key];
    }
  });
};

describe('PropertiesVolume', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    resetMockConfig();
    jest.clearAllMocks();
    mockConfig.has.mockImplementation((key: string) => get(mockConfig, key) !== undefined);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  test('loads mounted secrets into config and applies preview redis overrides', () => {
    const directories = new Set([
      '/mnt/secrets/idam-idam',
      '/mnt/secrets/idam-idam-preview',
    ]);
    const fileContents: Record<string, string> = {
      '/mnt/secrets/idam-idam/AppInsightsConnectionString': 'app-insights\n',
      '/mnt/secrets/idam-idam/launchdarkly-sdk-key': 'launchdarkly-key\n',
      '/mnt/secrets/idam-idam/idam-user-dashboard-client-secret': 'client-secret\n',
      '/mnt/secrets/idam-idam/idam-user-dashboard-systemUser-username': 'system-user\n',
      '/mnt/secrets/idam-idam/idam-user-dashboard-systemUser-password': 'system-password\n',
      '/mnt/secrets/idam-idam/redis-hostname': 'redis-host\n',
      '/mnt/secrets/idam-idam/redis-port': '6380\n',
      '/mnt/secrets/idam-idam/redis-key': 'redis-key\n',
      '/mnt/secrets/idam-idam-preview/redis-hostname': 'preview-redis-host\n',
      '/mnt/secrets/idam-idam-preview/redis-port': '6381\n',
      '/mnt/secrets/idam-idam-preview/redis-key': 'preview-redis-key\n',
    };

    mockReaddirSync.mockImplementation((target: string) => {
      if (target === '/mnt/secrets') {
        return [ 'idam-idam', 'idam-idam-preview' ];
      }

      if (target === '/mnt/secrets/idam-idam') {
        return [
          'AppInsightsConnectionString',
          'launchdarkly-sdk-key',
          'idam-user-dashboard-client-secret',
          'idam-user-dashboard-systemUser-username',
          'idam-user-dashboard-systemUser-password',
          'redis-hostname',
          'redis-port',
          'redis-key',
        ];
      }

      if (target === '/mnt/secrets/idam-idam-preview') {
        return [ 'redis-hostname', 'redis-port', 'redis-key' ];
      }

      throw new Error(`Unexpected path ${target}`);
    });

    mockStatSync.mockImplementation((target: string) => ({
      isDirectory: () => directories.has(target)
    }));

    mockReadFileSync.mockImplementation((target: string) => fileContents[target]);

    new PropertiesVolume().enableFor('aat');

    expect(get(mockConfig, 'secrets.idam-idam.idam-user-dashboard-client-secret')).toBe('client-secret');
    expect(get(mockConfig, 'appInsights.connectionString')).toBe('app-insights');
    expect(get(mockConfig, 'featureFlags.launchdarkly.sdkKey')).toBe('launchdarkly-key');
    expect(get(mockConfig, 'services.idam.clientSecret')).toBe('client-secret');
    expect(get(mockConfig, 'services.idam.systemUser.username')).toBe('system-user');
    expect(get(mockConfig, 'services.idam.systemUser.password')).toBe('system-password');
    expect(get(mockConfig, 'session.redis.host')).toBe('preview-redis-host');
    expect(get(mockConfig, 'session.redis.port')).toBe('6381');
    expect(get(mockConfig, 'session.redis.key')).toBe('preview-redis-key');
    expect(get(mockConfig, 'session.secret')).toBe('preview-redis-key');
    expect(consoleLogSpy).toHaveBeenCalledWith('Using idam-preview redis');
  });

  test('ignores a missing mounted secrets directory', () => {
    const error = Object.assign(new Error('missing mount'), { code: 'ENOENT' });

    mockReaddirSync.mockImplementation(() => {
      throw error;
    });

    expect(() => new PropertiesVolume().enableFor('aat')).not.toThrow();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "Could not find properties to load, check your config, you can ignore this if you don't expect any"
    );
    expect(get(mockConfig, 'services.idam.clientSecret')).toBeUndefined();
  });

  test('loads local secrets via azure cli in development', () => {
    const secretValues: Record<string, string> = {
      AppInsightsConnectionString: 'local-app-insights\n',
      'launchdarkly-sdk-key': 'local-ld-key\n',
      'idam-user-dashboard-client-secret': 'local-client-secret\n',
      'idam-user-dashboard-systemUser-username': 'local-system-user\n',
      'idam-user-dashboard-systemUser-password': 'local-system-password\n',
    };

    mockExecSync.mockImplementation((command: string) => {
      const secretName = command.split(' --name ')[1];
      return Buffer.from(secretValues[secretName]);
    });

    new PropertiesVolume().enableFor('development');

    expect(mockReaddirSync).not.toHaveBeenCalled();
    expect(mockExecSync).toHaveBeenCalledTimes(5);
    expect(get(mockConfig, 'appInsights.connectionString')).toBe('local-app-insights');
    expect(get(mockConfig, 'featureFlags.launchdarkly.sdkKey')).toBe('local-ld-key');
    expect(get(mockConfig, 'services.idam.clientSecret')).toBe('local-client-secret');
    expect(get(mockConfig, 'services.idam.systemUser.username')).toBe('local-system-user');
    expect(get(mockConfig, 'services.idam.systemUser.password')).toBe('local-system-password');
  });
});
