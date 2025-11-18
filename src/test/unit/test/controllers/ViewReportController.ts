import { mockRootController } from '../../utils/mockRootController';
import { mockResponse } from '../../utils/mockResponse';
import { mockRequest } from '../../utils/mockRequest';
import { mockApi } from '../../utils/mockApi';
import { ViewReportController } from '../../../../main/controllers/ViewReportController';
import {
  GENERATING_REPORT_FILE_ERROR,
  GENERATING_REPORT_NO_USERS_MATCHED,
} from '../../../../main/utils/error';
import { User } from '../../../../main/interfaces/User';
import { IdamAPI } from '../../../../main/app/idam-api/IdamAPI';

describe('Generate report controller', () => {
  mockRootController();

  let req: any;
  const res = mockResponse();
  const mockReportGenerator: any = {
    saveReportQueryRoles: jest.fn(),
    getReportQueryRoles: jest.fn(),
  };
  const controller = new ViewReportController(mockReportGenerator, mockApi as unknown as IdamAPI);
  const testToken = 'test-token';

  beforeEach(() => {
    req = mockRequest();
    req.idam_user_dashboard_session = {access_token: testToken};
  });

  test('Should render the view report page', async () => {
    const query = ['IDAM_SUPER_USER'];
    const reportUUID = 'someUUID';
    req.body.search = query[0];
    req.params = { reportUUID: reportUUID };
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

    mockApi.getUsersWithRoles.mockResolvedValue(users);
    mockReportGenerator.getReportQueryRoles.mockResolvedValue(query);

    await controller.post(req, res);

    expect(res.render).toHaveBeenCalledWith('view-report', {
      content: {
        query,
        reportUUID,
        reportData: users
      }
    });
  });

  test('Should render the view report page with no users matched error when searching non existent / unassigned role', async () => {
    const query = ['XYZ'];
    req.body.search = query[0];
    const reportUUID = 'someUUID';
    req.params = { reportUUID: reportUUID };

    const users = [] as User[];


    mockApi.getUsersWithRoles.mockResolvedValue(users);
    mockReportGenerator.getReportQueryRoles.mockResolvedValue(query);

    await controller.post(req, res);
    expect(res.render).toHaveBeenCalledWith('view-report', {
      content: {
        reportData: users,
        query
      },
      error: {
        body: { message: GENERATING_REPORT_NO_USERS_MATCHED }
      },
    });

  });

  test('Should render the view report page with a warning when an error has occurred fetching report query', async () => {
    const query = ['IDAM_SUPER_USER'];
    req.body.search = query[0];
    const reportUUID = 'someUUID';
    req.params = { reportUUID: reportUUID };

    mockReportGenerator.getReportQueryRoles.mockRejectedValue(false);

    await controller.post(req, res);

    expect(res.render).toHaveBeenCalledWith('view-report', {
      error: {
        body: { message: GENERATING_REPORT_FILE_ERROR }
      },
    });
  });
});
