import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OAuthService } from '../services/oauth.service';
import { OAuthProvider } from '../enums/oauth-provider.enum';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class OAuthController {
    constructor(private oauthService: OAuthService) { }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Initiate Google OAuth login' })
    googleLogin() {
        // Initiates the Google OAuth flow
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Google OAuth callback' })
    async googleCallback(@Req() req, @Res() res) {
        const authResponse = await this.oauthService.handleOAuthLogin(req.user, OAuthProvider.GOOGLE);
        // Redirect to frontend with tokens
        // For now, returning JSON or redirecting to a frontend route with params
        // Ideally: res.redirect(`${FRONTEND_URL}/auth/callback?token=${authResponse.accessToken}...`)

        // For API testing, returning the JSON
        res.json(authResponse);
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
        const authResponse = await this.oauthService.handleOAuthLogin(req.user, OAuthProvider.MICROSOFT);
        res.json(authResponse);
    }
}
