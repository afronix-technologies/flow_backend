import { Controller, Post, Body, UseGuards, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';

import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({
    default: {
      limit: parseInt(process.env.THROTTLE_LIMIT || '5', 10),
      ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    },
  }) // Limit configurable via env
  @Post('register')
  @ApiOperation({ summary: 'Register new user and organization' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with code' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async verifyEmail(
    @Body() verifyDto: VerifyEmailDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.authService.verifyEmail(
      verifyDto.email,
      verifyDto.code,
      ip,
      userAgent,
    );

    if (result.sessionId) {
      res.cookie('session_token', result.sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        domain: process.env.DOMAIN ? `.${process.env.DOMAIN}` : undefined,
      });
    }

    if (result.refreshToken) {
      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }

    return result;
  }

  @Throttle({
    default: {
      limit: parseInt(process.env.THROTTLE_LIMIT || '5', 10),
      ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    },
  }) // Limit configurable via env
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.authService.login(loginDto, ip, userAgent);

    if ('organizations' in result) {
      return result; // Multi-org selection needed
    }

    // Set Cookies
    if (result.sessionId) {
      res.cookie('session_token', result.sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        domain: process.env.DOMAIN ? `.${process.env.DOMAIN}` : undefined,
      });
    }

    if (result.refreshToken) {
      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/auth/refresh', // Scope to refresh endpoint
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }

    return result;
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  async forgotPassword(@Body() forgotDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotDto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() resetDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  async logout() {
    // Client side just drops token, server could invalidate refresh token
    return { message: 'Logged out successfully' };
  }
}
