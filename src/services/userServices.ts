import  User, {  Agent, IAgent, IOwner, IUser, Owner, IAdmin, ISuperAgent,SuperAgent, Admin  }  from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import EmailService from "./emailService";
import dotenv from "dotenv";
import {findRoleById} from "../utils/role";
import Yacht, { IYacht } from "../models/Yacht";
import Booking, {IBooking} from "../models/Booking"; 
import { EarningFilter } from "../controllers/userController";
import {AdminFilter,ApprovedDetails,AgentFilterBooking,AgentCustomerFilter} from "../controllers/userController";

dotenv.config();
const OTP_JWT_SECRET = process.env.OTP_JWT_SECRET as string;

export interface IUserAuthInfo {
  user: IUser | IAdmin;
  token: string;
}

export interface Filter {
  status: "pending" | "completed"
  agentWise: "All" | string
}
interface AgentWithBookings {
  agent: IAgent | null;
  totalBookings: number;
}

class UserprofileService{

// customer
  static async meCustomer(userId: string): Promise<IBooking[] | null> {
    try {
      return await User.findById(userId);
    } catch (error) {
      throw new Error("Error getting user: " + (error as Error).message);
    }
  }

  static async customerCurrentRides(userId: string): Promise<IBooking[] | null> {
    try {
      const bookings = await Booking.find({ user: userId, rideStatus: 'pending' });
      return bookings;
    } catch (error) {
      throw new Error("Error getting previous rides: " + (error as Error).message);
    }
  }

  static async customerPrevRides(userId: string): Promise<IBooking[] | null> {
    try {
      const bookings = await Booking.find({ user: userId, rideStatus: 'completed' });
      return bookings;
    } catch (error) {
      throw new Error("Error getting previous rides: " + (error as Error).message);
    }
  }

  static async customerPrevRidesId(userId: string, bookingId: string): Promise<IBooking | null> {
    try {
      const booking = await Booking.findOne({ _id: bookingId, user: userId });
      return booking;
    } catch (error) {
      throw new Error("Error getting user: " + (error as Error).message);
    }
  }

  // owner
  static async meOwner(userId: string): Promise<IUser | null> {
    try {
      return await Owner.findById(userId);
    } catch (error) {
      throw new Error("Error getting user: " + (error as Error).message);
    }
  }

  static async ownerCurrentRides(userId: string): Promise<IBooking[] | null> {
    try {
      console.log("Searching for owner ID:", userId);
  
      // Get owner's yachts with explicit select
      const ownerYachts = await Yacht.find({ owner: userId });
      console.log("Owner's yachts found:", ownerYachts.map(y => y._id));
  
      if (ownerYachts.length === 0) {
        console.log("No yachts found for owner:", userId);
        return [];
      }
  
      const yachtIds = ownerYachts.map(yacht => yacht._id);
  
      // Modified query with full debug logging
      const bookings = await Booking.find({ 
        yacht: { $in: yachtIds },
        status: 'confirmed',  // First check the booking is confirmed
        $or: [
          { rideStatus: 'pending' },
          { rideStatus: { $exists: false } }  // Also check for bookings without rideStatus
        ]
      }).populate({
        path: 'yacht',
        populate: {
          path: 'owner'
        }
      }).populate('user');
  
      console.log("Query parameters:", {
        yachtIds,
        ownerUserId: userId
      });
      
      console.log("Found bookings:", 
        bookings.map(b => ({
          id: b._id,
          yachtId: b.yacht,
          status: b.status,
          rideStatus: b.rideStatus
        }))
      );
  
      return bookings;
    } catch (error) {
      console.error("Error in ownerCurrentRides:", error);
      throw new Error("Error getting current rides: " + (error as Error).message);
    }
  }

