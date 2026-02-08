import { Controller, Get } from '@nestjs/common';

@Controller('jobs')
export class AppController {
  @Get('health')
  getHealth() {
    return { status: 'ok', service: 'job-service', timestamp: new Date().toISOString() };
  }
}
