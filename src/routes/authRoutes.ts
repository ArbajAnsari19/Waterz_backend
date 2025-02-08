import express from "express";
import { AuthController } from "../controllers/authControllers";
import authenticateToken from "../middleware/authMiddleware";


const router = express.Router();

router.post("/signup/customer",  AuthController.signUpUser);
router.post("/signup/owner",  AuthController.signUpOwner);
router.post("/signup/agent/:referralCode", AuthController.signUpAgent);
router.post("/signup/super-agent", AuthController.signUpSuperAgent);
router.post('/signin', AuthController.signIn);
router.post('/generate-otp', AuthController.generateOTP);
router.post('/verify-otp', AuthController.verifyOTP);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

export default router;


