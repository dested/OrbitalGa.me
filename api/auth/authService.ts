import * as jwt from 'jsonwebtoken';
import {Config} from '../config/config';
import {JwtPlayer} from './models/jwtPlayer';

export class AuthService {
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
      const jwtUser = this.validateJwt(authorization.replace('Bearer ', ''));
      if (!jwtUser) {
        return undefined;
      }
      return jwtUser;
    } catch (ex) {
      return undefined;
    }
  }
  static validateJwt(jwtText: string): JwtPlayer | undefined {
    try {
      const j = jwt.verify(jwtText || '', Config.jwtPlayerKey);
      return (j as unknown) as JwtPlayer;
    } catch (ex) {
      return undefined;
    }
  }
}
