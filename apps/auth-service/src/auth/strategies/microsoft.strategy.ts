import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
    constructor(private configService: ConfigService) {
        super({
            clientID: configService.get('MICROSOFT_CLIENT_ID'),
            clientSecret: configService.get('MICROSOFT_CLIENT_SECRET'),
            callbackURL: configService.get('MICROSOFT_CALLBACK_URL'),
            scope: ['user.read'],
            tenant: configService.get('MICROSOFT_TENANT_ID') || 'common'
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: any, done: Function): Promise<any> {
        const { name, emails, id } = profile;
        const user = {
            email: emails[0].value,
            firstName: name.givenName,
            lastName: name.familyName,
            providerId: id,
            accessToken,
            refreshToken
        };
        done(null, user);
    }
}
