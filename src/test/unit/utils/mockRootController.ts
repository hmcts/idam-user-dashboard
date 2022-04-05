import { RootController } from '../../../main/controllers/RootController';

export const mockRootController = () => {
  jest.spyOn(RootController.prototype, 'get').mockImplementation((req, res, view, data) => {
    data ? res.render(view, data) : res.render(view);
  });

  jest.spyOn(RootController.prototype, 'post').mockImplementation((req, res, view, data) => {
    data ? res.render(view, data) : res.render(view);
  });
};
