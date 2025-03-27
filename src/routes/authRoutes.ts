import express from "express";
import { AuthController } from "../controllers/authControllers";
import authenticateToken from "../middleware/authMiddleware";
import passport from "passport";
import jwt from "jsonwebtoken"


const router = express.Router();
// Redirect user to Google login
router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  )
// Google callback route
router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      const user = req.user as any
  
      // Generate JWT token
      const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET!, {
        expiresIn: "7d"
      })
  
      // Send token as response (or redirect)
      res.redirect(`http://localhost:3000/dashboard?token=${token}`)
    }
  )
// Logout
router.get("/logout", (req, res) => {
    req.logout(err => {
      if (err) return res.status(500).json({ error: "Logout failed" })
      res.json({ message: "Logged out successfully" })
    })
  })
  
router.post("/signup/customer",  AuthController.signUpUser);
router.post("/signup/owner",  AuthController.signUpOwner);
router.post("/signup/agent/:referralCode?", AuthController.signUpAgent);
router.post("/signup/super-agent", AuthController.signUpSuperAgent);
router.post("/signup/admin", AuthController.signUpAdmin);
router.post('/signin', AuthController.signIn);
router.post('/generate-otp', AuthController.generateOTP);
router.post('/verify-otp', AuthController.verifyOTP);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

export default router;


