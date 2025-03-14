import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy as StrategyJWT,
  ExtractJwt as ExtractJWT,
} from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(StrategyJWT, 'jwt') {
  constructor(configService: ConfigService<{ JWT_SECRET: string }>) {
    const secretKey = configService.get('JWT_SECRET');
    if (!secretKey) {
      throw new Error('JWT_SECRET not found in configuration');
    }

    super({
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretKey,
    });
  }

  validate(payload: JwtPayload): { userId: string; username: string } {
    return { userId: payload.sub, username: payload.username };
  }
}
