import { Request, Response } from 'express';
import YatchService from '../services/yatchServices';
import UserService from '../services/userServices';

export class YatchController {

  static async detailYatch(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const yatch = await YatchService.detailsYatch(id);
        res.status(200).json(yatch);
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
    try {
        const {
            name,
            images,
            pickupat,
            description,
            capacity,
            mnfyear,
            dimension,
            location,
            category,
            YachtType,
            crews,
            amenities,
            availability,
            price
          } = req.body;
        const owner = req.currentUser.id;
        const yatchDetails = {
            owner,
            name,
            pickupat,
            images,
            description,
            capacity,
            mnfyear,
            YachtType,
            dimension,
            location,
            category,
            crews,
            amenities,
            availability,
            price
          };
        const { yachtId } = await YatchService.createYatch(yatchDetails);
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

  static async findNearbyYachts(req: Request, res: Response): Promise<void> {
    try {
      const { longitude, latitude, maxDistance, page = 1, limit = 10 } = req.body;
      const yachts = await YatchService.findNearbyYachts(longitude, latitude, maxDistance, page, limit);
      res.status(200).json(yachts);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async listmyYatchs(req: Request, res: Response): Promise<void> {
    try {
      const owner = req.currentUser.id;
      const yachts = await YatchService.findYachtsByOwner(owner);
      res.status(200).json(yachts);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }
}