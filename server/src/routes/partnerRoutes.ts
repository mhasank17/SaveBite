import { Router } from 'express';
import partnerController from '../controllers/partnerController';
import { verifyAuth, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// All partner routes require authentication and PARTNER or ADMIN role
router.use(verifyAuth, requireRole(['PARTNER', 'ADMIN']));

// Restaurant Profile & Dashboard Metrics
router.get('/restaurant', (req, res, next) => partnerController.getRestaurantProfile(req, res, next));
router.patch('/restaurant/status', (req, res, next) => partnerController.toggleStoreStatus(req, res, next));

// Partner Account Profile, Email, Password & Avatar Photo
router.get('/profile', (req, res, next) => partnerController.getProfile(req, res, next));
router.patch('/profile', (req, res, next) => partnerController.updateProfile(req, res, next));
router.post('/change-password', (req, res, next) => partnerController.changePassword(req, res, next));
router.post('/email/request-otp', (req, res, next) => partnerController.requestEmailOtp(req, res, next));
router.post('/email/verify-otp', (req, res, next) => partnerController.verifyEmailOtp(req, res, next));
router.post('/avatar', (req, res, next) => partnerController.uploadAvatar(req, res, next));
router.delete('/avatar', (req, res, next) => partnerController.removeAvatar(req, res, next));

// Partner Deal Listings CRUD & Custom Image Upload
router.get('/listings', (req, res, next) => partnerController.getListings(req, res, next));
router.post('/listings', (req, res, next) => partnerController.createListing(req, res, next));
router.post('/listings/upload-image', (req, res, next) => partnerController.uploadDealImage(req, res, next));
router.patch('/listings/:id', (req, res, next) => partnerController.updateListing(req, res, next));
router.delete('/listings/:id', (req, res, next) => partnerController.deleteListing(req, res, next));

// Partner Orders & Counter OTP/QR Pickup Verification
router.get('/orders', (req, res, next) => partnerController.getOrders(req, res, next));
router.post('/orders/verify-pickup', (req, res, next) => partnerController.verifyPickup(req, res, next));

// Partner Financials & Payouts
router.get('/earnings', (req, res, next) => partnerController.getEarnings(req, res, next));

export default router;
