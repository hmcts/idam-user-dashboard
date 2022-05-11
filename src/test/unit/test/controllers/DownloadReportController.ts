import { mockResponse } from '../../utils/mockResponse';
import { mockRequest } from '../../utils/mockRequest';
import { DownloadReportController } from '../../../../main/controllers/DownloadReportController';

describe('Download report controller', () => {
  let req: any;
  let res: any;
  const next = jest.fn();
  const mockReportGenerator: any = {
    generate: jest.fn(),
    load: jest.fn(),
  };
  const controller = new DownloadReportController(mockReportGenerator);

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
  });

  test('Should send report that exists', async () => {
    const fileData = 'someFileData';
    req.params = {
      reportUUID: 'someUUID'
    };
    mockReportGenerator.load.mockResolvedValue(fileData);

    await controller.get(req, res, next);
    expect(res.send).toHaveBeenCalledWith(fileData);
    expect(res.attachment).toHaveBeenCalled();
    expect(res.header).toHaveBeenCalledWith('Content-Type', 'text/csv');
  });

  test('Should pass to next middleware (404) if file doesnt exist', async () => {
    req.params = {
      reportUUID: 'someUUID'
    };
    mockReportGenerator.load.mockRejectedValue(false);

    await controller.get(req, res, next);
    expect(res.send).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
