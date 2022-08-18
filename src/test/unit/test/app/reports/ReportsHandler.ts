import { ReportsHandler } from '../../../../../main/app/reports/ReportsHandler';
import { User } from '../../../../../main/interfaces/User';
import { fs } from 'memfs';
import * as uuid from 'uuid';
import config from 'config';
import { when } from 'jest-when';
import * as redis from 'redis';
import * as json2csv from 'json2csv';

jest.mock('memfs');
jest.mock('uuid');
jest.mock('config');
jest.mock('json2csv');
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

  const mockLogger = { error: jest.fn(), info: jest.fn() } as any;
  const mockTelemetryClient = { trackTrace: jest.fn() } as any;
  const singleUser = [
    {
      id: '1',
      forename: 'test',
      surname: 'test',
      email: 'test@test.email',
      active: true,
      roles: ['IDAM_SUPER_USER'],
    },
  ] as User[];
  const multiUser = [
    {
      id: '1',
      forename: 'test',
      surname: 'test',
      email: 'test@test.email',
      active: true,
      roles: ['IDAM_SUPER_USER'],
    },
    {
      id: '2',
      forename: 'test',
      surname: 'test',
      email: 'test2@test.email',
      active: true,
      roles: ['IDAM_SUPER_USER'],
    }
  ] as User[];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('in memory store', () => {
    fs.promises.writeFile = jest.fn();
    fs.promises.readFile = jest.fn();

    describe('saveReport', () => {

      test('Generates report with single user details', async () => {
        const reportUUID = '5';

        when(fs.promises.writeFile).mockResolvedValue();
        when(uuid.v4).mockReturnValue(reportUUID);

        const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

        await expect(reportsHandler.saveReport(singleUser)).resolves.toEqual(reportUUID);
        expect(fs.promises.writeFile).toHaveBeenCalledWith('/' + reportUUID, JSON.stringify(singleUser));
      });

      test('Generates report with multiple user details', async () => {
        const reportUUID = '5';

        when(fs.promises.writeFile).mockResolvedValue();
        when(uuid.v4).mockReturnValue(reportUUID);

        const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

        await expect(reportsHandler.saveReport(multiUser)).resolves.toEqual(reportUUID);
        expect(fs.promises.writeFile).toHaveBeenCalledWith('/' + reportUUID, JSON.stringify(multiUser));
      });

      test('Return rejected promise when failing to write file', async () => {
        const reportUUID = '5';

        when(uuid.v4).mockReturnValue(reportUUID);
        when(fs.promises.writeFile).mockRejectedValue(false);

        const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

        await expect(reportsHandler.saveReport(singleUser)).rejects.toThrowError();
        expect(mockTelemetryClient.trackTrace).toHaveBeenCalledTimes(1);
        expect(mockLogger.error).toHaveBeenCalledTimes(1);
      });
    });

    describe('getReport', () => {

      test('Load report file that exists', async () => {
        const reportUUID = '10';

        when(fs.promises.readFile).mockResolvedValue(JSON.stringify(singleUser));
        when(json2csv.parse).mockReturnValue(singleUser.toString());

        const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

        await expect(reportsHandler.getReport(reportUUID)).resolves.toEqual(singleUser.toString());
        expect(fs.promises.readFile).toHaveBeenCalledWith('/' + reportUUID);
        expect(json2csv.parse).toHaveBeenCalledWith(singleUser);
      });

      test('Throw error when report does not exist', () => {
        const reportUUID = '10';

        when(fs.promises.readFile).mockRejectedValue('fail');

        const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

        expect(reportsHandler.getReport(reportUUID)).rejects.toThrowError();
        expect(fs.promises.readFile).toHaveBeenCalledWith('/' + reportUUID);
        expect(json2csv.parse).not.toHaveBeenCalled();
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

      test('Generates report with single user details', async () => {
        const reportUUID = '5';

        when(uuid.v4).mockReturnValue(reportUUID);

        const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

        await expect(reportsHandler.saveReport(singleUser)).resolves.toEqual(reportUUID);
        expect(redisClientMock.set).toHaveBeenCalledWith(reportUUID, JSON.stringify(singleUser), 'EX', 30 * 60, expect.any(Function));
      });

      test('Generates report with multiple user details', async () => {
        const reportUUID = '5';

        when(uuid.v4).mockReturnValue(reportUUID);

        const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

        await expect(reportsHandler.saveReport(multiUser)).resolves.toEqual(reportUUID);
        expect(redisClientMock.set).toHaveBeenCalledWith(reportUUID, JSON.stringify(multiUser), 'EX', 30 * 60, expect.any(Function));
      });

      test('Return rejected promise when failing to add record to redis', async () => {
        const reportUUID = '5';

        when(uuid.v4).mockReturnValue(reportUUID);
        when(redisClientMock.set).mockImplementation((a, b, c, d, callback) => callback(true, null));

        const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

        await expect(reportsHandler.saveReport(singleUser)).rejects.toThrowError();
        expect(mockTelemetryClient.trackTrace).toHaveBeenCalledTimes(1);
        expect(mockLogger.error).toHaveBeenCalledTimes(1);
      });
    });

    describe('getReport', () => {

      test('Load report that exists', async () => {
        const reportUUID = '10';

        when(redisClientMock.get).mockImplementation((a, callback) => callback(null, JSON.stringify(singleUser)));

        when(json2csv.parse).mockReturnValue(singleUser.toString());

        const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

        await expect(reportsHandler.getReport(reportUUID)).resolves.toEqual(singleUser.toString());
        expect(redisClientMock.get).toHaveBeenCalledWith(reportUUID, expect.any(Function));
        expect(json2csv.parse).toHaveBeenCalledWith(singleUser);
      });

      test('Throw error when report does not exist', () => {
        const reportUUID = '10';

        when(redisClientMock.get).mockImplementation((a, callback) => callback(true, null));

        const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

        expect(reportsHandler.getReport(reportUUID)).rejects.toThrowError();
        expect(redisClientMock.get).toHaveBeenCalledWith(reportUUID, expect.any(Function));
        expect(json2csv.parse).not.toHaveBeenCalled();
      });
    });
  });
});
