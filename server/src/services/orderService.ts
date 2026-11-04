import crypto from 'crypto';
import prisma, { isDatabaseConfigured } from '../config/db';
import { CreateOrderInput, VerifyPaymentInput, OrderItemDetails, RazorpayCheckoutDetails } from '../types/order';
import inventoryService from './inventoryService';
import razorpayService from './razorpayService';


export class OrderService {
  // In-memory store fallback when PostgreSQL is offline
  private inMemoryOrders: Map<string, OrderItemDetails> = new Map();
  private customerClearedHistoryAt: Map<string, Date> = new Map();
  private customerHiddenOrderIds: Map<string, Set<string>> = new Map();

  constructor() {
    this.seedInitialOrders();
  }

  private seedInitialOrders() {
    // Seed sample orders for Sarah (cust-sarah)
    const seedOrder: OrderItemDetails = {
      id: 'ord-8492',
      orderNumber: '#8492',
      customerId: 'user-sarah',
      restaurantId: 'rest-1',
      restaurantName: 'The French Boulangerie & Patisserie',
      restaurantAddress: '142 Saint-Denis Ave, Downtown West',
      listingId: 'deal-1',
      dealTitle: 'Evening Mystery Patisserie & Sourdough Box',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
      quantity: 1,
      unitPriceInr: 149,
      subtotalInr: 149,
      deliveryFeeInr: 0,
      totalPriceInr: 149,
      fulfillmentType: 'SELF_PICKUP',
      orderStatus: 'READY_FOR_PICKUP',
      paymentStatus: 'SUCCESS',
      paymentMethod: 'RAZORPAY_SANDBOX',
      razorpayOrderId: 'order_test_8492_initial',
      razorpayPaymentId: 'pay_test_8492_initial',
      razorpaySignature: 'rzp_test_valid_signature',
      pickupOtp: '8492',
      qrSecretToken: 'SAVEBITE-PASS-8492-VERIFIED-AUTH',
      pickupWindowText: 'Tonight, 8:00 PM – 9:00 PM',
      co2eSavingsKg: 1.8,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.inMemoryOrders.set(seedOrder.id, seedOrder);
  }

  /**
   * Create an order:
   * 1. Validate quantity and listing availability.
   * 2. Calculate prices on the server (integer paise).
   * 3. Atomically reserve inventory.
   * 4. Create Razorpay backend order.
   * 5. Save order in PENDING_PAYMENT state.
   */
  public async createOrder(
    customerId: string,
    input: CreateOrderInput
  ): Promise<{ order: OrderItemDetails; razorpay: RazorpayCheckoutDetails }> {
    const { listingId, quantity, fulfillmentType, deliveryAddress, deliveryAddressId } = input;

    const resolvedCustomerId =
      customerId === 'cust-sarah' || customerId === 'user-sarah'
        ? 'demo-user-cust-sarah'
        : customerId === 'cust-alice'
        ? 'demo-user-cust-alice'
        : customerId === 'cust-bob'
        ? 'demo-user-cust-bob'
        : customerId;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`Quantity must be a positive integer, received: ${quantity}`);
    }

    // Counter Pickup only: delivery options are discontinued
    if (fulfillmentType === 'ECO_COURIER') {
      const err: any = new Error('Delivery functionality is discontinued. SaveBite supports Counter Pickup only.');
      err.statusCode = 400;
      throw err;
    }

    // 1. Fetch listing details
    const listing = await inventoryService.getListing(listingId);
    if (!listing) {
      throw new Error(`Listing with ID '${listingId}' does not exist.`);
    }

    if (listing.status !== 'ACTIVE') {
      throw new Error(`Listing is no longer active for ordering (Status: ${listing.status}).`);
    }

    if (listing.availableQuantity < quantity) {
      throw new Error(
        `Insufficient inventory: Only ${listing.availableQuantity} available, requested ${quantity}.`
      );
    }

