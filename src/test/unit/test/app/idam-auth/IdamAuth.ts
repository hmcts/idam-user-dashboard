import { IdamAuth, IdamGrantType } from '../../../../../main/app/idam-auth/IdamAuth';
import { when } from 'jest-when';
import jwtDecode from 'jwt-decode';
import config from 'config';
jest.mock('jwt-decode');
jest.mock('config');
jest.mock('applicationinsights');

describe('IdamAuth', () =>{
  const mockLogger = {
    error: jest.fn()
  } as any;
  const mockAxios = {post: jest.fn()} as any;
  const mockTelemetryClient = { trackTrace: jest.fn() } as any;
  const clientId = 'test-client-id';
  const clientSecret = 'test-client-secret';
  const clientScope = 'test-scope';
  const mockTokens = {
    'access_token': 'access-token',
    'refresh_token': 'refresh-token',
    'id_token': {
      'uid': 1,
      'given_name': 'Test First Name',
      'family_name': 'Test Last Name',
      'sub': 'test@email.test',
      'roles': ['test-role']
    }
  };
  const mockUser = {
    id: mockTokens.id_token.uid,
    forename: mockTokens.id_token.given_name,
    surname: mockTokens.id_token.family_name,
    email: mockTokens.id_token.sub,
    roles: mockTokens.id_token.roles,
    active: true
  };
  const requestParamDefaults = {
    'client_id': clientId,
    'client_secret': clientSecret,
    'redirect_uri': 'callbackURL'
  };

  when(config.get).calledWith('services.idam.endpoint.token').mockReturnValue('tokenUrl');
  when(config.get).calledWith('services.idam.callbackURL').mockReturnValue('callbackURL');
  when(jwtDecode).mockReturnValue({'mock-key': 'mock-value'});
  when(jwtDecode).calledWith('id-token').mockReturnValue(mockTokens['id_token']);

  describe('authorizeCode', () => {
    test('Should call authorize function with correct parameters', async () => {
      const response = { data: {
        'access_token': 'access-token',
        'refresh_token': 'refresh-token',
        'id_token': 'id-token',
      }};
      const params = new URLSearchParams({
        'grant_type': IdamGrantType.AUTH_CODE,
        ...requestParamDefaults,
        'code': 'test-code-123'
      });
      const expectedResult = {
        tokens: {
          accessToken: {'mock-key': 'mock-value', raw: response.data['access_token']},
          refreshToken: {'mock-key': 'mock-value', raw: response.data['refresh_token']},
        },
        user: mockUser
      };

      when(mockAxios.post).mockReturnValue(Promise.resolve(response));

      const auth = new IdamAuth(mockLogger, mockTelemetryClient, clientId, clientSecret, clientScope, mockAxios);
      const result = await auth.authorizeCode('test-code-123');

      expect(mockAxios.post).toBeCalledWith('tokenUrl', params);
      expect(result).toEqual(expectedResult);
    });

    test('Should log error if API issues', async () => {
      const params = new URLSearchParams({
        'grant_type': IdamGrantType.AUTH_CODE,
        ...requestParamDefaults,
        'code': 'test-code-123'
      });

      when(mockAxios.post).mockReturnValue(Promise.reject('error'));

      const auth = new IdamAuth(mockLogger, mockTelemetryClient, clientId, clientSecret, clientScope, mockAxios);

      await expect(auth.authorizeCode('test-code-123')).rejects.toThrowError();
      expect(mockAxios.post).toBeCalledWith('tokenUrl', params);
    });
  });

  describe('authorizePassword', () => {
    test('Should call authorize function with correct parameters', async () => {
      const response = { data: {
        'access_token': 'access-token',
        'refresh_token': 'refresh-token',
        'id_token': 'id-token',
      }};
      const params = new URLSearchParams({
        'grant_type': IdamGrantType.PASSWORD,
        ...requestParamDefaults,
        'username': 'test@email.test',
        'password': 'test-password',
        'scope': clientScope,
      });
      const expectedResult = {
        tokens: {
          accessToken: {'mock-key': 'mock-value', raw: response.data['access_token']},
          refreshToken: {'mock-key': 'mock-value', raw: response.data['refresh_token']},
        },
        user: mockUser
      };

      when(mockAxios.post).mockReturnValue(Promise.resolve(response));

      const auth = new IdamAuth(mockLogger, mockTelemetryClient, clientId, clientSecret, clientScope, mockAxios);
      const result = await auth.authorizePassword('test@email.test', 'test-password');

      expect(mockAxios.post).toBeCalledWith('tokenUrl', params);
      expect(result).toEqual(expectedResult);
    });

    test('Should log error if API issues', async () => {
      const params = new URLSearchParams({
        'grant_type': IdamGrantType.PASSWORD,
        ...requestParamDefaults,
        'username': 'test@email.test',
        'password': 'test-password',
        'scope': clientScope,
      });

      when(mockAxios.post).mockReturnValue(Promise.reject('error'));

      const auth = new IdamAuth(mockLogger, mockTelemetryClient, clientId, clientSecret, clientScope, mockAxios);

      await expect(auth.authorizePassword('test@email.test', 'test-password')).rejects.toThrowError();
      expect(mockAxios.post).toBeCalledWith('tokenUrl', params);
    });
  });

  describe('authorizeRefresh', () => {
    test('Should call authorize function with correct parameters', async () => {
      const response = { data: {
        'access_token': 'access-token',
        'refresh_token': 'refresh-token',
        'id_token': 'id-token',
      }};
      const params = new URLSearchParams({
        'grant_type': IdamGrantType.REFRESH,
        ...requestParamDefaults,
        'refresh_token': response.data['refresh_token'],
      });
      const expectedResult = {
        tokens: {
          accessToken: {'mock-key': 'mock-value', raw: response.data['access_token']},
          refreshToken: {'mock-key': 'mock-value', raw: response.data['refresh_token']},
        },
        user: mockUser
      };

      when(mockAxios.post).mockReturnValue(Promise.resolve(response));

      const auth = new IdamAuth(mockLogger, mockTelemetryClient, clientId, clientSecret, clientScope, mockAxios);
      const result = await auth.authorizeRefresh(response.data['refresh_token']);

      expect(mockAxios.post).toBeCalledWith('tokenUrl', params);
      expect(result).toEqual(expectedResult);
    });

    test('Should log error if API issues', async () => {
      const params = new URLSearchParams({
        'grant_type': IdamGrantType.REFRESH,
        ...requestParamDefaults,
        'refresh_token': 'refresh-token',
      });

      when(mockAxios.post).mockReturnValue(Promise.reject('error'));

      const auth = new IdamAuth(mockLogger, mockTelemetryClient, clientId, clientSecret, clientScope, mockAxios);

      await expect(auth.authorizeRefresh('refresh-token')).rejects.toThrowError();
      expect(mockAxios.post).toBeCalledWith('tokenUrl', params);
    });
  });
});
