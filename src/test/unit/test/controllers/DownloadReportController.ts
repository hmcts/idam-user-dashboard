import { mockResponse } from '../../utils/mockResponse';
import { mockRequest } from '../../utils/mockRequest';
import { mockApi } from '../../utils/mockApi';
import { DownloadReportController } from '../../../../main/controllers/DownloadReportController';
import { User } from '../../../../main/interfaces/User';
import { when } from 'jest-when';
import * as json2csv from 'json2csv';
const {Logger} = require('@hmcts/nodejs-logging');

jest.mock('json2csv');

describe('Download report controller', () => {
  let req: any;
  let res: any;
  const mockLogger = { info: jest.fn() } as typeof Logger;
  const mockReportGenerator: any = {
    saveReportQueryRoles: jest.fn(),
    getReportQueryRoles: jest.fn(),
  };
  const query = ['IDAM_SUPER_USER'];
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
      email: 'test@test.email',
      active: true,
      roles: ['IDAM_SUPER_USER'],
    },
  ] as User[];
  const controller = new DownloadReportController(mockLogger, mockReportGenerator);
  const testToken = 'test-token';

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    req.scope.cradle.api = mockApi;
  });

  test('Should send report that exists', async () => {
    const fileData = 'someFileData';
    req.params = { reportUUID: 'someUUID' };
    req.idam_user_dashboard_session = {access_token: testToken};

    mockReportGenerator.getReportQueryRoles.mockResolvedValue(query);
    mockApi.getUsersWithRoles.mockReturnValueOnce(users).mockReturnValue([]);
    when(json2csv.parse).mockReturnValue(fileData);

    await controller.get(req, res);
    expect(res.send).toHaveBeenCalledWith(fileData);
    expect(res.attachment).toHaveBeenCalled();
    expect(res.header).toHaveBeenCalledWith('Content-Type', 'text/csv');
  });

  test('Should render view reports page with error if no data returns', async () => {
    req.params = { reportUUID: 'someUUID' };
    mockReportGenerator.getReportQueryRoles.mockRejectedValue(false);

    await controller.get(req, res);
    expect(res.send).not.toHaveBeenCalled();
    expect(res.render).toBeCalledWith('view-report', expect.any(Object));
  });
});
