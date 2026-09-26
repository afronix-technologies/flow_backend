import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../settings/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { HolidayService } from '../services/holiday.service';
import { CreateHolidayDto } from '../dto/create-holiday.dto';
import { UpdateHolidayDto } from '../dto/update-holiday.dto';
import { ImportHolidaysDto } from '../dto/import-holidays.dto';

@ApiTags('Work Policies — Holidays')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class HolidayController {
  constructor(private readonly service: HolidayService) {}

  // ── Country discovery (no org scope) ──────────────────────────────────────

  @Get('work-policies/holidays/countries')
  @ApiOperation({
    summary: 'List all supported countries for holiday import',
    description:
      'Returns the full list of countries supported for public holiday data, powered by Nager.Date. ' +
      '100+ countries worldwide using ISO 3166-1 alpha-2 codes. ' +
      'Use the countryCode value when calling the presets or import endpoints.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of supported countries.',
    schema: {
      example: [
        { countryCode: 'NG', name: 'Nigeria' },
        { countryCode: 'GB', name: 'United Kingdom' },
        { countryCode: 'US', name: 'United States' },
      ],
    },
  })
  @ApiResponse({ status: 503, description: 'Holiday data provider temporarily unavailable.' })
  getCountries() {
    return this.service.getAvailableCountries();
  }

  // ── Holiday presets preview (no org scope) ─────────────────────────────────

  @Get('work-policies/holidays/presets')
  @ApiOperation({
    summary: 'Preview public holidays for a country',
    description:
      'Returns live public holiday data for any country and year, sourced from Nager.Date. ' +
      'Use this to preview before importing into an organisation. ' +
      'Preset items have no id or enabled field — those are assigned on import. ' +
      'country must be a 2-letter ISO 3166-1 alpha-2 code (e.g. NG, US, GB, ZA, DE). ' +
      'Use GET /work-policies/holidays/countries for the full list of supported codes.',
  })
  @ApiQuery({
    name: 'country',
    required: true,
    description: 'ISO 3166-1 alpha-2 country code (2 uppercase letters)',
    example: 'NG',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Year to fetch holidays for. Defaults to the current year.',
    example: 2026,
  })
  @ApiResponse({
    status: 200,
    description: 'Public holidays for the requested country and year.',
    schema: {
      example: [
        { name: "New Year's Day", date: '2026-01-01', type: 'national' },
        { name: 'Independence Day', date: '2026-10-01', type: 'national' },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid or unsupported country code.' })
  @ApiResponse({ status: 503, description: 'Holiday data provider temporarily unavailable.' })
  getPresets(@Query('country') country: string, @Query('year') year?: string) {
    return this.service.getPresets(country, year ? parseInt(year) : undefined);
  }

  // ── Org-scoped holidays ────────────────────────────────────────────────────

  @Get('organizations/:orgId/work-policies/holidays')
  @ApiOperation({
    summary: 'List organisation holidays',
    description:
      'Returns all holidays configured for the organisation, ' +
      'including both imported country holidays and custom entries, ordered by date. ' +
      'Check the enabled field to see which are currently active.',
  })
  @ApiParam({ name: 'orgId', description: 'Organisation UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of holidays for the organisation.',
    schema: {
      example: [
        {
          id: 'uuid',
          name: "New Year's Day",
          date: '2026-01-01',
          type: 'national',
          enabled: true,
          organizationId: 'uuid',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(@Param('orgId') orgId: string, @Req() req: any) {
    const organizationId = req.user.role === 'super_admin' ? orgId : req.user.organizationId;
    return this.service.findAllByOrg(organizationId);
  }

  @Post('organizations/:orgId/work-policies/holidays')
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Add a custom holiday',
    description:
      'Adds a single custom holiday to the organisation. ' +
      'Use type "custom" for company-specific days. ' +
      'Only custom holidays can be permanently deleted later — use PATCH to toggle national/religious ones. ' +
      'Requires admin or owner role.',
  })
  @ApiParam({ name: 'orgId', description: 'Organisation UUID' })
  @ApiResponse({ status: 201, description: 'The newly created holiday.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin or owner role required.' })
  create(@Param('orgId') orgId: string, @Req() req: any, @Body() dto: CreateHolidayDto) {
    const organizationId = req.user.role === 'super_admin' ? orgId : req.user.organizationId;
    return this.service.create(organizationId, dto);
  }

  @Post('organizations/:orgId/work-policies/holidays/import')
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Bulk-import public holidays from any country',
    description:
      'Fetches live public holiday data for any country worldwide and imports it into the organisation. ' +
      'This REPLACES the entire existing holiday list for the org — current holidays are cleared first. ' +
      'Supports 100+ countries via ISO 3166-1 alpha-2 country codes (e.g. NG, US, GB, ZA, DE, IN, AU). ' +
      'Use GET /work-policies/holidays/countries to discover all supported country codes. ' +
      'year defaults to the current year if not provided. ' +
      'Requires admin or owner role.',
  })
  @ApiParam({ name: 'orgId', description: 'Organisation UUID' })
  @ApiResponse({
    status: 201,
    description: 'Holidays imported successfully.',
    schema: {
      example: {
        imported: 11,
        holidays: [
          {
            id: 'uuid',
            name: "New Year's Day",
            date: '2026-01-01',
            type: 'national',
            enabled: true,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid or unsupported country code.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin or owner role required.' })
  @ApiResponse({ status: 503, description: 'Holiday data provider temporarily unavailable.' })
  importPresets(@Param('orgId') orgId: string, @Req() req: any, @Body() dto: ImportHolidaysDto) {
    const organizationId = req.user.role === 'super_admin' ? orgId : req.user.organizationId;
    return this.service.importPresets(organizationId, dto);
  }

  @Patch('organizations/:orgId/work-policies/holidays/:holidayId')
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Enable, disable or update a holiday',
    description:
      'Partially updates a holiday. All fields are optional. ' +
      'Use enabled: false to deactivate a national holiday without deleting it. ' +
      'name and date can only be changed on custom type holidays. ' +
      'Requires admin or owner role.',
  })
  @ApiParam({ name: 'orgId', description: 'Organisation UUID' })
  @ApiParam({ name: 'holidayId', description: 'Holiday UUID' })
  @ApiResponse({ status: 200, description: 'The updated holiday.' })
  @ApiResponse({ status: 400, description: 'Cannot change name/date on non-custom holidays.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin or owner role required.' })
  @ApiResponse({ status: 404, description: 'Holiday not found.' })
  update(
    @Param('orgId') orgId: string,
    @Param('holidayId') holidayId: string,
    @Req() req: any,
    @Body() dto: UpdateHolidayDto,
  ) {
    const organizationId = req.user.role === 'super_admin' ? orgId : req.user.organizationId;
    return this.service.update(organizationId, holidayId, dto);
  }

  @Delete('organizations/:orgId/work-policies/holidays/:holidayId')
  @UseGuards(RolesGuard)
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete a custom holiday',
    description:
      'Permanently removes a holiday from the organisation. ' +
      'Only "custom" type holidays can be deleted. ' +
      'For national or religious holidays, use PATCH with enabled: false instead. ' +
      'Requires admin or owner role.',
  })
  @ApiParam({ name: 'orgId', description: 'Organisation UUID' })
  @ApiParam({ name: 'holidayId', description: 'Holiday UUID' })
  @ApiResponse({ status: 204, description: 'Holiday deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Cannot delete national/religious holidays.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin or owner role required.' })
  @ApiResponse({ status: 404, description: 'Holiday not found.' })
  remove(@Param('orgId') orgId: string, @Param('holidayId') holidayId: string, @Req() req: any) {
    const organizationId = req.user.role === 'super_admin' ? orgId : req.user.organizationId;
    return this.service.remove(organizationId, holidayId);
  }
}
