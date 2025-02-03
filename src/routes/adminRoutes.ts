import express from "express";
import authenticateToken, { authenticateAdmin } from "../middleware/authMiddleware";
import { adminController } from "../controllers/userController";


const router = express.Router();

router.get("/getAllYatchs", authenticateToken, authenticateAdmin, adminController.getAllYatchs);
router.get("/getAllOwners", authenticateToken, authenticateAdmin, adminController.getAllOwners);
router.get("/getAllCustomers", authenticateToken, authenticateAdmin, adminController.getAllCustomers);
router.get("/getAllBookings", authenticateToken, authenticateAdmin, adminController.getAllBookings);
router.get("/getAllQueries", authenticateToken, authenticateAdmin, adminController.getAllQueries);
router.get("/getAllPayments", authenticateToken, authenticateAdmin, adminController.getAllPayments);
router.get("/getAllSuperAgents", authenticateToken, authenticateAdmin, adminController.getAllSuperAgents);
router.get("/getAllAgents", authenticateToken, authenticateAdmin, adminController.getAllAgents);
router.get("/getAllPayments", authenticateToken, authenticateAdmin, adminController.getAllPayments);
router.get("/yatchOwner", authenticateToken, authenticateAdmin, adminController.getYatchOwner);
router.get("/owners-Booking", authenticateToken, authenticateAdmin, adminController.getAllBookingByOwner);
 
export default router;