import { IBooking } from "../models/Booking";
import Yacht, {IYacht} from "../models/Yacht";
import Booking from "../models/Booking";
import Owner from "../models/User";
import User,{ Agent } from "../models/User";
import Razorpay from "razorpay";
import { PackageType } from "../utils/trip";
import PaymentService from "./paymentService";
import Payment from "../models/Payment";
import { getEffectivePrice } from "../utils/timeUtils";

interface customerData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}

interface Role {
  role: "agent" | "customer";
} 
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || (() => { throw new Error("RAZORPAY_KEY_ID is not defined"); })(),
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

class BookingService {

    private static getPackageDuration(packageType: string): { sailingHours: number, anchorageHours: number, totalHours: number } {
      // Extract all numbers from the package string using regex.
      const numbers = packageType.match(/(\d+(\.\d+)?)/g);
      const sailing = numbers && numbers[0] ? parseFloat(numbers[0]) : 0;
      const anchorage = numbers && numbers[1] ? parseFloat(numbers[1]) : 0;
      return { sailingHours: sailing, anchorageHours: anchorage, totalHours: sailing + anchorage };
    }

    private static getPackageDurationHelper(pkgType: string): { sailingHours: number, anchorageHours: number, totalHours: number } {
      const [sailing, anchoring] = pkgType.split('_hour').map(part => {
        const match = part.match(/(\d+\.?\d*)/);
        return match ? parseFloat(match[0]) : 0;
      });
      return { sailingHours: sailing, anchorageHours: anchoring, totalHours: sailing + anchoring };
    }

    private static calculateAddonCost(
      yachtDetails: IYacht,
      totalHours: number,
      addonServices?: Array<{ service: string } | string>
    ): number {
      if (!addonServices || addonServices.length === 0) return 0;
      const calculatedAddonPrice = addonServices.reduce((sum, addon) => {
        let serviceName: string;
        // Use totalHours as duration regardless of addon type
        if (typeof addon === 'string') {
          serviceName = addon;
        } else {
          serviceName = addon.service;
        }
        const yachtAddon = yachtDetails.addonServices.find(a => a.service === serviceName);
        return sum + (yachtAddon ? yachtAddon.pricePerHour * totalHours : 0);
      }, 0);
      console.log("AddonPrice is here : ", calculatedAddonPrice);
      return calculatedAddonPrice;
    }

    private static calculateGst(totalAmount: number, totalTaxPercentage : number): number {
      return totalAmount * (totalTaxPercentage / 100);
    }

