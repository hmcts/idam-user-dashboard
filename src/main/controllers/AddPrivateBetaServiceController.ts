import autobind from 'autobind-decorator';
import { RootController } from './RootController';
import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import asyncError from '../modules/error-handler/asyncErrorDecorator';
import { hasProperty, isEmpty } from '../utils/utils';
import { MISSING_PRIVATE_BETA_SERVICE_ERROR } from '../utils/error';
import { getServicesForSelect } from '../utils/serviceUtils';
import { UserType } from '../utils/UserType';
import { PRIVATE_BETA_ROLE } from '../utils/serviceUtils';

@autobind
export class AddPrivateBetaServiceController extends RootController {
  @asyncError
  public async post(req: AuthedRequest, res: Response) {
    const allServices = await req.scope.cradle.api.getAllServices();
    const fields = req.body;
    const privateBetaServices = getServicesForSelect(allServices);
    const user = {
      email: fields._email,
      forename: fields._forename,
      surname: fields._surname
    };

    if (hasProperty(fields, 'service') && isEmpty(fields.service)) {
      return super.post(req, res, 'add-user-private-beta-service', {
        content: { user: user, services: privateBetaServices, selectedService: fields.service },
        error: { privateBeta : { message: MISSING_PRIVATE_BETA_SERVICE_ERROR } }
      });
    }

    const selectedService = allServices.find(service => service.label === fields.service);
    const privateBetaRole = selectedService.onboardingRoles.find(element => element.includes(PRIVATE_BETA_ROLE));

    return req.scope.cradle.api.registerUser({
      email: fields._email,
      firstName: fields._forename,
      lastName: fields._surname,
      roles: [UserType.Citizen, privateBetaRole]
    })
      .then (() => {
        return super.post(req, res, 'add-user-completion');
      })
      .catch((error) => {
        return super.post(req, res, 'add-user-private-beta-service', {
          content: { user: user, services: privateBetaServices, selectedService: fields.service },
          error: { userRegistration : { message: error } }
        });
      });
  }
}
