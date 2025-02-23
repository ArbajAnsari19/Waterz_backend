import express from "express";
import authenticateToken from "../middleware/authMiddleware";
import { userController } from "../controllers/userController";
import { YatchController } from "../controllers/yachtController";
import { authenticateOwner } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/me", authenticateToken,authenticateOwner,userController.meOwner)
router.get("/me/yatchs", authenticateToken,authenticateOwner,YatchController.listmyYatchs)
router.get("/me/yatch/:id", authenticateToken,authenticateOwner,YatchController.detailYatch)
router.get("/current/rides", authenticateToken,authenticateOwner,userController.ownercurrentRides)
router.get("/prev/rides", authenticateToken,authenticateOwner,userController.ownerPrevRides)
router.get("/prev/ride/:id", authenticateToken,authenticateOwner,userController.ownerPrevRidesId)
router.post("/create", authenticateToken,authenticateOwner,YatchController.createYatch);
router.put("/update/:id",authenticateToken,authenticateOwner, YatchController.updateYatch);
router.delete("/delete/:id",authenticateToken,authenticateOwner,YatchController.deleteYatch);
router.get("/me/earnings", authenticateToken,authenticateOwner,YatchController.revenue)
export default router;