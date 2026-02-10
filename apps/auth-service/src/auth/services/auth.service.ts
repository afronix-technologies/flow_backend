import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { UserOrganization } from '../entities/user-organization.entity';
import { Invitation, InvitationStatus } from '../entities/invitation.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { InviteUserDto } from '../dto/invite-user.dto';
import { BulkInviteDto } from '../dto/bulk-invite.dto';
import { AcceptInvitationDto } from '../dto/accept-invitation.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { PasswordService } from './password.service';
import { EmailService } from './email.service';
import { RolesService } from './roles.service';
import { AuthGateway } from '../gateways/auth.gateway';
import { v4 as uuidv4 } from 'uuid';

import { RefreshToken } from '../entities/refresh-token.entity';
import { SessionService } from './session.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(UserOrganization)
    private userOrganizationRepository: Repository<UserOrganization>,
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private passwordService: PasswordService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private rolesService: RolesService,
    private authGateway: AuthGateway,
    private sessionService: SessionService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    // 1. Check if user exists (by email, we'll check globally for now or effectively unique per org, but usually unique email is better for UX,
    // strictly spec said unique on [email, org_id], but for registration we are creating a NEW org, so user shouldn't exist in a creating context usually.
    // However, if user exists in another org, they can registers a NEW org.
    // Let's assume registration expects a fresh user or at least separate context.
    // Actually, if user exists, they should probably "Login" and "Create Organization".
    // But for simplicity of "Register" endpoint, we assume new user. If user exists in DB, we'll see.

    // Actually the constraints are unique [email, organization_id].
    // But for a NEW organization, organization_id is not yet known.
    // So we can always create a new User linked to the new Org.

    const existingUser = await this.userRepository.findOne({ where: { email: registerDto.email } });
    if (existingUser) {
      if (!existingUser.emailVerified) {
        // Resend verification email
        const emailVerificationToken = uuidv4();
        existingUser.emailVerificationToken = emailVerificationToken;
        await this.userRepository.save(existingUser);

        await this.emailService.sendVerificationEmail(existingUser.email, emailVerificationToken);
        return { message: 'User already exists. Verification email sent again.' };
      }
      throw new ConflictException(
        'User with this email already exists and is verified. Please login.',
      );
    }

    const hashedPassword = await this.passwordService.hash(registerDto.password);

    // Transactional would be better
    const organization = this.organizationRepository.create({
      name: registerDto.organizationName,
      slug: registerDto.slug || this.generateSlug(registerDto.organizationName),
      teamSize: 1,
    });
    const savedOrg = await this.organizationRepository.save(organization);

    const emailVerificationToken = uuidv4();

    // Get Admin Role
    const adminRole = await this.rolesService.findByName('admin');

    const user = this.userRepository.create({
      organizationId: savedOrg.id,
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      password: hashedPassword,
      role: adminRole,
      emailVerified: false,
      emailVerificationToken: emailVerificationToken,
      isActive: true,
    });
    const savedUser = await this.userRepository.save(user);

    // Create UserOrganization mapping
    await this.userOrganizationRepository.save({
      userId: savedUser.id,
      organizationId: savedOrg.id,
      role: adminRole,
    });

    await this.emailService.sendVerificationEmail(user.email, emailVerificationToken);

    // Emit Welcome Socket Message (Client needs to join room 'user.id' first via 'joinRoom' event)
    // Delay slightly or ensure client connection flow
    this.authGateway.sendWelcomeMessage(savedUser.id, `Welcome to Flow, ${savedUser.firstName}!`);

    return { message: 'Check your email to verify your account' };
  }

  async verifyEmail(token: string): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
      relations: ['organization'],
    });

    if (!user) {
      throw new NotFoundException('Invalid verification token');
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.lastLogin = new Date(); // Update last login
    await this.userRepository.save(user);

    // Auto-login: Create Session
    const sessionId = await this.sessionService.createSession(user);

    // Auto-login: Create Refresh Token
    const refreshToken = uuidv4();
    await this.refreshTokenRepository.save({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: '127.0.0.1',
      userAgent: 'Verification Flow',
    });

    const authResponse = this.generateAuthResponse(user, user.organization);

    return {
      sessionId,
      refreshToken,
      accessToken: authResponse.accessToken, // Include access token
      user: authResponse.user,
      organization: authResponse.organization,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto | { organizations: Organization[] }> {
    // Find users by email (could be multiple)
    const users = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .leftJoinAndSelect('user.organization', 'organization')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.email = :email', { email: loginDto.email })
      .getMany();

    if (!users || users.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let userToLogin: User;

    if (users.length > 1 && !loginDto.organizationId) {
      // Return list of organizations
      return {
        organizations: users.map((u) => u.organization),
      };
    } else if (loginDto.organizationId) {
      userToLogin = users.find((u) => u.organizationId === loginDto.organizationId);
      if (!userToLogin)
        throw new UnauthorizedException('Invalid credentials for this organization');
    } else {
      // Single user
      userToLogin = users[0];
    }

    if (!userToLogin.password) {
      // User might have registered via OAuth and has no password set
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.passwordService.compare(
      loginDto.password,
      userToLogin.password,
    );
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    if (!userToLogin.isActive) throw new UnauthorizedException('Account is disabled');
    if (!userToLogin.emailVerified) throw new UnauthorizedException('Please verify your email');

    userToLogin.lastLogin = new Date();
    await this.userRepository.save(userToLogin);

    if (!userToLogin.organization) {
      throw new UnauthorizedException(
        'No organization assigned to this account. Please contact support.',
      );
    }

    // Create Redis Session
    const sessionId = await this.sessionService.createSession(userToLogin);

    // Create Refresh Token (Long Lived)
    const refreshToken = uuidv4();
    await this.refreshTokenRepository.save({
      userId: userToLogin.id,
      token: refreshToken, // Should hash this in production
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ipAddress: '127.0.0.1', // Todo: Extract from request
      userAgent: 'Unknown', // Todo: Extract from request
    });

    const authResponse = this.generateAuthResponse(userToLogin, userToLogin.organization);

    return {
      sessionId,
      refreshToken,
      accessToken: authResponse.accessToken, // Include access token
      user: authResponse.user,
      organization: authResponse.organization, // Default org context
    };
  }

  async validateUser(userId: string): Promise<User> {
    return this.userRepository.findOne({ where: { id: userId }, relations: ['organization'] });
  }

  async inviteUser(inviterId: string, inviteDto: InviteUserDto): Promise<{ message: string }> {
    const inviter = await this.userRepository.findOne({ where: { id: inviterId } });
    if (!inviter) throw new UnauthorizedException();

    // Check if user already in org
    const existingUser = await this.userRepository.findOne({
      where: { email: inviteDto.email, organizationId: inviter.organizationId },
    });
    if (existingUser) throw new ConflictException('User already in organization');

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Fetch role entity
    const role = await this.rolesService.findByName(inviteDto.role);
    if (!role) {
      throw new BadRequestException(`Invalid role: ${inviteDto.role}`);
    }

    await this.invitationRepository.save({
      organizationId: inviter.organizationId,
      invitedByUserId: inviter.id,
      email: inviteDto.email,
      role: role,
      token,
      status: InvitationStatus.PENDING,
      expiresAt,
    });

    // Get Org Name
    const org = await this.organizationRepository.findOne({
      where: { id: inviter.organizationId },
    });

    await this.emailService.sendInvitationEmail(inviteDto.email, org.name, token);

    return { message: `Invitation sent to ${inviteDto.email}` };
  }

  async acceptInvitation(acceptDto: AcceptInvitationDto): Promise<AuthResponseDto> {
    const invitation = await this.invitationRepository.findOne({
      where: { token: acceptDto.token, status: InvitationStatus.PENDING },
      relations: ['organization'],
    });

    if (!invitation) throw new BadRequestException('Invalid or expired invitation');
    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation expired');
    }

    // Check if user exists (sanity check)
    const existingUser = await this.userRepository.findOne({
      where: { email: invitation.email, organizationId: invitation.organizationId },
    });
    if (existingUser) throw new ConflictException('User already exists');

    const hashedPassword = await this.passwordService.hash(acceptDto.password);

    const newUser = this.userRepository.create({
      organizationId: invitation.organizationId,
      email: invitation.email,
      firstName: acceptDto.firstName,
      lastName: acceptDto.lastName,
      password: hashedPassword,
      role: invitation.role,
      emailVerified: true,
      isActive: true,
    });

    const savedUser = await this.userRepository.save(newUser);

    // Create UserOrganization
    await this.userOrganizationRepository.save({
      userId: savedUser.id,
      organizationId: invitation.organizationId,
      role: invitation.role,
    });

    // Update Invitation
    invitation.status = InvitationStatus.ACCEPTED;
    invitation.acceptedAt = new Date();
    await this.invitationRepository.save(invitation);

    // Update Org Team Size
    await this.organizationRepository.increment({ id: invitation.organizationId }, 'teamSize', 1);

    return this.generateAuthResponse(savedUser, invitation.organization);
  }

  async bulkInvite(
    inviterId: string,
    bulkInviteDto: BulkInviteDto,
  ): Promise<{ message: string; sentCount: number }> {
    const inviter = await this.userRepository.findOne({ where: { id: inviterId } });
    if (!inviter) throw new UnauthorizedException();

    let sentCount = 0;
    const org = await this.organizationRepository.findOne({
      where: { id: inviter.organizationId },
    });

    for (const invite of bulkInviteDto.invitations) {
      // Check if user already in org
      const existingUser = await this.userRepository.findOne({
        where: { email: invite.email, organizationId: inviter.organizationId },
      });

      if (existingUser) continue; // Skip existing users

      // Check pending invitation
      const existingInvite = await this.invitationRepository.findOne({
        where: {
          email: invite.email,
          organizationId: inviter.organizationId,
          status: InvitationStatus.PENDING,
        },
      });

      if (existingInvite) continue; // Skip if already pending

      const token = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      // Fetch role entity
      const role = await this.rolesService.findByName(invite.role);
      if (!role) {
        // Log error or skip? DTO validation should catch invalid roles usually.
        // Depending on requirements, we can skip or error.
        // Let's skip invalid roles for bulk invite robustness
        continue;
      }

      await this.invitationRepository.save({
        organizationId: inviter.organizationId,
        invitedByUserId: inviter.id,
        email: invite.email,
        role: role,
        token,
        status: InvitationStatus.PENDING,
        expiresAt,
      });

      // Send email
      await this.emailService.sendInvitationEmail(invite.email, org.name, token);
      sentCount++;
    }

    return { message: `Processed invitations`, sentCount };
  }

  async generateJoinLink(userId: string): Promise<{ link: string; token: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const token = uuidv4();

    await this.organizationRepository.update(user.organizationId, {
      joinLinkToken: token,
      joinLinkEnabled: true,
      joinLinkExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    // Assuming frontend URL structure
    const link = `${this.configService.get('FRONTEND_URL')}/join/${token}`;
    return { link, token };
  }

  async validateJoinLink(token: string): Promise<{ organizationName: string; isValid: boolean }> {
    const org = await this.organizationRepository.findOne({ where: { joinLinkToken: token } });

    if (
      !org ||
      !org.joinLinkEnabled ||
      (org.joinLinkExpiresAt && org.joinLinkExpiresAt < new Date())
    ) {
      throw new NotFoundException('Invalid or expired join link');
    }

    return { organizationName: org.name, isValid: true };
  }

  async joinViaLink(
    token: string,
    userData: { email: string; password?: string; firstName: string; lastName: string },
  ): Promise<AuthResponseDto> {
    const org = await this.organizationRepository.findOne({ where: { joinLinkToken: token } });

    if (
      !org ||
      !org.joinLinkEnabled ||
      (org.joinLinkExpiresAt && org.joinLinkExpiresAt < new Date())
    ) {
      throw new NotFoundException('Invalid or expired join link');
    }

    // Check if user exists globally (by email) and in THIS org
    const existingUserInOrg = await this.userRepository.findOne({
      where: { email: userData.email, organizationId: org.id },
    });

    if (existingUserInOrg) {
      throw new ConflictException('You are already a member of this organization');
    }

    // Logic:
    // 1. If user has account elsewhere? Link them.
    // 2. If new user? Create them.

    // For simplicity reusing registration logic flow but specifically for this org
    const hashedPassword = await this.passwordService.hash(userData.password || uuidv4()); // Require password or generated one if simple join?
    // Ideally "Join" flow asks for password setting.

    // Ideally "Join" flow asks for password setting.

    // Get dynamic default role
    const defaultRole = await this.rolesService.findDefaultRole();

    const newUser = this.userRepository.create({
      organizationId: org.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      password: hashedPassword,
      role: defaultRole,
      emailVerified: true,
      isActive: true,
    });

    const savedUser = await this.userRepository.save(newUser);

    await this.userOrganizationRepository.save({
      userId: savedUser.id,
      organizationId: org.id,
      role: defaultRole,
    });

    await this.organizationRepository.increment({ id: org.id }, 'teamSize', 1);

    this.authGateway.sendWelcomeMessage(savedUser.id, `Welcome to Flow, ${savedUser.firstName}!`);

    return this.generateAuthResponse(savedUser, org);
  }

  async forgotPassword(forgotDto: ForgotPasswordDto): Promise<{ message: string }> {
    // If organization ID is not provided,
    // Check if user has role
    // We'll assume for password reset we might need to find ALL users with that email?
    // Or just pick one?
    // Guide says "Find user by email + organizationId".
    // If orgId missing, maybe fail? Or find any?
    // Let's assume strict logic: if multiple users with same email, require OrgID.

    const users = await this.userRepository.find({ where: { email: forgotDto.email } });
    if (!users.length) return { message: 'If email exists, reset link sent' }; // Security

    let targetUser = users[0];
    if (forgotDto.organizationId) {
      targetUser = users.find((u) => u.organizationId === forgotDto.organizationId);
    }

    if (!targetUser) return { message: 'If email exists, reset link sent' };

    const token = uuidv4();
    targetUser.passwordResetToken = token;
    targetUser.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    await this.userRepository.save(targetUser);

    await this.emailService.sendPasswordResetEmail(targetUser.email, token);
    return { message: 'If email exists, reset link sent' };
  }

  async resetPassword(resetDto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { passwordResetToken: resetDto.token },
    });

    if (!user || user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }

    const hashedPassword = await this.passwordService.hash(resetDto.newPassword);

    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await this.userRepository.save(user);

    return { message: 'Password reset successful' };
  }

  async switchOrganization(userId: string, targetOrgId: string): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userOrganizations', 'userOrganizations.organization'], // Load available orgs
    });

    if (!user) throw new NotFoundException('User not found');

    // Check if user belongs to target org
    const participation = user.userOrganizations.find((uo) => uo.organizationId === targetOrgId);
    if (!participation) {
      throw new UnauthorizedException('You do not have access to this organization API');
    }

    // Context switch: we update the "current" organizationId on the user entity?
    // Or just generate a new token with that orgId?
    // The guide says: "JWT token contains selected organization_id".
    // The User entity has `organizationId` column which acts as "default" or "current" context in DB?
    // Let's update it so `GET /me` returns correct context.

    user.organizationId = targetOrgId;
    user.organization = participation.organization; // set for response generation
    user.role = participation.role; // Switch active role to that of the org

    await this.userRepository.save(user); // Persist constraint/context

    return this.generateAuthResponse(user, participation.organization);
  }

  async updateOrganization(orgId: string, updateDto: UpdateOrganizationDto): Promise<Organization> {
    const org = await this.organizationRepository.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    // Merge updates
    if (updateDto.name) org.name = updateDto.name;
    if (updateDto.industry) org.industry = updateDto.industry;
    if (updateDto.companySize) org.companySize = updateDto.companySize;
    if (updateDto.template) org.template = updateDto.template;
    if (updateDto.onboardingStep) org.onboardingStep = updateDto.onboardingStep;

    return this.organizationRepository.save(org);
  }

  generateAuthResponse(user: User, organization: Organization): AuthResponseDto {
    const payload = {
      sub: user.id,
      email: user.email,
      organizationId: organization.id,
      role: user.role.name,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRATION') || '7d',
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '30d',
      },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name, // Map entity to string
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        onboardingStep: organization.onboardingStep,
      },
    };
  }

  private generateSlug(name: string): string {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Append random 4-char string to ensure uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `${baseSlug}-${randomSuffix}`;
  }
}
