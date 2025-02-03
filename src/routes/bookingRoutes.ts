import express from "express";
import { BookingController } from "../controllers/bookingController";
import authenticateToken from "../middleware/authMiddleware";

const router = express.Router();

router.post("/create/:id",authenticateToken, BookingController.createBooking);
router.post("/idealYatchs",authenticateToken, BookingController.serchIdealYatchs);

export default router;