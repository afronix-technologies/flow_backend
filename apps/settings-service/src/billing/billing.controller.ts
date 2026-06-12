import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BillingService } from './billing.service';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * GET /api/v1/billing/plans
   * Returns all available billing plans (public, no auth required).
   */
  @Get('plans')
  @ApiOperation({ summary: 'Get all available billing plans' })
  async getPlans() {
    return this.billingService.getPlans();
  }

  /**
   * GET /api/v1/billing/packs
   * Returns all available feature packs (public, no auth required).
   */
  @Get('packs')
  @ApiOperation({ summary: 'Get all available feature packs' })
  async getPacks() {
    return this.billingService.getAvailablePacks();
  }
}
