import { UserOptionController } from '../../../../main/controllers/UserOptionController';
import { mockRequest } from '../../utils/mockRequest';
import { mockResponse } from '../../utils/mockResponse';
import { PageData } from '../../../../main/interfaces/PageData';
import * as urls from '../../../../main/utils/urls';
import { mockRootController } from '../../utils/mockRootController';
import {when} from 'jest-when';

describe('User option controller', () => {
  const mockFeatureFlags: any = {
    getFlagValue: jest.fn(),
    getAllFlagValues: jest.fn(),
    toggleRoute: jest.fn()
  };
  mockRootController(mockFeatureFlags);
  let req: any;
  const res = mockResponse();
  const controller = new UserOptionController();

  beforeEach(() => {
    req = mockRequest();
  });

  test('Should render the user option page with a single option', async () => {
    when(mockFeatureFlags.getAllFlagValues)
      .calledWith()
      .mockReturnValue(Promise.resolve({}));

    await controller.get(req, res);
    const expectedPageData: PageData = {
      content: { options: [ {value: 'manage-user', text: 'Manage an existing user' } ] },
    };
    expect(res.render).toBeCalledWith('user-option', expectedPageData);
  });

  test('Should render the user option page with multiple options', async () => {
    const mockData = {
      'idam-user-dashboard--beta-add': true,
      'idam-user-dashboard--gamma-generate-report': true
    };
    when(mockFeatureFlags.getAllFlagValues)
      .calledWith()
      .mockReturnValue(Promise.resolve(mockData));

    await controller.get(req, res);
    const expectedPageData: PageData = {
      content: { options: [
        { value: 'manage-user', text: 'Manage an existing user' },
        { value: 'add-user', text: 'Add a new user' },
        { value: 'generate-report', text: 'Generate a user report' }
      ]},
    };
    expect(res.render).toBeCalledWith('user-option', expectedPageData);
  });

  test('Should render the user option page with error when posting with no option selected', async () => {
    when(mockFeatureFlags.getAllFlagValues)
      .calledWith()
      .mockReturnValue(Promise.resolve({ 'idam-user-dashboard--beta-add': true }));

    await controller.post(req, res);
    const expectedPageData: PageData = {
      content: { options: [
        { value: 'manage-user', text: 'Manage an existing user' },
        { value: 'add-user', text: 'Add a new user' }
      ]},
      error: { userAction: { message: 'Select if you would like to manage an existing user or add a new user' } },
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
