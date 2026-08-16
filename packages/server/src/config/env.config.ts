import { z } from 'zod';

export const EnvSchema = z.object({
  PORT: z.string().default('8080').transform((val) => parseInt(val, 10)),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/tabvault'),
  CORS_ORIGIN: z.string().default('*'),
  
  // AWS S3 / Cloudflare R2 Free Tier Config
  AWS_REGION: z.string().default('us-east-1'),
  S3_BUCKET_NAME: z.string().default('tabvault-staging'),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(), // For Cloudflare R2 or MinIO
  
  // Ephemeral Pairing Code TTL
  SYNC_CODE_TTL_SECONDS: z.string().default('300').transform((val) => parseInt(val, 10)),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function loadEnvConfig(): EnvConfig {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid server environment variables:', result.error.format());
    return EnvSchema.parse({}); // Fallback to safe defaults
  }
  return result.data;
}

export const env = loadEnvConfig();
