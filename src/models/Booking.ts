import mongoose from "mongoose";

export interface IBooking extends mongoose.Document {
  user: string;
  yacht: string;
  agent?: string;
  bookingDateTime?: Date;
  location: string;
  tripType: string; 
  timeOption: number;  
  duration: number;
  startDate: Date;
  startTime: Date;
  endDate: Date;
  sailingTime: number;
  anchorage: number;
  YachtType: string;
  capacity: number;
  PeopleNo: number;
  specialEvent: string;
  specialRequest: string;
  totalAmount: number;
  services: string[];
  rideStatus: string;
  paymentStatus: string;
  razorpayOrderId?: string;
  status: string;
  calendarSync: boolean;
}

export interface IBookingAgent extends Omit<IBooking, 'yacht'> {
  yachts: string[];  
  noOfYatchs: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  yacht: { type: mongoose.Schema.Types.ObjectId, ref: 'Yacht', required: true },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null }, // Optional agent
  bookingDate: { type: Date, required: false },
  location: { type: String, required: true },
  tripType: { type: String, required: true },
  timeOption: { type: Number, required: true },
  duration: { type: Number, required: true },
  startDate: { type: Date, required: true },
  startTime: { type: Date, required: true },
  endDate: { type: Date, required: true },
  sailingTime: { type: Number, required: true },
  anchorage: { type: Number, required: true },
  YachtType: { type: String, required: false },
  capacity: { type: Number, required: true },
  razorpayOrderId: { type: String, required: true },
  PeopleNo: { type: Number, required: true },
  specialEvent: { type: String, required: true },
  specialRequest: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  services: { type: [String], required: true },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'completed', 'failed'], 
    default: 'pending' 
  },
  status: { 
    type: String, 
    enum: ['confirmed', 'canceled', 'completed'], 
    default: 'confirmed' 
  },
  rideStatus: { 
    type: String, 
    enum: ['pending', 'completed'], 
    default: 'pending'
  },
  calendarSync: { type: Boolean, default: false }, // To sync with external calendars
}, { timestamps: true });

const bookingAgentSchema = new mongoose.Schema({
  ...Object.fromEntries(Object.entries(bookingSchema.obj).filter(([key]) => key !== 'yacht')),
  yachts: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Yacht' }], required: true },
  noOfYatchs: { type: Number, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String, required: true }
});

const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
const BookingAgent = mongoose.model<IBookingAgent>('BookingAgent', bookingAgentSchema);
export { BookingAgent };
export default Booking;