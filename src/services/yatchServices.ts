import Yacht, { IYacht } from "../models/Yacht";
import Booking from "../models/Booking"; // Add this import at the top

interface EarningsAnalytics {
  sevenDaysEarnings: number;
  thirtyDaysEarnings: number;
  totalEarnings: number;
  sevenDaysBookings: any[];
  thirtyDaysBookings: any[];
  allBookings: any[];
}

class YatchService {

    static async detailsYatch(id: string): Promise<IYacht | null> {
        try {
          return await Yacht.findById(id);
        } catch (error) {
          throw new Error((error as Error).message);
        }
    }

    static async listAll(): Promise<IYacht[]> {
        try {
          return await Yacht.find();
        } catch (error) {
          throw new Error((error as Error).message);
        }
    }

    static async revenue(owner: string): Promise<EarningsAnalytics> {
        try {
        // Get all yachts owned by this owner
        const yachts = await Yacht.find({ owner });
        const yachtIds = yachts.map(yacht => yacht._id);

        const allBookings = await Booking.find({
          yacht: { $in: yachtIds },
          paymentStatus : "completed"
        }).populate('yacht');

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
        const sevenDaysBookings = allBookings.filter(booking => 
          //@ts-ignore
          booking.createdAt >= sevenDaysAgo
        );
        
        const thirtyDaysBookings = allBookings.filter(booking => 
          //@ts-ignore
          booking.createdAt >= thirtyDaysAgo
        );
    
        return {
          sevenDaysEarnings: sevenDaysBookings.reduce((sum, booking) => sum + booking.totalAmount, 0),
          thirtyDaysEarnings: thirtyDaysBookings.reduce((sum, booking) => sum + booking.totalAmount, 0),
          totalEarnings: allBookings.reduce((sum, booking) => sum + booking.totalAmount, 0),
          sevenDaysBookings,
          thirtyDaysBookings,  
          allBookings
        };

        } catch (error) {
          throw new Error((error as Error).message);
        }
    }

    static async topYatch(): Promise<IYacht[]> {
        try {
          const yachts = await Yacht.aggregate([
            {
              $lookup: {
                from: "reviews",
                localField: "_id",
                foreignField: "yacht",
                as: "reviews"
              }
            },
            {
              $lookup: {
                from: "bookings",
                localField: "_id",
                foreignField: "yacht",
                as: "bookings"
              }
            },
            {
              $addFields: {
                averageRating: { $avg: "$reviews.rating" },
                bookingCount: { $size: "$bookings" }
              }
            },
            {
              $sort: {
                averageRating: -1,
                bookingCount: -1
              }
            }
          ]);
    
          return yachts;
        } catch (error) {
          throw new Error((error as Error).message);
        }
    }

    static async createYatch(yatchDtails:IYacht): Promise<{yachtId : string}> {
      try {
        const yatch = new Yacht({
            ...yatchDtails,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        const newYatch = await yatch.save();
        const yachtId = newYatch._id.toString();
        console.log(yachtId);
        return {yachtId};
      } catch (error) {
        throw new Error((error as Error).message);
      }
    }
    
    static async updateYatch(id: string, detail: Partial<IYacht>): Promise<IYacht | null> {
        try {
          const updatedYatch = await Yacht.findByIdAndUpdate(id, { ...detail, updatedAt: new Date() }, { new: true });
          return updatedYatch;
        } catch (error) {
          throw new Error((error as Error).message);
        }
    }

    static async deleteYatch(id: string): Promise<IYacht | null> {
        try {
          const deletedYatch = await Yacht.findByIdAndDelete(id);
          return deletedYatch;
        } catch (error) {
          throw new Error((error as Error).message);
        }
    }
    
    static async updateDetail(): Promise<void> {
        try {
          // Implement logic to update details
        } catch (error) {
          throw new Error((error as Error).message);
        }
    }

    static async findYachtsByOwner(owner: string): Promise<IYacht[]> {
        try {
          return await Yacht.find({ owner : owner });
        } catch (error) {
          throw new Error((error as Error).message);
        }
    }

    static async revenueAgent(agent: string): Promise<EarningsAnalytics> {
      try {
        // Find all bookings for this agent with completed payment
        const allBookings = await Booking.find({
          agent: agent,
          paymentStatus: "completed"
        }).populate('yacht');
        
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        // Filter bookings for last 7 & 30 days
        const sevenDaysBookings = allBookings.filter(booking =>
          //@ts-ignore
          booking.createdAt >= sevenDaysAgo
        );
        const thirtyDaysBookings = allBookings.filter(booking =>
          //@ts-ignore
          booking.createdAt >= thirtyDaysAgo
        );
        
        // Calculate earnings over the defined periods
        const sevenDaysEarnings = sevenDaysBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
        const thirtyDaysEarnings = thirtyDaysBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
        const totalEarnings = allBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
        
        return {
          sevenDaysEarnings,
          thirtyDaysEarnings,
          totalEarnings,
          sevenDaysBookings,
          thirtyDaysBookings,
          allBookings
        };
        
      } catch (error) {
        throw new Error((error as Error).message);
      }
    }
  }
export default YatchService;