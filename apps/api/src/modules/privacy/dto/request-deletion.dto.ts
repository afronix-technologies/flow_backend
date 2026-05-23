import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RequestDeletionDto {
  @ApiPropertyOptional({
    example: null,
    description: 'Leave null for initial request; provide token to confirm',
  })
  @IsOptional()
  @IsString()
  confirmationToken?: string;

  @ApiPropertyOptional({ example: 'User choosing to leave platform' })
  @IsOptional()
  @IsString()
  requestReason?: string;
}
