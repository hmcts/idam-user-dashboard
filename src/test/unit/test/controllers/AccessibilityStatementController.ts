import { AccessibilityStatementController } from '../../../../main/controllers/AccessibilityStatementController';
import { mockRequest } from '../../utils/mockRequest';
import { mockResponse } from '../../utils/mockResponse';
import { mockRootController } from '../../utils/mockRootController';

describe('Manage accessibility controller', () => {
  mockRootController();
  let req: any;
  const res = mockResponse();
  const controller = new AccessibilityStatementController();

  beforeEach(() => {
    req = mockRequest();
  });

  test('Should render the accessibility statement page', async () => {
    await controller.get(req, res);
    expect(res.render).toHaveBeenCalledWith('accessibility-statement');
  });
});