    // 2. Server-side price calculation in integer paise (strictly no float arithmetic)
    const pricing = inventoryService.calculatePrices(listing, quantity, fulfillmentType);

    // 3. Atomically reserve inventory
    await inventoryService.reserveInventory(listingId, quantity);

    // 4. Generate unique order references
    const orderNumber = `#${Math.floor(1000 + Math.random() * 9000)}`;
    const pickupOtp = String(Math.floor(1000 + Math.random() * 9000));
    const qrSecretToken = `SAVEBITE-PASS-${orderNumber.replace('#', '')}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour reservation window

    // 5. Create Razorpay order on the backend
    const razorpayResult = await razorpayService.createOrder(
      pricing.totalAmountPaise,
      orderNumber,
      {
        listingId,
        customerId,
        quantity: String(quantity),
        fulfillmentType,
      }
    );

    const newOrderId = `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const nowIso = new Date().toISOString();

    const orderRecord: OrderItemDetails = {
      id: newOrderId,
      orderNumber,
      customerId,
      restaurantId: listing.restaurantId,
      restaurantName: listing.restaurantName,
      restaurantAddress: listing.restaurantAddress,
      listingId: listing.id,
      dealTitle: listing.title,
      imageUrl: listing.imageUrl,
      quantity,
      unitPriceInr: pricing.unitPriceInr,
      subtotalInr: pricing.subtotalInr,
      deliveryFeeInr: 0,
      totalPriceInr: pricing.totalPriceInr,
      fulfillmentType: 'SELF_PICKUP',
      deliveryAddress: undefined,
      orderStatus: 'PENDING_PAYMENT',
      paymentStatus: 'INITIATED',
      paymentMethod: 'RAZORPAY_SANDBOX',
      razorpayOrderId: razorpayResult.razorpayOrderId,
      pickupOtp,
      qrSecretToken,
      pickupWindowText: listing.pickupWindowText,
      co2eSavingsKg: Number(((listing.co2eSavingsKg || 1.8) * quantity).toFixed(1)),
      expiresAt,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Attempt Prisma database insert
    if (isDatabaseConfigured()) {
      try {
        await prisma.order.create({
          data: {
            id: orderRecord.id,
            orderNumber: orderRecord.orderNumber,
            customerId: resolvedCustomerId,
            restaurantId: orderRecord.restaurantId,
            listingId: orderRecord.listingId,
            quantity: orderRecord.quantity,
            unitPriceInr: orderRecord.unitPriceInr,
            subtotalInr: orderRecord.subtotalInr,
            deliveryFeeInr: orderRecord.deliveryFeeInr,
            totalPriceInr: orderRecord.totalPriceInr,
            fulfillmentType: orderRecord.fulfillmentType,
            deliveryAddress: orderRecord.deliveryAddress,
            orderStatus: 'PENDING_PAYMENT',
            paymentStatus: 'INITIATED',
            isDemo: Boolean(listing.isDemo),
            razorpayOrderId: orderRecord.razorpayOrderId,
            pickupOtp: orderRecord.pickupOtp,
            qrSecretToken: orderRecord.qrSecretToken,
            expiresAt: new Date(orderRecord.expiresAt),
          },
        });
      } catch {
        // In-memory fallback if DB is offline
      }
    }

    this.inMemoryOrders.set(orderRecord.id, orderRecord);

    const razorpayCheckout: RazorpayCheckoutDetails = {
      keyId: razorpayResult.keyId,
      amount: pricing.totalAmountPaise,
      currency: 'INR',
      razorpayOrderId: razorpayResult.razorpayOrderId,
      orderNumber,
      orderId: newOrderId,
      isTestMode: razorpayResult.isTestMode,
    };

    return {
      order: orderRecord,
      razorpay: razorpayCheckout,
    };
  }

  private isCustomerOwner(orderCustomerId: string, requestCustomerId: string): boolean {
    if (orderCustomerId === requestCustomerId) return true;
    const norm = (id: string) => id.replace('demo-user-', '').replace('user-', 'cust-');
    return norm(orderCustomerId) === norm(requestCustomerId);
  }

