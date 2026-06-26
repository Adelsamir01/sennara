import winston from 'winston';
import { env } from './env';

const formats: winston.Logform.Format[] = [
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
];

if (env.NODE_ENV === 'production') {
  formats.push(winston.format.json());
} else {
  formats.push(
    winston.format.printf(({ level, message, timestamp, stack }) => {
      return `${timestamp} [${level}]: ${stack || message}`;
    })
  );
}

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: { service: 'sennara-api' },
  transports: [new winston.transports.Console()],
  format: winston.format.combine(...formats),
  silent: env.NODE_ENV === 'test',
});
