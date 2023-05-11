import * as express from 'express';

import {InfoConfig} from './infoConfig';
import {loadVersionFile} from './versionFile';

export function infoRequestHandler(config: InfoConfig): express.RequestHandler {
  return (req: express.Request, res: express.Response) => {
    loadVersionFile()
      .then((versionFile) => {
        const json = {
          build: versionFile,
          extraBuildInfo: config.extraBuildInfo
        };
        res.json(json);
      });
  };
}
