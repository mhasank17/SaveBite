import { Router } from 'express';
import listingController from '../controllers/listingController';

const router = Router();

router.get('/', (req, res, next) => listingController.getActiveListings(req, res, next));
router.get('/:id', (req, res, next) => listingController.getListingById(req, res, next));

export default router;
