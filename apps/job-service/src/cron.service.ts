import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  @Cron(CronExpression.EVERY_MINUTE)
  handleEveryMinute() {
    this.logger.debug('Running "Every Minute" System Check...');
    // Future: Dispatch "Check Subscriptions" job to Queue
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  handleDailyJobs() {
    this.logger.log('Running Daily Midnight Jobs...');
    // Future: Dispatch "Generate Daily Reports" job to Queue
  }
}
