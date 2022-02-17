import { AddUsersController } from '../../../../main/controllers/AddUsersController';
import { mockRequest } from '../../utils/mockRequest';
import { mockResponse } from '../../utils/mockResponse';
import * as urls from '../../../../main/utils/urls';

describe('Add users controller', () => {
  let req: any;
  const res = mockResponse();
  const controller = new AddUsersController();

  beforeEach(() => {
    req = mockRequest();
  });

  test('Should render the add users page', async () => {
    await controller.get(req, res);
    expect(res.render).toBeCalledWith('add-users', { urls });
  });
});
