import { AddUserController } from '../../../../main/controllers/AddUserController';
import { mockRequest } from '../../utils/mockRequest';
import { mockResponse } from '../../utils/mockResponse';
import * as urls from '../../../../main/utils/urls';

describe('Add user controller', () => {
  let req: any;
  const res = mockResponse();
  const controller = new AddUserController();

  beforeEach(() => {
    req = mockRequest();
  });

  test('Should render the add user page', async () => {
    await controller.get(req, res);
    expect(res.render).toBeCalledWith('add-user', { urls });
  });
});
