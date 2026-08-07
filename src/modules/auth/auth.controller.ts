import type { Request, Response, CookieOptions } from 'express';
import { authService } from './auth.service.js';
import { ok, created } from '../../utils/response.js';
import { env, isProduction } from '../../config/env.js';

// Shared options for the httpOnly auth cookie.
// - httpOnly: JS (and thus XSS) cannot read it.
// - sameSite 'lax' in dev (same-site localhost); 'none' + secure in prod so a
//   separate frontend origin can send it over HTTPS.
// - secure: only sent over HTTPS in production.
function authCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: env.tokenMaxAgeMs,
    path: '/',
  };
}

export const authController = {
  async register(req: Request, res: Response) {
    const user = await authService.register(req.body);
    return created(res, {
      user,
      message: 'Registration successful. Your account is pending admin approval.',
    });
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    // Set the token as an httpOnly cookie for browser clients. The token is
    // still returned in the body so non-browser clients (Swagger/curl/mobile)
    // can use the Authorization: Bearer header.
    res.cookie(env.authCookieName, result.token, authCookieOptions());
    return ok(res, result);
  },

  // Clears the auth cookie. (JWT itself remains valid until expiry — this is a
  // client-side/cookie logout, matching the stateless design.)
  async logout(_req: Request, res: Response) {
    // clearCookie must use the same attributes (minus maxAge) to match.
    const { maxAge: _omit, ...clearOpts } = authCookieOptions();
    res.clearCookie(env.authCookieName, clearOpts);
    return ok(res, { message: 'Logged out successfully' });
  },

  async me(req: Request, res: Response) {
    const user = await authService.me(req.user!.id);
    return ok(res, { user });
  },
};
