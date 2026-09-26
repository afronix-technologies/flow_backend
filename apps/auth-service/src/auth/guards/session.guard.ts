import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SessionService } from '../services/session.service';
import { UsersService } from '../services/users.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private sessionService: SessionService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let sessionId = request.cookies['session_token'];

    // Fallback: Check Bearer Token (for Mobile/API usage)
    if (!sessionId) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        sessionId = authHeader.split(' ')[1];
      }
    }

    if (!sessionId) {
      throw new UnauthorizedException('No session token found in Cookie or Authorization header');
    }

    const sessionData = await this.sessionService.getSession(sessionId);
    if (!sessionData) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    // Attach user to request
    // We can fetch full user here or just use session data if sufficient
    // Fetching full user ensures latest permissions
    const user = await this.usersService.findOne(sessionData.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    request.user = user;
    request.session = sessionData;
    return true;
  }
}
