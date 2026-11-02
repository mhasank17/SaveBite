import dotenv from 'dotenv';
import path from 'path';

// Load .env from process.cwd() as well as server/.env explicitly
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL || '',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET || 'savebite-assets',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465,
  SMTP_SECURE: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || '',
};

export const isRazorpayConfigured = (): boolean => {
  return (
    Boolean(ENV.RAZORPAY_KEY_ID) &&
    Boolean(ENV.RAZORPAY_KEY_SECRET) &&
    !ENV.RAZORPAY_KEY_ID.includes('placeholder')
  );
};

export const isEmailConfigured = (): boolean => {
  return (
    Boolean(ENV.SMTP_USER) &&
    Boolean(ENV.SMTP_PASS) &&
    ENV.SMTP_HOST !== 'smtp.example.com' &&
    !ENV.SMTP_PASS.includes('placeholder')
  );
};
