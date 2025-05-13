import { mockResponse } from '../../utils/mockResponse';
import { mockRequest } from '../../utils/mockRequest';
import { mockApi } from '../../utils/mockApi';
import { DownloadReportController } from '../../../../main/controllers/DownloadReportController';
import { User } from '../../../../main/interfaces/User';
import { IdamAPI } from '../../../../main/app/idam-api/IdamAPI';


describe('Download report controller', () => {
  let req: any;
  let res: any;
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
  const controller = new DownloadReportController(mockReportGenerator, mockApi as unknown as IdamAPI);
  const testToken = 'test-token';

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
  });

  test('Should send report that exists', async () => {
    req.params = { reportUUID: 'someUUID' };
    req.idam_user_dashboard_session = {access_token: testToken};

    mockReportGenerator.getReportQueryRoles.mockResolvedValue(query);
    mockApi.getUsersWithRoles.mockReturnValueOnce(users).mockReturnValue([]);

    await controller.get(req, res);

    const expectedHeader = '"id","forename","surname","email","active","roles"';
    const expectedUser1 = '"1","test","test1","test1@test.email",true,"[""IDAM_SUPER_USER"",""test-role""]"';
    const expectedUser2 = '"2","test","test2","test2@test.email",true,"[]"';
    const fileData = expectedHeader + '\n' + expectedUser2 + '\n' + expectedUser1;

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
