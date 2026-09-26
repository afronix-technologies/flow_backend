import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as path from 'path';

const logDir = 'logs';

export const loggerConfig = WinstonModule.createLogger({
  transports: [
    // 1. Console Transport (Dev friendly)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike('AfronixTracker', {
          colors: true,
          prettyPrint: true,
        }),
      ),
    }),
    // 2. Error Log File (Errors only)
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
    // 3. Combined Log File (All logs)
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
  ],
});
