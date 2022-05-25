import { Parser } from 'json2csv';
import { User } from '../../interfaces/User';
import { promises as fs, existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { Logger } from '../../interfaces/Logger';
import { TelemetryClient } from 'applicationinsights';

export class ReportsHandler {
  private readonly TMP_FOLDER = path.join('/', 'tmp', 'reports')

  constructor(
    private readonly logger: Logger,
    private readonly telemetryClient: TelemetryClient
  ) {
    this.createReportsDirectory();

    // Clear old files every minute
    setInterval(this.deleteOldReports, 1000 * 60);
  }

  generate(reportData: User[]): Promise<string | void> {
    const uuid = uuidv4();
    const fileName = uuid + '.csv';
    const filePath = path.join(this.TMP_FOLDER, fileName);
    const fileData = new Parser().parse(reportData);

    return fs.writeFile(filePath, fileData)
      .then(() => uuid)
      .catch(e => {
        this.telemetryClient.trackTrace({message: 'Error creating report file: ' + fileName});
        this.logger.error(e);
        throw new Error();
      });
  }

  load(fileUUID: string): Promise<Buffer | void> {
    const fileName = fileUUID + '.csv';
    const filePath = path.join(this.TMP_FOLDER, fileName);

    return fs.readFile(filePath)
      .catch(e => {
        this.telemetryClient.trackTrace({message: 'Error loading report file: ' + fileName});
        this.logger.error(e);

        throw new Error();
      });
  }

  private createReportsDirectory = () => {
    if (!existsSync(this.TMP_FOLDER)) {
      mkdirSync(this.TMP_FOLDER, { recursive: true });
    }
  }

  private deleteOldReports = () => {
    fs.readdir(this.TMP_FOLDER)
      .then(files => {
        files.map(file => {
          const filePath = path.join(this.TMP_FOLDER, file);

          fs.stat(filePath)
            .then(stats => {
              const fileAgeInMinutes = (new Date().getTime() - new Date(stats.mtime).getTime()) / (1000 * 60);
              if (fileAgeInMinutes >= 30) {
                fs.unlink(filePath).then(() => console.log('Deleted report file: ' + file));
              }
            });
        });
      });
  }
}
