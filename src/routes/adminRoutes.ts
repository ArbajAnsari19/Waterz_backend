import express from "express";
import authenticateToken, { authenticateAdmin } from "../middleware/authMiddleware";
import { adminController } from "../controllers/userController";


const router = express.Router();

router.get("/getAllYatchs", authenticateToken, authenticateAdmin, adminController.getAllYatchs);
// router.get("/getAllOwners", authenticateToken, authenticateAdmin, adminController.getAllOwners);
 
export default router;