  /**
   * Secure Payment Verification:
   * 1. Customer can only verify their own order.
   * 2. Verify Razorpay HMAC-SHA256 signature server-side.
   * 3. Idempotently handle repeated calls.
   * 4. Transition order from PENDING_PAYMENT to CONFIRMED / READY_FOR_PICKUP.
   */
  public async verifyPayment(
    orderId: string,
    customerId: string,
    input: VerifyPaymentInput
  ): Promise<OrderItemDetails> {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;

    // Retrieve order
    const order = await this.findOrder(orderId);
    if (!order) {
      throw new Error(`Order with ID '${orderId}' not found.`);
    }

    // Role-based access control: customer must own the order
    if (!this.isCustomerOwner(order.customerId, customerId)) {
      const err = new Error('Access denied: You can only verify your own orders.');
      (err as any).statusCode = 403;
      throw err;
    }

    // Idempotency: If already paid, return confirmed order safely
    if (order.paymentStatus === 'SUCCESS') {
      return order;
    }

    // Verify order reference matches
    if (order.razorpayOrderId && order.razorpayOrderId !== razorpayOrderId) {
      const err = new Error('Invalid payment reference: Razorpay order ID mismatch.');
      (err as any).statusCode = 400;
      throw err;
    }

    // Verify signature using Razorpay HMAC-SHA256
    const isSignatureValid = razorpayService.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isSignatureValid) {
      // Mark payment failed on invalid signature
      order.paymentStatus = 'FAILED';
      this.updateStoredOrder(order);

      const err = new Error('Payment verification failed: Invalid cryptographic signature.');
      (err as any).statusCode = 400;
      throw err;
    }

    // Signature verified! Confirm order
    order.orderStatus = 'CONFIRMED';
    order.paymentStatus = 'SUCCESS';
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.completedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    await this.updateStoredOrder(order);

