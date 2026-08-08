import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'Admin@12345';

async function main(): Promise<void> {
  const username = process.env.SEED_ADMIN_USERNAME || 'superadmin';
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@unblock.local').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || DEFAULT_PASSWORD;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`ℹ️  Super admin already exists (${email}) — skipping.`);
    return;
  }

  // In production, refuse to create an admin with the built-in default password.
  // Forces SEED_ADMIN_PASSWORD to be set to a real secret. Idempotent seed runs
  // on every deploy, so after the admin exists this branch is never reached.
  if (process.env.NODE_ENV === 'production' && password === DEFAULT_PASSWORD) {
    console.error(
      '✋ Refusing to seed super admin with the default password in production. ' +
        'Set SEED_ADMIN_PASSWORD to a strong value and redeploy.',
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      role: 'super_admin',
      status: 'active',
    },
  });

  console.log('✅ Seeded initial super admin:');
  console.log(`   email:    ${admin.email}`);
  console.log(`   username: ${admin.username}`);
  console.log(`   password: ${password}`);
  console.log('   ⚠️  Change this password after first login.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
