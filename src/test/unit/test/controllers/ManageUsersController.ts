import { ManageUsersController } from '../../../../main/controllers/ManageUsersController';
import { mockRequest } from '../../utils/mockRequest';
import { mockResponse } from '../../utils/mockResponse';
import * as urls from '../../../../main/utils/urls';

describe('Manage users controller', () => {
  let req: any;
  const res = mockResponse();
  const controller = new ManageUsersController();

  beforeEach(() => {
    req = mockRequest();
  });

  test('Should render the manage users page', async () => {
    await controller.get(req, res);
    expect(res.render).toBeCalledWith('manage-users', { urls });
  });
});
