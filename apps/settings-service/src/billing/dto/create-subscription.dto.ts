import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({ enum: ['Starter', 'Professional', 'Enterprise'] })
  @IsEnum(['Starter', 'Professional', 'Enterprise'])
  planName: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  seatCount: number;

  @ApiProperty({ enum: ['monthly', 'annual'] })
  @IsEnum(['monthly', 'annual'])
  billingCycle: string;

  @ApiProperty({ enum: ['card', 'flutterwave', 'paystack'] })
  @IsEnum(['card', 'flutterwave', 'paystack'])
  paymentMethod: string;

  @ApiPropertyOptional({ description: 'Required when paymentMethod is "card"' })
  @IsOptional()
  @IsString()
  cardToken?: string;
}
