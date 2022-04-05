import { ManageUserController } from '../../../../main/controllers/ManageUserController';
import { mockRequest } from '../../utils/mockRequest';
import { mockResponse } from '../../utils/mockResponse';
import * as urls from '../../../../main/utils/urls';

describe('Manage user controller', () => {
  let req: any;
  const res = mockResponse();
  const controller = new ManageUserController();

  beforeEach(() => {
    req = mockRequest();
  });

  test('Should render the manage user page', async () => {
    await controller.get(req, res);
    expect(res.render).toBeCalledWith('manage-user', { urls });
  });
});
