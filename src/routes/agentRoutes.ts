import express from "express";
import authenticateToken, { authenticateAgent } from "../middleware/authMiddleware";
import { userController } from "../controllers/userController";
import { YatchController } from "../controllers/yachtController";
import BookingController from "../controllers/bookingController";

const router = express.Router();

router.get("/me", authenticateToken,authenticateAgent, userController.meAgent)
router.get("/current/rides", authenticateToken,authenticateAgent,userController.agentAllCurrentRides)
router.get("/prev/rides", authenticateToken,authenticateAgent,userController.agentAllPreviousRides)
router.get("/rides/:id", authenticateToken,authenticateAgent,userController.agentPrevRidesId)
router.get("/listAll",authenticateToken,authenticateAgent, YatchController.listAll);
router.post("/updateProfile",authenticateToken,authenticateAgent, userController.updateAgentProfile);
// For the below endpoints make sure to show discount price of the yatch by reducing based on discount available for Agent which is set by Admin,
router.get("/yatch-detail/:id",authenticateToken,authenticateAgent, YatchController.detailYatch); 
router.post("/search-Yatch",authenticateToken,authenticateAgent, BookingController.serchIdealYatchs); 
router.post("/create-booking/:id",authenticateToken,authenticateAgent, BookingController.createAgentBooking); 
router.post("/create-booking/multiple",authenticateToken,authenticateAgent, BookingController.createAgentBookingWithMultipleYatchs);


export default router;