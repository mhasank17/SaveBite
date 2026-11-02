import { Router, Request, Response } from 'express';
import { isSupabaseStorageReady } from '../config/supabase';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'SaveBite API Engine',
    version: '1.0.0',
    phase: 'Phase 1 - Architecture & Foundations',
    timestamp: new Date().toISOString(),
    currency: 'INR (₹)',
    integrations: {
      auth: 'ready',
      supabaseStorage: isSupabaseStorageReady() ? 'ready' : 'awaiting_credentials',
      database: 'configured_via_prisma',
    },
  });
});

export default router;
