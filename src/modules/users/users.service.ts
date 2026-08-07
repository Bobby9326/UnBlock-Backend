import { usersRepository } from './users.repository.js';
import { uploadsRepository } from '../uploads/uploads.repository.js';
import { hashPassword, comparePassword } from '../../utils/hash.js';
import { AppError } from '../../utils/AppError.js';
import type { UpdateProfileInput, ChangePasswordInput } from './users.validation.js';

export const usersService = {
  // Self profile edit — only username and avatar.
  async updateProfile(userId: string, { username, avatarUrl }: UpdateProfileInput) {
    const data: { username?: string; avatarUrl?: string | null } = {};
    if (username !== undefined) data.username = username;
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;

    const user = await usersRepository.update(userId, data);

    // Flag the chosen avatar as referenced so the orphan-cleanup job won't
    // reap it. (A non-null URL only; clearing the avatar leaves the old file
    // to be cleaned up as an orphan.)
    if (avatarUrl) {
      await uploadsRepository.markReferencedByUrls([avatarUrl]);
    }

    return user;
  },

  // Self password change — requires the current password. Distinct from the
  // admin reset flow, which never checks the old password.
  async changePassword(userId: string, { currentPassword, newPassword }: ChangePasswordInput) {
    const user = await usersRepository.findById(userId);
    if (!user) throw AppError.notFound('User not found');

    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) throw AppError.badRequest('Current password is incorrect');

    const passwordHash = await hashPassword(newPassword);
    await usersRepository.updatePasswordHash(userId, passwordHash);
    return { message: 'Password changed successfully' };
  },
};
