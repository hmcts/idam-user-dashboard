import jwtDecode from 'jwt-decode';

export class OIDCToken {
  public static format = (tokenRaw: string): OIDCToken => ({ ...jwtDecode(tokenRaw), raw: tokenRaw });
  public static isExpired = (token: OIDCToken) => Math.round(Date.now() / 1000) >= token.exp;
  public static isStale = (token: OIDCToken) => Math.round(Date.now() / 1000) >= token.iat + token.expires_in/2
}

export interface OIDCToken {
  [key: string]: string | number | boolean;
  exp: number;
  iat: number;
  expires_in: number;
  raw: string;
}
