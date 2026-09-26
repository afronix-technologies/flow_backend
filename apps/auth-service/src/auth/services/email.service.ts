import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly notificationServiceUrl =
    process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3002';

  async sendVerificationEmail(email: string, code: string) {
    try {
      await axios.post(`${this.notificationServiceUrl}/api/v1/email/verify`, { email, code });
      this.logger.log(`Requested verification email for ${email}`);
    } catch (error) {
      this.logger.error(`Failed to trigger verification email: ${error.message}`);
    }
  }

  async sendInvitationEmail(email: string, organizationName: string, token: string) {
    try {
      await axios.post(`${this.notificationServiceUrl}/api/v1/email/invite`, {
        email,
        organizationName,
        token,
      });
      this.logger.log(`Requested invitation email for ${email}`);
    } catch (error) {
      this.logger.error(`Failed to trigger invitation email: ${error.message}`);
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    try {
      await axios.post(`${this.notificationServiceUrl}/api/v1/email/reset-password`, {
        email,
        token,
      });
      this.logger.log(`Requested password reset email for ${email}`);
    } catch (error) {
      this.logger.error(`Failed to trigger password reset email: ${error.message}`);
    }
  }

  async sendWelcomeEmail(email: string, firstName: string) {
    try {
      await axios.post(`${this.notificationServiceUrl}/api/v1/email/welcome`, { email, firstName });
      this.logger.log(`Requested welcome email for ${email}`);
    } catch (error) {
      this.logger.error(`Failed to trigger welcome email: ${error.message}`);
    }
  }
}
