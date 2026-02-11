import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { OAuthAccount } from '../entities/oauth-account.entity';
import { Organization } from '../entities/organization.entity';
import { UserOrganization } from '../entities/user-organization.entity';
import { RolesService } from './roles.service';
import { AuthService } from './auth.service';
import { OAuthProvider } from '../enums/oauth-provider.enum';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { RefreshToken } from '../entities/refresh-token.entity';
import { SessionService } from './session.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OAuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OAuthAccount)
    private oauthAccountRepository: Repository<OAuthAccount>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(UserOrganization)
    private userOrganizationRepository: Repository<UserOrganization>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private rolesService: RolesService,
    private authService: AuthService,
    private sessionService: SessionService,
  ) {}

  async handleOAuthLogin(
    userProfile: any,
    provider: OAuthProvider,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthResponseDto> {
    if (!userProfile) {
      throw new UnauthorizedException('OAuth login failed');
    }

    const { email, providerId, accessToken, refreshToken } = userProfile;

    let user: User;
    let organization: Organization;

    // 1. Check if OAuth account exists
    const oauthAccount = await this.oauthAccountRepository.findOne({
      where: { provider, providerUserId: providerId },
      relations: ['user', 'user.organization', 'user.role'],
    });

    if (oauthAccount) {
      // Update tokens
      oauthAccount.accessToken = accessToken;
      oauthAccount.refreshToken = refreshToken;
      await this.oauthAccountRepository.save(oauthAccount);

      user = oauthAccount.user;
      organization = oauthAccount.user.organization;
    } else {
      // 2. Check if user with email exists
      const existingUser = await this.userRepository.findOne({
        where: { email },
        relations: ['organization', 'role'],
      });

      if (existingUser) {
        // Link Account
        await this.linkOAuthAccount(existingUser, userProfile, provider);
        user = existingUser;
        organization = existingUser.organization;
      } else {
        // 3. Create new User + Organization
        const result = await this.createOAuthUser(userProfile, provider);
        user = result.user;
        organization = result.organization;
      }
    }

    return this.finalizeLogin(user, organization, ipAddress, userAgent);
  }

  private async finalizeLogin(
    user: User,
    organization: Organization,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthResponseDto> {
    // Auto-login: Create Session
    const sessionId = await this.sessionService.createSession(user);

    // Auto-login: Create Refresh Token
    const refreshToken = uuidv4();
    await this.refreshTokenRepository.save({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress,
      userAgent,
    });

    const authResponse = this.authService.generateAuthResponse(user, organization);

    return {
      ...authResponse,
      sessionId,
      refreshToken, // DB-backed refresh token (UUID), authResponse might have JWT one if configured so, but usually we use one or other. AuthController uses UUID one for cookie.
    };
  }

  async linkOAuthAccount(user: User, profile: any, provider: OAuthProvider) {
    const { providerId, accessToken, refreshToken } = profile;

    const newOAuth = this.oauthAccountRepository.create({
      userId: user.id,
      provider,
      providerUserId: providerId,
      email: profile.email,
      accessToken,
      refreshToken,
    });
    await this.oauthAccountRepository.save(newOAuth);
  }

  async createOAuthUser(
    profile: any,
    provider: OAuthProvider,
  ): Promise<{ user: User; organization: Organization }> {
    const { email, firstName, lastName } = profile;

    // Create Organization
    const organization = this.organizationRepository.create({
      name: `${firstName}'s Org`, // Default name, can be updated later
      teamSize: 1,
    });
    const savedOrg = await this.organizationRepository.save(organization);

    // Get Default Role
    const memberRole = await this.rolesService.findDefaultRole();
    // Or should creator be Admin? Yes, creator of Org should be Admin.
    const adminRole = await this.rolesService.findByName('admin');

    // Create User
    const user = this.userRepository.create({
      organizationId: savedOrg.id,
      email,
      firstName,
      lastName,
      password: null, // OAuth user
      role: adminRole || memberRole, // Fallback
      emailVerified: true, // Trusted provider
      isActive: true,
    });
    const savedUser = await this.userRepository.save(user);

    // Link UserOrganization
    await this.userOrganizationRepository.save({
      userId: savedUser.id,
      organizationId: savedOrg.id,
      role: adminRole,
    });

    // Create OAuth Account
    await this.linkOAuthAccount(savedUser, profile, provider);

    return { user: savedUser, organization: savedOrg };
  }
}
