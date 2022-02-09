import { mockResponse } from '../../utils/mockResponse';
import { mockRequest } from '../../utils/mockRequest';
import { RootController } from '../../../../main/controllers/RootController';
import { PageData } from '../../../../main/interfaces/PageData';


describe('Root controller', () => {
  let req: any;
  const res = mockResponse();
  const controller = new RootController();

  beforeEach(() => {
    req = mockRequest();
  });

  test('Should render the view with no data', async () => {
    controller.post(req, res, 'view', {});
    expect(res.render).toBeCalledWith('view', {});
  });

  test('Should render the view with only user data', async () => {
    const userDetails = {
      name: 'JOHN SMITH',
      email: 'johnsmith@user.test'
    };
    req.session = { user: userDetails };
    const expectedPageData: PageData = { user: userDetails };

    controller.post(req, res, 'view', {});
    expect(res.render).toBeCalledWith('view', expectedPageData);
  });

  test('Should render the view with only view data', async () => {
    const expectedPageData: PageData = { content: { testContent: 'test text' } };

    controller.post(req, res, 'view', {
      content: { testContent: 'test text' }
    });
    expect(res.render).toBeCalledWith('view', expectedPageData);
  });

  test('Should render the view with view and user data', async () => {
    const userDetails = {
      name: 'JOHN SMITH',
      email: 'johnsmith@user.test'
    };
    const expectedPageData: PageData = {
      user: userDetails,
      content: { testContent: 'test text' }
    };

    req.session = { user: userDetails };

    controller.post(req, res, 'view', {
      content: { testContent: 'test text' }
    });
    expect(res.render).toBeCalledWith('view', expectedPageData);
  });
});
