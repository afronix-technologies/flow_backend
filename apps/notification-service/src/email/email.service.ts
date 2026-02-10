import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';

import { verificationTemplate } from './templates/verification.template';
import { passwordResetTemplate } from './templates/password-reset.template';
import { welcomeTemplate } from './templates/welcome.template';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    // Initialize with environment variables or mock for now if not set
    console.log('[SMTP DEBUG] Host:', process.env.SMTP_HOST);
    console.log('[SMTP DEBUG] Port:', process.env.SMTP_PORT);
    console.log('[SMTP DEBUG] User:', process.env.SMTP_USER);
    console.log('[SMTP DEBUG] Pass length:', process.env.SMTP_PASS?.length);

    console.log('[SMTP DEBUG] Pass first 4 chars:', process.env.SMTP_PASS?.substring(0, 4));
    if (process.env.SMTP_HOST) {
      console.log(`[EmailService] Configuring SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT} User: ${process.env.SMTP_USER}`);
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('[EmailService] SMTP Connection Error:', error);
        } else {
          console.log('[EmailService] SMTP Server is ready to take our messages');
        }
      });
    } else {
      this.logger.warn(
        'SMTP configuration not found. Email service operating in mock mode (logging only).',
      );
    }
  }

  private async sendMail(to: string, subject: string, html: string) {
    if (!this.transporter) {
      this.logger.log(
        `[MOCK EMAIL] To: ${to} | Subject: ${subject} | Content: ${html.substring(0, 50)}...`,
      );
      return;
    }

    try {
      console.log(`[EmailService] Attempting to send email to ${to}...`);
      await this.transporter.sendMail({
        from: process.env.FROM_EMAIL || 'no-reply@navix.com',
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      console.error(`[EmailService] FAILED to send email to ${to}`, error);
      this.logger.error(`Failed to send email to ${to}`, error.stack);
      // Don't throw, just log
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const html = verificationTemplate(url);
    await this.sendMail(email, 'Verify your email for Flow', html);
  }

  async sendInvitationEmail(email: string, organizationName: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/accept-invitation?token=${token}`;
    // Design: "Hi John! You've been added to Afronix's team on Wazi..." (User requested branding: "Wazi" -> "Flow", "Afronix" -> "AFORNIX" or use dyn org name)
    // User said: "the name of the app is FLOW", "the name of the company is AFORNIX"
    // But the invitation is usually to A SPECIFIC Organization (e.g. "Coca Cola").
    // However, the screenshot text says "You've been added to Afronix's team on Wazi".
    // Current logic receives `organizationName`. If the user wants the text physically hardcoded as "Added to AFORNIX's team", I should check if they mean the SaaS owner or the tenant.
    // Context: "Afronix" is likely the SaaS company or the specific tenant in the example.
    // I will use {{organizationName}} to be dynamic, but default to "AFORNIX" if implied.
    // Let's stick to the structure: "You've been added to {{organizationName}}'s team on Flow."

    const template = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <div style="background-color: #3b82f6; padding: 20px; text-align: left; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                    <h1 style="color: white; margin: 0;">Flow</h1>
                </div>
                <div style="padding: 20px; background-color: #fff;">
                    <p>Hi!</p>
                    <p>You've been added to <strong>{{organizationName}}</strong>'s team on Flow.</p>
                    <p>Download the app to see your tasks and track your time:</p>
                    <p><a href="{{url}}" style="color: #3b82f6; text-decoration: none;">{{url}}</a></p>
                    <p>Need help? Reply to this message.</p>
                </div>
            </div>
        `;
    const html = handlebars.compile(template)({ url, organizationName });
    await this.sendMail(email, `You've been invited to join ${organizationName} on Flow`, html);
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = passwordResetTemplate(url);
    await this.sendMail(email, 'Reset your Flow password', html);
  }

  async sendWelcomeEmail(email: string, firstName: string) {
    const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;
    const html = welcomeTemplate(firstName, dashboardUrl);
    await this.sendMail(email, 'Welcome to Flow', html);
  }
}
