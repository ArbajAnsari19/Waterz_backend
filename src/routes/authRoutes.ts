import express from "express";
import { AuthController } from "../controllers/authControllers";
import authenticateToken from "../middleware/authMiddleware";
import passport from "passport";
import jwt from "jsonwebtoken";
import User from "../models/User";

const router = express.Router();

// Regular authentication routes
router.post("/signup/customer", AuthController.signUpUser);
router.post("/signup/owner", AuthController.signUpOwner);
router.post("/signup/agent/:referralCode?", AuthController.signUpAgent);
router.post("/signup/super-agent", AuthController.signUpSuperAgent);
router.post("/signup/admin", AuthController.signUpAdmin);
router.post('/signin', AuthController.signIn);
router.post('/generate-otp', AuthController.generateOTP);
router.post('/verify-otp', AuthController.verifyOTP);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// Google OAuth Routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })
);

// Google callback route with enhanced error handling and role-based redirects
router.get(
  "/google/callback",
  passport.authenticate("google", { 
    failureRedirect: "/auth/google/failed",
    session: false,
  }),
  async (req, res) => {
    try {
      // The user is authenticated and available as req.user
      const user = req.user as any;
      
      // Check if phone number is missing (required field in schema)
      if (!user.phone) {
        // Redirect to a page where they can complete their profile
        // Include user ID so the frontend can update the profile later
        const tempToken = jwt.sign(
          { id: user._id, needsProfileUpdate: true },
          process.env.JWT_SECRET!,
          { expiresIn: "1h" }
        );

        console.log("tempToken", tempToken);        
        // Replace with your frontend URL for profile completion
        // return res.redirect(`${process.env.FRONTEND_URL}/complete-profile?token=${tempToken}`);
        return res.redirect(`http://localhost:5173/complete-profile?token=${tempToken}`);

      }
      
      // Generate regular JWT token
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );
      
      // Determine the redirect URL based on user role
      let redirectUrl = process.env.FRONTEND_URL || 'http://localhost:5173'; // Default
      
      switch (user.role) {
        case 'owner':
          redirectUrl = 'https://www.owner.wavezgoa.com';
          break;
        case 'agent':
          redirectUrl = 'https://www.agent.wavezgoa.com';
          break;
        case 'super-agent':
          redirectUrl = 'https://www.superagent.wavezgoa.com';
          break;
        case 'admin':
          redirectUrl = 'https://www.admin.wavezgoa.com';
          break;
        default:
          redirectUrl = 'http://www.wavezgoa.com'; // Customer
      }
      
      // Redirect with token
      res.redirect(`${redirectUrl}/auth-callback?token=${token}`);
    } catch (error) {
      console.error('Google auth callback error:', error);
      res.redirect('/auth/google/failed');
    }
  }
);

// Failed Google auth route
router.get("/google/failed", (req, res) => {
  res.status(401).json({ success: false, message: "Google authentication failed" });
});

// Logout route
router.get("/logout", (req, res) => {
  req.logout((err: any) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.json({ message: "Logged out successfully" });
  });
});

// Update user profile (useful for Google auth users who need to complete profile)
router.post('/update-profile', authenticateToken, async (req, res): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user?.id;
    const { phone } = req.body;
    
    if (!phone) {
      res.status(400).json({ success: false, message: "Phone number is required" });
      return;
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { phone },
      { new: true }
    );
    
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    
    // Generate a new token after successful profile update
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );
    
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
});

export default router;


// import express from "express";
// import { AuthController } from "../controllers/authControllers";
// import authenticateToken from "../middleware/authMiddleware";
// import passport from "passport";
// import jwt from "jsonwebtoken"


// const router = express.Router();
// // Redirect user to Google login
// router.get(
//     "/google",
//     passport.authenticate("google", { scope: ["profile", "email"] })
//   )
// // Google callback route
// router.get(
//     "/google/callback",
//     passport.authenticate("google", { failureRedirect: "/login" }),
//     (req, res) => {
//       const user = req.user as any
  
//       // Generate JWT token
//       const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET!, {
//         expiresIn: "7d"
//       })
  
//       // Send token as response (or redirect)
//       res.redirect(`http://localhost:3000/dashboard?token=${token}`)
//     }
//   )
// // Logout
// router.get("/logout", (req, res) => {
//     req.logout(err => {
//       if (err) return res.status(500).json({ error: "Logout failed" })
//       res.json({ message: "Logged out successfully" })
//     })
//   })
  
// router.post("/signup/customer",  AuthController.signUpUser);
// router.post("/signup/owner",  AuthController.signUpOwner);
// router.post("/signup/agent/:referralCode?", AuthController.signUpAgent);
// router.post("/signup/super-agent", AuthController.signUpSuperAgent);
// router.post("/signup/admin", AuthController.signUpAdmin);
// router.post('/signin', AuthController.signIn);
// router.post('/generate-otp', AuthController.generateOTP);
// router.post('/verify-otp', AuthController.verifyOTP);
// router.post('/forgot-password', AuthController.forgotPassword);
// router.post('/reset-password', AuthController.resetPassword);

// export default router;


