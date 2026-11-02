import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { CreateOrderSchema, VerifyPaymentSchema } from '../types/order';
import orderService from '../services/orderService';
import { ZodError } from 'zod';

export class OrderController {
  /**
   * POST /api/v1/orders
   * Create new customer meal reservation and prepare Razorpay checkout
   */
  public async createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.uid) {
        res.status(401).json({ success: false, message: 'Unauthorized: Authentication required.' });
        return;
      }

      // Input validation using Zod
      const parseResult = CreateOrderSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed for order request.',
          errors: parseResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }

      const result = await orderService.createOrder(req.user.uid, parseResult.data);

      res.status(201).json({
        success: true,
        message: 'Order created and inventory reserved successfully. Proceed to Razorpay checkout.',
        data: result,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      const msg = err.message || '';
      if (
        msg.includes('Insufficient inventory') ||
        msg.includes('active') ||
        msg.includes('SOLD_OUT') ||
        msg.includes('sold out')
      ) {
        res.status(409).json({
          success: false,
          message: err.message,
        });
        return;
      }

      res.status(err.statusCode || 400).json({
        success: false,
        message: err.message || 'Failed to create order.',
      });
    }
  }

  /**
   * GET /api/v1/orders/my-orders
   * Retrieve all orders belonging to the authenticated customer
   */
  public async getMyOrders(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.uid) {
        res.status(401).json({ success: false, message: 'Unauthorized: Authentication required.' });
        return;
      }

      const orders = await orderService.getMyOrders(req.user.uid);
      res.status(200).json({
        success: true,
        count: orders.length,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/orders/history
   * POST /api/v1/orders/clear-history
   * Clear eligible completed order history for the authenticated customer only
   */
  public async clearOrderHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.uid) {
        res.status(401).json({ success: false, message: 'Unauthorized: Authentication required.' });
        return;
      }

      const result = await orderService.clearCustomerOrderHistory(req.user.uid);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/orders/:id
   * Retrieve a specific order by ID with ownership enforcement
   */
  public async getOrderById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.uid) {
        res.status(401).json({ success: false, message: 'Unauthorized: Authentication required.' });
        return;
      }

      const orderId = req.params.id;
      const order = await orderService.getOrderById(orderId, req.user.uid, req.user.role);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * POST /api/v1/orders/:id/verify-payment
   * Cryptographically verify Razorpay HMAC-SHA256 signature and confirm order
   */
  public async verifyPayment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.uid) {
        res.status(401).json({ success: false, message: 'Unauthorized: Authentication required.' });
        return;
      }

      const orderId = req.params.id;
      const parseResult = VerifyPaymentSchema.safeParse(req.body);

      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          message: 'Payment verification requires razorpayOrderId, razorpayPaymentId, and razorpaySignature.',
          errors: parseResult.error.errors,
        });
        return;
      }

      const confirmedOrder = await orderService.verifyPayment(
        orderId,
        req.user.uid,
        parseResult.data
      );

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully! Your meal pickup pass is ready.',
        data: confirmedOrder,
      });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      res.status(err.statusCode || 400).json({
        success: false,
        message: err.message || 'Payment signature verification failed.',
      });
    }
  }

  /**
   * POST /api/v1/orders/webhook
   * Razorpay server-to-server webhook endpoint
   */
  public async handleWebhook(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      if (!signature) {
        res.status(400).json({ success: false, message: 'Missing x-razorpay-signature header.' });
        return;
      }

      const rawBody = req.rawBody || JSON.stringify(req.body);
      const result = await orderService.handleWebhookEvent(rawBody, signature, req.body);

      res.status(200).json({ success: true, result });
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      res.status(err.statusCode || 400).json({
        success: false,
        message: err.message || 'Webhook verification failed.',
      });
    }
  }
}

export const orderController = new OrderController();
export default orderController;
