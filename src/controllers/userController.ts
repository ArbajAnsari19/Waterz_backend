import { Request, Response } from 'express';
import { UserprofileService } from '../services/userServices';
import { AdminService } from '../services/userServices';

export class userController {

    // customer
    static async meCustomer(req: Request, res: Response): Promise<void> {
        try {
            const user = await UserprofileService.meCustomer(req.currentUser.id);
            res.status(200).json({ 'User-Details' : user });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async customerAllCurrentRides(req: Request, res: Response): Promise<void> {
        try {
            const AllCurrentRides = await UserprofileService.customerCurrentRides(req.currentUser.id);
            res.status(200).json({ "AllCurrentRides": AllCurrentRides });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async customerAllPrevRides(req: Request, res: Response): Promise<void> {
        try {
            const AllbookingRides = await UserprofileService.customerPrevRides(req.currentUser.id);
            res.status(200).json({ "AllBokingRides": AllbookingRides });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async customerPrevRidesId(req: Request, res: Response): Promise<void> {
        try {
            const bookingId = req.params.id;
            const prevRideData = await UserprofileService.customerPrevRidesId(req.currentUser.id,bookingId);
            res.status(200).json({ "The details of this Ride are": prevRideData });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    // owner
    static async meOwner(req: Request, res: Response): Promise<void> {
        try {
            const user = await UserprofileService.meOwner(req.currentUser.id);
            res.status(200).json({ message: 'meOwner' });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async ownerPrevRides(req: Request, res: Response): Promise<void> {
        try {
            const ownerPrevRides = await UserprofileService.ownerPrevRides(req.currentUser.id);
            res.status(200).json({ ownerPrevRides});
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async ownercurrentRides(req: Request, res: Response): Promise<void> {
        console.log("here is req.currentUser.id",req.currentUser);

        try {
            console.log("here is req.currentUser.id",req.currentUser.id);
            const ownerCurrentRides = await UserprofileService.ownerCurrentRides(req.currentUser.id);
            res.status(200).json({ownerCurrentRides});
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async ownerPrevRidesId(req: Request, res: Response): Promise<void> { 
        try {
            const { id } = req.params;
            const ownerPrevRidesId = await UserprofileService.ownerPrevRidesId(req.currentUser.id, id);
            res.status(200).json({ownerPrevRidesId});
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }
    // agent 
    static meAgent = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = await UserprofileService.meAgent(req.currentUser.id);
            res.status(200).json({ message: 'meAgent' });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async agentAllCurrentRides(req: Request, res: Response): Promise<void> {
        try {
            const AllCurrentRides = await UserprofileService.agentCurrentRides(req.currentUser.id);
            res.status(200).json({ "AllCurrentRides": AllCurrentRides });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async agentAllPreviousRides(req: Request, res: Response): Promise<void> {
        try {
            const AllbookingRides = await UserprofileService.agentPrevRides(req.currentUser.id);
            res.status(200).json({ "AllBokingRides": AllbookingRides });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async agentPrevRidesId(req: Request, res: Response): Promise<void> {
        try {
            const bookingId = req.params.id;
            const prevRideData = await UserprofileService.customerPrevRidesId(req.currentUser.id,bookingId);
            res.status(200).json({ "The details of this Ride are": prevRideData });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    // superAgent
    static async meSuperAgent(req: Request, res: Response): Promise<void> {
        try {
            const user = await UserprofileService.meSuperAgent(req.currentUser.id);
            res.status(200).json({ message: 'meSuperAgent' });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async agentnRefferal(req: Request, res: Response): Promise<void> {
        try {
            const link = await UserprofileService.createRefferal(req.currentUser.id);
            res.status(200).json({ message: 'Agent Refferal link created :', link });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }   

    static async listAllAgent(req: Request, res: Response): Promise<void> {
        try {
            const allAgents = await UserprofileService.listAllAgent(req.currentUser.id);
            res.status(200).json({ allAgents });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async AgentDetail(req: Request, res: Response): Promise<void> {
        try {
            const agentId = req.params.id;
            const user = await UserprofileService.meAgent(agentId);
            res.status(200).json({ message: 'meAgent' });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }
    
    // static paymentDetail = async (req: Request, res: Response): Promise<void> => {
    //     try {
    //         const paymentDetails = await UserprofileService.paymentDetail(req.currentUser.id);
    //         res.status(200).json({ paymentDetails });
    //     } catch (error) {
    //         res.status(500).json({ message: (error as Error).message });
    //     }
    // }-
}


export class adminController{
    static async getAllYatchs(req: Request, res: Response): Promise<void> {
        try {
            const yatchs = await AdminService.getAllYatchs();
            res.status(200).json({ yatchs });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }
}