import * as jwt from 'jsonwebtoken';
import {RequestHeaders} from './handlerWrapper';
import {Config} from '../config/config';
import {UnauthorizedError} from './errors';
import {JwtPlayer} from './jwtPlayer';

export class Auth {
  static async createToken(user: JwtPlayer): Promise<string> {
    const expiresIn = 24 * 60 * 60 * 365 * 10 * 1000;
    const token = jwt.sign(user, Config.jwtPlayerKey, {expiresIn});
    return token;
  }

  static validate(headers?: RequestHeaders): JwtPlayer {
    const token = headers?.authorization || (headers as any)?.Authorization || '';
    if (!token) {
      throw new UnauthorizedError();
      return null!;
    }
    try {
      const jwtUser = this.validateJwt(token.replace('Bearer ', ''));
      if (!jwtUser) {
        throw new UnauthorizedError();
      }
      return jwtUser!;
    } catch (ex) {
      console.error('jwt', ex);
      throw new UnauthorizedError();
      return null!;
    }
  }

  static getJwt(headers: RequestHeaders) {
    try {
      const token = headers.authorization || (headers as any).Authorization;
      return token.replace('Bearer ', '');
    } catch (ex) {
      console.error('jwt', ex);
      return null;
    }
  }

  static validateJwt(jwtText: string) {
    try {
      const j = jwt.verify(jwtText || '', Config.jwtPlayerKey);
      return (j as unknown) as JwtPlayer;
    } catch (ex) {
      console.error('jwt', ex);
      return null;
    }
  }
}
