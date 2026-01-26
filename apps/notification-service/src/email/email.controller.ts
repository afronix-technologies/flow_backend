import { Controller, Post, Body, Get, Param, Res, BadRequestException } from '@nestjs/common';

import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { invitationTemplate } from './templates/invitation.template';
import { verificationTemplate } from './templates/verification.template';
import { passwordResetTemplate } from './templates/password-reset.template';
import { welcomeTemplate } from './templates/welcome.template';

@ApiTags('Email')
@Controller('email')
export class EmailController {
    constructor(private readonly emailService: EmailService) { }

    @Post('verify')
    @ApiOperation({ summary: 'Send verification email' })
    @ApiBody({ schema: { type: 'object', properties: { email: { type: 'string' }, token: { type: 'string' } } } })
    @ApiResponse({ status: 201, description: 'Email sent' })
    async sendVerificationEmail(@Body() body: { email: string, token: string }) {
        await this.emailService.sendVerificationEmail(body.email, body.token);
        return { message: 'Verification email sent' };
    }

    @Post('invite')
    @ApiOperation({ summary: 'Send invitation email' })
    @ApiBody({ schema: { type: 'object', properties: { email: { type: 'string' }, organizationName: { type: 'string' }, token: { type: 'string' } } } })
    @ApiResponse({ status: 201, description: 'Email sent' })
    async sendInvitationEmail(@Body() body: { email: string, organizationName: string, token: string }) {
        await this.emailService.sendInvitationEmail(body.email, body.organizationName, body.token);
        return { message: 'Invitation email sent' };
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Send password reset email' })
    @ApiBody({ schema: { type: 'object', properties: { email: { type: 'string' }, token: { type: 'string' } } } })
    @ApiResponse({ status: 201, description: 'Email sent' })
    async sendPasswordResetEmail(@Body() body: { email: string, token: string }) {
        await this.emailService.sendPasswordResetEmail(body.email, body.token);
        return { message: 'Password reset email sent' };
    }

    @Post('welcome')
    @ApiOperation({ summary: 'Send welcome email' })
    @ApiBody({ schema: { type: 'object', properties: { email: { type: 'string' }, firstName: { type: 'string' } } } })
    @ApiResponse({ status: 201, description: 'Email sent' })
    async sendWelcomeEmail(@Body() body: { email: string, firstName: string }) {
        await this.emailService.sendWelcomeEmail(body.email, body.firstName);
        return { message: 'Welcome email sent' };
    }

    // --- Local Testing / Preview ---
    @Get('preview/:type')
    @ApiOperation({ summary: 'Preview email template' })
    async previewEmail(@Param('type') type: string, @Res() res: Response) {
        let html = '';
        const mockUrl = 'http://localhost:3000/mock-link';
        const mockOrg = 'Demo Corp';
        const mockName = 'John Doe';

        switch (type) {
            case 'verification':
                html = verificationTemplate(mockUrl);
                break;
            case 'invitation':
                html = invitationTemplate(mockUrl, mockOrg);
                break;
            case 'reset':
                html = passwordResetTemplate(mockUrl);
                break;
            case 'welcome':
                html = welcomeTemplate(mockName, mockUrl);
                break;
            default:
                throw new BadRequestException('Invalid template type. Try: verification, invitation, reset, welcome');
        }

        res.set('Content-Type', 'text/html');
        res.send(html);
    }
}