  static async ownerPrevRides(userId: string): Promise<IBooking[] | null> {
    try {
      // First, get all yachts owned by this owner
      const ownerYachts = await Yacht.find({ owner: userId });
      const yachtIds = ownerYachts.map(yacht => yacht._id);
      
      // Then find all completed bookings for these yachts
      const bookings = await Booking.find({ 
        yacht: { $in: yachtIds },
        rideStatus: 'completed'
      }).populate('yacht user'); // Optionally populate yacht and user details
      
      return bookings;
    } catch (error) {
      throw new Error("Error getting previous rides: " + (error as Error).message);
    }
  }

  static async ownerPrevRidesId(userId: string, bookingId: string): Promise<IBooking | null> {
    try {
        const booking = await Booking.findOne({ 
        _id: bookingId,
        owner : userId,
      })
      return booking;
    } catch (error) {
      throw new Error("Error getting previous ride: " + (error as Error).message);
    }
  }

  // agent
  static async meAgent(userId: string): Promise<IUser | null> {
    try {
      return await Agent.findById(userId);
    } catch (error) {
      throw new Error("Error getting user: " + (error as Error).message);
    }

  }

  static async agentCurrentRides(userId: string): Promise<IBooking[] | null> {
    try {
      const bookings = await Booking.find({ user: userId, rideStatus: 'pending' });
      return bookings;
    } catch (error) {
      throw new Error("Error getting current rides: " + (error as Error).message);
    }
  }

  static async agentPrevRides(userId: string): Promise<IBooking[] | null> {
    try {
      const bookings = await Booking.find({ user: userId, rideStatus: 'completed' });
      return bookings;
    } catch (error) {
      throw new Error("Error getting previous rides: " + (error as Error).message);
    }
  }
  
  // superAgent
  static async meSuperAgent(userId: string): Promise<IUser | null> {
    try {
      return await SuperAgent.findById(userId);
    } catch (error) {
      throw new Error("Error getting user: " + (error as Error).message);
    }
  }

  static async createRefferal(userId: string): Promise<string> {
    try {
      // Find superagent by ID
      const superAgent = await SuperAgent.findById(userId) 
      if (!superAgent) {
        throw new Error("Agent not found");
      }
  
      // Generate unique referral code if not exists
      if (!superAgent.referralCode) {
        const referralCode = `${superAgent.name.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 8)}`;
        superAgent.referralCode = referralCode;
        await superAgent.save();
      }
  
      // Generate full referral URL
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const referralUrl = `${baseUrl}/register?ref=${superAgent.referralCode}`;
  
      return referralUrl;
  
    } catch (error) {
      throw new Error(`Error creating referral: ${(error as Error).message}`);
    }
  }

  static async listAllAgent(userId: string): Promise<IAgent[] | null> {
    try {
      const agents = await Agent.find({ superAgent: userId });
      return agents;
    } catch (error) {
      throw new Error("Error getting agents: " + (error as Error).message);
    }
  }

  static async agentDetail(userId: string): Promise<AgentWithBookings | null> {
    try {
      // Get agent details
      const agent = await Agent.findById(userId);
      // Get bookings count for this agent
      const bookings = await Booking.find({ agentId: userId });
      const totalBookings = bookings.length;
      // Return combined response
      return {
        agent,
        totalBookings
      };
    } catch (error) {
      throw new Error("Error getting user: " + (error as Error).message);
    }
  }
  static async paymentDetail(userId: string): Promise<IUser | null> {
    try {
      return await User.findById(userId);
    } catch (error) {
      throw new Error("Error getting user: " + (error as Error).message);
    }
  }

  static async deleteAgent(agentId: string): Promise<IAgent | null> {
    try {
      return await Agent.findByIdAndDelete(agentId);
    } catch (error) {
      throw new Error("Error deleting agent: " + (error as Error).message);
    }
  }

