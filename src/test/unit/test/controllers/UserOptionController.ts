import { UserOptionController } from '../../../../main/controllers/UserOptionController';
import { mockRequest } from '../../utils/mockRequest';
import { mockResponse } from '../../utils/mockResponse';
import { PageData } from '../../../../main/interfaces/PageData';
import { MISSING_OPTION_ERROR } from '../../../../main/utils/error';
import * as urls from '../../../../main/utils/urls';
import { mockRootController } from '../../utils/mockRootController';

describe('User option controller', () => {
  mockRootController();
  let req: any;
  const res = mockResponse();
  const controller = new UserOptionController();

  beforeEach(() => {
    req = mockRequest();
  });

  test('Should render the user option page', async () => {
    await controller.get(req, res);
    expect(res.render).toBeCalledWith('user-option' );
  });

  test('Should render the user option page with error when posting with no option selected', async () => {
    await controller.post(req, res);
    const expectedPageData: PageData = {
      error: { userAction: { message: MISSING_OPTION_ERROR }},
    };

    expect(res.render).toBeCalledWith('user-option', expectedPageData);
  });

  test('Should redirect to the manage user page when "Manage an exiting user" option is selected', async () => {
    req.body = {
      userAction: 'manage-user',
    };
    await controller.post(req, res);
    expect(res.redirect).toBeCalledWith(urls.MANAGER_USER_URL);
  });

  test('Should redirect to the add user page when "Add a new user" option is selected', async () => {
    req.body = {
      userAction: 'add-user',
    };
    await controller.post(req, res);
    expect(res.redirect).toBeCalledWith(urls.ADD_USER_URL);
  });

  test('Should redirect to the generate a report page when "Generate a user report" option is selected', async () => {
    req.body = {
      userAction: 'generate-report',
    };
    await controller.post(req, res);
    expect(res.redirect).toBeCalledWith(urls.GENERATE_REPORT_URL);
  });
});
