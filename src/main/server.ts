#!/usr/bin/env node
import { Logger } from '@hmcts/nodejs-logging';
import { app } from './app';

const logger = Logger.getLogger('server');
console.log('(console) server logger level is ' + logger.level);

const port: number = parseInt(process.env.PORT, 10) || 3100;
app.listen(port, () => {
  console.log('(console) Application started on port: ' + port);
});
