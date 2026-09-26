import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class SubdomainGuard implements CanActivate {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const host = request.headers.host; // e.g., acme-corp.flow.afronix.com
    const user: User = request.user;

    if (!user) {
      // SessionGuard must run before this
      return false;
    }

    // Parse subdomain
    // Env variable for BASE_DOMAIN e.g., "flow.afronix.com"
    const baseDomain = process.env.DOMAIN || 'flow.afronix.com';
    if (!host.endsWith(baseDomain)) {
      // Localhost or direct IP? handling
      return true;
    }

    const subdomain = host.replace(`.${baseDomain}`, '');
    if (
      subdomain === host ||
      subdomain === 'www' ||
      subdomain === 'api' ||
      subdomain === 'staging'
    ) {
      // Root domain or special subdomains - no org context required
      return true;
    }

    // Check Organization
    const organization = await this.organizationRepository.findOne({ where: { slug: subdomain } });
    if (!organization) {
      throw new NotFoundException(`Organization '${subdomain}' not found`);
    }

    // Check Membership
    const membership = user.userOrganizations?.find((uo) => uo.organizationId === organization.id);
    // Note: user.userOrganizations must be loaded. SessionGuard usually loads user. Ensure relations are loaded.

    if (!membership) {
      throw new ForbiddenException(`You are not a member of ${organization.name}`);
    }

    request.organization = organization;
    return true;
  }
}
