import { Controller, Get } from '@nestjs/common';

@Controller('notifications')
export class AppController {
  @Get('health')
  getHealth() {
    return { status: 'ok', service: 'notification-service', timestamp: new Date().toISOString() };
  }
}
