import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
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
        private rolesService: RolesService,
        private authService: AuthService
    ) { }

    async handleOAuthLogin(userProfile: any, provider: OAuthProvider): Promise<AuthResponseDto> {
        if (!userProfile) {
            throw new UnauthorizedException('OAuth login failed');
        }

        const { email, providerId, firstName, lastName, accessToken, refreshToken } = userProfile;

        // 1. Check if OAuth account exists
        let oauthAccount = await this.oauthAccountRepository.findOne({
            where: { provider, providerUserId: providerId },
            relations: ['user', 'user.organization', 'user.role']
        });

        if (oauthAccount) {
            // Update tokens
            oauthAccount.accessToken = accessToken;
            oauthAccount.refreshToken = refreshToken;
            await this.oauthAccountRepository.save(oauthAccount);

            // Generate response
            return this.authService.generateAuthResponse(oauthAccount.user, oauthAccount.user.organization);
        }

        // 2. Check if user with email exists
        let user = await this.userRepository.findOne({
            where: { email },
            relations: ['organization', 'role']
        });

        if (user) {
            // Link Account
            await this.linkOAuthAccount(user, userProfile, provider);
            return this.authService.generateAuthResponse(user, user.organization);
        }

        // 3. Create new User + Organization
        return this.createOAuthUser(userProfile, provider);
    }

    async linkOAuthAccount(user: User, profile: any, provider: OAuthProvider) {
        const { providerId, accessToken, refreshToken } = profile;

        const newOAuth = this.oauthAccountRepository.create({
            userId: user.id,
            provider,
            providerUserId: providerId,
            email: profile.email,
            accessToken,
            refreshToken
        });
        await this.oauthAccountRepository.save(newOAuth);
    }

    async createOAuthUser(profile: any, provider: OAuthProvider): Promise<AuthResponseDto> {
        const { email, firstName, lastName, providerId, accessToken, refreshToken } = profile;

        // Create Organization
        const organization = this.organizationRepository.create({
            name: `${firstName}'s Org`, // Default name, can be updated later
            teamSize: 1
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
            isActive: true
        });
        const savedUser = await this.userRepository.save(user);

        // Link UserOrganization
        await this.userOrganizationRepository.save({
            userId: savedUser.id,
            organizationId: savedOrg.id,
            role: adminRole // Assign dynamic role entity? 
            // Wait, UserOrganization entity has `role` column which is UserRole enum AND `roleId` FK?
            // I updated UserOrganization to have `role: Role` (step 196).
        });
        // We need to pass the Role entity or ID to UserOrganization
        // Let's check UserOrganization entity definition.
        // It has `role: Role`. So we need to assign it.
        // Wait, UserOrganization still has `role: UserRole` enum column in my previous update (step 196)?
        // Let's check step 196.
        // I replaced `role: UserRole` with `role: Role` relation AND `roleId`. 
        // But I removed the enum column.
        // So I should pass `role: adminRole`.

        // Create OAuth Account
        await this.linkOAuthAccount(savedUser, profile, provider);

        return this.authService.generateAuthResponse(savedUser, savedOrg);
    }
}
