import fs from 'fs';
import { status, jsonStatus } from './api.responses.js';
const errorLogs = fs.createWriteStream('error.log', { flags: 'a' });

export const catchError = (name, error, req, res) => {
  // if (process.env.NODE_ENV === 'production') Sentry.captureMessage(error)
  errorLogs.write(`${name} => ${new Date().toString()} => ${error.toString()}\r\n`)
  return res.status(status.InternalServerError).jsonp({
    status: jsonStatus.InternalServerError,
    message: 'Something went wrong.'
  })
}