import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { NotificationsGateway } from './notifications.gateway';
import { EmailService } from '../email/email.service';

@Injectable()
@Processor('notifications')
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
    private readonly gateway: NotificationsGateway,
    private readonly emailService: EmailService,
  ) {}

  async queueEmail(type: string, payload: any) {
    await this.notificationsQueue.add('send-email', { type, payload });
    this.logger.log(`Queued email: ${type} for ${payload.email}`);
  }

  @Process('send-email')
  async handleEmailJob(job: Job) {
    const { type, payload } = job.data;
    this.logger.debug(`Processing email job: ${type}`);

    try {
      // 1. Send Email via Nodemailer (delegated to EmailService)
      if (type === 'verify')
        await this.emailService.sendVerificationEmail(payload.email, payload.token);
      else if (type === 'invite')
        await this.emailService.sendInvitationEmail(
          payload.email,
          payload.organizationName,
          payload.token,
        );
      // ... Handle other types

      // 2. Emit Real-time Notification if user is connected
      if (payload.userId) {
        this.gateway.sendToUser(payload.userId, {
          title: 'Email Sent',
          message: `We sent a ${type} email to you.`,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to process email job: ${error.message}`);
      throw error; // Retry
    }
  }

  @Process('workspace-updated')
  async handleWorkspaceUpdated(job: Job) {
    const { organizationId, packageKey, message } = job.data;
    this.logger.debug(`Broadcasting workspace update for org: ${organizationId} → ${packageKey}`);

    this.gateway.sendToOrganization(organizationId, {
      type: 'WORKSPACE_UPDATED',
      packageKey,
      message,
    });
  }
}
