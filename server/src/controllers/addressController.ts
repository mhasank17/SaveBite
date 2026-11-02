import { Request, Response } from 'express';
import { CreateAddressSchema, UpdateAddressSchema, CheckServiceabilitySchema } from '../types/address';
import addressService from '../services/addressService';
import serviceabilityService from '../services/serviceabilityService';

export class AddressController {
  /**
   * GET /api/v1/addresses
   * Retrieve all saved delivery addresses for the authenticated customer
   */
  public async getAddresses(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.uid;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const addresses = await addressService.getAddresses(userId);
      res.status(200).json({
        success: true,
        data: { addresses },
      });
    } catch (err: any) {
      console.error('[AddressController.getAddresses]', err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to retrieve delivery addresses',
      });
    }
  }

  /**
   * GET /api/v1/addresses/:id
   * Retrieve a specific address by ID (with ownership check)
   */
  public async getAddressById(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.uid;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const address = await addressService.getAddressById(userId, req.params.id);
      if (!address) {
        res.status(404).json({ success: false, message: 'Address not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: { address },
      });
    } catch (err: any) {
      console.error('[AddressController.getAddressById]', err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to retrieve address',
      });
    }
  }

  /**
   * POST /api/v1/addresses
   * Add a new delivery address
   */
  public async createAddress(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.uid;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const parseResult = CreateAddressSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errorMsg = parseResult.error.errors.map((e) => e.message).join('. ');
        res.status(400).json({
          success: false,
          message: errorMsg,
          errors: parseResult.error.format(),
        });
        return;
      }

      const created = await addressService.createAddress(userId, parseResult.data);
      res.status(201).json({
        success: true,
        message: 'Delivery address saved successfully',
        data: { address: created },
      });
    } catch (err: any) {
      console.error('[AddressController.createAddress]', err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to save delivery address',
      });
    }
  }

  /**
   * PATCH /api/v1/addresses/:id
   * Edit an existing address
   */
  public async updateAddress(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.uid;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const parseResult = UpdateAddressSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errorMsg = parseResult.error.errors.map((e) => e.message).join('. ');
        res.status(400).json({
          success: false,
          message: errorMsg,
          errors: parseResult.error.format(),
        });
        return;
      }

      const updated = await addressService.updateAddress(userId, req.params.id, parseResult.data);
      res.status(200).json({
        success: true,
        message: 'Delivery address updated successfully',
        data: { address: updated },
      });
    } catch (err: any) {
      console.error('[AddressController.updateAddress]', err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to update address',
      });
    }
  }

  /**
   * DELETE /api/v1/addresses/:id
   * Delete an address
   */
  public async deleteAddress(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.uid;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      await addressService.deleteAddress(userId, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Delivery address removed successfully',
      });
    } catch (err: any) {
      console.error('[AddressController.deleteAddress]', err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to remove address',
      });
    }
  }

  /**
   * PATCH /api/v1/addresses/:id/default
   * Set address as default
   */
  public async setDefaultAddress(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.uid;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const address = await addressService.setDefaultAddress(userId, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Default delivery address set successfully',
        data: { address },
      });
    } catch (err: any) {
      console.error('[AddressController.setDefaultAddress]', err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to set default address',
      });
    }
  }

  /**
   * POST /api/v1/addresses/check-serviceability
   * Check if a PIN code / location is serviceable for delivery
   */
  public checkServiceability(req: Request, res: Response): void {
    const parseResult = CheckServiceabilitySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid input. Please provide a valid 6-digit Indian PIN code.',
      });
      return;
    }

    const { postalCode, city, latitude, longitude } = parseResult.data;
    const result = serviceabilityService.evaluateServiceability(
      postalCode,
      city,
      undefined,
      latitude,
      longitude
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  }
}

export const addressController = new AddressController();
export default addressController;