  static async listFilteredAgent(userId: string, filter: Filter): Promise<IBooking[]> {
    try {
      // Debug logging
      console.log('SuperAgent ID:', userId);
      console.log('Filter:', filter);

      // Set default values if not provided
      const filterWithDefaults = {
        status: filter.status || "completed",
        agentWise: filter.agentWise || "All"
      };
      // 1. Get all agents under this superAgent
      const agents = await Agent.find({ superAgent: userId });
      
      if (agents.length === 0) {
        console.log('No agents found for superAgent:', userId);
        return [];
      }

      // 2. Build base query
      let query: any = {};

      // 3. Apply agent filter with fixed comparison
      if (filterWithDefaults.agentWise === "All") {
        query.agentId = { $in: agents.map(agent => agent._id) };
      } else {
        const agentExists = agents.some(agent => 
          agent._id.toString() === filterWithDefaults.agentWise.toString()
        );
        
        console.log('Agent exists check:', agentExists);
        if (!agentExists) {
          throw new Error('Selected agent does not belong to this superAgent');
        }
        query.agentId = filterWithDefaults.agentWise;
      }

      // 4. Apply status filter
      query.rideStatus = filterWithDefaults.status;


      // Debug: Log final query
      console.log('Final query:', JSON.stringify(query));

      const bookings = await Booking.find(query)
        .sort({ createdAt: -1 })
        .populate('agentId');

      return bookings;

    } catch (error) {
      console.error("Error in listFilteredAgent:", error);
      throw error;
    }
  } 

  static async listFilteredEarnings(userId: string, filter: EarningFilter): Promise<any> {
    try {
      // 1. Get date range based on timeframe
      const getDateRange = (timeframe: string) => {
        const now = new Date();
        switch (timeframe) {
          case 'today':
            return {
              start: new Date(now.setHours(0, 0, 0, 0)),
              end: new Date(now.setHours(23, 59, 59, 999))
            };
          case 'last_week':
            const lastWeek = new Date(now.setDate(now.getDate() - 7));
            return {
              start: lastWeek,
              end: now
            };
          case 'last_month':
            const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
            return {
              start: lastMonth,
              end: now
            };
          default:
            return {
              start: new Date(0),
              end: now
            };
        }
      };
  
      // 2. Build query
      const { start, end } = getDateRange(filter.timeframe);
      const query: any = {
        createdAt: { $gte: start, $lte: end },
        paymentStatus: 'completed'
      };
  
      // 3. Get agents under superAgent
      const agents = await Agent.find({ superAgent: userId });
      if (!agents.length) return [];
  
      // 4. Filter by specific agent if provided
      if (filter.agentWise !== 'All') {
        const agentExists = agents.some(agent => 
          agent._id.toString() === filter.agentWise
        );
        if (!agentExists) {
          throw new Error('Invalid agent selection');
        }
        query.user = filter.agentWise;
      } else {
        query.user = { $in: agents.map(agent => agent._id) };
      }
  
      // 5. Get bookings and calculate earnings
      const bookings = await Booking.find(query)
        .sort({ createdAt: -1 });
  
      // 6. Calculate earnings
      const earnings = bookings.map(booking => {
        const agent = agents.find(a => a._id.toString() === booking.user?.toString());
        const commissionRate = agent?.commissionRate || 0;
        const earningAmount = (booking.totalAmount * commissionRate) / 100;
  
        return {
          bookingId: booking._id,
          date: booking.createdAt,
          yachtName: booking.yacht,
          totalAmount: booking.totalAmount,
          commissionRate,
          earningAmount,
          agentName: agent?.name,
          customerName: booking.customerName,
          status: booking.status
        };
      });
  
      return earnings;
  
    } catch (error) {
      console.error("Error in listFilteredEarnings:", error);
      throw error;
    }
  }

}

class UserService {
  
