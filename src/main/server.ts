#!/usr/bin/env node
import { Logger } from '@hmcts/nodejs-logging';
import { app } from './app';

const logger = Logger.getLogger('server');
console.log('server logger is ' + logger);

const port: number = parseInt(process.env.PORT, 10) || 3100;
app.listen(port, () => {
  logger.info(`Application started: http://localhost:${port}`);
  console.log('Application started!')
});
