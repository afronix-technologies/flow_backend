import { ApiProperty } from '@nestjs/swagger';

class StatusBreakdown {
  @ApiProperty({ example: 4 }) active: number;
  @ApiProperty({ example: 1 }) onHold: number;
  @ApiProperty({ example: 2 }) completed: number;
  @ApiProperty({ example: 0 }) archived: number;
}

class HealthBreakdown {
  @ApiProperty({ example: 5 }) onTrack: number;
  @ApiProperty({ example: 1 }) atRisk: number;
  @ApiProperty({ example: 1 }) critical: number;
}

class CategoryBreakdown {
  @ApiProperty({ example: 5 }) billable: number;
  @ApiProperty({ example: 2 }) internal: number;
}

export class ProjectStatsResponse {
  @ApiProperty({ example: 7 }) total: number;
  @ApiProperty({ type: StatusBreakdown }) byStatus: StatusBreakdown;
  @ApiProperty({ type: HealthBreakdown }) byHealth: HealthBreakdown;
  @ApiProperty({ type: CategoryBreakdown }) byCategory: CategoryBreakdown;
}
