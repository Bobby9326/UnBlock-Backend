import type { Role, UserStatus } from '@prisma/client';

// The authenticated user attached by authMiddleware (a subset of the User row).
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatarUrl: string | null;
}
