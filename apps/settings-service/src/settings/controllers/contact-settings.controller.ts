import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ContactSettingsService } from '../services/contact-settings.service';
import { UpdateContactSettingsDto } from '../dto/update-contact-settings.dto';

@ApiTags('Contact Settings')
@Controller('settings/contact')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContactSettingsController {
  constructor(private readonly contactSettingsService: ContactSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get contact information settings for the current organisation' })
  get(@Req() req: any) {
    return this.contactSettingsService.findByOrg(req.user.organizationId);
  }

  @Put()
  @ApiOperation({ summary: 'Update contact information settings (partial update supported)' })
  update(@Req() req: any, @Body() dto: UpdateContactSettingsDto) {
    return this.contactSettingsService.update(req.user.organizationId, dto);
  }
}
