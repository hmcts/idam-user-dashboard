import autobind from 'autobind-decorator';
import { RootController } from './RootController';
import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import { PageError } from '../interfaces/PageData';
import { isArrayEmpty, isObjectEmpty } from '../utils/utils';
import {
  GENERATING_REPORT_CITIZEN_ERROR,
  GENERATING_REPORT_ERROR,
  MISSING_ROLE_INPUT_ERROR
} from '../utils/error';
import { ReportsHandler } from '../app/reports/ReportsHandler';
import asyncError from '../modules/error-handler/asyncErrorDecorator';
import { VIEW_REPORT_URL } from '../utils/urls';

@autobind
export class GenerateReportController extends RootController {
  constructor(
    private readonly reportGenerator: ReportsHandler
  ) {
    super();
  }

  public get(req: AuthedRequest, res: Response) {
    return super.get(req, res,'generate-report');
  }

  @asyncError
  public async post(req: AuthedRequest, res: Response) {
    const roles = (req.body.search as string)
      .split(',')
      .map(role => role.trim())
      .filter(role => role.length);

    const errors = this.validateFields({ search: roles });
    if(!isObjectEmpty(errors)) {
      return super.post(req, res,'generate-report', { error: errors });
    }

    let reportUUID;
    try {
      reportUUID = await this.reportGenerator.saveReportQueryRoles(roles);
    } catch (e) {
      return super.post(req, res,'generate-report', {
        error: {
          'body': { message: GENERATING_REPORT_ERROR }
        }
      });
    }

    return res.redirect(307, VIEW_REPORT_URL.replace(':reportUUID', reportUUID));
  }

  private validateFields(fields: { search: string[] }): PageError {
    const { search } = fields;
    const errors: PageError = {};

    if(isArrayEmpty(search)) errors.search = { message: MISSING_ROLE_INPUT_ERROR };
    if(search.includes('citizen')) errors.search = { message: GENERATING_REPORT_CITIZEN_ERROR };

    return errors;
  }
}
