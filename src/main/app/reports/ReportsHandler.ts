import { Parser } from 'json2csv';
import { User } from '../../interfaces/User';
import { fs } from 'memfs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { Logger } from '../../interfaces/Logger';
import { TelemetryClient } from 'applicationinsights';
import Stats from 'memfs/lib/Stats';

export class ReportsHandler {
  private readonly TMP_FOLDER = path.join('/');

  constructor(
    private readonly logger: Logger,
    private readonly telemetryClient: TelemetryClient
  ) {
    // Clear old files every minute
    setInterval(this.deleteOldReports, 1000 * 60);
  }

  generate(reportData: User[]): Promise<string | void> {
    const uuid = uuidv4();
    const fileName = uuid + '.csv';
    const filePath = path.join(this.TMP_FOLDER, fileName);
    const fileData = new Parser().parse(reportData);

    return fs.promises.writeFile(filePath, fileData)
      .then(() => uuid)
      .catch(e => {
        this.telemetryClient.trackTrace({message: 'Error creating report file: ' + fileName});
        this.logger.error(e);
        throw new Error();
      });
  }

  load(fileUUID: string) {
    const fileName = fileUUID + '.csv';
    const filePath = path.join(this.TMP_FOLDER, fileName);

    return fs.promises.readFile(filePath)
      .catch(e => {
        this.telemetryClient.trackTrace({message: 'Error loading report file: ' + fileName});
        this.logger.error(e);

        throw new Error();
      });
  }

  private deleteOldReports = () => {
    fs.promises.readdir(this.TMP_FOLDER)
      .then((files: string[]) => {
        files.map(file => {
          const filePath = path.join(this.TMP_FOLDER, file);

          fs.promises.stat(filePath)
            .then((stats: Stats) => {
              const fileAgeInMinutes = (new Date().getTime() - new Date(stats.mtime).getTime()) / (1000 * 60);
              if (fileAgeInMinutes >= 1) {
                fs.promises.unlink(filePath).then(() => console.log('Deleted report file: ' + file));
              }
            });
        });
      });
  }
}