    static async createBooking(BookingDetails: Partial<IBooking>,role : Role): Promise<{booking: IBooking, orderId: string,totalAmount: number,packageAmount: number, addonCost: number, gstAmount: number }> {
      try {
        const { 
          startDate, 
          startTime, 
          location, 
          packages, 
          PeopleNo, 
          addonServices, 
          user,
          promoCode,
          yacht 
        } = BookingDetails;
  
      // Find yacht
      console.log("BookingDetails is here : ",BookingDetails)
      const yachtDetails = await Yacht.findById(yacht);
      if (!yachtDetails) throw new Error("Yacht not found");

      const packageType = typeof packages === 'string' ? packages : packages;
      if (!packageType) {
        throw new Error("Package type is required");
      }
  
      // Extract sailing and anchoring times from package
      const getPackageDuration = (pkgType: string): { sailingHours: number, anchorageHours: number } => {
        const [sailing, anchoring] = pkgType.split('_hour').map(part => {
          const match = part.match(/(\d+\.?\d*)/);
          return match ? parseFloat(match[0]) : 0;
        });
        return { sailingHours: sailing, anchorageHours: anchoring };
      };
      const { sailingHours, anchorageHours } = getPackageDuration(packageType);
      const totalHours = sailingHours + anchorageHours;
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + (totalHours * 60 * 60 * 1000));

      // Validate capacity
      if (PeopleNo && PeopleNo > yachtDetails.capacity) {
        throw new Error("Number of people exceeds yacht capacity");
      }    
  
      // Check availability
      const overlappingBookings = await Booking.find({
        yacht: yacht,
        status: 'confirmed',
        $or: [
          { startDate: { $lt: endDateTime }, endDate: { $gt: startDateTime } },
          { startDate: { $gte: startDateTime, $lt: endDateTime } },
          { endDate: { $gt: startDateTime, $lte: endDateTime } }
        ]
      });
      if (overlappingBookings.length > 0) {
        throw new Error("The yacht is not available for the selected dates and times");
      }

    // Calculate pricing using effective prices based on IST booking time
      const effectiveSailingPrice = getEffectivePrice(yachtDetails, 'sailing', startDateTime);
      const effectiveAnchoringPrice = getEffectivePrice(yachtDetails, 'anchoring', startDateTime);


      const packageAmount = (sailingHours * effectiveSailingPrice) + (anchorageHours * effectiveAnchoringPrice);
      let totalAmount = packageAmount;
      console.log("Package Amount using effective prices: ", packageAmount);
      
      // Add addon services cost
      const addonCost = this.calculateAddonCost(yachtDetails, totalHours, addonServices);
      totalAmount += addonCost;
      console.log("Total Amount after addon is here : ",totalAmount)

      // Add gst cost
      const totalTaxPercentage = 18;
      const gstAmount = this.calculateGst(totalAmount, totalTaxPercentage);
      totalAmount += gstAmount;
      console.log("Total Amount after gst is here : ",totalAmount)

  
      // Fetch user details
      console.log("User is here : ",user)
      const userDetails = await User.findById(user);
      console.log("UserDetails is here : ",userDetails)
      if (!userDetails) throw new Error("User not found");

      // Create booking record
      const booking = new Booking({
        ...BookingDetails,
        user,
        yacht,
        bookingDateTime: new Date(),
        location,
        packages,
        startDate: startDateTime,
        startTime: startDateTime,
        endDate: endDateTime,
        name: yachtDetails.name,
        images: yachtDetails.images,
        YachtType: yachtDetails.YachtType,
        promoCode,
        capacity: yachtDetails.capacity,
        customerName: userDetails.name,
        customerEmail: userDetails.email,
        customerPhone: userDetails.phone,
        PeopleNo,
        totalAmount,
        addonServices: addonServices || [],
        paymentStatus: 'pending',
        status: 'confirmed',
        calendarSync: false
      });

        const options = {
          amount: totalAmount * 100, 
          currency: "INR",
          //@ts-ignore
          receipt: booking._id.toString(),
        };
        const order = await razorpay.orders.create(options);
        booking.razorpayOrderId = order.id;
        await booking.save();
  
        await User.findByIdAndUpdate(user, { $push: { bookings: booking._id } });
        const owner = yachtDetails.owner;
        await Owner.findByIdAndUpdate(owner, { $push: { bookings: booking._id } });
        
        return { 
          booking,
          orderId: order.id,
          totalAmount,
          packageAmount,
          addonCost,
          gstAmount
        };
  
      } catch (error) {
        throw new Error((error as Error).message);
      }
    }

    static async searchIdealYachts(searchParams: Partial<IBooking>): Promise<IYacht[]> {
      try {
        const { startDate, startTime, location, YachtType, PeopleNo, addonServices, packages } = searchParams;
    
        // Validate inputs
        if (!startDate || !startTime) {
          throw new Error("Start date, time are required");
        }
    
        // Convert packages string to expected format
        if (!packages) {
          throw new Error("Package type is required");
        }
    
        // Extract sailing and anchoring times from package
        const getPackageDuration = (pkgType: string): { sailingHours: number, anchorageHours: number } => {
          const [sailing, anchoring] = pkgType.split('_hour').map(part => {
            const match = part.match(/(\d+\.?\d*)/);
            return match ? parseFloat(match[0]) : 0;
          });
          return { sailingHours: sailing, anchorageHours: anchoring };
        };
    
        const { sailingHours, anchorageHours } = getPackageDuration(packages);
        const totalHours = sailingHours + anchorageHours;

      // Calculate end date and time
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const BUFFER_TIME = 30 * 60 * 1000; // 30 min buffer
      const HOUR_IN_MS = 60 * 60 * 1000;
      const endDateTime = new Date(startDateTime.getTime() + (totalHours * HOUR_IN_MS) + BUFFER_TIME);

        // Find yachts that match the search criteria
        const yachts = await Yacht.find({
          location,
          YachtType: YachtType,
          capacity: { $gte: PeopleNo },
          addonServices: {
            $elemMatch: {
              service: { 
                $in: addonServices?.map(a => a.service) || [] 
              }
            }
          }      
        });

        // Filter out yachts that have overlapping bookings
        const availableYachts = [];
        for (const yacht of yachts) {
          const overlappingBookings = await Booking.find({
            yacht: yacht._id,
            status: 'confirmed',
            $or: [
              { startDate: { $lt: endDateTime }, endDate: { $gt: startDateTime } },
              { startDate: { $gte: startDateTime, $lt: endDateTime } },
              { endDate: { $gt: startDateTime, $lte: endDateTime } }
            ]
          });

          if (overlappingBookings.length === 0) {
            availableYachts.push(yacht);
          }
        }

        return availableYachts;
      } catch (error) {
        throw new Error(`Yacht search failed: ${(error as Error).message}`);
      }
    }

    static async createAgentBooking(BookingDetails: Partial<IBooking>, customerData:customerData): Promise<{booking: IBooking, orderId: string }> {
      try {
        const { 
          startDate, 
          startTime, 
          location, 
          packages, 
          PeopleNo, 
          addonServices, 
          user, 
          yacht,
        } = BookingDetails;

    // 1. Find yacht
    const yachtDetails = await Yacht.findById(yacht);
    if (!yachtDetails) throw new Error("Yacht not found");

    // 2. Use helper function for package duration
    if (!packages) throw new Error("Packages are required");
    const { sailingHours, anchorageHours, totalHours } = this.getPackageDurationHelper(packages);


    // 3. Calculate booking start and end times
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(startDateTime.getTime() + (totalHours * 60 * 60 * 1000));

    // 4. Validate capacity
    if (PeopleNo && PeopleNo > yachtDetails.capacity) {
      throw new Error("Number of people exceeds yacht capacity");
    }

    // 5. Check for overlapping bookings
    const overlappingBookings = await Booking.find({
      yacht: yacht,
      status: 'confirmed',
      $or: [
        { startDate: { $lt: endDateTime }, endDate: { $gt: startDateTime } },
        { startDate: { $gte: startDateTime, $lt: endDateTime } },
        { endDate: { $gt: startDateTime, $lte: endDateTime } }
      ]
    });
    if (overlappingBookings.length > 0) {
      throw new Error("The yacht is not available for the selected dates and times");
    }
    // 6 Calculate pricing using effective prices based on IST booking time
    const effectiveSailingPrice = getEffectivePrice(yachtDetails, 'sailing', startDateTime);
    const effectiveAnchoringPrice = getEffectivePrice(yachtDetails, 'anchoring', startDateTime);

    const packageAmount = (sailingHours * effectiveSailingPrice) + (anchorageHours * effectiveAnchoringPrice);
    let totalAmount = packageAmount;
    console.log("Package Amount using effective prices: ", packageAmount);

    // Add addon services cost
    const addonCost = this.calculateAddonCost(yachtDetails, totalHours, addonServices);
    totalAmount += addonCost;
    console.log("Total Amount after addon is here : ", totalAmount);

    // Add GST cost
    const totalTaxPercentage = 18;
    const gstAmount = this.calculateGst(totalAmount, totalTaxPercentage);
    totalAmount += gstAmount;
    console.log("Total Amount after gst is here : ", totalAmount);
    
    // 7. Apply agent discount logic
    const agent = await Agent.findById(user);
    if (!agent) throw new Error("Agent not found");
    const agentDiscount = agent.commissionRate ?? 0;
    const discountedAmount = totalAmount - (totalAmount * agentDiscount / 100);



   
    // 8. Create booking object
    const booking = new Booking({
      ...BookingDetails,
      user,
      yacht,
      bookingDateTime: new Date(),
      location,
      packages,
      startDate: startDateTime,
      startTime: startDateTime,
      endDate: endDateTime,
      YachtType: yachtDetails.YachtType,
      capacity: yachtDetails.capacity,
      PeopleNo,
      name: yachtDetails.name,
      images: yachtDetails.images,
      isAgentBooking: true,
      totalAmount: discountedAmount,
      customerName: customerData.customerName,
      customerEmail: customerData.customerEmail,
      customerPhone: customerData.customerPhone,
      addonServices: addonServices || [],
      paymentStatus: 'pending',
      status: 'confirmed',
      calendarSync: false
    });


    const options = {
          amount: totalAmount * 100, 
          currency: "INR",
          //@ts-ignore
          receipt: booking._id.toString(),
    };
    const order = await razorpay.orders.create(options);
    booking.razorpayOrderId = order.id;
    await booking.save();

    await Agent.findByIdAndUpdate(user, { $push: { bookings: booking._id } });
    const owner = yachtDetails.owner;
    await Owner.findByIdAndUpdate(owner, { $push: { bookings: booking._id } });
        
    return { booking, orderId: order.id };
    } catch (error) {
      throw new Error((error as Error).message);
    }
    }

    static async validatePromocode(
      promoCode: string,
      user: string,
      grandTotal: number,
      bookingId: string,
      role:"customer" | "agent"
    ): Promise<{ discount: number, discountType: string, newTotal: number ,orderId:string}> {
      try {
        const promoResult = await PaymentService.validateAndApplyPromo(promoCode, user, role, grandTotal);
    
        if (promoResult.isValid) {
          const newTotal = grandTotal - promoResult.discount;

            // Create a new Razorpay order with the updated amount
            const newOrder = await razorpay.orders.create({
              amount: newTotal * 100, // Amount in paise
              currency: "INR",
              receipt: bookingId,
            });
          await Booking.findByIdAndUpdate(bookingId, { totalAmount: newTotal, razorpayOrderId: newOrder.id });
          console.log("razorPayId updated and successfully added here is new one : ",newOrder.id)
          return { discount: promoResult.discount, discountType: promoResult.discountType, newTotal, orderId :newOrder.id  };
        }
        throw new Error(promoResult.message);
      } catch (error) {
        throw new Error((error as Error).message);
      }
    }

    static async getBookingTotalandRazorPayId(bookingId: string): Promise<{totalAmount:number,razorpayId:string}> {
      try {
        console.log("getBookingTotal bookingId:", bookingId);
        const booking = await Booking.findById(bookingId);
        if (!booking) {
          console.error("Booking details not found for id:", bookingId);
          throw new Error("Booking details not found");
        }
        const razorpayId =booking.razorpayOrderId || "",
        totalAmount = booking.totalAmount;
        
        return {totalAmount,razorpayId};
      } catch (error) {
        throw new Error((error as Error).message);
      }
    }
}

export default BookingService;