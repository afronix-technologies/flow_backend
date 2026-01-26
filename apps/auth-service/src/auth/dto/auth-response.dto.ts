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
    onboardingStep: string;
}

export class AuthResponseDto {
    @ApiProperty()
    accessToken: string;

    @ApiProperty()
    refreshToken: string;

    @ApiProperty({ type: UserResponse })
    user: UserResponse;

    @ApiProperty({ type: OrganizationResponse })
    organization: OrganizationResponse;
}
