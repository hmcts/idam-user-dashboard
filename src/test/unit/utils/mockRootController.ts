import { RootController } from '../../../main/controllers/RootController';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const mockRootController = (featureFlags?: any ) => {
  jest.spyOn(RootController.prototype, 'get').mockImplementation((req, res, view, data) => {
    data ? res.render(view, data) : res.render(view);
  });

  jest.spyOn(RootController.prototype, 'post').mockImplementation((req, res, view, data) => {
    data ? res.render(view, data) : res.render(view);
  });
};
