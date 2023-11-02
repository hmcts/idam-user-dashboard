import autobind from 'autobind-decorator';
import { ReportsHandler } from '../app/reports/ReportsHandler';
import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import { parse } from 'json2csv';
import { Logger } from '../interfaces/Logger';
import { GENERATING_FILE_FAILED_TRY_AGAIN } from '../utils/error';
import { RootController } from './RootController';

@autobind
export class DownloadReportController extends RootController {
  constructor(
    private readonly logger: Logger,
    private readonly reportGenerator: ReportsHandler
  ) {
    super();
  }

  public async get(req: AuthedRequest, res: Response): Promise<void> {
    const reportUUID = req.params.reportUUID;
    return this.generateReport(reportUUID, req)
      .then(csv => {
        this.logger.info(`Report generation successful for ${reportUUID}.`);
        // YYYY-MM-DD-hh-mm-ss format
        const timestamp = new Date().toISOString().split('.')[0].replace(/[T:]/g, '-');
        res.header('Content-Type', 'text/csv');
        res.attachment( 'user-report-' + timestamp + '.csv');
        res.send(csv);
      })
      .catch(() => super.post(req, res, 'view-report', {
        error: {
          'body': {message: GENERATING_FILE_FAILED_TRY_AGAIN}
        }
      }));
  }

  private async generateReport(reportUUID: string, req: AuthedRequest) {
    let reportCsv = '';
    let reportData;
    let pageNo = 0;
    const roles = (await this.reportGenerator.getReportQueryRoles(reportUUID));
    this.logger.info(`Fetching data for report ${reportUUID} for roles ${roles}.`);
    do {
      reportData = (await req.scope.cradle.api.getUsersWithRoles(roles, 2000, pageNo))
        .sort((a, b) => (a.forename.toLowerCase() > b.forename.toLowerCase()) ? 1 : -1);
      if (reportData && reportData.length > 1) {
        reportCsv += parse(reportData);
      }
      pageNo++;
    } while (reportData && reportData.length > 1);
    return reportCsv;
  }
}
