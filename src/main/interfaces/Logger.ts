import { LoggerInstance } from 'winston';

// The logging instance is provided by '@hmcts/nodejs-logging' which internally uses the third party
// 'winston module. This empty interface is used as a marker interface so the exact logger implementation
// is hidden and only needs to be imported in one place.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Logger extends LoggerInstance {
}
