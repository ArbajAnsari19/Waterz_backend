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
      
      // // for local
      // res.redirect(`http://localhost:5173/auth-callback?token=${token}`);

      // for production
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

router.post('/complete-profile', authenticateToken, AuthController.completeGoogleProfile)

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


