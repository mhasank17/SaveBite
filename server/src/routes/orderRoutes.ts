import { Router } from 'express';
import orderController from '../controllers/orderController';
import { verifyAuth, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// Public webhook route for Razorpay events (verifies HMAC header)
router.post('/webhook', (req, res, next) => orderController.handleWebhook(req, res, next));

// Protected customer order routes
router.post('/', verifyAuth, requireRole(['CUSTOMER', 'ADMIN']), (req, res, next) =>
  orderController.createOrder(req, res, next)
);

router.get('/my-orders', verifyAuth, (req, res, next) =>
  orderController.getMyOrders(req, res, next)
);

// Customer order history clearance (soft customer-specific visibility)
router.delete('/history', verifyAuth, (req, res, next) =>
  orderController.clearOrderHistory(req, res, next)
);

router.post('/clear-history', verifyAuth, (req, res, next) =>
  orderController.clearOrderHistory(req, res, next)
);

router.get('/:id', verifyAuth, (req, res, next) =>
  orderController.getOrderById(req, res, next)
);

router.post('/:id/verify-payment', verifyAuth, (req, res, next) =>
  orderController.verifyPayment(req, res, next)
);

export default router;
