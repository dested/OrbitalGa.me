import * as jwt from 'jsonwebtoken';
import {Config} from '../config/config';
import {JwtPlayer, JwtSpectate} from './jwtModels';
import {SecureConfig} from '../config/secureConfig';

export class AuthService {
  static async createSpectateToken(): Promise<string> {
    const payload: JwtSpectate = {
      timeJoined: +new Date(),
    };
    const expiresIn = 60 * 1;
    const token = jwt.sign(payload, Config.jwtSpectateKey, {expiresIn});
    return token;
  }
  static async createToken(user: JwtPlayer): Promise<string> {
    const expiresIn = 60 * 24 * 3;
    const token = jwt.sign(user, Config.jwtPlayerKey, {expiresIn});
    return token;
  }

  static validate(authorization: string): JwtPlayer | undefined {
    if (!authorization) {
      return undefined;
    }
    try {
      const jwtUser = jwt.verify(authorization.replace('Bearer ', ''), Config.jwtPlayerKey) as JwtPlayer | undefined;
      if (!jwtUser) {
        return undefined;
      }
      return jwtUser;
    } catch (ex) {
      return undefined;
    }
  }

  static validateSpectate(authorization: string): JwtSpectate | undefined {
    if (!authorization) {
      return undefined;
    }
    try {
      const jwtUser = jwt.verify(authorization.replace('Bearer ', ''), Config.jwtSpectateKey) as
        | JwtSpectate
        | undefined;
      if (!jwtUser) {
        return undefined;
      }
      return jwtUser;
    } catch (ex) {
      return undefined;
    }
  }
}
