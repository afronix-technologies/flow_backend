import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class SystemKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const systemKey = request.headers['x-system-key'];
    const expected = process.env.SYSTEM_MANAGEMENT_KEY;

    if (!expected) {
      throw new ForbiddenException('System management key is not configured.');
    }

    if (!systemKey || systemKey !== expected) {
      throw new ForbiddenException('Invalid or missing system key.');
    }

    return true;
  }
}
