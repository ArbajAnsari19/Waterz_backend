import { IBooking } from "../models/Booking";
import Yacht, {IYacht} from "../models/Yacht";
import Booking, {BookingAgent,IBookingAgent} from "../models/Booking";
import Owner from "../models/User";
import User,{ Agent } from "../models/User";
import Razorpay from "razorpay";
import { TRIP_COMBINATIONS } from "../utils/trip";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || (() => { throw new Error("RAZORPAY_KEY_ID is not defined"); })(),
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

class BookingService {

  static async createBooking(BookingDetails: Partial<IBooking>): Promise<{booking: IBooking, orderId: string }> {
    try {
      const { startDate, startTime, duration, location, tripType, timeOption, PeopleNo, sailingTime, anchorage, specialEvent, specialRequest, user, yacht } = BookingDetails;
      const yachtDetails = await Yacht.findById(yacht);
      if (!yachtDetails) throw new Error("Yacht not found");
  
      const tripCombination = TRIP_COMBINATIONS.find(t => t.id === tripType);
      if (!tripCombination) throw new Error("Invalid trip type");
  
      const selectedTime = tripCombination.options[timeOption || 0];
      if (!selectedTime) throw new Error("Invalid time option");
  
      const startDateTime = new Date(startDate!);
      const totalDuration = selectedTime.sailing + selectedTime.anchorage;
      const endDateTime = new Date(startDateTime.getTime() + totalDuration * 60 * 60 * 1000);

      // Ensure PeopleNo <= capacity

      if (PeopleNo && PeopleNo > yachtDetails.capacity) {
        throw new Error("Number of people exceeds yacht capacity");
      }

      // Check for overlapping bookings
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

      // Calculate the total amount
      const sailingCharge = yachtDetails.price.sailing * selectedTime.sailing;
      const stillCharge = yachtDetails.price.still * selectedTime.anchorage;
      const totalAmount = sailingCharge + stillCharge;
      // In BookingService.createBooking
        const booking = new Booking({
          ...BookingDetails,
          user,
          yacht,
          tripType,
          timeOption,
          bookingDateTime: new Date(),
          location,
          duration,
          startDate: startDateTime,
          startTime: startDateTime,
          endDate: endDateTime,
          sailingTime: selectedTime.sailing,
          anchorage: selectedTime.anchorage,
          rideStatus: 'pending',  // Ensure this is explicitly set
          capacity: yachtDetails.capacity,
          PeopleNo,
          specialEvent,
          specialRequest,
          totalAmount,
          services: BookingDetails.services || [],
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

  static async searchIdealYachts(searchParams: Partial<IBooking>): Promise<IYacht[]> {
    try {
      const { startDate, startTime, duration, location, YachtType, capacity } = searchParams;

      // Validate inputs
      if (!startDate || !startTime || !duration) {
        throw new Error("Start date, time and duration are required");
      }

      // Calculate end date and time
      const startDateTime = new Date(`${startDate}T${startTime}`);
      if (duration === undefined) {
        throw new Error("Duration is required");
      }
      const BUFFER_TIME = 30 * 60 * 1000; // 30 min buffer
      const endDateTime = new Date(startDateTime.getTime() + (duration * 60 * 60 * 1000) + BUFFER_TIME);

      // Find yachts that match the search criteria
      const yachts = await Yacht.find({
        location,
        type: YachtType,
        capacity: { $gte: capacity }
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

  static async createAgentBooking(BookingDetails: Partial<IBookingAgent>): Promise<{booking: IBookingAgent, orderId: string }> {
    try {
      const { startDate, startTime, duration, location, PeopleNo, sailingTime, anchorage, specialEvent, specialRequest, user, yachts, noOfYatchs, customerEmail, customerName, customerPhone} = BookingDetails;
      // Check if the yachts exists and get its details
      if (!yachts) {
        throw new Error("Yachts are required");
      }
      const yachtDetails = await Promise.all(
        yachts.map(async (yachtId) => {
          const yacht = await Yacht.findById(yachtId);
          if (!yacht) throw new Error(`Yacht ${yachtId} not found`);
          return yacht;
        })
      );

    // 2. Check total capacity
    const totalCapacity = yachtDetails.reduce((sum, yacht) => sum + yacht.capacity, 0);
    if (PeopleNo && PeopleNo > totalCapacity) {
      throw new Error("Number of people exceeds total yachts capacity");
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    if (!duration) throw new Error("Duration is required");
    const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 60 * 1000);

    await Promise.all(
      yachtDetails.map(async (yacht) => {
        const overlappingBookings = await Booking.find({
          yacht: yacht._id,
          status: 'confirmed',
          $or: [
            { startDate: { $lt: endDateTime }, endDate: { $gt: startDateTime } },
            { startDate: { $gte: startDateTime, $lt: endDateTime } },
            { endDate: { $gt: startDateTime, $lte: endDateTime } }
          ]
        });

        if (overlappingBookings.length > 0) {
          throw new Error(`Yacht ${yacht.name} is not available for selected time`);
        }
      })
    );
      

    // 4. Calculate total amount with agent discount
    const agent = await Agent.findById(user);
    const agentDiscount = agent?.discount ?? 0;

    const totalAmount = yachtDetails.reduce((sum, yacht) => {
      //@ts-ignore
      const sailingCharge = yacht.price.sailing * sailingTime;
      //@ts-ignore
      const stillCharge = yacht.price.still * anchorage;
      return sum + sailingCharge + stillCharge;
    }, 0);

    const discountedAmount = totalAmount - (totalAmount * agentDiscount / 100);

      // In BookingService.createBooking
      const bookingAgent = new BookingAgent({
        ...BookingDetails,
        user,
        yachts, // Array of yacht IDs
        bookingDateTime: new Date(),
        location,
        duration,
        startDate: startDateTime,
        startTime: startDateTime,
        endDate: endDateTime,
        sailingTime,
        anchorage,
        rideStatus: 'pending',
        capacity: totalCapacity,
        PeopleNo,
        specialEvent,
        specialRequest,
        totalAmount: discountedAmount,
        customerEmail,
        customerName,
        customerPhone,
        noOfYatchs,
        services: BookingDetails.services || [],
        paymentStatus: 'pending',
        status: 'confirmed',
        calendarSync: false
      });

      const options = {
        amount: discountedAmount * 100, 
        currency: "INR",
        //@ts-ignore
        receipt: booking._id.toString(),
      };
      const order = await razorpay.orders.create(options);
      bookingAgent.razorpayOrderId = order.id;
      await bookingAgent.save();

      // Update all owners
      const ownerUpdates = yachtDetails.map(yacht => 
        Owner.findByIdAndUpdate(yacht.owner, { $push: { bookings: bookingAgent._id } })
      );
      await Promise.all(ownerUpdates);

    // Update user
      await User.findByIdAndUpdate(user, { $push: { bookings: bookingAgent._id } });

    return { booking: bookingAgent, orderId: order.id };


    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

}

export default BookingService;