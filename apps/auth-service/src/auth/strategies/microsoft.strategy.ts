import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(private configService: ConfigService) {
    const clientID = configService.get('MICROSOFT_CLIENT_ID') || 'dummy';
    const clientSecret = configService.get('MICROSOFT_CLIENT_SECRET') || 'dummy';

    super({
      clientID,
      clientSecret,
      callbackURL: configService.get('MICROSOFT_CALLBACK_URL') || 'http://localhost:3001/callback',
      scope: ['user.read'],
      tenant: configService.get('MICROSOFT_TENANT_ID') || 'common',
    });

    if (clientID === 'dummy') {
      console.log('Microsoft OAuth disabled - no credentials provided');
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    const { name, emails, id } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      providerId: id,
      accessToken,
      refreshToken,
    };
    done(null, user);
  }
}