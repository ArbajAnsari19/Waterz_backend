import { Request, Response } from 'express';
import UserService from '../services/userServices';
import jwt from 'jsonwebtoken';


export class AuthController {
  static async signUpUser(req: Request, res: Response): Promise<void> {
    try {
      const { token } = await UserService.createUser(req.body);
      res.status(201).json({
        message: "Signup successful! Please verify your email with the OTP sent.",
        redirect: 'verify-otp',
        token,
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async signUpOwner(req: Request, res: Response): Promise<void> {
    try {
      const { token } = await UserService.createOwner(req.body);
      res.status(201).json({
        message: "Signup successful! Please verify your email with the OTP sent.",
        redirect: 'verify-otp',
        token,
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async signUpAgent(req: Request, res: Response): Promise<void> {
    try {
      const referralCode = req.params.referralCode;
      const { token } = await UserService.createAgent(req.body,referralCode);
      res.status(201).json({
        message: "Signup successful! Please verify your email with the OTP sent.",
        redirect: 'verify-otp',
        token,
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async signUpSuperAgent(req: Request, res: Response): Promise<void> {
    try {
      const { token } = await UserService.createSuperAgent(req.body);
      res.status(201).json({
        message: "Signup successful! Please verify your email with the OTP sent.",
        redirect: 'verify-otp',
        token,
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async signUpAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { token } = await UserService.createAdmin(req.body);
      res.status(201).json({
        message: "Signup successful! Please verify your email with the OTP sent.",
        redirect: 'verify-otp',
        token,
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }
  static async signIn(req: Request, res: Response): Promise<void> {
    try {
      console.log(req.body);
      const result = await UserService.validatePassword(req.body.email, req.body.password, req.body.role);
      if (result) {
        const { token, user } = result;
        if (user.redirect) {
          res.status(200).json({
            message: "OTP not verified. Redirecting to OTP verification.",
            redirect: 'verify-otp',
            token,
        });
        } else {
          res.status(200).json({ message: "Authentication successful", token, user });
        }
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const result = await UserService.forgotPassword(email);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { newPassword } = req.body;
      const userId = req.currentUser?.id!;     
      const result = await UserService.resetPassword(userId,newPassword);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async generateOTP(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.currentUser?.id!;
      await UserService.generateOTP(userId);
      res.status(201).json({ message: 'OTP sent successfully' });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async verifyOTP(req: Request, res: Response): Promise<void> {
    try {
      const { otp, token, role } = req.body;
      // console.log("role", role)
      const decoded = jwt.verify(token, process.env.OTP_JWT_SECRET as string) as { id: string };
      // console.log("decoded", decoded)
      const verified = await UserService.verifyOTP(decoded.id, otp, role);
      // console.log("verified", verified)
      if (verified) {
        const user = await UserService.findUserById(decoded.id,role);
        // console.log("user", user)
        const authToken = UserService.generateToken(decoded.id, user!.email, user!.role);
        res.status(200).json({ 
          message: 'OTP verified successfully',
          token: authToken 
        });
      } else {
        res.status(400).json({ message: 'Invalid or expired OTP' });
      }
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }
}
