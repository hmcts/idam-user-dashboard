import autobind from 'autobind-decorator';
import { RootController } from './RootController';
import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import asyncError from '../modules/error-handler/asyncErrorDecorator';
import { hasProperty, isEmpty } from '../utils/utils';
import { MISSING_PRIVATE_BETA_SERVICE_ERROR } from '../utils/error';
import { getServicesForSelect } from '../utils/serviceUtils';
import { UserType } from '../utils/UserType';
import { Service } from '../interfaces/Service';
import { V2Role } from '../interfaces/V2Role';
import { InviteService } from '../app/invite-service/InviteService';
import { IdamAPI } from '../app/idam-api/IdamAPI';
import { FeatureFlags } from '../app/feature-flags/FeatureFlags';
@autobind
export class AddPrivateBetaServiceController extends RootController {
  constructor(
    private readonly inviteService: InviteService,
    private readonly idamWrapper: IdamAPI,
    protected featureFlags?: FeatureFlags
  ) {
    super(featureFlags);
  }

  @asyncError
  public async post(req: AuthedRequest, res: Response) {
    const allServices = await this.idamWrapper.getAllServices();
    const fields = req.body;
    const rolesMap = await this.getRolesMap();
    const privateBetaServices = getServicesForSelect(allServices, rolesMap);
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
    const rolesToAdd = await this.getRolesToRegisterUser(allServices, fields.service);

    return this.inviteService.inviteUser({
      email: fields._email,
      forename: fields._forename,
      surname: fields._surname,
      activationRoleNames: rolesToAdd,
      invitedBy: req.idam_user_dashboard_session.user.id,
      successRedirect: selectedService.activationRedirectUrl,
      clientId: selectedService.oauth2ClientId
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

  private async getRolesToRegisterUser(allServices: Service[], serviceField: string): Promise<string[]> {
    const selectedService = allServices.find(service => service.label === serviceField);
    const rolesToAdd: string[] = [UserType.Citizen];
    const rolesMap = await this.getRolesMap();

    selectedService.onboardingRoles
      .filter(r => rolesMap.has(r))
      .forEach(r => rolesToAdd.push(rolesMap.get(r).name));
    return rolesToAdd;
  }

  private async getRolesMap(): Promise<Map<string, V2Role>> {
    const allRoles = await this.idamWrapper.getAllV2Roles();
    const rolesMap = new Map(allRoles
      .filter(role => role !== undefined)
      .map(role => [role.id, role])
    );
    return rolesMap;
  }
}
