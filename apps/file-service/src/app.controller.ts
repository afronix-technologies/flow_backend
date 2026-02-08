import { Controller, Get } from '@nestjs/common';

@Controller('files')
export class AppController {
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      service: 'file-service',
      timestamp: new Date().toISOString(),
    };
  }
}
