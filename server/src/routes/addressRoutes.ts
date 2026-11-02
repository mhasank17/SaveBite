import { Router } from 'express';
import { verifyAuth } from '../middlewares/authMiddleware';
import addressController from '../controllers/addressController';

const router = Router();

// Public / Protected serviceability verification
router.post('/check-serviceability', (req, res) => addressController.checkServiceability(req, res));

// Customer-protected delivery address management routes
router.get('/', verifyAuth, (req, res) => addressController.getAddresses(req, res));
router.post('/', verifyAuth, (req, res) => addressController.createAddress(req, res));
router.get('/:id', verifyAuth, (req, res) => addressController.getAddressById(req, res));
router.patch('/:id', verifyAuth, (req, res) => addressController.updateAddress(req, res));
router.put('/:id', verifyAuth, (req, res) => addressController.updateAddress(req, res));
router.delete('/:id', verifyAuth, (req, res) => addressController.deleteAddress(req, res));
router.patch('/:id/default', verifyAuth, (req, res) => addressController.setDefaultAddress(req, res));

export default router;
