import { Application } from 'express';

export default function(app: Application): void {
  app.get('/', app.locals.container.cradle.userOptionController.get);
  app.post('/', app.locals.container.cradle.userOptionController.post);
  app.get('/add-users', app.locals.container.cradle.addUsersController.get);
  app.get('/manage-users', app.locals.container.cradle.manageUsersController.get);
  app.get('/user-details', app.locals.container.cradle.userDetailsController.get);
}
