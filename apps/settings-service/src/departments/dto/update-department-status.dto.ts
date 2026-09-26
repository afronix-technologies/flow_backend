import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { DepartmentStatus } from '../entities/department.entity';

export class UpdateDepartmentStatusDto {
  @ApiProperty({
    enum: DepartmentStatus,
    example: DepartmentStatus.SUSPENDED,
    description: '"active" or "suspended"',
  })
  @IsEnum(DepartmentStatus)
  status: DepartmentStatus;
}
