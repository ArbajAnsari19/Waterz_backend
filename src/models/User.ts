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
  isVerifiedByAdmin: 'accepted' | 'requested' | 'denied';
  commissionRate?: number;
  superAgent?: IUser | string | null;
}

export interface ISuperAgent extends IAgent {
  agents: mongoose.Types.ObjectId[] | IAgent[];
  referralCode: string;
}

export interface IAdmin {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'admin' | 'owner' | 'agent' | 'super-agent';
  otp?: string;
  otpExpiresAt?: Date;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  // Existing fields
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
  isVerifiedByAdmin: { type: String, enum: ["accepted", "requested", "denied"], required: true },
  commissionRate: { type: Number, required: false }, 
  superAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now },
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
  // New fields from IAgent interface
  username: { type: String, unique: true, required: false },
  age: { type: Number, required: false },
  experience: { type: Number, required: false },
  address: { type: String, required: false },
  accountHolderName: { type: String, required: false },
  accountNumber: { type: String, required: false },
  bankName: { type: String, required: false },
  ifscCode: { type: String, required: false },
  imgUrl: { type: String, required: false }
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
  agents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }], // Managed Agents
  createdAt: { type: Date, default: Date.now },
});

const adminSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    otp: { type: String, required: false },
    role: { 
      type: String, 
      enum: ['customer', 'owner', 'agent', 'super-agent', 'admin'],
      required: true 
    },
    otpExpiresAt: { type: Date, required: false },
    isVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});



// Create the models
const User = mongoose.model<IUser>('User', userSchema);
const Owner = mongoose.model<IOwner>('Owner', ownerSchema);
const Agent = mongoose.model<IAgent>('Agent', agentSchema);
const SuperAgent = mongoose.model<ISuperAgent>('SuperAgent', superAgentSchema);
const Admin = mongoose.model<IAdmin>('Admin', adminSchema);

export { Agent, Owner, SuperAgent , Admin};
export default User;

