import { Injectable, UnauthorizedException } from '@nestjs/common';

import { ExecutionContext } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

/**
 * Lightweight JWT guard for the settings-service.
 * Validates the Bearer token using the same JWT_SECRET as auth-service,
 * and attaches the decoded payload as `req.user`.
 */
@Injectable()
export class JwtAuthGuard {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No Bearer token found in Authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
      const secret = process.env.JWT_SECRET;
      const payload = jwt.verify(token, secret) as any;
      request.user = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
