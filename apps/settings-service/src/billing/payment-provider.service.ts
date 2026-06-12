import { Injectable, BadGatewayException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface PaymentInitParams {
  txRef: string;
  amount: number;
  currency: string;
  userEmail: string;
  description: string;
  callbackUrl: string;
}

@Injectable()
export class PaymentProviderService {
  private readonly logger = new Logger(PaymentProviderService.name);

  constructor(private readonly configService: ConfigService) {}

  async initializeFlutterwave(params: PaymentInitParams): Promise<string> {
    const secretKey = this.configService.get<string>('FLUTTERWAVE_SECRET_KEY');
    if (!secretKey) {
      throw new BadGatewayException('Flutterwave is not configured on this server');
    }

    try {
      const { data } = await axios.post(
        'https://api.flutterwave.com/v3/payments',
        {
          tx_ref: params.txRef,
          amount: params.amount,
          currency: params.currency,
          redirect_url: params.callbackUrl,
          customer: { email: params.userEmail },
          customizations: {
            title: 'Flow Subscription',
            description: params.description,
          },
        },
        { headers: { Authorization: `Bearer ${secretKey}` } },
      );
      return data.data.link as string;
    } catch (err: any) {
      this.logger.error('Flutterwave init failed', err?.response?.data ?? err.message);
      throw new BadGatewayException('Failed to initialize Flutterwave payment');
    }
  }

  async initializePaystack(params: PaymentInitParams): Promise<string> {
    const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    if (!secretKey) {
      throw new BadGatewayException('Paystack is not configured on this server');
    }

    try {
      const { data } = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email: params.userEmail,
          // Paystack expects the smallest currency unit (kobo / pesewas)
          amount: Math.round(params.amount * 100),
          currency: params.currency,
          reference: params.txRef,
          callback_url: params.callbackUrl,
          metadata: { description: params.description },
        },
        { headers: { Authorization: `Bearer ${secretKey}` } },
      );
      return data.data.authorization_url as string;
    } catch (err: any) {
      this.logger.error('Paystack init failed', err?.response?.data ?? err.message);
      throw new BadGatewayException('Failed to initialize Paystack payment');
    }
  }
}
