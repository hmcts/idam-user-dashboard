import { AccessibilityStatementController } from '../../../../main/controllers/AccessibilityStatementController';
import { mockRequest } from '../../utils/mockRequest';
import { mockResponse } from '../../utils/mockResponse';

describe('Manage accessibility controller', () => {
  let req: any;
  const res = mockResponse();
  const controller = new AccessibilityStatementController();

  beforeEach(() => {
    req = mockRequest();
  });

  test('Should render the accessibility statement page', async () => {
    await controller.get(req, res);
    expect(res.render).toBeCalledWith('accessibility-statement');
  });
});