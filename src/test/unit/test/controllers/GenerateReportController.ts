import { mockRootController } from '../../utils/mockRootController';
import { mockResponse } from '../../utils/mockResponse';
import { mockRequest } from '../../utils/mockRequest';
import { GenerateReportController } from '../../../../main/controllers/GenerateReportController';
import {
  GENERATING_REPORT_CITIZEN_ERROR,
  GENERATING_REPORT_ERROR,
  MISSING_ROLE_INPUT_ERROR
} from '../../../../main/utils/error';
import {VIEW_REPORT_URL} from '../../../../main/utils/urls';

describe('Generate report controller', () => {
  mockRootController();

  let req: any;
  const res = mockResponse();
  const mockReportGenerator: any = {
    saveReportQueryRoles: jest.fn(),
    getReportQueryRoles: jest.fn(),
  };
  const controller = new GenerateReportController(mockReportGenerator);

  beforeEach(() => {
    req = mockRequest();
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
    const query = ['IDAM_SUPER_USER'];
    req.body.search = query[0];
    mockReportGenerator.saveReportQueryRoles.mockRejectedValue(false);
    await controller.post(req, res);
    expect(res.render).toBeCalledWith('generate-report', {
      error: {
        body: { message: GENERATING_REPORT_ERROR }
      },
    });
  });

  test('Should redirect to the view report', async () => {
    const query = ['IDAM_SUPER_USER'];
    req.body.search = query[0];
    const reportUUID = 'someUUID';

    mockReportGenerator.saveReportQueryRoles.mockResolvedValue(reportUUID);

    await controller.post(req, res);

    expect(res.redirect).toBeCalledWith(307, VIEW_REPORT_URL.replace(':reportUUID', reportUUID));
  });
});
