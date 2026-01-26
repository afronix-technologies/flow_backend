import { Module, forwardRef } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [forwardRef(() => NotificationsModule)],
    controllers: [EmailController],
    providers: [EmailService],
    exports: [EmailService],
})
export class EmailModule { }
