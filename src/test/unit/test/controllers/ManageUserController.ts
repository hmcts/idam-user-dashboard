import { ManageUserController } from '../../../../main/controllers/ManageUserController';
import { mockRequest } from '../../utils/mockRequest';
import { mockResponse } from '../../utils/mockResponse';
import { mockRootController } from '../../utils/mockRootController';

describe('Manage user controller', () => {
  mockRootController();
  let req: any;
  const res = mockResponse();
  const controller = new ManageUserController();

  beforeEach(() => {
    req = mockRequest();
  });

  test('Should render the manage user page', async () => {
    await controller.get(req, res);
    expect(res.render).toBeCalledWith('manage-user');
  });
});
