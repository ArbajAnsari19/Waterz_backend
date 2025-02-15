import { Request, Response } from 'express';
import YatchService from '../services/yatchServices';
import UserService from '../services/userServices';
import {LocationType,AddonService,PackageType} from '../utils/trip';


export class YatchController {

  static async detailYatch(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const yatch = await YatchService.detailsYatch(id);
        res.status(200).json({"yatch" : yatch});
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async listAll(req: Request, res: Response): Promise<void> {
    try {
        const yatchs = await YatchService.listAll();
        res.status(200).json(yatchs);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async topYatch(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 4;
      const yachts = await YatchService.topYatch(page, limit);
      res.status(200).json(yachts);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async revenue(req: Request, res: Response): Promise<void> {
    try {
      const owner = req.currentUser.id;
      const earnings = await YatchService.revenue(owner);
      res.status(200).json(earnings);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async createYatch(req: Request, res: Response): Promise<void> {
    console.log("body", req.body);
    try {
        const {
            name,
            images,
            description,
            capacity,
            mnfyear,
            dimension,
            location,
            pickupat,
            YachtType,
            crewCount,
            amenities,
            availability,
            price,
            packageTypes,
            addonServices
          } = req.body;


          // Validate required fields
          if (!name || !images || !location || !location || !YachtType) {
            throw new Error('Missing required fields');
          }

          // Validate location is valid enum value
          if (!Object.values(LocationType).includes(location)) {
            throw new Error('Invalid location');
          }

          // Validate price structure
          if (!price?.sailing?.peakTime || !price?.sailing?.nonPeakTime || 
              !price?.anchoring?.peakTime || !price?.anchoring?.nonPeakTime) {
            throw new Error('Invalid price structure');
          }

          // Validate addon services
        if (addonServices) {
            addonServices.forEach((addon: { service: string; pricePerHour: number }) => {
                if (!addon.service || typeof addon.pricePerHour !== 'number') {
                    throw new Error('Invalid addon service structure: missing service or price');
                }
                
                const validService = Object.values(AddonService).includes(addon.service as AddonService);
                if (!validService) {
                    throw new Error(`Invalid addon service: ${addon.service}. Must be one of: ${Object.values(AddonService).join(', ')}`);
                }
            });
        }
          
        // Validate packageTypes array
        if (packageTypes && Array.isArray(packageTypes)) {
          const invalidPackage = packageTypes.some(
              pkg => !Object.values(PackageType).includes(pkg)
          );
          if (invalidPackage) {
              throw new Error('Invalid package type in list');
          }
      }
          const owner = req.currentUser.id;
          const yachtDetails = {
            owner,
            name,
            images,
            description,
            capacity,
            mnfyear,
            YachtType,
            dimension,
            location,
            pickupat,
            crewCount,
            amenities,
            availability,
            price,
            addonServices: addonServices || [],
            packageTypes,
            isVerifiedByAdmin: 'requested',
          };
      
          const { yachtId } = await YatchService.createYatch(yachtDetails);
          await UserService.addYachtToOwner(owner, yachtId);
        res.status(201).json({ message: 'Yatch created successfully', yachtId });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async updateYatch(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const details = req.body;
        const yatchId = await YatchService.updateYatch(id,details);
        res.status(201).json({ message: 'Yatch created successfully', yatchId });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async deleteYatch(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await YatchService.deleteYatch(id);
      res.status(200).json({ message: 'Yacht deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async listmyYatchs(req: Request, res: Response): Promise<void> {
    try {
      const owner = req.currentUser.id;
      const yachts = await YatchService.findYachtsByOwner(owner);
      res.status(200).json({"yachts" : yachts});
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }
}