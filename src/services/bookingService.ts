import { IBooking } from "../models/Booking";
import Yacht, {IYacht} from "../models/Yacht";
import Booking from "../models/Booking";
import Owner from "../models/User";
import User,{ Agent } from "../models/User";
import Razorpay from "razorpay";
import { PackageType } from "../utils/trip";
import PaymentService from "./paymentService";
import Payment from "../models/Payment";

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

    // Helper: Extract package duration
    private static getPackageDuration(packageType: string): { sailingHours: number, anchorageHours: number, totalHours: number } {
      // Extract all numbers from the package string using regex.
      const numbers = packageType.match(/(\d+(\.\d+)?)/g);
      const sailing = numbers && numbers[0] ? parseFloat(numbers[0]) : 0;
      const anchorage = numbers && numbers[1] ? parseFloat(numbers[1]) : 0;
      return { sailingHours: sailing, anchorageHours: anchorage, totalHours: sailing + anchorage };
    }
  
    // Helper: Calculate base price from package
    private static calculateBasePrice(yachtDetails: IYacht, sailingHours: number, anchorageHours: number, isPeakTime: boolean): number {
      const sailingPrice = isPeakTime ? yachtDetails.price.sailing.peakTime : yachtDetails.price.sailing.nonPeakTime;
      const anchoragePrice = isPeakTime ? yachtDetails.price.anchoring.peakTime : yachtDetails.price.anchoring.nonPeakTime;
      return (sailingPrice * sailingHours) + (anchoragePrice * anchorageHours);
    }
  
    //   // Helper: Calculate addon services cost
    //   private static calculateAddonCost(yachtDetails: IYacht, addonServices?: Array<{ service: string; hours: number }>): number {
    //     if (!addonServices || addonServices.length === 0) return 0;
    //     const CaluclatedAddonPrice = addonServices.reduce((sum, addon) => {
    //       const yachtAddon = yachtDetails.addonServices.find(a => a.service === addon.service);
    //       return sum + (yachtAddon ? yachtAddon.pricePerHour * addon.hours : 0);
    //     }, 0);
    //     console.log("AddonPrice is here : ",CaluclatedAddonPrice)
    //   return CaluclatedAddonPrice
    // }

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

    // Helper: Apply promo discount returning discount amount and adjusted total
    private static async applyPromoDiscount(promoCode: string, user: string, role: "agent" | "customer", amount: number): Promise<{ discount: number, adjustedAmount: number }> {
      const promoResult = await PaymentService.validateAndApplyPromo(promoCode, user, role, amount);
      if (promoResult.isValid) {
        const discount = promoResult.discount;
        return { discount, adjustedAmount: amount - discount };
      }
      throw new Error(promoResult.message);
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

      // Validate packages
      if (!packages) {
        throw new Error("Packages are required");
      }

      // Calculate package duration and booking times
      const { sailingHours, anchorageHours, totalHours } = this.getPackageDuration(packages);
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
      // Calculate pricing
      const isPeakTime = false; // TODO: Implement peak time logic
      console.log("sailing Hours" , sailingHours)
      console.log("anchorage Hours" , anchorageHours)
      console.log("yachtDetails" , yachtDetails)
      let totalAmount = 0;
      const packageAmount = this.calculateBasePrice(yachtDetails, sailingHours, anchorageHours, isPeakTime);
      totalAmount += packageAmount;
      console.log("Total Amount is here : ",totalAmount)
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

    // static async createBooking(BookingDetails: Partial<IBooking>,role : Role): Promise<{booking: IBooking, orderId: string }> {
    //   try {
    //     const { 
    //       startDate, 
    //       startTime, 
    //       location, 
    //       packages, 
    //       PeopleNo, 
    //       addonServices, 
    //       user,
    //       promoCode,
    //       yacht 
    //     } = BookingDetails;

    //   // Find yacht
    //   const yachtDetails = await Yacht.findById(yacht);
    //   if (!yachtDetails) throw new Error("Yacht not found");

    //   // Extract package times
    //   const getPackageDuration = (packageType: PackageType): { sailingHours: number, anchorageHours: number } => {
    //     const [sailing, anchoring] = packageType.split('_hour').map(part => {
    //       const match = part.match(/(\d+\.?\d*)/);
    //       return match ? parseFloat(match[0]) : 0;
    //     });
    //     return { sailingHours: sailing, anchorageHours: anchoring };
    //   };
    //   if (!packages) {
    //     throw new Error("Packages are required");
    //   }

    //   const { sailingHours, anchorageHours } = getPackageDuration(packages.type);
    //   const totalHours = sailingHours + anchorageHours;

    //   // Calculate dates
    //   const startDateTime = new Date(`${startDate}T${startTime}`);
    //   const endDateTime = new Date(startDateTime.getTime() + (totalHours * 60 * 60 * 1000));

    //   // Validate capacity
    //   if (PeopleNo && PeopleNo > yachtDetails.capacity) {
    //     throw new Error("Number of people exceeds yacht capacity");
    //   }    

    //   // Check availability
    //   const overlappingBookings = await Booking.find({
    //     yacht: yacht,
    //     status: 'confirmed',
    //     $or: [
    //       { startDate: { $lt: endDateTime }, endDate: { $gt: startDateTime } },
    //       { startDate: { $gte: startDateTime, $lt: endDateTime } },
    //       { endDate: { $gt: startDateTime, $lte: endDateTime } }
    //     ]
    //   });

    //   if (overlappingBookings.length > 0) {
    //     throw new Error("The yacht is not available for the selected dates and times");
    //   }
    //   // Calculate total amount
    //   const isPeakTime = true; // TODO: Implement peak time logic
    //   const sailingPrice = isPeakTime ? yachtDetails.price.sailing.peakTime : yachtDetails.price.sailing.nonPeakTime;
    //   const anchoragePrice = isPeakTime ? yachtDetails.price.anchoring.peakTime : yachtDetails.price.anchoring.nonPeakTime;

    //   let totalAmount = (sailingPrice * sailingHours) + (anchoragePrice * anchorageHours);

    //   // calculate total discount amount if applied any Promo code
    //   let discountPromoAmount = 0;
    //   if (promoCode) {
    //     if (!user) {
    //       throw new Error("User is required");
    //     }
    //     const promoResult = await PaymentService.validateAndApplyPromo(
    //       promoCode,
    //       user,
    //       role.role,
    //       totalAmount
    //     );
        
    //     if (promoResult.isValid) {
    //       discountPromoAmount = promoResult.discount;
    //       totalAmount = totalAmount - discountPromoAmount;
    //     } else {
    //       throw new Error(promoResult.message);
    //     }
    //   }

    //   // Addon services cost
    //   if (addonServices && addonServices.length > 0) {
    //     const addonsCost = addonServices.reduce((sum, addon) => {
    //       const yachtAddon = yachtDetails.addonServices.find(a => a.service === addon.service);
    //       return sum + (yachtAddon ? yachtAddon.pricePerHour * addon.hours : 0);
    //     }, 0);
    //     totalAmount += addonsCost;
    //   }
        

    //   // Fetch user details
    //   const userDetails = await User.findById(user);
    //   if (!userDetails) throw new Error("User not found");
    //     // In BookingService.createBooking
    //       const booking = new Booking({
    //         ...BookingDetails,
    //         user,
    //         yacht,
    //         bookingDateTime: new Date(),
    //         location,
    //         packages,
    //         startDate: startDateTime,
    //         startTime: startDateTime,
    //         endDate: endDateTime,
    //         name : yachtDetails.name,
    //         images : yachtDetails.images,
    //         YachtType: yachtDetails.YachtType,
    //         promoCode,
    //         capacity: yachtDetails.capacity,
    //         customerName: userDetails.name,
    //         customerEmail: userDetails.email,
    //         customerPhone: userDetails.phone,
    //         PeopleNo,
    //         totalAmount,
    //         addonServices: addonServices || [],
    //         paymentStatus: 'pending',
    //         status: 'confirmed',
    //         calendarSync: false
    //       });

    //     const options = {
    //       amount: totalAmount * 100, 
    //       currency: "INR",
    //       //@ts-ignore
    //       receipt: booking._id.toString(),
    //     };
    //     const order = await razorpay.orders.create(options);
    //     booking.razorpayOrderId = order.id;
    //     await booking.save();

    //     await User.findByIdAndUpdate(user, { $push: { bookings: booking._id } });
    //     const owner = yachtDetails.owner;
    //     await Owner.findByIdAndUpdate(owner, { $push: { bookings: booking._id } });
        
    //     return { booking, orderId: order.id };

    //   } catch (error) {
    //     throw new Error((error as Error).message);
    //   }
    // }

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

    // static async createAgentMultipleBooking(BookingDetails: Partial<IBookingAgent>): Promise<{booking: IBookingAgent, orderId: string }> {
    //   try {
    //     const { 
    //       startDate, 
    //       startTime, 
    //       location, 
    //       packages,
    //       PeopleNo, 
    //       addonServices,
    //       user, 
    //       yachts,
    //       customerEmail,
    //       customerName,
    //       customerPhone
    //     } = BookingDetails;
        
    //     if (!yachts) {
    //       throw new Error("Yachts are required");
    //     }
    //     // Get yacht details
    //     const yachtDetails = await Promise.all(
    //       yachts.map(async (yachtId) => {
    //         const yacht = await Yacht.findById(yachtId);
    //         if (!yacht) throw new Error(`Yacht ${yachtId} not found`);
    //         return yacht;
    //       })
    //     );
    //     const yachtNames = yachtDetails.map(yacht => yacht.name);
    //     const yachtImages = yachtDetails.map(yacht => yacht.images).flat();
    //     const numberOfYachts = yachtDetails.length;
    //   // Extract package times
    //   const getPackageDuration = (packageType: PackageType): { sailingHours: number, anchorageHours: number } => {
    //     const [sailing, anchoring] = packageType.split('_hour').map(part => {
    //       const match = part.match(/(\d+\.?\d*)/);
    //       return match ? parseFloat(match[0]) : 0;
    //     });
    //     return { sailingHours: sailing, anchorageHours: anchoring };
    //   };

    //   if (!packages) throw new Error("Packages are required");
    //   const { sailingHours, anchorageHours } = getPackageDuration(packages.type);
    //   const totalHours = sailingHours + anchorageHours;


    //   // Calculate dates
    //   const startDateTime = new Date(`${startDate}T${startTime}`);
    //   const endDateTime = new Date(startDateTime.getTime() + (totalHours * 60 * 60 * 1000));

    //   // Check total capacity
    //   const totalCapacity = yachtDetails.reduce((sum, yacht) => sum + yacht.capacity, 0);
    //   if (PeopleNo && PeopleNo > totalCapacity) {
    //     throw new Error("Number of people exceeds total yachts capacity");
    //   }

    //   // Check availability for all yachts
    //   await Promise.all(
    //     yachtDetails.map(async (yacht) => {
    //       const overlappingBookings = await Booking.find({
    //         yacht: yacht._id,
    //         status: 'confirmed',
    //         $or: [
    //           { startDate: { $lt: endDateTime }, endDate: { $gt: startDateTime } },
    //           { startDate: { $gte: startDateTime, $lt: endDateTime } },
    //           { endDate: { $gt: startDateTime, $lte: endDateTime } }
    //         ]
    //       });

    //       if (overlappingBookings.length > 0) {
    //         throw new Error(`Yacht ${yacht.name} is not available for selected time`);
    //       }
    //     })
    //   );
        
    //   // Calculate total amount
    //   const isPeakTime = true; // TODO: Implement peak time logic
    //   let totalAmount = yachtDetails.reduce((sum, yacht) => {
    //     const sailingPrice = isPeakTime ? yacht.price.sailing.peakTime : yacht.price.sailing.nonPeakTime;
    //     const anchoragePrice = isPeakTime ? yacht.price.anchoring.peakTime : yacht.price.anchoring.nonPeakTime;
    //     return sum + (sailingPrice * sailingHours) + (anchoragePrice * anchorageHours);
    //   }, 0);

    //   // Add addon services cost
    //   if (addonServices?.length) {
    //     const addonsCost = yachtDetails.reduce((sum, yacht) => {
    //       return sum + addonServices.reduce((addonSum, addon) => {
    //         const yachtAddon = yacht.addonServices.find(a => a.service === addon.service);
    //         return addonSum + (yachtAddon ? yachtAddon.pricePerHour * addon.hours : 0);
    //       }, 0);
    //     }, 0);
    //     totalAmount += addonsCost;
    //   }

    //   // Apply agent discount
    //   const agent = await Agent.findById(user);
    //   const agentDiscount = agent?.commissionRate ?? 0;
    //   const discountedAmount = totalAmount - (totalAmount * agentDiscount / 100);


    //   // Create booking
    //   const bookingAgent = new BookingAgent({
    //     ...BookingDetails,
    //     user,
    //     yachts,
    //     names: yachtNames,         // Add yacht names
    //     images: yachtImages,       // Add yacht images
    //     noOfYatchs: numberOfYachts, // Add number of yachts
    //     bookingDateTime: new Date(),
    //     location,
    //     packages,
    //     startDate: startDateTime,
    //     startTime: startDateTime,
    //     endDate: endDateTime,
    //     capacity: totalCapacity,
    //     PeopleNo,
    //     totalAmount: discountedAmount,
    //     customerEmail,
    //     customerName,
    //     isAgentBooking: true,
    //     customerPhone,
    //     addonServices: addonServices || [],
    //     paymentStatus: 'pending',
    //     status: 'confirmed',
    //     calendarSync: false
    //   });

    //     const options = {
    //       amount: discountedAmount * 100, 
    //       currency: "INR",
    //       //@ts-ignore
    //       receipt: bookingAgent._id.toString()
    //     };

    //     const order = await razorpay.orders.create(options);
    //     bookingAgent.razorpayOrderId = order.id;
    //     await bookingAgent.save();

    //   // Update owners and user
    //   await Promise.all([
    //     ...yachtDetails.map(yacht => 
    //       Owner.findByIdAndUpdate(yacht.owner, { $push: { bookings: bookingAgent._id } })
    //     ),
    //     User.findByIdAndUpdate(user, { $push: { bookings: bookingAgent._id } })
    //   ]);

    //   return { booking: bookingAgent, orderId: order.id };
    //   } catch (error) {
    //     throw new Error((error as Error).message);
    //   }
    // }

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

      // Find yacht
      const yachtDetails = await Yacht.findById(yacht);
      if (!yachtDetails) throw new Error("Yacht not found");

      // Extract package times
      const getPackageDuration = (packageType: PackageType): { sailingHours: number, anchorageHours: number } => {
        const [sailing, anchoring] = packageType.split('_hour').map(part => {
          const match = part.match(/(\d+\.?\d*)/);
          return match ? parseFloat(match[0]) : 0;
        });
        return { sailingHours: sailing, anchorageHours: anchoring };
      };
      if (!packages) {
        throw new Error("Packages are required");
      }

      const { sailingHours, anchorageHours } = getPackageDuration(packages);
      const totalHours = sailingHours + anchorageHours;

      // Calculate dates
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
      // Calculate total amount
      const isPeakTime = true; // TODO: Implement peak time logic
      const sailingPrice = isPeakTime ? yachtDetails.price.sailing.peakTime : yachtDetails.price.sailing.nonPeakTime;
      const anchoragePrice = isPeakTime ? yachtDetails.price.anchoring.peakTime : yachtDetails.price.anchoring.nonPeakTime;

      let totalAmount = (sailingPrice * sailingHours) + (anchoragePrice * anchorageHours);
      // Addon services cost
      if (addonServices && addonServices.length > 0) {
        const addonsCost = addonServices.reduce((sum, addon) => {
          const yachtAddon = yachtDetails.addonServices.find(a => a.service === addon.service);
          return sum + (yachtAddon ? yachtAddon.pricePerHour * addon.hours : 0);
        }, 0);
        totalAmount += addonsCost;
      }
      // Apply agent discount
      const agent = await Agent.findById(user);
      if (!agent) throw new Error("Agent not found");
      const agentDiscount = agent.commissionRate ?? 0;
      const discountedAmount = totalAmount - (totalAmount * agentDiscount / 100);

        // In BookingService.createBooking
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
          name : yachtDetails.name,
          images : yachtDetails.images,
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

        await User.findByIdAndUpdate(user, { $push: { bookings: booking._id } });
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
      razorpayId: string
    ): Promise<{ discount: number, discountType: string, newTotal: number ,orderId:string}> {
      try {
        const promoResult = await PaymentService.validateAndApplyPromo(promoCode, user, "customer", grandTotal);
    
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