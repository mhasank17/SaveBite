import { Router } from 'express';
import adminController from '../controllers/adminController';
import { verifyAuth, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// Protect all admin endpoints with ADMIN role requirement
router.use(verifyAuth, requireRole(['ADMIN']));

// 1. Platform overview metrics
router.get('/overview', (req, res, next) => adminController.getOverview(req, res, next));

// 2. Vendor management & KYC
router.get('/vendors', (req, res, next) => adminController.getVendors(req, res, next));
router.patch('/vendors/:id/kyc', (req, res, next) => adminController.updateVendorKyc(req, res, next));
router.patch('/vendors/:id/status', (req, res, next) => adminController.toggleVendorStatus(req, res, next));

// 3. Platform listings moderation
router.get('/listings', (req, res, next) => adminController.getListings(req, res, next));
router.patch('/listings/:id/status', (req, res, next) => adminController.moderateListing(req, res, next));

// 4. Customer disputes & refunds
router.get('/disputes', (req, res, next) => adminController.getDisputes(req, res, next));
router.post('/disputes/:id/resolve', (req, res, next) => adminController.resolveDispute(req, res, next));

// 5. Partner payouts & settlements
router.get('/payouts', (req, res, next) => adminController.getPayouts(req, res, next));
router.post('/payouts/process-batch', (req, res, next) => adminController.processPayoutBatch(req, res, next));
router.get('/settlements', (req, res, next) => adminController.getSettlements(req, res, next));
router.post('/settlements/pay', (req, res, next) => adminController.settleRestaurantPayout(req, res, next));

// 6. Customer & Order Management
router.get('/customers', (req, res, next) => adminController.getCustomers(req, res, next));
router.get('/orders', (req, res, next) => adminController.getOrders(req, res, next));

// 7. Campus Pickup Locations Management
router.get('/campus-locations', (req, res, next) => adminController.getCampusLocations(req, res, next));
router.patch('/campus-locations/:id', (req, res, next) => adminController.toggleCampusLocation(req, res, next));
router.post('/campus-locations', (req, res, next) => adminController.addCampusLocation(req, res, next));

// 8. Governance & Audit Logs
router.get('/audit-logs', (req, res, next) => adminController.getAuditLogs(req, res, next));

// 9. Admin Profile & Account Governance
router.get('/profile', (req, res, next) => adminController.getProfile(req, res, next));
router.patch('/profile', (req, res, next) => adminController.updateProfile(req, res, next));
router.post('/change-password', (req, res, next) => adminController.changePassword(req, res, next));

export default router;