    return order;
  }

  /**
   * Mark an order as failed and release reserved inventory
   */
  public async markOrderFailed(orderId: string, customerId: string, reason?: string): Promise<OrderItemDetails> {
    const order = await this.findOrder(orderId);
    if (!order) {
      throw new Error(`Order '${orderId}' not found.`);
    }

    if (order.customerId !== customerId) {
      const err = new Error('Access denied: You can only cancel your own orders.');
      (err as any).statusCode = 403;
      throw err;
    }

    if (order.paymentStatus === 'SUCCESS') {
      throw new Error('Cannot cancel an already completed and paid order.');
    }

    order.orderStatus = 'CANCELLED';
    order.paymentStatus = 'FAILED';
    order.updatedAt = new Date().toISOString();

    // Release reserved inventory
    await inventoryService.releaseReservedInventory(order.listingId, order.quantity);
    await this.updateStoredOrder(order);

    return order;
  }

  /**
   * Helper to determine if an order is visible in a customer's order history
   * Active orders (pickup, delivery, pending payment) are NEVER hidden.
   * Only completed/refunded/cancelled orders marked cleared by that customer are hidden.
   */
  private isOrderVisibleToCustomer(
    order: { id: string; orderStatus: string; createdAt: string | Date },
    customerId: string,
    resolvedCustomerId: string
  ): boolean {
    const isCompleted =
      order.orderStatus === 'COMPLETED' ||
      order.orderStatus === 'REFUNDED' ||
      order.orderStatus === 'CANCELLED';

    // Active orders are ALWAYS visible to the customer
    if (!isCompleted) {
      return true;
    }

    const hiddenSet =
      this.customerHiddenOrderIds.get(customerId) ||
      this.customerHiddenOrderIds.get(resolvedCustomerId);
    if (hiddenSet && hiddenSet.has(order.id)) {
      return false;
    }

    return true;
  }

  /**
   * Clear eligible completed order history for the authenticated customer only
   * Soft visibility mechanism: preserves all database records, financial/payment data,
   * restaurant partner orders, and admin audit logs.
   */
  public async clearCustomerOrderHistory(
    customerId: string
  ): Promise<{ clearedCount: number; activeOrdersRetained: number; message: string }> {
    const resolvedCustomerId =
      customerId === 'cust-sarah' || customerId === 'user-sarah'
        ? 'demo-user-cust-sarah'
        : customerId === 'cust-alice'
        ? 'demo-user-cust-alice'
        : customerId === 'cust-bob'
        ? 'demo-user-cust-bob'
        : customerId;

    const now = new Date();
    this.customerClearedHistoryAt.set(customerId, now);
    this.customerClearedHistoryAt.set(resolvedCustomerId, now);

    let userHiddenSet =
      this.customerHiddenOrderIds.get(customerId) ||
      this.customerHiddenOrderIds.get(resolvedCustomerId);
    if (!userHiddenSet) {
      userHiddenSet = new Set<string>();
    }
    this.customerHiddenOrderIds.set(customerId, userHiddenSet);
    this.customerHiddenOrderIds.set(resolvedCustomerId, userHiddenSet);

    const eligibleStatuses = ['COMPLETED', 'REFUNDED', 'CANCELLED'];
    const activeStatuses = ['CONFIRMED', 'READY_FOR_PICKUP', 'ARRIVING', 'PENDING_PAYMENT'];

    let clearedCount = 0;
    const clearedOrderIds: string[] = [];
    const activeOrderIds: string[] = [];

    // 1. Scan in-memory orders for this customer
    for (const order of this.inMemoryOrders.values()) {
      if (this.isCustomerOwner(order.customerId, customerId)) {
        if (eligibleStatuses.includes(order.orderStatus)) {
          userHiddenSet.add(order.id);
          if (!clearedOrderIds.includes(order.id)) {
            clearedOrderIds.push(order.id);
            clearedCount++;
          }
        } else if (activeStatuses.includes(order.orderStatus)) {
          if (!activeOrderIds.includes(order.id)) {
            activeOrderIds.push(order.id);
          }
        }
      }
    }

    // 2. Scan database orders for this customer if DB is configured
    if (isDatabaseConfigured()) {
      try {
        const dbOrders = await prisma.order.findMany({
          where: {
            OR: [{ customerId }, { customerId: resolvedCustomerId }],
          },
        });

        for (const o of dbOrders) {
          if (eligibleStatuses.includes(o.orderStatus)) {
            userHiddenSet.add(o.id);
            if (!clearedOrderIds.includes(o.id)) {
              clearedOrderIds.push(o.id);
              clearedCount++;
            }
          } else if (activeStatuses.includes(o.orderStatus)) {
            if (!activeOrderIds.includes(o.id)) {
              activeOrderIds.push(o.id);
            }
          }
        }

        // Record clearance audit log (zero loss of financial/order records)
        await prisma.systemAuditLog.create({
          data: {
            actorId: resolvedCustomerId,
            action: 'CUSTOMER_CLEAR_ORDER_HISTORY',
            details: {
              customerId,
              resolvedCustomerId,
              clearedOrderIds,
              clearedCount,
              clearedAt: now.toISOString(),
            },
          },
        });
      } catch (err) {
        console.warn('[OrderService] Audit log create fallback:', err);
      }
    }

    return {
      clearedCount,
      activeOrdersRetained: activeOrderIds.length,
      message: `Cleared ${clearedCount} completed order(s) from history. Active orders remain visible.`,
    };
  }

  /**
   * Get orders for the authenticated customer only
   */
  public async getMyOrders(customerId: string): Promise<OrderItemDetails[]> {
    const resolvedCustomerId =
      customerId === 'cust-sarah' || customerId === 'user-sarah'
        ? 'demo-user-cust-sarah'
        : customerId === 'cust-alice'
        ? 'demo-user-cust-alice'
        : customerId === 'cust-bob'
        ? 'demo-user-cust-bob'
        : customerId;

    // Load customer's clearance state from DB if not yet loaded in memory
    if (
      !this.customerClearedHistoryAt.has(customerId) &&
      !this.customerClearedHistoryAt.has(resolvedCustomerId) &&
      isDatabaseConfigured()
    ) {
      try {
        const lastLog = await prisma.systemAuditLog.findFirst({
          where: {
            actorId: { in: [customerId, resolvedCustomerId] },
            action: 'CUSTOMER_CLEAR_ORDER_HISTORY',
          },
          orderBy: { createdAt: 'desc' },
        });

        if (lastLog) {
          const logClearedAt = new Date(lastLog.createdAt);
          this.customerClearedHistoryAt.set(customerId, logClearedAt);
          this.customerClearedHistoryAt.set(resolvedCustomerId, logClearedAt);

          const details = lastLog.details as any;
          if (details && Array.isArray(details.clearedOrderIds)) {
            let set = this.customerHiddenOrderIds.get(customerId);
            if (!set) {
              set = new Set<string>();
              this.customerHiddenOrderIds.set(customerId, set);
              this.customerHiddenOrderIds.set(resolvedCustomerId, set);
            }
            details.clearedOrderIds.forEach((id: string) => set!.add(id));
          }
        }
      } catch {
        // Fall back to in-memory state
      }
    }

    if (isDatabaseConfigured()) {
      try {
        const dbOrders = await prisma.order.findMany({
          where: {
            OR: [{ customerId }, { customerId: resolvedCustomerId }],
          },
          include: { listing: true, restaurant: true },
          orderBy: { createdAt: 'desc' },
        });

        if (dbOrders.length > 0) {
          const mappedDbOrders = dbOrders
            .filter((o) => this.isOrderVisibleToCustomer(o, customerId, resolvedCustomerId))
            .map((o) => ({
              id: o.id,
              orderNumber: o.orderNumber,
              customerId: o.customerId,
              restaurantId: o.restaurantId,
              restaurantName: o.restaurant.name,
              restaurantAddress: o.restaurant.address,
              listingId: o.listingId,
              dealTitle: o.listing.title,
              imageUrl: o.listing.imageUrl,
              quantity: o.quantity,
              unitPriceInr: Number(o.unitPriceInr),
              subtotalInr: Number(o.subtotalInr),
              deliveryFeeInr: Number(o.deliveryFeeInr),
              totalPriceInr: Number(o.totalPriceInr),
              fulfillmentType: o.fulfillmentType,
              deliveryAddress: o.deliveryAddress || undefined,
              orderStatus: o.orderStatus as any,
              paymentStatus: o.paymentStatus as any,
              paymentMethod: 'RAZORPAY_SANDBOX',
              razorpayOrderId: o.razorpayOrderId || undefined,
              razorpayPaymentId: o.razorpayPaymentId || undefined,
              razorpaySignature: o.razorpaySignature || undefined,
              pickupOtp: o.pickupOtp,
              qrSecretToken: o.qrSecretToken,
              co2eSavingsKg: Number(o.listing.co2eSavingsKg || 1.8) * o.quantity,
              expiresAt: o.expiresAt.toISOString(),
              completedAt: o.completedAt?.toISOString(),
              createdAt: o.createdAt.toISOString(),
              updatedAt: o.updatedAt.toISOString(),
            }));

          const dbIds = new Set(dbOrders.map((o) => o.id));
          const memOrders = Array.from(this.inMemoryOrders.values())
            .filter((o) => !dbIds.has(o.id))
            .filter((o) => this.isCustomerOwner(o.customerId, customerId))
            .filter((o) => this.isOrderVisibleToCustomer(o, customerId, resolvedCustomerId));

          return [...mappedDbOrders, ...memOrders].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
      } catch {
        // DB offline, fall back
      }
    }

    return Array.from(this.inMemoryOrders.values())
      .filter((o) => this.isCustomerOwner(o.customerId, customerId))
      .filter((o) => this.isOrderVisibleToCustomer(o, customerId, resolvedCustomerId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get single order by ID with ownership enforcement
   */
  public async getOrderById(
    orderId: string,
    customerId: string,
    role: string = 'CUSTOMER'
  ): Promise<OrderItemDetails> {
    const order = await this.findOrder(orderId);
    if (!order) {
      const err = new Error(`Order with ID '${orderId}' was not found.`);
      (err as any).statusCode = 404;
      throw err;
    }

    if (role !== 'ADMIN' && !this.isCustomerOwner(order.customerId, customerId)) {
      const err = new Error('Access denied: You can only view your own orders.');
      (err as any).statusCode = 403;
      throw err;
    }

    return order;
  }

  /**
   * Handle Razorpay Webhook Events
   */
  public async handleWebhookEvent(rawBody: Buffer | string, signature: string, eventPayload: any): Promise<{ received: boolean; status: string }> {
    const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      const err = new Error('Invalid webhook signature.');
      (err as any).statusCode = 400;
      throw err;
    }

    const event = eventPayload.event;
    console.log(`[Razorpay Webhook] Received event: ${event}`);

    if (event === 'order.paid' || event === 'payment.captured') {
      const rzpOrderId = eventPayload.payload?.payment?.entity?.order_id || eventPayload.payload?.order?.entity?.id;
      const rzpPaymentId = eventPayload.payload?.payment?.entity?.id;

      if (rzpOrderId) {
        // Find matching order by razorpayOrderId
        const matchingOrder = Array.from(this.inMemoryOrders.values()).find(
          (o) => o.razorpayOrderId === rzpOrderId
        );

        if (matchingOrder && matchingOrder.paymentStatus !== 'SUCCESS') {
          matchingOrder.paymentStatus = 'SUCCESS';
          matchingOrder.orderStatus = 'CONFIRMED';
          matchingOrder.razorpayPaymentId = rzpPaymentId;
          matchingOrder.updatedAt = new Date().toISOString();
          await this.updateStoredOrder(matchingOrder);
          return { received: true, status: 'order_confirmed' };
        }
      }
    } else if (event === 'payment.failed') {
      const rzpOrderId = eventPayload.payload?.payment?.entity?.order_id;
      if (rzpOrderId) {
        const matchingOrder = Array.from(this.inMemoryOrders.values()).find(
          (o) => o.razorpayOrderId === rzpOrderId
        );
        if (matchingOrder && matchingOrder.paymentStatus !== 'SUCCESS') {
          matchingOrder.paymentStatus = 'FAILED';
          await inventoryService.releaseReservedInventory(matchingOrder.listingId, matchingOrder.quantity);
          await this.updateStoredOrder(matchingOrder);
          return { received: true, status: 'order_payment_failed' };
        }
      }
    }

    return { received: true, status: 'ignored_or_duplicate' };
  }

  private async findOrder(orderId: string): Promise<OrderItemDetails | null> {
    if (isDatabaseConfigured()) {
      try {
        const dbOrder = await prisma.order.findUnique({
          where: { id: orderId },
          include: { listing: true, restaurant: true },
        });

        if (dbOrder) {
          return {
            id: dbOrder.id,
            orderNumber: dbOrder.orderNumber,
            customerId: dbOrder.customerId,
            restaurantId: dbOrder.restaurantId,
            restaurantName: dbOrder.restaurant.name,
            restaurantAddress: dbOrder.restaurant.address,
            listingId: dbOrder.listingId,
            dealTitle: dbOrder.listing.title,
            imageUrl: dbOrder.listing.imageUrl,
            quantity: dbOrder.quantity,
            unitPriceInr: Number(dbOrder.unitPriceInr),
            subtotalInr: Number(dbOrder.subtotalInr),
            deliveryFeeInr: Number(dbOrder.deliveryFeeInr),
            totalPriceInr: Number(dbOrder.totalPriceInr),
            fulfillmentType: dbOrder.fulfillmentType,
            deliveryAddress: dbOrder.deliveryAddress || undefined,
            orderStatus: dbOrder.orderStatus as any,
            paymentStatus: dbOrder.paymentStatus as any,
            paymentMethod: 'RAZORPAY_SANDBOX',
            razorpayOrderId: dbOrder.razorpayOrderId || undefined,
            razorpayPaymentId: dbOrder.razorpayPaymentId || undefined,
            razorpaySignature: dbOrder.razorpaySignature || undefined,
            pickupOtp: dbOrder.pickupOtp,
            qrSecretToken: dbOrder.qrSecretToken,
            co2eSavingsKg: Number(dbOrder.listing.co2eSavingsKg || 1.8) * dbOrder.quantity,
            expiresAt: dbOrder.expiresAt.toISOString(),
            completedAt: dbOrder.completedAt?.toISOString(),
            createdAt: dbOrder.createdAt.toISOString(),
            updatedAt: dbOrder.updatedAt.toISOString(),
          };
        }
      } catch {
        // DB offline
      }
    }

    return this.inMemoryOrders.get(orderId) || null;
  }

  private async updateStoredOrder(order: OrderItemDetails): Promise<void> {
    this.inMemoryOrders.set(order.id, { ...order });

    if (isDatabaseConfigured()) {
      try {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            razorpayPaymentId: order.razorpayPaymentId,
            razorpaySignature: order.razorpaySignature,
            completedAt: order.completedAt ? new Date(order.completedAt) : undefined,
          },
        });
      } catch {
        // DB offline
      }
    }
  }

  /**
   * Test helper to seed or update an order status for automated tests
   */
  public addTestOrder(
    order: Partial<OrderItemDetails> & { id: string; customerId: string; orderStatus: any }
  ): void {
    const defaultOrder: OrderItemDetails = {
      id: order.id,
      orderNumber: order.orderNumber || `#${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: order.customerId,
      restaurantId: order.restaurantId || 'rest-1',
      restaurantName: order.restaurantName || 'Test Restaurant',
      restaurantAddress: order.restaurantAddress || 'Campus Center',
      listingId: order.listingId || 'deal-1',
      dealTitle: order.dealTitle || 'Meal Deal',
      imageUrl: order.imageUrl || '',
      quantity: order.quantity || 1,
      unitPriceInr: order.unitPriceInr || 149,
      subtotalInr: order.subtotalInr || 149,
      deliveryFeeInr: order.deliveryFeeInr || 0,
      totalPriceInr: order.totalPriceInr || 149,
      fulfillmentType: order.fulfillmentType || 'SELF_PICKUP',
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus || 'SUCCESS',
      paymentMethod: order.paymentMethod || 'RAZORPAY_SANDBOX',
      pickupOtp: order.pickupOtp || '1234',
      qrSecretToken: order.qrSecretToken || 'TOKEN-TEST',
      co2eSavingsKg: order.co2eSavingsKg || 1.5,
      expiresAt: order.expiresAt || new Date(Date.now() + 3600000).toISOString(),
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: order.updatedAt || new Date().toISOString(),
      completedAt: order.completedAt,
    };
    this.inMemoryOrders.set(order.id, defaultOrder);
  }

  /**
   * Test helper to reset cleared history state
   */
  public async resetClearedHistory(): Promise<void> {
    this.customerClearedHistoryAt.clear();
    this.customerHiddenOrderIds.clear();
    if (isDatabaseConfigured()) {
      try {
        await prisma.systemAuditLog.deleteMany({
          where: { action: 'CUSTOMER_CLEAR_ORDER_HISTORY' },
        });
      } catch {
        // Fallback if DB offline
      }
    }
  }
}

export const orderService = new OrderService();
export default orderService;
