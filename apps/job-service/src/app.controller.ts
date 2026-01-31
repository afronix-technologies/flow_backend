import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
    @Get('health')
    getHealth() {
        return { status: 'ok', service: 'job-service', timestamp: new Date().toISOString() };
    }
}
