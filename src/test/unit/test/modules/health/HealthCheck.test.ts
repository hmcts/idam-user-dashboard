import { HealthCheck } from '../../../../../main/modules/health';

// Mock logger to avoid noisy output during tests
jest.mock('../../../../../main/modules/logging', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn() }
}));

// Create sentinels for up/down to verify callback behavior
const UP_SENTINEL = { status: 'UP' } as const;
const DOWN_SENTINEL = { status: 'DOWN' } as const;

// Mock @hmcts/nodejs-healthcheck so we can intercept web/raw/addTo/up/down
const addToMock = jest.fn();
const webMock = jest.fn();
const rawMock = jest.fn();
const upMock = jest.fn(() => UP_SENTINEL);
const downMock = jest.fn(() => DOWN_SENTINEL);

jest.mock('@hmcts/nodejs-healthcheck', () => ({
  __esModule: true,
  default: undefined,
  // Node require style import in code under test uses `require(...)`
  // so we export as module.exports shape
  addTo: (...args: any[]) => addToMock(...args),
  web: (...args: any[]) => webMock(...args),
  raw: (...args: any[]) => rawMock(...args),
  up: () => upMock(),
  down: () => downMock(),
}));

// Provide config values used by HealthCheck
const configGetMock = jest.fn((key: string) => {
  const map: Record<string, any> = {
    'health.idam.url.public': 'https://public.example',
    'health.idam.url.hmctsAccess': 'https://hmcts-access.example',
    'health.idam.url.api': 'https://api.example',
    'services.idam.url.public': 'https://fallback-public.example',
    'services.idam.url.hmctsAccess': 'https://fallback-hmcts-access.example',
    'services.idam.url.api': 'https://fallback-api.example',
    'health.timeout': 3000,
    'health.deadline': 6000,
    'services.name': 'idam-user-dashboard',
  };
  return map[key];
});

jest.mock('config', () => ({
  __esModule: true,
  default: { get: (key: string) => configGetMock(key) },
  get: (key: string) => configGetMock(key),
}));

// Minimal Express app stub
const makeApp = () => {
  const routes: Record<string, any> = {};
  const app: any = {
    get: jest.fn((path: string, handler: any) => { routes[path] = handler; }),
    locals: {},
  };
  return app;
};

// Helper to reset mocks between tests
const resetAll = () => {
  addToMock.mockReset();
  webMock.mockReset();
  rawMock.mockReset();
  upMock.mockClear();
  downMock.mockClear();
};

describe('HealthCheck module', () => {
  beforeEach(() => {
    resetAll();
  });

  test('registers health checks including hmcts-access with correct URLs', () => {
    // Arrange: set webMock to capture arguments and return a marker object
    webMock.mockImplementation((url: string, options: any) => ({ kind: 'web', url, options }));

    const app = makeApp();
    const hc = new HealthCheck();

    // Act
    hc.enableFor(app as any);

    // Assert addTo was called once with checks containing expected keys
    expect(addToMock).toHaveBeenCalledTimes(1);
    const [, configArg] = addToMock.mock.calls[0];
    expect(configArg).toBeDefined();
    expect(configArg.checks).toBeDefined();
    const checks = configArg.checks;

    // Ensure each check has been constructed via web with the right URL
    expect(checks['idam-web-public']).toEqual({
      kind: 'web',
      url: 'https://public.example/health',
      options: expect.any(Object),
    });
    expect(checks['hmcts-access']).toEqual({
      kind: 'web',
      url: 'https://hmcts-access.example/health',
      options: expect.any(Object),
    });
    expect(checks['idam-api']).toEqual({
      kind: 'web',
      url: 'https://api.example/health',
      options: expect.any(Object),
    });

    // And that global options include configured timeout/deadline
    const { options } = checks['hmcts-access'];
    expect(options.timeout).toBe(3000);
    expect(options.deadline).toBe(6000);
    expect(typeof options.callback).toBe('function');
  });

  test('callback returns up when dependency reports UP and down otherwise', () => {
    webMock.mockImplementation((url: string, options: any) => ({ kind: 'web', url, options }));

    const app = makeApp();
    const hc = new HealthCheck();
    hc.enableFor(app as any);

    const [, configArg] = addToMock.mock.calls[0];
    const options = (configArg.checks['hmcts-access'] as any).options;

    // UP case
    const upResult = options.callback(undefined, { body: { status: 'UP' } });
    expect(upMock).toHaveBeenCalledTimes(1);
    expect(upResult).toBe(UP_SENTINEL);

    // DOWN case (missing or not UP)
    const downResult1 = options.callback(undefined, { body: { status: 'DOWN' } });
    expect(downMock).toHaveBeenCalledTimes(1);
    expect(downResult1).toBe(DOWN_SENTINEL);

    const downResult2 = options.callback(new Error('boom'), undefined);
    expect(downMock).toHaveBeenCalledTimes(2);
    expect(downResult2).toBe(DOWN_SENTINEL);
  });

  test('does not add redis check when app.locals.redisClient is not set', () => {
    webMock.mockImplementation((url: string, options: any) => ({ kind: 'web', url, options }));

    const app = makeApp();
    const hc = new HealthCheck();
    hc.enableFor(app as any);

    const [, configArg] = addToMock.mock.calls[0];
    const checks = configArg.checks;
    expect(checks.redis).toBeUndefined();
  });
});
