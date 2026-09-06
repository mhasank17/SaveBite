import { Router } from 'express';
import healthRoutes from './healthRoutes';

const router = Router();

// Health check and diagnostic routes
router.use('/', healthRoutes);

export default router;
