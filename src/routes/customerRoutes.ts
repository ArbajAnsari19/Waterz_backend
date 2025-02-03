import express from "express";
import authenticateToken from "../middleware/authMiddleware";
import { userController } from "../controllers/userController";
import { YatchController } from "../controllers/yachtController";
import { authenticateUser } from "../middleware/authMiddleware";
const router = express.Router();

router.get("/me", authenticateToken,authenticateUser, userController.meCustomer)
router.get("/current/rides", authenticateToken,authenticateUser,userController.customerAllCurrentRides)
router.get("/prev/rides", authenticateToken,authenticateUser,userController.customerAllPrevRides)
router.get("/rides/:id", authenticateToken,authenticateUser,userController.customerPrevRidesId)
router.get("/yatch-detail/:id",authenticateToken,authenticateUser, YatchController.detailYatch);
router.get("/listAll",authenticateToken,authenticateUser, YatchController.listAll);
router.get("/topYatch",YatchController.topYatch);
router.post("/findNearby", YatchController.findNearbyYachts);

export default router;
