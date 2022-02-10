import {when} from 'jest-when';
import { mockRequest } from '../../../utils/mockRequest';
import { FeatureFlagClient, FeatureFlags } from '../../../../../main/app/feature-flags/FeatureFlags';
import { mockResponse } from '../../../utils/mockResponse';
import config from 'config';
import { HTTPError } from '../../../../../main/HttpError';

jest.mock('config');

describe('FeatureToggleService', () => {
  const mockFeatureFlagClient: FeatureFlagClient = {
    getFlagValue: jest.fn(),
    getAllFlagValues: jest.fn(),
    onFlagChange: jest.fn((callback, defaultValue, flag) => {
      if(flag === undefined || flag === 'test-feature-flag-2') {
        callback();
      }
    })
  };

  const featureFlags = new FeatureFlags(mockFeatureFlagClient);

  jest.mock('config');
  config.get = jest.fn();
  config.has = jest.fn();

  test('Should return flag result', async () => {
    when(mockFeatureFlagClient.getFlagValue)
      .calledWith('test-feature-flag', false)
      .mockReturnValue(Promise.resolve(true));

    const testResult = await featureFlags.getFlagValue('test-feature-flag');
    expect(mockFeatureFlagClient.getFlagValue).toBeCalled();
    expect(testResult).toBe(true);
  });

  test('Should return overridden flag result', async () => {
    when(config.has as jest.Mock)
      .calledWith('featureFlags.flags.test-feature-flag')
      .mockReturnValue(Promise.resolve(true));
    when(config.get as jest.Mock)
      .calledWith('featureFlags.flags.test-feature-flag')
      .mockReturnValue(Promise.resolve(false));

    const testResult = await featureFlags.getFlagValue('test-feature-flag');
    expect(testResult).toBe(false);
  });

  test('Should return all flag values', async () => {
    const mockData = {
      'test-feature-flag-1': true,
      'test-feature-flag-2': false,
      'test-feature-flag-3': false
    };

    when(mockFeatureFlagClient.getAllFlagValues)
      .calledWith(false)
      .mockReturnValue(Promise.resolve(mockData));

    const testResult = await featureFlags.getAllFlagValues();
    expect(mockFeatureFlagClient.getAllFlagValues).toBeCalled();
    expect(testResult).toStrictEqual(mockData);
  });

  test('Should return all flag with overridden flag values', async () => {
    const mockData = {
      'test-feature-flag-1': true,
      'test-feature-flag-2': false,
      'test-feature-flag-3': false
    };

    const expectedData = {
      'test-feature-flag-1': true,
      'test-feature-flag-2': true,
      'test-feature-flag-3': false
    };

    when(mockFeatureFlagClient.getAllFlagValues)
      .calledWith(false)
      .mockReturnValue(Promise.resolve(mockData));
    when(config.has as jest.Mock)
      .calledWith('featureFlags.flags')
      .mockReturnValue(Promise.resolve(true));
    when(config.get as jest.Mock)
      .calledWith('featureFlags.flags')
      .mockReturnValue({ 'test-feature-flag-2': true });

    const testResult = await featureFlags.getAllFlagValues();
    expect(mockFeatureFlagClient.getAllFlagValues).toBeCalled();
    expect(testResult).toStrictEqual(expectedData);
  });

  test('Should use feature-flag controller if flag is true', async () => {
    const mockReq = mockRequest();
    const mockRes = mockResponse();
    const mockNextController = jest.fn();

    when(mockFeatureFlagClient.getFlagValue)
      .calledWith('test-feature-flag--true', false)
      .mockReturnValue(Promise.resolve(true));

    await featureFlags.toggleRoute('test-feature-flag--true')(mockReq, mockRes, mockNextController);
    expect(mockFeatureFlagClient.getFlagValue).toBeCalledWith('test-feature-flag--true', false);
    expect(mockNextController).toBeCalledWith();
  });

  test('Should send to forbidden error page if flag is false', async () => {
    const mockReq = mockRequest();
    const mockRes = mockResponse();
    const mockNextController = jest.fn();

    when(mockFeatureFlagClient.getFlagValue)
      .calledWith('test-feature-flag--false', false)
      .mockReturnValue(Promise.resolve(false));

    await featureFlags.toggleRoute('test-feature-flag--false')(mockReq, mockRes, mockNextController);
    expect(mockFeatureFlagClient.getFlagValue).toBeCalledWith('test-feature-flag--false', false);
    expect(mockNextController).toBeCalledWith(new HTTPError('FORBIDDEN', 403));
  });
});
