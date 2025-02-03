import mongoose from 'mongoose';
import { IYacht } from './Yacht';
import { IBooking } from './Booking';


export interface IUser {
  name: string;
  email: string;
  password: string;
  role: 'customer' | 'owner' | 'agent' | 'super-agent';
  phone: string;
  otp?: string;
  otpExpiresAt?: Date;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date; 
  bookings?: mongoose.Types.ObjectId[] | IBooking[];
}

export interface IOwner extends IUser{
  yachts: mongoose.Types.ObjectId[] | IYacht[];
}

export interface IAgent extends IUser {
  commissionRate?: number;
  discount?: number;
  superAgent?: IUser | string | null;
}

export interface ISuperAgent extends IAgent {
  agents: mongoose.Types.ObjectId[] | IAgent[];
  referralsCode: string;
}

export interface IAdmin {
  user: IUser | string;
}



const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['customer', 'owner', 'agent', 'super-agent', 'admin'],
    required: true 
  },
  phone: { type: String, required: true },
  otp: { type: String, required: false },
  otpExpiresAt: { type: Date, required: false },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }]
}, { timestamps: true });


const ownerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['customer', 'owner', 'agent', 'super-agent', 'admin'],
    required: true 
  },
  phone: { type: String, required: true },
  otp: { type: String, required: false },
  otpExpiresAt: { type: Date, required: false },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  yachts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Yacht' }],
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }]
}, { timestamps: true });


const agentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['customer', 'owner', 'agent', 'super-agent', 'admin'],
    required: true 
  },
  discount: { type: Number, required: false }, // Discount in percentage
  phone: { type: String, required: true },
  otp: { type: String, required: false },
  otpExpiresAt: { type: Date, required: false },
  isVerified: { type: Boolean, default: false },
  commissionRate: { type: Number, required: false }, // Commission in percentage
  superAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Managed by SuperAgent
  createdAt: { type: Date, default: Date.now },
});

const superAgentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['customer', 'owner', 'agent', 'super-agent', 'admin'],
    required: true 
  },
  phone: { type: String, required: true },
  otp: { type: String, required: false },
  otpExpiresAt: { type: Date, required: false },
  isVerified: { type: Boolean, default: false },
  referralCode : { type: String, required: true },
  commissionRate: { type: Number, required: false }, // Commission in percentage
  agents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Managed Agents
  createdAt: { type: Date, default: Date.now },
});

const adminSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});



// Create the models
const User = mongoose.model<IUser>('User', userSchema);
const Owner = mongoose.model<IOwner>('Owner', ownerSchema);
const Agent = mongoose.model<IAgent>('Agent', agentSchema);
const SuperAgent = mongoose.model<ISuperAgent>('SuperAgent', superAgentSchema);
const Admin = mongoose.model<IAdmin>('Admin', adminSchema);

export { Agent, Owner, SuperAgent , Admin};
export default User;

