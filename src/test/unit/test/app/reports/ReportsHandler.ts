import { ReportsHandler } from '../../../../../main/app/reports/ReportsHandler';
import { User } from '../../../../../main/interfaces/User';
import { fs } from 'memfs';
import * as uuid from 'uuid';
import { when } from 'jest-when';
import path from 'path';

jest.mock('memfs');
jest.mock('uuid');

describe('Report handler', () => {
  const reportsFolder = path.join('/');

  fs.promises.writeFile = jest.fn();
  fs.promises.readFile = jest.fn();
  jest.spyOn(uuid, 'v4');

  describe('generate', () => {
    test('Generates report with single user details', () => {
      const users = [
        {
          id: '1',
          forename: 'test',
          surname: 'test',
          email: 'test@test.email',
          active: true,
          roles: ['IDAM_SUPER_USER'],
        },
      ] as User[];
      const reportUUID = '5';
      const reportFileLocation = path.join(reportsFolder, reportUUID + '.csv');

      const mockLogger = {} as any;
      const mockTelemetryClient = {} as any;
      when(fs.promises.writeFile).mockResolvedValue();
      when(uuid.v4).mockReturnValue(reportUUID);

      const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

      expect(reportsHandler.generate(users)).resolves.toEqual(reportUUID);
      expect(fs.promises.writeFile).toHaveBeenCalledWith(reportFileLocation, expect.any(String));
    });

    test('Generates report with multiple user details', () => {
      const users = [
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
      const reportUUID = '5';
      const reportFileLocation = path.join(reportsFolder, reportUUID + '.csv');

      const mockLogger = {} as any;
      const mockTelemetryClient = {} as any;
      when(fs.promises.writeFile).mockResolvedValue();
      when(uuid.v4).mockReturnValue(reportUUID);

      const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

      expect(reportsHandler.generate(users)).resolves.toEqual(reportUUID);
      expect(fs.promises.writeFile).toHaveBeenCalledWith(reportFileLocation, expect.any(String));
    });

    test('Return rejected promise when failing to write file', () => {
      const users = [
        {
          id: '1',
          forename: 'test',
          surname: 'test',
          email: 'test@test.email',
          active: true,
          roles: ['IDAM_SUPER_USER'],
        },
      ] as User[];

      const mockLogger = {error: jest.fn()} as any;
      const mockTelemetryClient = {trackTrace: jest.fn()} as any;
      when(fs.promises.writeFile).mockRejectedValue(false);

      const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

      expect(reportsHandler.generate(users)).rejects.toThrowError();
    });
  });

  describe('load', () => {
    test('Load report file that exists', () => {
      const reportUUID = '10';
      const reportFileLocation = path.join(reportsFolder, reportUUID + '.csv');
      const fileContents = 'someFileContents';
      const mockLogger = {} as any;
      const mockTelemetryClient = {} as any;

      when(fs.promises.readFile).mockResolvedValue(fileContents);

      const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

      expect(reportsHandler.load(reportUUID)).resolves.toEqual(fileContents);
      expect(fs.promises.readFile).toHaveBeenCalledWith(reportFileLocation);
    });

    test('Load report file that exists', () => {
      const reportUUID = '10';
      const reportFileLocation = path.join(reportsFolder, reportUUID + '.csv');
      const fileContents = 'someFileContents';

      const mockLogger = {} as any;
      const mockTelemetryClient = {} as any;
      when(fs.promises.readFile).mockResolvedValue(fileContents);

      const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

      expect(reportsHandler.load(reportUUID)).resolves.toEqual(fileContents);
      expect(fs.promises.readFile).toHaveBeenCalledWith(reportFileLocation);
    });

    test('Throw error when report does not exist', () => {
      const reportUUID = '10';
      const reportFileLocation = path.join(reportsFolder, reportUUID + '.csv');

      const mockLogger = {error: jest.fn()} as any;
      const mockTelemetryClient = {trackTrace: jest.fn()} as any;
      when(fs.promises.readFile).mockRejectedValue('fail');

      const reportsHandler = new ReportsHandler(mockLogger, mockTelemetryClient);

      expect(reportsHandler.load(reportUUID)).rejects.toThrowError();
      expect(fs.promises.readFile).toHaveBeenCalledWith(reportFileLocation);
    });
  });
});
