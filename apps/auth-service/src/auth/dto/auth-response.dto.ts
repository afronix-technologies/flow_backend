import { ApiProperty } from '@nestjs/swagger';

class UserResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  role: string;
}

class OrganizationResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  onboardingStep: string;

  @ApiProperty({ required: false, nullable: true })
  packageKey: string | null;
}

export class AuthResponseDto {
  @ApiProperty({ required: false })
  accessToken?: string; // Optional if we move to cookie-only

  @ApiProperty({ required: false })
  refreshToken?: string;

  @ApiProperty({ required: false })
  sessionId?: string;

  @ApiProperty({ type: UserResponse })
  user: UserResponse;

  @ApiProperty({ type: OrganizationResponse })
  organization: OrganizationResponse;
}
