import { mockResponse } from '../../utils/mockResponse';
import { mockRequest } from '../../utils/mockRequest';
import { mockApi } from '../../utils/mockApi';
import { DownloadReportController } from '../../../../main/controllers/DownloadReportController';
import { User } from '../../../../main/interfaces/User';
import { IdamAPI } from '../../../../main/app/idam-api/IdamAPI';
import config from 'config';

jest.mock('config');

describe('Download report controller', () => {
  let req: any;
  let res: any;
  let controller: DownloadReportController;
  const mockReportGenerator: any = {
    saveReportQueryRoles: jest.fn(),
    getReportQueryRoles: jest.fn(),
  };
  const query = ['IDAM_SUPER_USER'];
  const users = [
    {
      id: '1',
      forename: 'test',
      surname: 'test1',
      email: 'test1@test.email',
      active: true,
      roles: ['IDAM_SUPER_USER', 'test-role'],
    },
    {
      id: '2',
      forename: 'test',
      surname: 'test2',
      email: 'test2@test.email',
      active: true,
      roles: [],
    },
  ] as User[];
  const testToken = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
    mockReportGenerator.saveReportQueryRoles.mockReset();
    mockReportGenerator.getReportQueryRoles.mockReset();
    mockApi.getUsersWithRoles.mockReset();
    req = mockRequest();
    res = mockResponse();
    (config.get as jest.Mock).mockImplementation((key: string) => {
      switch (key) {
        case 'reports.download.maxPages':
          return 5;
        case 'reports.download.pageSize':
          return 2000;
        default:
          return undefined;
      }
    });
    controller = new DownloadReportController(mockReportGenerator, mockApi as unknown as IdamAPI);
    (controller as any).reportDownloadMaxPages = 5;
    (controller as any).reportDownloadPageSize = 2000;
  });

  test('Should send report that exists', async () => {
    req.params = { reportUUID: 'someUUID' };
    req.idam_user_dashboard_session = {access_token: testToken};

    mockReportGenerator.getReportQueryRoles.mockResolvedValue(query);
    mockApi.getUsersWithRoles
      .mockResolvedValueOnce({ users, hasNextPage: true })
      .mockResolvedValueOnce({ users: [], hasNextPage: false });

    await controller.get(req, res);

    const expectedHeader = '"id","forename","surname","email","active","roles"';
    const expectedUser1 = '"1","test","test1","test1@test.email",true,"[""IDAM_SUPER_USER"",""test-role""]"';
    const expectedUser2 = '"2","test","test2","test2@test.email",true,"[]"';
    const fileData = expectedHeader + '\n' + expectedUser2 + '\n' + expectedUser1;

    expect(res.send).toHaveBeenCalledWith(fileData);
    expect(res.attachment).toHaveBeenCalled();
    expect(res.header).toHaveBeenCalledWith('Content-Type', 'text/csv');
  });

  test('Should mark report file as partial when total exceeds configured maximum', async () => {
    req.params = { reportUUID: 'someUUID' };
    req.idam_user_dashboard_session = {access_token: testToken};

    const pagedUsers = Array.from({ length: 2000 }, (_, index) => ({
      id: `${index}`,
      forename: `test${index}`,
      surname: 'partial',
      email: `test${index}@test.email`,
      active: true,
      roles: ['caseworker'],
    })) as User[];

    mockReportGenerator.getReportQueryRoles.mockResolvedValue(['caseworker']);
    mockApi.getUsersWithRoles
      .mockResolvedValue({ users: pagedUsers, hasNextPage: true });

    await controller.get(req, res);

    expect(mockApi.getUsersWithRoles).toHaveBeenCalledTimes(5);
    expect(res.attachment).toHaveBeenCalledWith(expect.stringMatching(/^user-report-.*-partial\.csv$/));
  });

  test('Should render view reports page with error if no data returns', async () => {
    req.params = { reportUUID: 'someUUID' };
    mockReportGenerator.getReportQueryRoles.mockRejectedValue(false);

    await controller.get(req, res);
    expect(res.send).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith('view-report', expect.any(Object));
  });
});
