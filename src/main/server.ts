#!/usr/bin/env node
import { app } from './app';
import logger from './modules/logging';

console.log('(console) server logger level is ' + logger.level);

const port: number = parseInt(process.env.PORT, 10) || 3100;
app.listen(port, () => {
  console.log('(console) Application started on port: ' + port);
  logger.info('Application started on port: ' + port);
});
