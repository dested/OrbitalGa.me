export type Jwt = string & {_opaque: 'string'};
export function makeJwt(jwt: string): Jwt {
  return jwt as Jwt;
}
