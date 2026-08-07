import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const username = process.env.SEED_ADMIN_USERNAME || 'superadmin';
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@unblock.local').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`ℹ️  Super admin already exists (${email}) — skipping.`);
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
