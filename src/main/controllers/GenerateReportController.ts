import autobind from 'autobind-decorator';
import { RootController } from './RootController';
import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import { PageError } from '../interfaces/PageData';
import { isArrayEmpty, isObjectEmpty } from '../utils/utils';
import { GENERATING_REPORT_ERROR, GENERATING_REPORT_FILE_ERROR, MISSING_ROLE_INPUT_ERROR } from '../utils/error';
import { ReportsHandler } from '../app/reports/ReportsHandler';
import asyncError from '../modules/error-handler/asyncErrorDecorator';

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
      .filter(role => role.length && role !== 'citizen');

    const errors = this.validateFields({ search: roles });
    if(!isObjectEmpty(errors)) {
      return super.post(req, res,'generate-report', { error: errors });
    }

    let reportData;

    try {
      reportData = (await req.scope.cradle.api.getUsersWithRoles(roles))
        .sort((a, b) => (a.forename.toLowerCase() > b.forename.toLowerCase()) ? 1 : -1);
    } catch (e) {
      return super.post(req, res,'generate-report', {
        error: {
          'body': { message: GENERATING_REPORT_ERROR }
        }
      });
    }

    try {
      const reportFileName = await this.reportGenerator.generate(reportData);
      return super.post(req, res,'view-report', {
        content: {
          reportFileName, reportData, query: roles
        },
      });
    } catch (e) {
      return super.post(req, res,'view-report', {
        content: {
          reportData, query: roles,
        },
        error: {
          'body': { message: GENERATING_REPORT_FILE_ERROR }
        }
      });
    }
  }

  private validateFields(fields: { search: string[] }): PageError {
    const { search } = fields;
    const errors: PageError = {};

    if(isArrayEmpty(search)) errors.search = { message: MISSING_ROLE_INPUT_ERROR };

    return errors;
  }
}
