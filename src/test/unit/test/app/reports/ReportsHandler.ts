import { ReportsHandler } from '../../../../../main/app/reports/ReportsHandler';
import { fs } from 'memfs';
import * as uuid from 'uuid';
import config from 'config';
import { when } from 'jest-when';
import * as redis from 'redis';
import { Logger } from '@hmcts/nodejs-logging';

jest.mock('memfs');
jest.mock('uuid');
jest.mock('config');
const redisClientMock = {
  set: jest.fn((a, b, c, d, callback) => callback(null, true)),
  get: jest.fn((a, callback) => callback(null, true))
};
jest.mock('redis', () => ({
  createClient: jest.fn(() => redisClientMock)
}));

describe('Report handler', () => {
  jest.spyOn(uuid, 'v4');
  jest.spyOn(redis, 'createClient');

  const mockLogger = { error: jest.fn(), info: jest.fn() } as Logger;
  const mockTelemetryClient = { trackTrace: jest.fn() } as any;
  const singleRole = [ 'IDAM_SUPER_USER' ];
  const multipleRoles = [ 'IDAM_SUPER_USER', 'IDAM_ADMIN_USER' ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('in memory store', () => {
    fs.promises.writeFile = jest.fn();
    fs.promises.readFile = jest.fn();

    describe('saveReportQueryRoles', () => {

      test('Saves report query with single role', async () => {
        const reportUUID = '5';

        when(fs.promises.writeFile).mockResolvedValue();
        when(uuid.v4).mockReturnValue(reportUUID);

        const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

        await expect(reportsHandler.saveReportQueryRoles(singleRole)).resolves.toEqual(reportUUID);
        expect(fs.promises.writeFile).toHaveBeenCalledWith('/' + reportUUID, JSON.stringify(singleRole));
      });

      test('Saves report query with multiple user roles', async () => {
        const reportUUID = '5';

        when(fs.promises.writeFile).mockResolvedValue();
        when(uuid.v4).mockReturnValue(reportUUID);

        const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

        await expect(reportsHandler.saveReportQueryRoles(multipleRoles)).resolves.toEqual(reportUUID);
        expect(fs.promises.writeFile).toHaveBeenCalledWith('/' + reportUUID, JSON.stringify(multipleRoles));
      });

      test('Return rejected promise when failing to write file', async () => {
        const reportUUID = '5';

        when(uuid.v4).mockReturnValue(reportUUID);
        when(fs.promises.writeFile).mockRejectedValue(false);

        const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

        await expect(reportsHandler.saveReportQueryRoles(singleRole)).rejects.toThrowError();
        expect(mockTelemetryClient.trackTrace).toHaveBeenCalledTimes(1);
        expect(mockLogger.error).toHaveBeenCalledTimes(1);
      });
    });

    describe('getReport', () => {

      test('Load report role query that exists', async () => {
        const reportUUID = '10';

        when(fs.promises.readFile).mockResolvedValue(JSON.stringify(singleRole));

        const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

        await expect(reportsHandler.getReportQueryRoles(reportUUID)).resolves.toEqual(singleRole);
        expect(fs.promises.readFile).toHaveBeenCalledWith('/' + reportUUID);
      });

      test('Throw error when report query does not exist', () => {
        const reportUUID = '10';

        when(fs.promises.readFile).mockRejectedValue('fail');

        const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

        expect(reportsHandler.getReportQueryRoles(reportUUID)).rejects.toThrowError();
        expect(fs.promises.readFile).toHaveBeenCalledWith('/' + reportUUID);
      });
    });
  });

  describe('redis store', () => {

    beforeAll(() => {
      when(config.get).calledWith('session.redis.host').mockReturnValue('host');
      when(config.get).calledWith('session.redis.port').mockReturnValue('6380');
      when(config.get).calledWith('session.redis.key').mockReturnValue('secretKeyHere');
    });

    describe('saveReport', () => {

      test('Saves report query with single user roles', async () => {
        const reportUUID = '5';

        when(uuid.v4).mockReturnValue(reportUUID);

        const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

        await expect(reportsHandler.saveReportQueryRoles(singleRole)).resolves.toEqual(reportUUID);
        expect(redisClientMock.set).toHaveBeenCalledWith(reportUUID, JSON.stringify(singleRole), 'EX', 30 * 60, expect.any(Function));
      });

      test('Saves report query with multiple user roles', async () => {
        const reportUUID = '5';

        when(uuid.v4).mockReturnValue(reportUUID);

        const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

        await expect(reportsHandler.saveReportQueryRoles(multipleRoles)).resolves.toEqual(reportUUID);
        expect(redisClientMock.set).toHaveBeenCalledWith(reportUUID, JSON.stringify(multipleRoles), 'EX', 30 * 60, expect.any(Function));
      });

      test('Return rejected promise when failing to add record to redis', async () => {
        const reportUUID = '5';

        when(uuid.v4).mockReturnValue(reportUUID);
        when(redisClientMock.set).mockImplementation((a, b, c, d, callback) => callback(true, null));

        const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

        await expect(reportsHandler.saveReportQueryRoles(singleRole)).rejects.toThrowError();
        expect(mockTelemetryClient.trackTrace).toHaveBeenCalledTimes(1);
        expect(mockLogger.error).toHaveBeenCalledTimes(1);
      });
    });

    describe('getReport', () => {

      test('Load report query that exists', async () => {
        const reportUUID = '10';

        when(redisClientMock.get).mockImplementation((a, callback) => callback(null, JSON.stringify(singleRole)));

        const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

        await expect(reportsHandler.getReportQueryRoles(reportUUID)).resolves.toEqual(singleRole);
        expect(redisClientMock.get).toHaveBeenCalledWith(reportUUID, expect.any(Function));
      });

      test('Throw error when report query does not exist', () => {
        const reportUUID = '10';

        when(redisClientMock.get).mockImplementation((a, callback) => callback(true, null));

        const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

        expect(reportsHandler.getReportQueryRoles(reportUUID)).rejects.toThrowError();
        expect(redisClientMock.get).toHaveBeenCalledWith(reportUUID, expect.any(Function));
      });
    });
  });
});
