import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import { RootController } from './RootController';
import autobind from 'autobind-decorator';
import { hasProperty, isEmpty, isObjectEmpty, isValidEmailFormat } from '../utils/utils';
import {
  duplicatedEmailError,
  INVALID_EMAIL_FORMAT_ERROR,
  MISSING_EMAIL_ERROR,
  MISSING_USER_TYPE_ERROR,
  USER_EMPTY_FORENAME_ERROR,
  USER_EMPTY_SURNAME_ERROR
} from '../utils/error';
import asyncError from '../modules/error-handler/asyncErrorDecorator';
import { PageError} from '../interfaces/PageData';
import { constructAllRoleAssignments } from '../utils/roleUtils';

@autobind
export class AddUserDetailsController extends RootController {
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
    if (isEmpty(email.trim())) {
      return this.postError(req, res, MISSING_EMAIL_ERROR);
    } else if (!isValidEmailFormat(email)) {
      return this.postError(req, res, INVALID_EMAIL_FORMAT_ERROR);
    }

    // check if the user with the same email already exists
    const users = await req.scope.cradle.api.searchUsersByEmail(email);
    if (users.length == 0) {
      return super.post(req, res, 'add-user-details', {content: {
        user: {
          email: email
        },
      }});
    }

    return this.postError(req, res, duplicatedEmailError(email));
  }

  private async processNewUserDetails(req: AuthedRequest, res: Response) {
    const fields = req.body;
    Object.keys(fields).forEach(field => fields[field] = (typeof fields[field] === 'string') ? fields[field].trim(): fields[field]);
    const error = this.validateFields(fields);
    const user = await this.constructUserDetails(fields);
    if(!isObjectEmpty(error)) {
      return super.post(req, res, 'add-user-details', {
        content: {
          user: user
        },
        error
      });
    }

    const allRoles = await req.scope.cradle.api.getAllRoles();
    const roleAssignment = constructAllRoleAssignments(allRoles, req.session.user.assignableRoles);
    super.post(req, res, 'add-user-roles', {
      content: {
        user: user,
        roles: roleAssignment
      }
    });

    return;
  }

  private postError(req: AuthedRequest, res: Response, errorMessage: string) {
    return super.post(req, res, 'add-users', { error: {
      email: { message: errorMessage }
    }});
  }

  private validateFields(fields: any): PageError {
    const { forename, surname } = fields;
    const error: PageError = {};

    if (hasProperty(fields, 'forename') && isEmpty(forename)) error.forename = { message: USER_EMPTY_FORENAME_ERROR };
    if (hasProperty(fields, 'surname') && isEmpty(surname)) error.surname = { message: USER_EMPTY_SURNAME_ERROR };
    if (!hasProperty(fields, 'userType')) error.userType = { message: MISSING_USER_TYPE_ERROR };

    return error;
  }

  private async constructUserDetails(fields: any): Promise<any> {
    return {
      email: fields._email,
      forename: fields.forename,
      surname: fields.surname,
      userType: this.getUserType(fields)
    };
  }

  private getUserType(fields: any): string {
    return hasProperty(fields, 'userType') ? fields.userType : '';
  }
}
