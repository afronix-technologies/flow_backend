import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
  ConflictException,
  ForbiddenException,
  Logger,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BillingPlan } from './entities/billing-plan.entity';
import { FeaturePack } from './entities/feature-pack.entity';
import { OrgSubscription } from './entities/org-subscription.entity';
import { OrgActivePack } from './entities/org-active-pack.entity';
import { Invoice } from './entities/invoice.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ConfigService } from '@nestjs/config';
import { CountryPaymentService } from './country-payment.service';
import { PaymentProviderService } from './payment-provider.service';

const PLAN_RANK: Record<string, number> = {
  Free: 0,
  Starter: 1,
  Professional: 2,
  Enterprise: 3,
};

const WORKSPACE_RANK: Record<string, number> = {
  'time-tracking': 0,
  'project-management': 1,
  workforce: 2,
};

const WORKSPACE_LABEL: Record<string, string> = {
  'time-tracking': 'Time Tracking',
  'project-management': 'Project Management',
  workforce: 'Workforce Management',
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(BillingPlan)
    private readonly planRepo: Repository<BillingPlan>,

    @InjectRepository(FeaturePack)
    private readonly packRepo: Repository<FeaturePack>,

    @InjectRepository(OrgSubscription)
    private readonly subscriptionRepo: Repository<OrgSubscription>,

    @InjectRepository(OrgActivePack)
    private readonly activePackRepo: Repository<OrgActivePack>,

    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,

    @InjectQueue('notifications')
    private readonly notificationsQueue: Queue,

    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,

    private readonly countryPaymentService: CountryPaymentService,
    private readonly paymentProviderService: PaymentProviderService,
    private readonly configService: ConfigService,
  ) {}

  // ── Plans & Packs (static catalogue) ──────────────────────────────────────

  async getPlans() {
    const plans = await this.planRepo.find({ order: { sortOrder: 'ASC' } });
    return plans.map((p) => ({
      name: p.name,
      tagline: p.tagline,
      pricePerSeat: Number(p.pricePerSeat),
      annualDiscount: Number(p.annualDiscount),
      seatLimit: p.seatLimit,
      allowedConfigs: p.allowedConfigs,
      highlights: p.highlights,
      order: p.sortOrder,
    }));
  }

  async getAvailablePacks() {
    const packs = await this.packRepo.find();
    return packs.map((p) => this.toPackPayload(p, false));
  }

  async getOrgAvailablePacks(organizationId: string) {
    const subscription = await this.subscriptionRepo.findOne({ where: { organizationId } });
    const workspaceConfig = subscription?.workspaceConfig ?? 'time-tracking';
    const currentWorkspaceRank = WORKSPACE_RANK[workspaceConfig] ?? 0;

    const activeRows = await this.activePackRepo.find({ where: { organizationId } });
    const activePackIds = new Set(activeRows.map((r) => r.packId));

    const allPacks = await this.packRepo.find();

    return allPacks
      .filter((p) => {
        const packRank = WORKSPACE_RANK[p.sourceConfig] ?? 0;
        return packRank > currentWorkspaceRank && !activePackIds.has(p.id);
      })
      .map((p) => this.toPackPayload(p, false));
  }

  // ── Subscription ───────────────────────────────────────────────────────────

  async getSubscription(organizationId: string) {
    let subscription = await this.subscriptionRepo.findOne({ where: { organizationId } });

    if (!subscription) {
      subscription = this.subscriptionRepo.create({
        organizationId,
        planName: 'Free',
        workspaceConfig: 'time-tracking',
        workspaceLabel: 'Time Tracking',
        seatCount: 1,
        seatLimit: 3,
        billingCycle: 'monthly',
        status: 'active',
        monthlyTotal: 0,
      });
      await this.subscriptionRepo.save(subscription);
    }

    const activePacks = await this.buildActivePacksPayload(organizationId);
    return this.toSubscriptionPayload(subscription, activePacks);
  }

  async createOrUpdateSubscription(
    organizationId: string,
    dto: CreateSubscriptionDto,
    userEmail: string,
    idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      const cacheKey = `idempotency:sub:${organizationId}:${idempotencyKey}`;
      const cached = await this.cache.get<object>(cacheKey);
      if (cached) return cached;
    }

    const plan = await this.planRepo.findOne({ where: { name: dto.planName } });
    if (!plan) throw new NotFoundException(`Plan '${dto.planName}' not found`);

    const existing = await this.subscriptionRepo.findOne({ where: { organizationId } });

    if (existing) {
      const existingRank = PLAN_RANK[existing.planName] ?? 0;
      const newRank = PLAN_RANK[dto.planName] ?? 0;
      if (newRank < existingRank && dto.seatCount < existing.seatCount) {
        throw new UnprocessableEntityException('Cannot downgrade below current seat count');
      }
      if (plan.seatLimit !== null && dto.seatCount > plan.seatLimit) {
        throw new ConflictException('Seat count exceeds plan limit');
      }
    }

    if (dto.paymentMethod === 'card' && !dto.cardToken) {
      throw new BadRequestException('cardToken is required for card payments');
    }

    const paymentConfig = await this.countryPaymentService.getConfigForOrg(organizationId);
    if (!paymentConfig.paymentMethods.includes(dto.paymentMethod)) {
      throw new BadRequestException(
        `Payment method '${dto.paymentMethod}' is not available in your country. ` +
          `Available methods: ${paymentConfig.paymentMethods.join(', ')}`,
      );
    }

    const packDetails = await this.buildActivePacksPayload(organizationId);
    const packTotal = packDetails.reduce((sum, p) => sum + Number(p.pricePerSeat), 0);
    const monthlyTotal = (Number(plan.pricePerSeat) + packTotal) * dto.seatCount;

    const workspaceConfig =
      dto.planName === 'Free'
        ? 'time-tracking'
        : (plan.allowedConfigs?.[plan.allowedConfigs.length - 1] ?? 'time-tracking');

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + (dto.billingCycle === 'annual' ? 12 : 1));

    const isManualPayment = dto.paymentMethod === 'flutterwave' || dto.paymentMethod === 'paystack';

    let subscription = existing;
    if (!subscription) {
      subscription = this.subscriptionRepo.create({ organizationId });
    }

    const txRef = isManualPayment
      ? `flow-sub-${organizationId}-${Date.now()}`
      : (existing?.txRef ?? null);

    subscription.planName = dto.planName;
    subscription.workspaceConfig = workspaceConfig;
    subscription.workspaceLabel = WORKSPACE_LABEL[workspaceConfig] ?? workspaceConfig;
    subscription.seatCount = dto.seatCount;
    subscription.seatLimit = plan.seatLimit;
    subscription.billingCycle = dto.billingCycle;
    // Manual payment methods stay 'trialing' until webhook confirms payment
    subscription.status = isManualPayment ? 'trialing' : 'active';
    subscription.paymentMethod = dto.paymentMethod;
    subscription.txRef = txRef;
    subscription.currentPeriodEnd = periodEnd;
    subscription.monthlyTotal = monthlyTotal;
    subscription.currency = paymentConfig.currency;
    subscription.currencySymbol = paymentConfig.currencySymbol;

    await this.subscriptionRepo.save(subscription);

    const invoiceDescription = `${dto.planName} Plan — ${new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;

    const invoice = this.invoiceRepo.create({
      organizationId,
      date: new Date().toISOString().split('T')[0],
      description: invoiceDescription,
      amount: monthlyTotal,
      currency: paymentConfig.currency,
      // open until webhook confirms; card is charged inline so mark paid immediately
      status: isManualPayment ? 'open' : 'paid',
    });
    await this.invoiceRepo.save(invoice);

    const result = await this.subscriptionRepo.findOne({ where: { organizationId } });
    const activePacks = await this.buildActivePacksPayload(organizationId);
    const basePayload = this.toSubscriptionPayload(result, activePacks);

    let redirectUrl: string | undefined;

    if (isManualPayment) {
      const callbackUrl = this.configService.get<string>(
        'BILLING_CALLBACK_URL',
        'https://app.devflow.afronix.com/billing/callback',
      );

      const initParams = {
        txRef,
        amount: monthlyTotal,
        currency: paymentConfig.currency,
        userEmail,
        description: invoiceDescription,
        callbackUrl,
      };

      if (dto.paymentMethod === 'flutterwave') {
        redirectUrl = await this.paymentProviderService.initializeFlutterwave(initParams);
      } else {
        redirectUrl = await this.paymentProviderService.initializePaystack(initParams);
      }
    }

    const payload = redirectUrl ? { ...basePayload, redirectUrl } : basePayload;

    if (idempotencyKey) {
      const cacheKey = `idempotency:sub:${organizationId}:${idempotencyKey}`;
      await this.cache.set(cacheKey, payload, 86400000);
    }

    return payload;
  }

  // ── Invoices ───────────────────────────────────────────────────────────────

  async getInvoices(organizationId: string) {
    return this.invoiceRepo.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Packs ──────────────────────────────────────────────────────────────────

  async managePack(organizationId: string, packId: string, action: 'add' | 'remove') {
    const pack = await this.packRepo.findOne({ where: { id: packId } });
    if (!pack) throw new NotFoundException(`Pack '${packId}' not found`);

    const subscription = await this.subscriptionRepo.findOne({ where: { organizationId } });
    if (!subscription) throw new NotFoundException('No active subscription found');

    if (action === 'add') {
      // Validate minimum plan requirement
      const currentPlanRank = PLAN_RANK[subscription.planName] ?? 0;
      const requiredRank = PLAN_RANK[pack.minimumPlan] ?? 0;
      if (currentPlanRank < requiredRank) {
        throw new ForbiddenException(`This pack requires the ${pack.minimumPlan} plan or higher`);
      }

      // Validate workspace rank — pack sourceConfig must be above current workspace
      const currentWorkspaceRank = WORKSPACE_RANK[subscription.workspaceConfig] ?? 0;
      const packWorkspaceRank = WORKSPACE_RANK[pack.sourceConfig] ?? 0;
      if (packWorkspaceRank <= currentWorkspaceRank) {
        throw new UnprocessableEntityException(
          'This pack is already included in your current workspace configuration',
        );
      }

      const existing = await this.activePackRepo.findOne({
        where: { organizationId, packId },
      });
      if (!existing) {
        await this.activePackRepo.save(this.activePackRepo.create({ organizationId, packId }));
      }
    } else {
      await this.activePackRepo.delete({ organizationId, packId });
    }

    const allPacks = await this.buildActivePacksPayload(organizationId);
    const packTotal = allPacks.reduce((sum, p) => sum + Number(p.pricePerSeat), 0);
    const plan = await this.planRepo.findOne({ where: { name: subscription.planName } });
    subscription.monthlyTotal =
      (Number(plan?.pricePerSeat ?? 0) + packTotal) * subscription.seatCount;
    await this.subscriptionRepo.save(subscription);

    return this.toSubscriptionPayload(subscription, allPacks);
  }

  // ── MISSING-009: Billing reminder + auto-downgrade cron ───────────────────

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runBillingReminders() {
    await this.sendUpcomingRenewalReminders();
    await this.processExpiredSubscriptions();
  }

  private async sendUpcomingRenewalReminders() {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const startOfDay = new Date(sevenDaysFromNow);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(sevenDaysFromNow);
    endOfDay.setHours(23, 59, 59, 999);

    const due = await this.subscriptionRepo
      .createQueryBuilder('s')
      .where('s.paymentMethod IN (:...methods)', { methods: ['flutterwave', 'paystack'] })
      .andWhere('s.status != :cancelled', { cancelled: 'cancelled' })
      .andWhere('s.currentPeriodEnd BETWEEN :start AND :end', {
        start: startOfDay,
        end: endOfDay,
      })
      .getMany();

    for (const sub of due) {
      try {
        await this.notificationsQueue.add('billing-reminder', {
          organizationId: sub.organizationId,
          planName: sub.planName,
          currentPeriodEnd: sub.currentPeriodEnd,
          paymentMethod: sub.paymentMethod,
          message: `Your ${sub.planName} subscription renews in 7 days. Please complete payment to avoid service interruption.`,
        });
        this.logger.log(`Billing reminder queued for org ${sub.organizationId}`);
      } catch (err) {
        this.logger.error(`Failed to queue billing reminder for org ${sub.organizationId}`, err);
      }
    }
  }

  private async processExpiredSubscriptions() {
    const now = new Date();

    const expired = await this.subscriptionRepo
      .createQueryBuilder('s')
      .where('s.paymentMethod IN (:...methods)', { methods: ['flutterwave', 'paystack'] })
      .andWhere('s.status != :active', { active: 'active' })
      .andWhere('s.currentPeriodEnd <= :now', { now })
      .getMany();

    for (const sub of expired) {
      try {
        const overSeatLimit = sub.seatCount > 3;

        sub.planName = 'Free';
        sub.workspaceConfig = 'time-tracking';
        sub.workspaceLabel = 'Time Tracking';
        sub.seatLimit = 3;
        sub.monthlyTotal = 0;
        // 9.6: If over seat limit, flag past_due instead of cancelling outright
        sub.status = overSeatLimit ? 'past_due' : 'cancelled';
        await this.subscriptionRepo.save(sub);

        await this.activePackRepo.delete({ organizationId: sub.organizationId });

        const message = overSeatLimit
          ? `Your subscription has lapsed and your account has been moved to the Free plan. You currently have ${sub.seatCount} seats which exceeds the Free plan limit of 3 — please remove members to resolve this.`
          : 'Your subscription has expired and your account has been downgraded to the Free plan.';

        await this.notificationsQueue.add('subscription-downgraded', {
          organizationId: sub.organizationId,
          overSeatLimit,
          message,
          auditEvent: {
            event: 'plan_reverted_to_free',
            reason: 'payment_lapsed',
            orgId: sub.organizationId,
          },
        });

        this.logger.log(
          `Subscription downgraded to Free for org ${sub.organizationId} (overSeatLimit=${overSeatLimit})`,
        );
      } catch (err) {
        this.logger.error(`Failed to downgrade subscription for org ${sub.organizationId}`, err);
      }
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async buildActivePacksPayload(organizationId: string) {
    const activeRows = await this.activePackRepo.find({ where: { organizationId } });
    if (!activeRows.length) return [];

    const packIds = activeRows.map((r) => r.packId);
    const packs = await this.packRepo
      .createQueryBuilder('p')
      .where('p.id IN (:...packIds)', { packIds })
      .getMany();

    return packs.map((p) => this.toPackPayload(p, true));
  }

  private toPackPayload(pack: FeaturePack, active: boolean) {
    return {
      id: pack.id,
      name: pack.name,
      sourceConfig: pack.sourceConfig,
      description: pack.description,
      features: pack.features,
      pricePerSeat: Number(pack.pricePerSeat),
      minimumPlan: pack.minimumPlan,
      active,
    };
  }

  private toSubscriptionPayload(sub: OrgSubscription, activePacks: any[]) {
    return {
      planName: sub.planName,
      workspaceConfig: sub.workspaceConfig,
      workspaceLabel: sub.workspaceLabel,
      seatCount: sub.seatCount,
      seatLimit: sub.seatLimit,
      billingCycle: sub.billingCycle,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd,
      monthlyTotal: Number(sub.monthlyTotal),
      currency: sub.currency,
      currencySymbol: sub.currencySymbol,
      activePacks,
    };
  }
}