  static async createUser(userData:IUser | IOwner | IAgent): Promise<IUserAuthInfo> {
    try {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error("User already exists");
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const user = new User({
        ...userData,
        password: hashedPassword,
        otp,
        otpExpiresAt,
        isVerified: false,
      });
      const savedUser = await user.save();
      await this.sendOTPEmail(savedUser.email, otp);
      const token = this.generateOtpToken(savedUser._id.toString(), savedUser.email);
      return { user: savedUser.toObject(), token };
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  static async createOwner(userData:IOwner): Promise<IUserAuthInfo> {
    try {
      console.log("before creating owner, here is useerData", userData);
      const existingUser = await Owner.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error("Owner already exists");
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const user = new Owner({
        ...userData,
        password: hashedPassword,
        otp,
        otpExpiresAt,
        isVerified: false,
        yachts: [],
      });
      console.log("before creating owner and before saving owner");
      const savedUser = await user.save();
      console.log("after creating owner and before saving owner");
      await this.sendOTPEmail(savedUser.email, otp);
      const token = this.generateOtpToken(savedUser._id.toString(), savedUser.email);
      return { user: savedUser.toObject(), token };
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  static async createAgent(userData:IAgent, referralCode?:string): Promise<IUserAuthInfo> {
    try {
    // Check existing user
    const existingUser = await Agent.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error("Agent already exists");
    }
    let superAgentId = null;
    if (referralCode) {
      // Find and validate superAgent
      const superagent = await SuperAgent.findOne({ referralCode: referralCode });
      if (!superagent) {
        throw new Error("Invalid referral code");
      }
      superAgentId = superagent._id;
    }
    console.log("Super agent id is here : ", superAgentId);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Create new agent with superAgent reference
    const agent = new Agent({
      ...userData,
      password: hashedPassword,
      otp,
      otpExpiresAt,
      isVerified: false,
      commissionRate: 0,
      ...(superAgentId && { superAgent: superAgentId })
    });
          // Save agent
    console.log("Agent is here : ", agent);
    const savedAgent = await agent.save();

    // Update superAgent's agents array if exists
    if (superAgentId) {
      await SuperAgent.findByIdAndUpdate(
        superAgentId,
        { $push: { agents: savedAgent._id } }
      );
    }
    // Send OTP and generate token
    await this.sendOTPEmail(savedAgent.email, otp);
    const token = this.generateOtpToken(savedAgent._id.toString(), savedAgent.email);

    return { user: savedAgent.toObject(), token };

  } catch (error) {
    throw new Error((error as Error).message);
  }
}

  static async createSuperAgent(userData:ISuperAgent): Promise<IUserAuthInfo> {
    try {
      console.log("userData", userData)
      const existingUser = await SuperAgent.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error("User already exists");
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const referralCode = `${userData.name.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 8)}`;
      console.log("referral code", referralCode)
      const superAgent = new SuperAgent({
        ...userData,
        password: hashedPassword,
        otp,
        referralCode,
        otpExpiresAt,
        isVerified: false,
      });
      console.log("superAgent", superAgent)
      superAgent.referralCode = referralCode;
      const savedUser = await superAgent.save();
      console.log("savedUser", savedUser)

      await this.sendOTPEmail(savedUser.email, otp);
      const token = this.generateOtpToken(savedUser._id.toString(), savedUser.email);
      return { user: savedUser.toObject(), token };
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  static async createAdmin(userData:IAdmin): Promise<IUserAuthInfo> {
    try {
      const existingUser = await Admin.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error("User already exists");
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const user = new Admin({
        ...userData,
        password: hashedPassword,
        otp,
        otpExpiresAt,
        isVerified: false,
      });
      const savedUser = await user.save();
      await this.sendOTPEmail(savedUser.email, otp);
      const token = this.generateOtpToken(savedUser._id.toString(), savedUser.email);
      return { user: savedUser.toObject(), token };
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }
  
  static async validatePassword(email: string, password: string, role :string): Promise<{ token: string; user: any } | null> {
    try {
      const Role = findRoleById(role);
      const user = await (Role as typeof User).findOne({ email });
      if (!user) {
        return null;
      }

      if (!user.isVerified) {
        await this.generateOTP(user._id.toString());
        const token = this.generateOtpToken(user._id.toString(), user.email);
        return { token, user: { email: user.email, redirect: 'verify-otp' } };
      }

      if (user && (await bcrypt.compare(password, user.password))) {
        const token = this.generateToken(user._id.toString(), user.email, user.role);
        const reducedUser = {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
        return { token, user: reducedUser };
      }
      return null;
    } catch (error) {
      throw new Error("Error validating password: " + (error as Error).message);
    }
  }

  static generateToken(userId: string, email: string, role: string ): string {
    const payload = { id: userId, email, role };
    try {
      return jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: "3d",
      });
    } catch (error) {
      throw new Error("Error generating token: " + (error as Error).message);
    }
  }

  static generateOtpToken(userId: string, email: string): string {
    const payload = { id: userId, email };
    try {
      return jwt.sign(payload, OTP_JWT_SECRET, {
        expiresIn: "15m",
      });
    } catch (error) {
      throw new Error("Error generating OTP token: " + (error as Error).message);
    }
  }

  static async findUserById(userId: string,role:string): Promise<IUser | null> {
    try {
      const Role = findRoleById(role);
      return await (Role as typeof User || Role as typeof Owner || Role as typeof Agent ).findById(userId);
    } catch (error) {
      throw new Error("Error finding user by ID: " + (error as Error).message);
    }
  }

  static async updateUser(userId: string, userData: Partial<IUser>): Promise<IUser | null> {
    try {
      return await User.findByIdAndUpdate(userId, userData, { new: true });
    } catch (error) {
      throw new Error("Error updating user: " + (error as Error).message);
    }
  }

  static async deleteUser(userId: string): Promise<IUser | null> {
    try {
      return await User.findByIdAndDelete(userId);
    } catch (error) {
      throw new Error("Error deleting user: " + (error as Error).message);
    }
  }

  static async listUsers(): Promise<IUser[]> {
    try {
      return await User.find();
    } catch (error) {
      throw new Error("Error listing users: " + (error as Error).message);
    }
  }

  static async generateOTP(userId: string): Promise<{ message: string }> {
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const user = await User.findByIdAndUpdate(userId, { otp, otpExpiresAt }, { new: true });

      if (user) {
        await this.sendOTPEmail(user.email, otp);
        return { message: "OTP sent successfully." };
      } else {
        throw new Error("User not found.");
      }
    } catch (error) {
      throw new Error("Error generating OTP: " + (error as Error).message);
    }
  }

  static async verifyOTP(userId: string, otp: string,role:string): Promise<{ message: string }> {
    try {
      const Role = findRoleById(role);
      console.log("role is here : ", Role);
      const user = await (Role as typeof User ||  Role as typeof Owner || Role as typeof Agent ).findById(userId);
      console.log("User is here : ", user);
      if (user && user.otp === otp && user.otpExpiresAt && user.otpExpiresAt > new Date()) {
        await (Role as typeof User ||  Role as typeof Owner || Role as typeof Agent ).findByIdAndUpdate(userId, { isVerified: true, otp: null, otpExpiresAt: null });
        return { message: 'OTP verified successfully' };
      }
      throw new Error('Invalid or expired OTP');
    } catch (error) {
      throw new Error("Error verifying OTP: " + (error as Error).message);
    }
  }

  static async sendOTPEmail(email: string, otp: string): Promise<void> {
    try {
      const options = {
        subjectLine: 'Your OTP Code',
        contentBody: `Your OTP code is ${otp}. It will expire in 15 minutes.`,
      };

      await EmailService.send(email, options);
    } catch (error) {
      throw new Error("Error sending OTP email: " + (error as Error).message);
    }
  }

  static async forgotPassword(email: string): Promise<{ message: string, token: string }> {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error("User with this email does not exist.");
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await User.findByIdAndUpdate(user._id, { otp, otpExpiresAt });

      await this.sendOTPEmail(user.email, otp);

      const token = this.generateOtpToken(user._id.toString(), user.email);
      return { message: 'OTP sent for password reset', token };
    } catch (error) {
      throw new Error("Error in forgot password process: " + (error as Error).message);
    }
  }

  static async resetPassword(userId: string, newPassword: string): Promise<{ message: string }> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await User.findByIdAndUpdate(userId, { password: hashedPassword, otp: null, otpExpiresAt: null });
      return { message: 'Password reset successfully' };
    } catch (error) {
      throw new Error("Error resetting password: " + (error as Error).message);
    }
  }

  static async addYachtToOwner(ownerId: string, yachtId: string): Promise<void> {
    try {
      await Owner.findByIdAndUpdate(ownerId, { $push: { yachts: yachtId } });
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }
}

class AdminService {

  static async getAllYatchs(): Promise<IUser[]> {
    try {
      return await Yacht.find();
    } catch (error) {
      throw new Error("Error listing users: " + (error as Error).message);
    }
  }

   static async getAllOwners(): Promise<IOwner[]> {
    try {
      return await Owner.find();
    } catch (error) {
      throw new Error("Error listing owners: " + (error as Error).message);
    }
  }

  static async getAllCustomers(): Promise<IUser[]> {
    try {
      return await User.find();
    } catch (error) {
      throw new Error("Error listing customers: " + (error as Error).message);
    }
  }

  static async getAllBookings(): Promise<IBooking[]> {
    try {
      return await Booking.find();
    } catch (error) {
      throw new Error("Error listing bookings: " + (error as Error).message);
    }
  }

  static async getAllQueries(): Promise<IUser[]> {
    try {
      return await User.find();
    } catch (error) {
      throw new Error("Error listing queries: " + (error as Error).message);
    }
  }

  static async getAllPayments(): Promise<IUser[]> {
    try {
      return await User.find();
    } catch (error) {
      throw new Error("Error listing payments: " + (error as Error).message);
    }
  }

  static async getAllSuperAgents(): Promise<IUser[]> {
    try {
      return await User.find();
    } catch (error) {
      throw new Error("Error listing super agents: " + (error as Error).message);
    }
  }

  static async getAllAgents(): Promise<IUser[]> {
    try {
      return await User.find();
    } catch (error) {
      throw new Error("Error listing agents: " + (error as Error).message);
    }
  }

  static async getAllAdmins(): Promise<IAdmin[]> {
    try {
      return await Admin.find();
    } catch (error) {
      throw new Error("Error listing admins: " + (error as Error).message);
    }
  }

  static async getAdminById(adminId: string): Promise<IAdmin | null> {
    try {
      return await Admin.findById(adminId);
    } catch (error) {
      throw new Error("Error getting admin: " + (error as Error).message);
    }
  }

  static async getYatchsOwner(YatchId: string): Promise<IOwner | null> {
    try {
      const YachtDetail  = await Yacht.findById(YatchId);
      if (!YachtDetail) {
        throw new Error("Yacht not found");
      }
      const OwnerDetail = await Owner.findById(YachtDetail.owner);
      return OwnerDetail;
    } catch (error) {
      throw new Error("Error getting owner: " + (error as Error).message);
    }
  }

  static async getAllBookingByOwner(ownerId: string): Promise<IBooking[]> {
    try {
      const bookings = await Booking.find({ owner: ownerId });
      return bookings;
    } catch (error) {
      throw new Error("Error getting bookings: " + (error as Error).message);
    }
  }

  static async filterYatchs(filter: AdminFilter): Promise<IYacht[]> {
    try {
      const { status, searchName } = filter;
      let query: any = {};
  
      console.log('Received filters:', { status, searchName });
  
      // Apply status filter
      switch(status) {
        case "all":
          // No filter needed for "All"
          break;
        case "recent":
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          query.createdAt = { $gte: sevenDaysAgo };
          break;
        case "requested":
          query.isVerifiedByAdmin = { $in: [true, false] };
          break;
        default:
          throw new Error(`Invalid status filter: ${status}`);
      }
  
      // Apply name search if provided and not empty
      if (searchName && searchName.trim()) {
        query.name = { $regex: searchName.trim(), $options: 'i' };
      }
  
      console.log('Final query:', JSON.stringify(query));
  
      const yachts = await Yacht.find(query)
        .sort({ createdAt: -1 })
  
      return yachts;
  
    } catch (error) {
      console.error("Error in filterYatchs:", error);
      throw error;
    }
  }

  static async yatchRequestDetails(yatchId: string): Promise<IYacht | null> {
    try {
      return await Yacht.findById({yatchId, isVerifiedByAdmin: false});
    } catch (error) {
      throw new Error("Error getting yatch details: " + (error as Error).message);
    }
  }

  static async isApprovedYatch(updateDetails:ApprovedDetails,yatchId: string): Promise<IYacht | null> {
    try {
      const { sailingPeakTimePrice, sailingNonPeakTimePrice, anchoringPeakTimePrice, anchoringNonPeakTimePrice,approved } = updateDetails;
      const yatch = await Yacht.findByIdAndUpdate(yatchId,
        { 
          price: {
            sailing: {
              peakTime: sailingPeakTimePrice,
              nonPeakTime: sailingNonPeakTimePrice
            },
            anchoring: {
              peakTime: anchoringPeakTimePrice,
              nonPeakTime: anchoringNonPeakTimePrice
            }
          },
          isVerifiedByAdmin: approved 
        }, { new: true });
        return yatch;
    }
    catch (error) {
      throw new Error("Error verifying yatch: " + (error as Error).message);
    }
  }

  static async filteredBooking(filter: AgentFilterBooking): Promise<IBooking[]> {
    try {
      const { status, searchName, bookedBy } = filter;
      let query: any = {};
  
      console.log('Received filters:', { status, searchName, bookedBy });
  
      // Apply bookedBy filter
      switch(bookedBy) {
        case "all":
          break;
        case "customer":
          query.isAgentBooking = false;
          break;
        case "agent":
          query.isAgentBooking = true;
          break;
        default:
          throw new Error(`Invalid bookedBy filter: ${bookedBy}`);
      }
  
      // Apply status filter
      switch(status) {
        case "all":
          break;
        case "pending":
          query.rideStatus = 'pending';
          break;
        case "completed":
          query.rideStatus = 'completed';
          break;
        default:
          throw new Error(`Invalid status filter: ${status}`);
      }
  
      // Apply name search if provided and not empty
      if (searchName && searchName.trim()) {
        query.name = { $regex: searchName.trim(), $options: 'i' };
      }
  
      console.log('Final query:', JSON.stringify(query));
  
      const bookings = await Booking.find(query)
        .sort({ createdAt: -1 })
  
      return bookings;
  
    } catch (error) {
      console.error("Error in filterBooking:", error);
      throw error;
    }
  }
  
  static async filterCustomers(filter: AgentCustomerFilter): Promise<void> {
    try{
      const { searchQuery, type } = filter;
      let query: any = {};
      console.log('Received filters:', { searchQuery, type });

      switch(type){
        case "all":
          break;
        case "withBooking":
          const bookings = await User.find({ $gte : { bookings: 1 } });
          break;
        case "withoutBooking":
          query.isAgentBooking = false;
          break;
      }

      if(searchQuery && searchQuery.trim()){
        query.name = { $regex: searchQuery.trim(), $options: 'i' };
      }

  }
    catch(error){
      throw new Error("Error in filterCustomers: " + (error as Error).message);
    }
  }
}
export { UserprofileService, AdminService };
export default UserService;
