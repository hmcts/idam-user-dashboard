const logger = {
  warn: jest.fn(),
  error: jest.fn(),
};

const uuidMock = jest.fn(() => 'error-uuid-123');

jest.mock('../../../../../main/modules/logging', () => ({
  __esModule: true,
  default: logger,
}));

jest.mock('uuid', () => ({
  __esModule: true,
  v4: () => uuidMock(),
}));

import { constants as http } from 'http2';
import { ErrorHandler } from '../../../../../main/modules/error-handler';
import { HTTPError } from '../../../../../main/app/errors/HttpError';

const makeApp = (env = 'production') => {
  const handlers: Function[] = [];
  const app: any = {
    locals: { ENV: env },
    use: jest.fn((handler: Function) => {
      handlers.push(handler);
      return app;
    }),
  };

  return { app, handlers };
};

const makeRequest = () => ({
  method: 'GET',
  url: '/admin/users',
  originalUrl: '/admin/users?role=caseworker',
  idam_user_dashboard_session: {
    user: {
      id: '12345',
      email: 'operator@example.com',
      roles: ['caseworker'],
    },
  },
});

const makeResponse = () => {
  const res: any = {
    locals: {},
    status: jest.fn(),
    render: jest.fn(),
  };

  res.status.mockReturnValue(res);
  res.render.mockReturnValue(res);

  return res;
};

describe('ErrorHandler', () => {
  beforeEach(() => {
    logger.warn.mockReset();
    logger.error.mockReset();
    uuidMock.mockClear();
  });

  test('logs handled HTTPError messages for forbidden responses without exposing them in render data', () => {
    const { app, handlers } = makeApp();
    const errorHandler = new ErrorHandler();

    errorHandler.enableFor(app);

    const middleware = handlers[1] as Function;
    const req = makeRequest();
    const res = makeResponse();
    const error = new HTTPError(http.HTTP_STATUS_FORBIDDEN, 'Missing required role assignment');

    middleware(error, req, res, jest.fn());

    expect(logger.warn).toHaveBeenCalledWith(
      'Handled HTTPError',
      expect.objectContaining({
        errorName: 'HTTPError',
        status: http.HTTP_STATUS_FORBIDDEN,
        message: 'Missing required role assignment',
        method: 'GET',
        url: '/admin/users?role=caseworker',
        principalId: '12345',
        principalEmail: 'ope******r@***.com',
        stack: expect.stringContaining('HTTPError: Missing required role assignment'),
      })
    );
    expect(logger.error).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(http.HTTP_STATUS_FORBIDDEN);
    expect(res.render).toHaveBeenCalledWith(
      'error.njk',
      expect.objectContaining({
        status: http.HTTP_STATUS_FORBIDDEN,
        title: 'Sorry, access to this resource is forbidden',
      })
    );
    expect(res.render.mock.calls[0][1].message).toBeUndefined();
  });

  test('logs unhandled HTTPError messages with an error UUID and stack trace', () => {
    const { app, handlers } = makeApp();
    const errorHandler = new ErrorHandler();

    errorHandler.enableFor(app);

    const middleware = handlers[1] as Function;
    const req = makeRequest();
    const res = makeResponse();
    const error = new HTTPError(http.HTTP_STATUS_INTERNAL_SERVER_ERROR, 'Downstream API timed out');

    middleware(error, req, res, jest.fn());

    expect(uuidMock).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'Unhandled HTTPError',
      expect.objectContaining({
        errorUUID: 'error-uuid-123',
        errorName: 'HTTPError',
        status: http.HTTP_STATUS_INTERNAL_SERVER_ERROR,
        message: 'Downstream API timed out',
        method: 'GET',
        url: '/admin/users?role=caseworker',
        principalId: '12345',
        principalEmail: 'ope******r@***.com',
        stack: expect.stringContaining('HTTPError: Downstream API timed out'),
      })
    );
    expect(res.status).toHaveBeenCalledWith(http.HTTP_STATUS_INTERNAL_SERVER_ERROR);
    expect(res.render).toHaveBeenCalledWith(
      'error.njk',
      expect.objectContaining({
        status: http.HTTP_STATUS_INTERNAL_SERVER_ERROR,
        errorUUID: 'error-uuid-123',
        title: 'Sorry, there is a problem with the service',
      })
    );
    expect(res.render.mock.calls[0][1].message).toBeUndefined();
  });
});
