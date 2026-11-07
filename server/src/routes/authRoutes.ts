import { Router } from 'express';
import authController from '../controllers/authController';
import { verifyAuth } from '../middlewares/authMiddleware';

const router = Router();

// Customer Authentication
router.post('/customer/register', (req, res, next) => authController.registerCustomer(req, res, next));
router.post('/customer/login', (req, res, next) => authController.loginCustomer(req, res, next));

// Restaurant Owner Authentication & Application
router.post('/partner/register', (req, res, next) => authController.registerPartner(req, res, next));
router.post('/partner/login', (req, res, next) => authController.loginPartner(req, res, next));

// Administrator Authentication (Unadvertised secure login only; public registration is strictly disallowed)
router.post('/admin/login', (req, res, next) => authController.loginAdmin(req, res, next));
router.post('/secure-admin-access/login', (req, res, next) => authController.loginAdmin(req, res, next));

// Secure Password Reset Flow (Time-limited, single-use, anti-enumeration)
router.post('/forgot-password', (req, res, next) => authController.forgotPassword(req, res, next));
router.post('/verify-password-otp', (req, res, next) => authController.verifyPasswordOtp(req, res, next));
router.post('/reset-password', (req, res, next) => authController.resetPassword(req, res, next));

// Profile verification
router.get('/me', verifyAuth, (req, res, next) => authController.getMe(req, res, next));

// Customer Profile Avatar update (Authorized)
router.patch('/avatar', verifyAuth, (req, res, next) => authController.updateAvatar(req, res, next));
router.put('/avatar', verifyAuth, (req, res, next) => authController.updateAvatar(req, res, next));

export default router;
