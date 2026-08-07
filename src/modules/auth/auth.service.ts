import { authRepository } from './auth.repository.js';
import { notificationsService } from '../notifications/notifications.service.js';
import { hashPassword, comparePassword } from '../../utils/hash.js';
import { signToken } from '../../utils/jwt.js';
import { AppError } from '../../utils/AppError.js';
import type { RegisterInput, LoginInput } from './auth.validation.js';

export const authService = {
  // Registration always yields a pending account; an admin activates it later.
  async register({ username, email, password }: RegisterInput) {
    const existing = await authRepository.findByEmail(email);
    if (existing) throw AppError.conflict('Email is already registered');

    const passwordHash = await hashPassword(password);
    const user = await authRepository.create({
      username,
      email,
      passwordHash,
      role: 'general_user',
      status: 'pending',
    });

    // Alert super admins that an account is awaiting approval. A failure here
    // must never fail the registration itself — log and continue.
    try {
      await notificationsService.notifyAdmins({
        type: 'user_registered',
        referenceId: user.id,
        message: `${user.username} registered and is awaiting approval`,
      });
    } catch (err) {
      console.error('[auth] failed to notify admins of registration:', (err as Error).message);
    }

    return user;
  },

  async login({ email, password }: LoginInput) {
    const user = await authRepository.findByEmail(email);
    // Uniform error to avoid leaking which emails exist.
    if (!user) throw AppError.unauthorized('Invalid email or password');

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) throw AppError.unauthorized('Invalid email or password');

    const token = signToken({ sub: user.id, role: user.role });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
      },
    };
  },

  async me(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) throw AppError.notFound('User not found');
    return user;
  },
};
