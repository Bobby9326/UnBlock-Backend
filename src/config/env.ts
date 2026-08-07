import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),

  databaseUrl: required('DATABASE_URL'),

  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Auth cookie (httpOnly). tokenMaxAgeMs should match JWT lifetime.
  authCookieName: process.env.AUTH_COOKIE_NAME || 'unblock_token',
  tokenMaxAgeMs: parseInt(process.env.TOKEN_MAX_AGE_MS || String(7 * 24 * 60 * 60 * 1000), 10),
  // Comma-separated list of allowed browser origins for CORS (credentials mode).
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  supabase: {
    url: required('SUPABASE_URL'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
    bucket: process.env.SUPABASE_BUCKET || 'uploads',
    // Lifetime of signed URLs handed to the frontend for viewing private files.
    signedUrlTtlSeconds: parseInt(process.env.SIGNED_URL_TTL_SECONDS || '3600', 10),
  },
  maxUploadBytes: parseInt(process.env.MAX_UPLOAD_BYTES || '5242880', 10),
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,

  cleanupCron: process.env.CLEANUP_CRON || '0 * * * *',
  orphanMaxAgeHours: parseInt(process.env.ORPHAN_MAX_AGE_HOURS || '24', 10),

  seed: {
    adminUsername: process.env.SEED_ADMIN_USERNAME || 'superadmin',
    adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@unblock.local',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
  },
};

export const isProduction = env.nodeEnv === 'production';
