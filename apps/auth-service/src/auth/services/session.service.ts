import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../entities/user.entity';

export interface SessionData {
  userId: string;
  email: string;
  roleId: string;
  organizationId?: string; // Optional context
  ipAddress?: string;
}

@Injectable()
export class SessionService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async createSession(user: User, ipAddress?: string): Promise<string> {
    const sessionId = uuidv4();
    const sessionData: SessionData = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      organizationId: user.organizationId,
      ipAddress,
    };

    // Store session with 1 day TTL (can be configured)
    const ttl = 24 * 60 * 60 * 1000; // milliseconds in new cache-manager
    await this.cacheManager.set(`session:${sessionId}`, sessionData, ttl);

    return sessionId;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    return await this.cacheManager.get<SessionData>(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.cacheManager.del(`session:${sessionId}`);
  }

  async refreshSession(sessionId: string, ttl?: number): Promise<void> {
    const data = await this.getSession(sessionId);
    if (data) {
      // Default 1 day or custom
      const newTtl = ttl || 24 * 60 * 60 * 1000;
      await this.cacheManager.set(`session:${sessionId}`, data, newTtl);
    }
  }
}
