import { UserOptionController } from '../../../../main/controllers/UserOptionController';
import { mockRequest } from '../../utils/mockRequest';
import { mockResponse } from '../../utils/mockResponse';
import { PageData } from '../../../../main/interfaces/PageData';
import { MISSING_OPTION_ERROR } from '../../../../main/utils/error';

describe('User option controller', () => {
  let req: any;
  const res = mockResponse();
  const controller = new UserOptionController();

  beforeEach(() => {
    req = mockRequest();
  });

  test('Should render the user option page', async () => {
    await controller.get(req, res);
    expect(res.render).toBeCalledWith('user-option');
  });

  test('Should render the user option page with error when posting with no option selected', async () => {
    await controller.post(req, res);
    const expectedPageData: PageData = {
      hasError: true,
      errorMessage: MISSING_OPTION_ERROR
    };
    expect(res.render).toBeCalledWith('user-option', expectedPageData);
  });

  test('Should redirect to the manage users page when \'Manage exiting users\' option is selected', async () => {
    req.body = {
      userAction: 'manage-users',
    };
    await controller.post(req, res);
    expect(res.redirect).toBeCalledWith('/manage-users');
  });

  test('Should redirect to the add users page when \'Add new users\' option is selected', async () => {
    req.body = {
      userAction: 'add-users',
    };
    await controller.post(req, res);
    expect(res.redirect).toBeCalledWith('/add-users');
  });
});
