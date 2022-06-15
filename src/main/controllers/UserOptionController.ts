import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import { constructOptionsStringFromArray, hasProperty } from '../utils/utils';
import { selectOptionError } from '../utils/error';
import { ADD_USER_URL, GENERATE_REPORT_URL, MANAGER_USER_URL } from '../utils/urls';
import { RootController } from './RootController';
import autobind from 'autobind-decorator';
import { UserOption } from '../utils/UserOption';
import { SelectItem } from '../interfaces/SelectItem';
import { BETA_ADD, GAMMA_GENERATE_REPORT } from '../app/feature-flags/flags';

@autobind
export class UserOptionController extends RootController {
  public async get(req: AuthedRequest, res: Response) {
    const options = await this.getOptionsForSelect();
    return super.get(req, res,'user-option', { content: { options: options } });
  }

  public async post(req: AuthedRequest, res: Response) {
    if (!hasProperty(req.body, 'userAction')) {
      const options = await this.getOptionsForSelect();
      return super.post(req, res, 'user-option', {
        content: { options: options },
        error: { userAction: { message: selectOptionError(this.composeOptions(options)) } }
      });
    }

    switch (req.body.userAction) {
      case UserOption.MANAGE_USER:
        return res.redirect(MANAGER_USER_URL);
      case UserOption.ADD_USER:
        return res.redirect(ADD_USER_URL);
      case UserOption.GENERATE_REPORT:
        return res.redirect(GENERATE_REPORT_URL);
    }
  }

  private async getOptionsForSelect(): Promise<SelectItem[]> {
    const items = [{value: UserOption.MANAGE_USER, text: 'Manage an existing user'}];

    if (this.featureFlags) {
      const featureFlags = await this.featureFlags.getAllFlagValues();

      if (featureFlags[BETA_ADD]) {
        items.push({value: UserOption.ADD_USER, text: 'Add a new user'});
      }

      if (featureFlags[GAMMA_GENERATE_REPORT]) {
        items.push({value: UserOption.GENERATE_REPORT, text: 'Generate a user report'});
      }
    }
    return items;
  }

  private composeOptions(options: SelectItem[]): string {
    const optionsText = [];
    for (let i = 0; i < options.length; i++) {
      optionsText.push(options[i].text.toLowerCase());
    }
    return constructOptionsStringFromArray(optionsText);
  }
}
