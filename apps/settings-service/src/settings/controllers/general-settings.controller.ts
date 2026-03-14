import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GeneralSettingsService } from '../services/general-settings.service';
import { UpdateGeneralSettingsDto } from '../dto/update-general-settings.dto';

@ApiTags('General Settings')
@Controller('settings/general')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GeneralSettingsController {
  constructor(private readonly generalSettingsService: GeneralSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get general/company configuration for the current organisation' })
  get(@Req() req: any) {
    return this.generalSettingsService.findByOrg(req.user.organizationId);
  }

  @Put()
  @ApiOperation({ summary: 'Update general/company configuration (partial update supported)' })
  update(@Req() req: any, @Body() dto: UpdateGeneralSettingsDto) {
    return this.generalSettingsService.update(req.user.organizationId, dto);
  }
}
