import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import axios from 'axios';

const NAGER_BASE = 'https://date.nager.at/api/v3';

export interface NagerHoliday {
  date: string;
  name: string;
  localName: string;
  types: string[];
}

export interface HolidayPreset {
  name: string;
  date: string;
  type: 'national' | 'religious';
}

export interface AvailableCountry {
  countryCode: string;
  name: string;
}

@Injectable()
export class NagerDateService {
  private readonly logger = new Logger(NagerDateService.name);

  /**
   * Fetch public holidays for a given ISO country code and year from Nager.Date.
   * Filters to only "Public" type holidays (excludes school/bank/observance).
   * Throws if the country code is not supported or the API is unreachable.
   */
  async getPublicHolidays(country: string, year: number): Promise<HolidayPreset[]> {
    const url = `${NAGER_BASE}/PublicHolidays/${year}/${country.toUpperCase()}`;

    try {
      const response = await axios.get<NagerHoliday[]>(url, { timeout: 8000 });

      if (!Array.isArray(response.data) || response.data.length === 0) {
        throw new BadRequestException(
          `No public holidays found for country "${country.toUpperCase()}" in ${year}. ` +
            `Check the country code is a valid ISO 3166-1 alpha-2 code (e.g. US, GB, NG, ZA).`,
        );
      }

      return response.data
        .filter((h) => h.types.includes('Public'))
        .map((h) => ({
          name: h.localName || h.name,
          date: h.date,
          type: 'national' as const,
        }));
    } catch (err) {
      if (err instanceof BadRequestException) throw err;

      if (err.response?.status === 404) {
        throw new BadRequestException(
          `Country code "${country.toUpperCase()}" is not supported by the holiday data provider. ` +
            `Use GET /work-policies/holidays/countries to see all supported country codes.`,
        );
      }

      this.logger.error(`Nager.Date API error for ${country}/${year}: ${err.message}`);
      throw new ServiceUnavailableException(
        'Holiday data provider is currently unavailable. Please try again in a moment.',
      );
    }
  }

  /**
   * Returns all countries supported by the Nager.Date API (100+ countries).
   */
  async getAvailableCountries(): Promise<AvailableCountry[]> {
    try {
      const response = await axios.get<AvailableCountry[]>(`${NAGER_BASE}/AvailableCountries`, {
        timeout: 8000,
      });
      return response.data;
    } catch (err) {
      this.logger.error(`Failed to fetch available countries: ${err.message}`);
      throw new ServiceUnavailableException(
        'Holiday data provider is currently unavailable. Please try again in a moment.',
      );
    }
  }
}
