import autobind from 'autobind-decorator';
import {RootController} from './RootController';
import {AuthedRequest} from '../interfaces/AuthedRequest';
import {Response} from 'express';
import {ReportsHandler} from '../app/reports/ReportsHandler';
import asyncError from '../modules/error-handler/asyncErrorDecorator';
import {
  GENERATING_REPORT_END_OF_RESULTS,
  GENERATING_REPORT_ERROR,
  GENERATING_REPORT_FILE_ERROR,
  GENERATING_REPORT_NO_USERS_MATCHED
} from '../utils/error';
import { IdamAPI } from '../app/idam-api/IdamAPI';
@autobind
export class ViewReportController extends RootController {
  constructor(
    private readonly reportGenerator: ReportsHandler,
    private readonly idamWrapper: IdamAPI
  ) {
    super();
  }

  @asyncError
  public async post(req: AuthedRequest, res: Response) {
    return this.loadReportPage(req, res);
  }

  @asyncError
  public async get(req: AuthedRequest, res: Response) {
    return this.loadReportPage(req, res);
  }

  private async loadReportPage(req: AuthedRequest, res: Response) {
    const reportUUID = req.params.reportUUID;
    const pageNoQueryVar = req.query.page ? req.query.page : 0;
    const pageNo = parseInt(pageNoQueryVar.toString(), 10);

    try {
      const roles = (await this.reportGenerator.getReportQueryRoles(reportUUID));
      let reportData;

      try {
        reportData = (await this.idamWrapper.getUsersWithRoles(req.idam_user_dashboard_session.access_token, roles, 50, pageNo))
          .sort((a, b) => (a.forename.toLowerCase() > b.forename.toLowerCase()) ? 1 : -1);
      } catch (e) {
        return super.post(req, res, 'generate-report', {
          error: {
            'body': {message: GENERATING_REPORT_ERROR}
          }
        });
      }

      if (reportData.length < 1) {
        if (pageNo == 0) {
          return super.post(req, res, 'view-report', {
            content: {
              reportData, query: roles
            },
            error: {
              'body': {message: GENERATING_REPORT_NO_USERS_MATCHED}
            }
          });
        } else {
          return super.post(req, res, 'view-report', {
            content: {
              reportData, query: roles
            },
            error: {
              'body': {message: GENERATING_REPORT_END_OF_RESULTS}
            }
          });
        }
      }

      return super.post(req, res, 'view-report', {
        content: {
          reportUUID, reportData, query: roles
        },
      });
    } catch (e) {
      return super.post(req, res, 'view-report', {
        error: {
          'body': {message: GENERATING_REPORT_FILE_ERROR}
        }
      });
    }
  }
}
