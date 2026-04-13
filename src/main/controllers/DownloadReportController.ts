import autobind from 'autobind-decorator';
import { ReportsHandler } from '../app/reports/ReportsHandler';
import { AuthedRequest } from '../interfaces/AuthedRequest';
import { Response } from 'express';
import { GENERATING_FILE_FAILED_TRY_AGAIN } from '../utils/error';
import { RootController } from './RootController';
import { IdamAPI } from '../app/idam-api/IdamAPI';
import logger from '../modules/logging';
import { User } from '../interfaces/User';
import config from 'config';

interface GeneratedReport {
  csv: string;
  isPartial: boolean;
}

@autobind
export class DownloadReportController extends RootController {
  private readonly reportDownloadMaxPages: number = Number(config.get('reports.download.maxPages'));
  private readonly reportDownloadPageSize: number = Number(config.get('reports.download.pageSize'));

  constructor(
    private readonly reportGenerator: ReportsHandler,
    private readonly idamWrapper: IdamAPI
  ) {
    super();
  }

  public async get(req: AuthedRequest, res: Response): Promise<void> {
    const reportUUID = req.params.reportUUID;
    return this.generateReport(reportUUID, req)
      .then(report => {
        logger.info(`Report generation successful for ${reportUUID}.`);
        // YYYY-MM-DD-hh-mm-ss format
        const timestamp = new Date().toISOString().split('.')[0].replace(/[T:]/g, '-');
        res.header('Content-Type', 'text/csv');
        const partialFileSuffix = report.isPartial ? '-partial' : '';
        res.attachment( `user-report-${timestamp}${partialFileSuffix}.csv`);
        res.send(report.csv);
      })
      .catch(() => super.post(req, res, 'view-report', {
        error: {
          '': {message: GENERATING_FILE_FAILED_TRY_AGAIN}
        }
      }));
  }

  private async generateReport(reportUUID: string, req: AuthedRequest) {
    let reportCsv = '';
    let pageNo = 0;
    let isPartial = false;
    const roles = (await this.reportGenerator.getReportQueryRoles(reportUUID));
    logger.info(`Fetching data for report ${reportUUID} for roles ${roles}.`);
    while (pageNo < this.reportDownloadMaxPages) {
      const response = await this.idamWrapper.getUsersWithRoles(
        req.idam_user_dashboard_session.access_token,
        roles,
        this.reportDownloadPageSize,
        pageNo
      );
      const reportData = response.users
        .sort((a, b) => (a.forename.toLowerCase() > b.forename.toLowerCase()) ? 1 : -1);

      if (reportData && reportData.length > 0) {
        const csvChunk = this.jsonToCsv(reportData, pageNo === 0);
        reportCsv += reportCsv.length > 0 ? `\n${csvChunk}` : csvChunk;
      }

      if (!response.hasNextPage) {
        break;
      }

      if (pageNo === this.reportDownloadMaxPages - 1) {
        isPartial = true;
        break;
      }

      pageNo++;
    }

    return {
      csv: reportCsv,
      isPartial
    } as GeneratedReport;
  }

  private jsonToCsv(data: User[], includeHeaders: boolean): string {
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

    return (includeHeaders ? [headerLine, ...rows] : rows).join('\n');
  }
}
