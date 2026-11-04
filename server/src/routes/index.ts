import { Router } from 'express';
import healthRoutes from './healthRoutes';
import orderRoutes from './orderRoutes';
import listingRoutes from './listingRoutes';
import partnerRoutes from './partnerRoutes';
import adminRoutes from './adminRoutes';
import authRoutes from './authRoutes';

const router = Router();

// Health check and diagnostic routes
router.use('/', healthRoutes);

// Multi-Portal Authentication (Customer, Restaurant Partner, Admin)
router.use('/auth', authRoutes);

// Customer Food Deal Listings
router.use('/listings', listingRoutes);

// Customer Orders, Inventory & Payment Integration (Phase 4)
router.use('/orders', orderRoutes);

// Restaurant Partner Portal (Phase 5)
router.use('/partner', partnerRoutes);

// SuperAdmin Portal (Phase 7)
router.use('/admin', adminRoutes);

export default router;
