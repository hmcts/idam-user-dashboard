import { mockResponse } from '../../utils/mockResponse';
import { mockRequest } from '../../utils/mockRequest';
import { RootController } from '../../../../main/controllers/RootController';
import { PageData } from '../../../../main/interfaces/PageData';
import * as urls from '../../../../main/utils/urls';
import * as flags from '../../../../main/app/feature-flags/flags';


describe('Root controller', () => {
  let req: any;
  const res = mockResponse();
  const mockFeatureToggles: any = {};
  const controller = new RootController(mockFeatureToggles);

  beforeEach(() => {
    req = mockRequest();
    mockFeatureToggles.getAllFlagValues = jest.fn(() => { return Promise.resolve({}); });
  });

  test('Should render the view with no data', async () => {
    await controller.post(req, res, 'view', {});
    expect(res.render).toBeCalledWith('view', { urls });
  });

  test('Should render the view with only feature flag data', async () => {
    mockFeatureToggles.getAllFlagValues = jest.fn(() => {
      return Promise.resolve({ 'unit-test': true });
    });

    const expectedPageData: PageData = {
      featureFlags: {
        flags,
        values: { 'unit-test': true }
      },
      urls
    };

    await controller.post(req, res, 'view', {});
    expect(res.render).toBeCalledWith('view', expectedPageData);
  });

  test('Should render the view with only user data', async () => {
    const userDetails = {
      name: 'JOHN SMITH',
      email: 'johnsmith@user.test'
    };
    req.appSession = { user: userDetails };
    const expectedPageData: PageData = {
      user: userDetails,
      urls
    };

    await controller.post(req, res, 'view', {});
    expect(res.render).toBeCalledWith('view', expectedPageData);
  });

  test('Should render the view with only view data', async () => {
    const expectedPageData: PageData = {
      content: { testContent: 'test text' },
      urls
    };

    await controller.post(req, res, 'view', {
      content: { testContent: 'test text' }
    });
    expect(res.render).toBeCalledWith('view', expectedPageData);
  });

  test('Should render the view with view, user and feature flag data', async () => {
    const userDetails = { name: 'JOHN SMITH', email: 'johnsmith@user.test' };
    const pageData = { testContent: 'test text' };
    const featureFlagData = {
      flags,
      values: { 'unit-test': true }
    };

    const expectedPageData: PageData = {
      user: userDetails,
      content: pageData,
      featureFlags: featureFlagData,
      urls
    };

    mockFeatureToggles.getAllFlagValues = jest.fn(() => {
      return Promise.resolve({ 'unit-test': true });
    });
    req.appSession = { user: userDetails };

    await controller.post(req, res, 'view', { content: pageData });
    expect(res.render).toBeCalledWith('view', expectedPageData);
  });
});
