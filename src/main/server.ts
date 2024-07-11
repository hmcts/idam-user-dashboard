#!/usr/bin/env node
import { Logger } from '@hmcts/nodejs-logging';
import { app } from './app';

const logger = Logger.getLogger('server');
console.log('server logger level is ' + logger.level);
logger.warn('server.ts: log level is' + logger.level);

const port: number = parseInt(process.env.PORT, 10) || 3100;
app.listen(port, () => {
  logger.info(`(logger) Application started: http://localhost:${port}`);
  console.log('(console) Application started!');
  logger.info({
    message: '(logger:json) Application Started'
  });
});
