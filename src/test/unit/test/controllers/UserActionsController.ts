import { mockResponse } from '../../utils/mockResponse';
import { mockRequest } from '../../utils/mockRequest';
import { UserActionsController } from '../../../../main/controllers/UserActionsController';
import { EDIT_USER_URL, USER_DELETE_URL } from '../../../../main/utils/urls';

describe('User actions controller', () => {
  let req: any;
  const res = mockResponse();
  const controller = new UserActionsController();

  beforeEach(() => req = mockRequest());

  test('Should redirect to edit controller', async () => {
    req.body = { _action: 'edit' };
    await controller.post(req, res);
    expect(res.redirect).toBeCalledWith(307, EDIT_USER_URL);
  });

  test('Should redirect to delete controller', async () => {
    req.body = { _action: 'delete' };
    await controller.post(req, res);
    expect(res.redirect).toBeCalledWith(307, USER_DELETE_URL);
  });
});
