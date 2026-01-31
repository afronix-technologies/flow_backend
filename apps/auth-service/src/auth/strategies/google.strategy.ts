import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const clientID = configService.get('GOOGLE_CLIENT_ID') || 'dummy';
    const clientSecret = configService.get('GOOGLE_CLIENT_SECRET') || 'dummy';

    super({
      clientID,
      clientSecret,
      callbackURL: configService.get('GOOGLE_CALLBACK_URL') || 'http://localhost:3001/callback',
      scope: ['email', 'profile'],
    });

    // Log if disabled
    if (clientID === 'dummy') {
      console.log('Google OAuth disabled - no credentials provided');
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, id } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: profile._json.picture,
      providerId: id,
      accessToken,
      refreshToken,
    };
    done(null, user);
  }
}