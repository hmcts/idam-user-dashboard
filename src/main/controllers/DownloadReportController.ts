import autobind from 'autobind-decorator';
import { ReportsHandler } from '../app/reports/ReportsHandler';
import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import { GENERATING_FILE_FAILED_TRY_AGAIN } from '../utils/error';
import { RootController } from './RootController';
import { IdamAPI } from '../app/idam-api/IdamAPI';
import logger from '../modules/logging';
import { User } from '../interfaces/User';

@autobind
export class DownloadReportController extends RootController {
  constructor(
    private readonly reportGenerator: ReportsHandler,
    private readonly idamWrapper: IdamAPI
  ) {
    super();
  }

  public async get(req: AuthedRequest, res: Response): Promise<void> {
    const reportUUID = req.params.reportUUID;
    return this.generateReport(reportUUID, req)
      .then(csv => {
        logger.info(`Report generation successful for ${reportUUID}.`);
        // YYYY-MM-DD-hh-mm-ss format
        const timestamp = new Date().toISOString().split('.')[0].replace(/[T:]/g, '-');
        res.header('Content-Type', 'text/csv');
        res.attachment( 'user-report-' + timestamp + '.csv');
        res.send(csv);
      })
      .catch(() => super.post(req, res, 'view-report', {
        error: {
          '': {message: GENERATING_FILE_FAILED_TRY_AGAIN}
        }
      }));
  }

  private async generateReport(reportUUID: string, req: AuthedRequest) {
    let reportCsv = '';
    let reportData: User[];
    let pageNo = 0;
    const roles = (await this.reportGenerator.getReportQueryRoles(reportUUID));
    logger.info(`Fetching data for report ${reportUUID} for roles ${roles}.`);
    do {
      reportData = (await this.idamWrapper.getUsersWithRoles(req.idam_user_dashboard_session.access_token, roles, 2000, pageNo))
        .sort((a, b) => (a.forename.toLowerCase() > b.forename.toLowerCase()) ? 1 : -1);
      if (reportData && reportData.length > 0) {
        reportCsv += this.jsonToCsv(reportData);
      }
      pageNo++;
    } while (reportData && reportData.length > 1);
    return reportCsv;
  }

private jsonToCsv(data: User[]): string {
  if (!Array.isArray(data) || data.length === 0) return '';

  const headers = Object.keys(data[0]) as (keyof User)[];
  const escape = (value: string): string => `"${value.replace(/"/g, '""')}"`;

  const headerLine = headers.map(h => escape(h)).join(',');

  const rows = data.map(row =>
    headers.map(field => {
      const value = row[field];

      if (Array.isArray(value)) {
        return escape(JSON.stringify(value));
      }

      if (typeof value === 'boolean' || typeof value === 'number') {
        return String(value);
      }

      return escape(value ?? '');
    }).join(',')
  );

  return [headerLine, ...rows].join('\n');
}
}
