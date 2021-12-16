import { UserDetailsController } from '../../../../main/controllers/UserDetailsController';
import { mockRequest } from '../../utils/mockRequest';
import { mockResponse } from '../../utils/mockResponse';
import { PageData } from '../../../../main/interfaces/PageData';
import { missingEmail } from '../../../../main/utils/error';

describe('User details controller', () => {
  let req: any;
  const res = mockResponse();
  const controller = new UserDetailsController();

  beforeEach(() => {
    req = mockRequest();
  });

  // TO DO - this test needs to be updated once the search for user functionality is implemented
  test('Should render the user details page when searching with a valid email', async () => {
    req.query.email = 'test@test.com';
    await controller.get(req, res);
    expect(res.render).toBeCalledWith('user-details');
  });

  test('Should render the manage users page with error when searching with empty email', async () => {
    req.query.email = '';
    await controller.get(req, res);
    const expectedPageData: PageData = {
      hasError: true,
      errorMessage: missingEmail
    };
    expect(res.render).toBeCalledWith('manage-users', expectedPageData);
  });
});
