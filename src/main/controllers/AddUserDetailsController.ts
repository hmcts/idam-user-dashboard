import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import { RootController } from './RootController';
import autobind from 'autobind-decorator';
import { hasProperty, isEmpty, isObjectEmpty, isValidEmailFormat } from '../utils/utils';
import {
  duplicatedEmailError,
  INVALID_EMAIL_FORMAT_ERROR,
  MISSING_EMAIL_ERROR, MISSING_PRIVATE_BETA_SERVICE_ERROR,
  MISSING_USER_TYPE_ERROR,
  USER_EMPTY_FORENAME_ERROR,
  USER_EMPTY_SURNAME_ERROR
} from '../utils/error';
import { SearchType } from '../utils/SearchType';
import asyncError from '../modules/error-handler/asyncErrorDecorator';
import { PageError} from '../interfaces/PageData';
import { SelectItem } from '../interfaces/SelectItem';
import { Service } from '../interfaces/Service';
import { UserType } from '../utils/UserType';

const PRIVATE_BETA_CITIZEN_ROLE = 'citizen';
const SERVICE_PRIVATE_BETA_ROLE_SUFFIX = '-private-beta';

@autobind
export class AddUserDetailsController extends RootController{
  public get(req: AuthedRequest, res: Response) {
    return super.get(req, res, 'add-user-details');
  }

  @asyncError
  public async post(req: AuthedRequest, res: Response) {
    if (hasProperty(req.body, 'email')) {
      return await this.processNewUserEmail(req, res);
    }
    return await this.processNewUserDetails(req, res);
  }

  private async processNewUserEmail(req: AuthedRequest, res: Response) {
    const email = req.body.email as string;
    if (isEmpty(email)) {
      return this.postError(req, res, MISSING_EMAIL_ERROR);
    } else if (!isValidEmailFormat(email)) {
      return this.postError(req, res, INVALID_EMAIL_FORMAT_ERROR);
    }

    // check if the user with the same email already exists
    const users = await req.scope.cradle.api.getUserDetails(SearchType.Email, email);
    if (users.length == 0) {
      const services = await this.getServicesWithPrivateBetaRole(req);
      return super.post(req, res, 'add-user-details', {content: {
        user: {
          email: email
        },
        services: this.getServicesForSelect(services)
      }});
    }

    return this.postError(req, res, duplicatedEmailError(email));
  }

  private async processNewUserDetails(req: AuthedRequest, res: Response) {
    const fields = req.body;
    const services = await this.getServicesWithPrivateBetaRole(req);
    const error = this.validateFields(fields);
    if(!isObjectEmpty(error)) {
      const value = await this.constructUserDetails(req, fields, services);
      return super.post(req, res, 'add-user-details', {
        content: value,
        error
      });
    }

    await req.scope.cradle.api.registerUser({
      email: '',
      firstName: fields.forename,
      lastName: fields.surname,
      roles: this.constructUserRoles(fields)
    });

    super.post(req, res, 'add-user-completion');
  }

  private postError(req: AuthedRequest, res: Response, errorMessage: string) {
    return super.post(req, res, 'add-users', { error: {
      email: { message: errorMessage }
    }});
  }

  private validateFields(fields: any): PageError {
    const { forename, surname, service } = fields;
    const error: PageError = {};

    if (hasProperty(fields, 'forename') && isEmpty(forename)) error.forename = { message: USER_EMPTY_FORENAME_ERROR };
    if (hasProperty(fields, 'surname') && isEmpty(surname)) error.surname = { message: USER_EMPTY_SURNAME_ERROR };
    if (!hasProperty(fields, 'userType')) error.userType = { message: MISSING_USER_TYPE_ERROR };
    if (hasProperty(fields, 'userType') && isEmpty(service)) error.service = { message: MISSING_PRIVATE_BETA_SERVICE_ERROR };

    return error;
  }

  private async getServicesWithPrivateBetaRole(req: AuthedRequest): Promise<Service[]> {
    const services = await req.scope.cradle.api.getAllServices();
    return services.filter( service => service.onboardingRoles.length > 0);
  }

  private getServicesForSelect(services: Service[]): SelectItem[] {
    return services.map((service) => (
      {value: service.label, text: service.label, selected: false}));
  }

  private constructUserRoles(fields: any): string[] {
    const roles: string[] = [];
    if (fields.userType === UserType.Citizen) {
      roles.push(PRIVATE_BETA_CITIZEN_ROLE);
      roles.push(fields.service + SERVICE_PRIVATE_BETA_ROLE_SUFFIX);
    }
    return roles;
  }

  private async constructUserDetails(req: AuthedRequest, fields: any, services: Service[]): Promise<any> {
    return {
      user : {
        email: fields._email,
        forename: fields.forename,
        surname: fields.surname,
        userType: this.getUserType(fields)
      },
      services: this.getServicesForSelect(services),
      selectedService: fields.service
    };
  }

  private getUserType(fields: any): string {
    return hasProperty(fields, 'userType') ? fields.userType : '';
  }
}
