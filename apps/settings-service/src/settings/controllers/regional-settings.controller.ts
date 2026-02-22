import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RegionalSettingsService } from '../services/regional-settings.service';
import { UpdateRegionalSettingsDto } from '../dto/update-regional-settings.dto';

@ApiTags('Regional Settings')
@Controller('settings/regional')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RegionalSettingsController {
  constructor(private readonly regionalSettingsService: RegionalSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get regional/locale settings for the current organisation' })
  get(@Req() req: any) {
    return this.regionalSettingsService.findByOrg(req.user.organizationId);
  }

  @Put()
  @ApiOperation({ summary: 'Update regional/locale settings (partial update supported)' })
  update(@Req() req: any, @Body() dto: UpdateRegionalSettingsDto) {
    return this.regionalSettingsService.update(req.user.organizationId, dto);
  }
}
