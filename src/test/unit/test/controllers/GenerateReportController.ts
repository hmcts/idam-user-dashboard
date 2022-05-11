import { mockRootController } from '../../utils/mockRootController';
import { mockResponse } from '../../utils/mockResponse';
import { mockRequest } from '../../utils/mockRequest';
import { mockApi } from '../../utils/mockApi';
import { GenerateReportController } from '../../../../main/controllers/GenerateReportController';
import {
  GENERATING_REPORT_CITIZEN_ERROR,
  GENERATING_REPORT_ERROR,
  GENERATING_REPORT_FILE_ERROR,
  MISSING_ROLE_INPUT_ERROR
} from '../../../../main/utils/error';
import { User } from '../../../../main/interfaces/User';

describe('Generate report controller', () => {
  mockRootController();

  let req: any;
  const res = mockResponse();
  const mockReportGenerator: any = {
    generate: jest.fn(),
    load: jest.fn(),
  };
  const controller = new GenerateReportController(mockReportGenerator);

  beforeEach(() => {
    req = mockRequest();
    req.scope.cradle.api = mockApi;
  });

  test('Should render the generate report page', async () => {
    await controller.get(req, res);
    expect(res.render).toBeCalledWith('generate-report');
  });

  test('Should render the generate report page with error when searching with empty query', async () => {
    req.body.search = '';
    await controller.post(req, res);

    expect(res.render).toBeCalledWith('generate-report', {
      error: {
        search: { message: MISSING_ROLE_INPUT_ERROR }
      },
    });
  });

  test('Should render the generate report page with error when attempting to generate citizen report', async () => {
    req.body.search = 'citizen';
    await controller.post(req, res);

    expect(res.render).toBeCalledWith('generate-report', {
      error: {
        search: { message: GENERATING_REPORT_CITIZEN_ERROR }
      },
    });
  });

  test('Should render the generate report page with error when an API error has occurred', async () => {
    req.body.search = 'IDAM_SUPER_USER';

    mockApi.getUsersWithRoles.mockRejectedValue(false);

    await controller.post(req, res);

    expect(res.render).toBeCalledWith('generate-report', {
      error: {
        body: { message: GENERATING_REPORT_ERROR }
      },
    });
  });

  test('Should render the view report page', async () => {
    const query = ['IDAM_SUPER_USER'];
    req.body.search = query[0];
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
    const reportFileName = 'someUUID.csv';

    mockApi.getUsersWithRoles.mockResolvedValue(users);
    mockReportGenerator.generate.mockResolvedValue(reportFileName);

    await controller.post(req, res);

    expect(res.render).toBeCalledWith('view-report', {
      content: {
        query,
        reportFileName,
        reportData: users
      }
    });
  });

  test('Should render the view report page with a warning when an error has occurred creating the report file', async () => {
    const query = ['IDAM_SUPER_USER'];
    req.body.search = query[0];
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
    mockReportGenerator.generate.mockRejectedValue(false);

    await controller.post(req, res);

    expect(res.render).toBeCalledWith('view-report', {
      content: {
        query,
        reportData: users
      },
      error: {
        body: { message: GENERATING_REPORT_FILE_ERROR }
      },
    });
  });
});
