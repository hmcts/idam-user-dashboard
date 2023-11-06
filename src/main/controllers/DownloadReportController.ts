import autobind from 'autobind-decorator';
import { ReportsHandler } from '../app/reports/ReportsHandler';
import { AuthedRequest } from '../interfaces/AuthedRequest';
import { NextFunction, Response } from 'express';
import { parse } from 'json2csv';
import {Logger} from '../interfaces/Logger';

@autobind
export class DownloadReportController {
  constructor(
    private readonly logger: Logger,
    private readonly reportGenerator: ReportsHandler
  ) {}

  public async get(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
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
      .catch(() => next());
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
      if (reportData && reportData.length > 0) {
        reportCsv += parse(reportData);
      }
      pageNo++;
    } while (reportData && reportData.length > 1);
    return reportCsv;
  }
}
