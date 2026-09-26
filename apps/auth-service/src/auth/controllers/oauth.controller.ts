import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { OAuthService } from '../services/oauth.service';
import { OAuthProvider } from '../enums/oauth-provider.enum';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class OAuthController {
  constructor(private oauthService: OAuthService) {}

  @Get('google')
  @ApiOperation({ summary: 'Get Google OAuth login URL' })
  googleLogin() {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const callbackURL = process.env.GOOGLE_CALLBACK_URL;
    const scope = ['email', 'profile'];

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientID,
      redirect_uri: callbackURL,
      scope: scope.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return { url };
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@Req() req, @Res({ passthrough: true }) res: Response) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const authResponse = await this.oauthService.handleOAuthLogin(
      req.user,
      OAuthProvider.GOOGLE,
      ip,
      userAgent,
    );

    if (authResponse.sessionId) {
      res.cookie('session_token', authResponse.sessionId, {
        httpOnly: true,
        secure: true, // Should be true in production, maybe check NODE_ENV
        sameSite: 'none',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        domain: process.env.DOMAIN ? `.${process.env.DOMAIN}` : undefined,
      });
    }

    if (authResponse.refreshToken) {
      res.cookie('refresh_token', authResponse.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/auth/callback`);
  }

  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  @ApiOperation({ summary: 'Initiate Microsoft OAuth login' })
  microsoftCallback() {
    // Initiates the Microsoft OAuth flow
  }

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  @ApiOperation({ summary: 'Microsoft OAuth callback' })
  async microsoftLoginCallback(@Req() req, @Res() res) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const authResponse = await this.oauthService.handleOAuthLogin(
      req.user,
      OAuthProvider.MICROSOFT,
      ip,
      userAgent,
    );
    res.json(authResponse);
  }
}
