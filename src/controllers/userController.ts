import { Request, Response } from 'express';
import { UserprofileService, AdminService, Filter } from '../services/userServices';
import { TimeFrame } from '../utils/trip';

export interface EarningFilter {
    timeframe: TimeFrame;
    agentWise: string;
}
export interface AdminFilter {
    searchName: string;
    status: "all" | "recent" | "requests";
}
export interface AgentFilterBooking {
    bookedBy : "all" | "customer" | "agent",
    searchName : string,
    status : "all" | "pending" | "completed",
}

export interface AgentCustomerFilter {
    searchQuery : string,
    type : "all" | "withBooking" | "withoutBooking",
}

export interface ApprovedDetails {
    sailingPeakTimePrice: number;
    sailingNonPeakTimePrice: number;
    anchoringPeakTimePrice: number;
    anchoringNonPeakTimePrice: number;
    approved: boolean;
}

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
            const user = await UserprofileService.agentDetail(agentId);
            res.status(200).json({ message: 'meAgent' });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async deleteAgent(req: Request, res: Response): Promise<void> {
        try {
            const agentId = req.params.id;
            const user = await UserprofileService.deleteAgent(agentId);
            res.status(200).json({ message: 'Agent Deleted' });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async listFilteredAgent(req: Request, res: Response): Promise<void> {
        try {
             const userId = req.currentUser.id;
            const filter : Filter = {
                status:req.body.status,
                agentWise:req.body.agentWise,
            } 
            const allAgents = await UserprofileService.listFilteredAgent(userId,filter);
            res.status(200).json({ allAgents });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async listFilteredEarnings(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.currentUser.id;
            const filter : EarningFilter = {
                timeframe:req.body.timeframe,
                agentWise:req.body.agentWise,
            } 
            const allAgents = await UserprofileService.listFilteredEarnings(userId,filter);
            res.status(200).json({ allAgents });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

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

    static async getAllOwners(req: Request, res: Response): Promise<void> {
        try {
            const owners = await AdminService.getAllOwners();
            res.status(200).json({ owners });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async getAllAgents(req: Request, res: Response): Promise<void> {
        try {
            const agents = await AdminService.getAllAgents();
            res.status(200).json({ agents });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async getAllSuperAgents(req: Request, res: Response): Promise<void> {
        try {
            const superAgents = await AdminService.getAllSuperAgents();
            res.status(200).json({ superAgents });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async getAllCustomers(req: Request, res: Response): Promise<void> {
        try {
            const customers = await AdminService.getAllCustomers();
            res.status(200).json({ customers });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async getAllBookings(req: Request, res: Response): Promise<void> {
        try {
            const bookings = await AdminService.getAllBookings();
            res.status(200).json({ bookings });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async getAllPayments(req: Request, res: Response): Promise<void> {
        try {
            const payments = await AdminService.getAllPayments();
            res.status(200).json({ payments });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async getAllQueries(req: Request, res: Response): Promise<void> {
        try {
            const queries = await AdminService.getAllQueries();
            res.status(200).json({ queries });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async getYatchOwner(req: Request, res: Response): Promise<void> {
        try {
            const yatchId = req.body.yatchId;
            const yatchs = await AdminService.getYatchsOwner(yatchId);
            res.status(200).json({ yatchs });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async getAllBookingByOwner(req: Request, res: Response): Promise<void> {
        try {
            const ownerId = req.body.ownerId;
            const bookings = await AdminService.getAllBookingByOwner(ownerId);
            res.status(200).json({ bookings });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async filterYatchs(req: Request, res: Response): Promise<void> {
        try {
            const filter:AdminFilter = {
                searchName:req.body.searchName,
                status:req.body.status,
            };
            const yatchs = await AdminService.filterYatchs(filter);
            res.status(200).json({ yatchs });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async yatchRequestDetails(req: Request, res: Response): Promise<void> {
        try {
            const yatchId = req.params.yatchId;
            const yatchs = await AdminService.yatchRequestDetails(yatchId);
            res.status(200).json({ yatchs });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async isApprovedYatch(req: Request, res: Response): Promise<void> {
        try {
            const yatchId = req.params.yatchId;
            const updateDetails : ApprovedDetails = {
                sailingPeakTimePrice :req.body.sailingPeakTimePrice,
                sailingNonPeakTimePrice :req.body.sailingNonPeakTimePrice,
                anchoringPeakTimePrice :req.body.anchoringPeakTimePrice,
                anchoringNonPeakTimePrice :req.body.anchoringNonPeakTimePrice,
                approved : req.body.approved,
            }
            const yatchs = await AdminService.isApprovedYatch(updateDetails,yatchId);
            res.status(200).json({ yatchs });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async filterBookings(req: Request, res: Response): Promise<void> {
        try {
            const filters : AgentFilterBooking = {
                bookedBy:req.body.bookedBy,
                searchName:req.body.searchName,
                status:req.body.status,};
            const yatchs = await AdminService.filteredBooking(filters);
            res.status(200).json({ yatchs });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async filterCustomers(req: Request, res: Response): Promise<void> {
        try {
            const filter:AgentCustomerFilter = {
                searchQuery:req.body.searchQuery,
                type:req.body.type,
            };
            const customers = await AdminService.filterCustomers(filter);
            res.status(200).json({ customers });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }
}