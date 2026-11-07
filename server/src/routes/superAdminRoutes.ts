import { Router } from 'express';
import { verifyAuth, requireSuperAdmin } from '../middlewares/authMiddleware';
import adminController from '../controllers/adminController';

const router = Router();

// Strictly protect all SuperAdmin endpoints with root platform clearance
router.use(verifyAuth, requireSuperAdmin);

// 1. Root telemetry & infrastructure health
router.get('/telemetry', (req, res, next) => adminController.getOverview(req, res, next));

// 2. Master system audit logs
router.get('/audit-logs', (req, res, next) => adminController.getAuditLogs(req, res, next));

// 3. Platform administrators directory
router.get('/admins', (req, res) => {
  res.status(200).json({
    success: true,
    data: [
      {
        id: 'admin-1',
        fullName: 'Master Platform SuperAdmin',
        email: 'admin@savebite.in',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        lastLogin: new Date().toISOString(),
      },
    ],
  });
});

// 4. Emergency marketplace lockdown control
router.post('/emergency-lockdown', (req, res) => {
  const { enabled, reason } = req.body || {};
  res.status(200).json({
    success: true,
    message: `Marketplace emergency lockdown ${enabled ? 'ACTIVATED' : 'DEACTIVATED'}.`,
    data: {
      lockdownActive: Boolean(enabled),
      reason: reason || 'Routine security protocol',
      updatedAt: new Date().toISOString(),
    },
  });
});

export default router;
