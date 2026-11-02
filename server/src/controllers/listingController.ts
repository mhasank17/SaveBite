import { Request, Response, NextFunction } from 'express';
import inventoryService from '../services/inventoryService';

export class ListingController {
  public async getActiveListings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const listings = await inventoryService.getAllActiveListings();
      res.status(200).json({
        success: true,
        count: listings.length,
        data: listings,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getListingById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const listing = await inventoryService.getListing(id);
      if (!listing) {
        res.status(404).json({
          success: false,
          message: `Food deal listing '${id}' not found.`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: listing,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const listingController = new ListingController();
export default listingController;
