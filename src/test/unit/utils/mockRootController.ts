import { RootController } from '../../../main/controllers/RootController';

export const mockRootController = () => {
  jest.spyOn(RootController.prototype, 'get').mockImplementation((req, res, view, data) => {
    res.render(view, data);
  });

  jest.spyOn(RootController.prototype, 'post').mockImplementation((req, res, view, data) => {
    res.render(view, data);
  });
};
