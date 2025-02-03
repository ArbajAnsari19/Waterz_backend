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
          status: 'confirmed'
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

    static async topYatch(page: number = 1, limit: number = 4): Promise<IYacht[]> {
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
            },
            {
              $skip: (page - 1) * limit
            },
            {
              $limit: limit
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

    static async findNearbyYachts(longitude: number, latitude: number, maxDistance: number, page: number, limit: number): Promise<IYacht[]> {
      try {
        const yachts = await Yacht.find({
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [longitude, latitude]
              },
              $maxDistance: maxDistance
            }
          }
        })
        .skip((page - 1) * limit)
        .limit(limit);
  
        return yachts;
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
  }
export default YatchService;