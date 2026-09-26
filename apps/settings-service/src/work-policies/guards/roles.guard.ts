import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

const ADMIN_ROLES = ['admin', 'owner', 'super_admin'];

/**
 * Guards write operations (PUT / POST / PATCH / DELETE) on work-policies endpoints.
 * The JWT payload must include a role of "admin", "owner", or "super_admin".
 * Read (GET) endpoints do not use this guard — any authenticated user can read.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !ADMIN_ROLES.includes(user.role)) {
      throw new ForbiddenException(
        'You do not have permission to perform this action. Required role: admin or owner.',
      );
    }

    return true;
  }
}
