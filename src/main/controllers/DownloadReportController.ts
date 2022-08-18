import autobind from 'autobind-decorator';
import { ReportsHandler } from '../app/reports/ReportsHandler';
import { AuthedRequest } from '../interfaces/AuthedRequest';
import { NextFunction, Response } from 'express';


@autobind
export class DownloadReportController {
  constructor(
    private readonly reportGenerator: ReportsHandler
  ) {}

  public get(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
    return this.reportGenerator.getReport(req.params.reportUUID)
      .then(csv => {
        // YYYY-MM-DD-hh-mm-ss format
        const timestamp = new Date().toISOString().split('.')[0].replace(/[T:]/g, '-');

        res.header('Content-Type', 'text/csv');
        res.attachment( 'user-report-' + timestamp + '.csv');
        res.send(csv);
      })
      .catch(() => next());
  }
}
