import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [
        forwardRef(() => EmailModule),
        BullModule.registerQueueAsync({
            name: 'notifications',
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                redis: {
                    host: configService.get('REDIS_HOST', 'redis'),
                    port: parseInt(configService.get('REDIS_PORT', '6379')),
                },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [NotificationsGateway, NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule { }
