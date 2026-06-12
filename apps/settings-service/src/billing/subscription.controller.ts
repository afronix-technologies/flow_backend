import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Headers,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
  ApiHeader,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { BillingService } from './billing.service';
import { CountryPaymentService } from './country-payment.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ManagePackDto } from './dto/manage-pack.dto';
import { JwtAuthGuard } from '../settings/guards/jwt-auth.guard';

@ApiTags('Subscription')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionController {
  constructor(
    private readonly billingService: BillingService,
    private readonly countryPaymentService: CountryPaymentService,
  ) {}

  /**
   * GET /api/v1/organizations/:orgId/subscription
   */
  @Get(':orgId/subscription')
  @ApiOperation({ summary: "Get an organisation's subscription details" })
  @ApiParam({ name: 'orgId', description: 'Organisation UUID' })
  async getSubscription(@Param('orgId') orgId: string, @Request() req: any) {
    this.assertSameOrg(req.user.organizationId, orgId);
    return this.billingService.getSubscription(orgId);
  }

  /**
   * POST /api/v1/organizations/:orgId/subscription
   * Create or upgrade/downgrade subscription. Rate-limited to 5/min per IP.
   */
  @Post(':orgId/subscription')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Create or update subscription (upgrade/downgrade)' })
  @ApiParam({ name: 'orgId', description: 'Organisation UUID' })
  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'Optional UUID to prevent duplicate charges on retry',
    required: false,
  })
  @ApiResponse({ status: 402, description: 'Payment failed / card declined' })
  @ApiResponse({ status: 409, description: 'Seat count exceeds plan limit' })
  @ApiResponse({ status: 422, description: 'Invalid plan transition' })
  async createSubscription(
    @Param('orgId') orgId: string,
    @Body() dto: CreateSubscriptionDto,
    @Request() req: any,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    this.assertSameOrg(req.user.organizationId, orgId);
    this.assertAdmin(req.user.role);
    return this.billingService.createOrUpdateSubscription(
      orgId,
      dto,
      req.user.email,
      idempotencyKey,
    );
  }

  /**
   * GET /api/v1/organizations/:orgId/invoices
   */
  @Get(':orgId/invoices')
  @ApiOperation({ summary: "Get an organisation's invoice history" })
  @ApiParam({ name: 'orgId', description: 'Organisation UUID' })
  async getInvoices(@Param('orgId') orgId: string, @Request() req: any) {
    this.assertSameOrg(req.user.organizationId, orgId);
    this.assertAdmin(req.user.role);
    return this.billingService.getInvoices(orgId);
  }

  /**
   * GET /api/v1/organizations/:orgId/billing/payment-config
   * Returns the currency and allowed payment methods for this org's country.
   * Frontend calls this on billing page load to render the correct checkout UI.
   */
  @Get(':orgId/billing/payment-config')
  @ApiOperation({ summary: "Get payment methods and currency available for this org's country" })
  @ApiParam({ name: 'orgId', description: 'Organisation UUID' })
  async getPaymentConfig(@Param('orgId') orgId: string, @Request() req: any) {
    this.assertSameOrg(req.user.organizationId, orgId);
    return this.countryPaymentService.getConfigForOrg(orgId);
  }

  /**
   * GET /api/v1/organizations/:orgId/billing/packs
   * Returns only packs eligible to add for this org (filtered by workspace rank + not already active).
   */
  @Get(':orgId/billing/packs')
  @ApiOperation({
    summary: 'Get packs available to add for this organisation (pre-filtered)',
  })
  @ApiParam({ name: 'orgId', description: 'Organisation UUID' })
  async getOrgAvailablePacks(@Param('orgId') orgId: string, @Request() req: any) {
    this.assertSameOrg(req.user.organizationId, orgId);
    return this.billingService.getOrgAvailablePacks(orgId);
  }

  /**
   * POST /api/v1/organizations/:orgId/subscription/packs/:packId
   * Add or remove a feature pack. Rate-limited to 10/min per IP.
   */
  @Post(':orgId/subscription/packs/:packId')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Add or remove a feature pack from an organisation subscription' })
  @ApiParam({ name: 'orgId', description: 'Organisation UUID' })
  @ApiParam({ name: 'packId', description: 'Feature pack ID e.g. workforce-pack' })
  async managePack(
    @Param('orgId') orgId: string,
    @Param('packId') packId: string,
    @Body() dto: ManagePackDto,
    @Request() req: any,
  ) {
    this.assertSameOrg(req.user.organizationId, orgId);
    this.assertAdmin(req.user.role);
    return this.billingService.managePack(orgId, packId, dto.action);
  }

  private assertSameOrg(tokenOrgId: string, paramOrgId: string) {
    if (tokenOrgId !== paramOrgId) {
      throw new ForbiddenException('Access denied to this organization');
    }
  }

  private assertAdmin(role: string) {
    if (!['admin', 'owner'].includes(role)) {
      throw new ForbiddenException('Admin access required');
    }
  }
}
