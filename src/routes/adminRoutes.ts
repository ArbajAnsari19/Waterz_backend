import express from "express";
import authenticateToken, { authenticateAdmin } from "../middleware/authMiddleware";
import { adminController } from "../controllers/userController";


const router = express.Router();

router.get("/getAllYatchs", authenticateToken, authenticateAdmin, adminController.getAllYatchs);
router.post("/filtered-yatchs", authenticateToken, authenticateAdmin, adminController.filterYatchs);
router.get("requested/yatch/:yatchId",authenticateToken,authenticateAdmin,adminController.yatchRequestDetails)
router.get("/approve/yatch/:yatchId",authenticateToken,authenticateAdmin,adminController.isApprovedYatch)
router.post("/filtered-bookings", authenticateToken, authenticateAdmin, adminController.filterBookings);
router.post("/filtered-customers", authenticateToken, authenticateAdmin, adminController.filterCustomers);
router.delete("/delete-customer/:customerId", authenticateToken, authenticateAdmin, adminController.deleteCustomer);
router.post("/filtered-agent", authenticateToken, authenticateAdmin, adminController.filterAgents);
router.post("/getFilteredSuperAgents", authenticateToken, authenticateAdmin, adminController.filterSuperAgents);
router.post("/filtered-Earning", authenticateToken, authenticateAdmin, adminController.filterEarnings);
router.get("/analytics", adminController.adminNavbar);
router.post("/getAdminDashboard", authenticateToken, authenticateAdmin, adminController.getAdminDashboard);
router.get("/getAllOwners", authenticateToken, authenticateAdmin, adminController.getAllOwners);
router.post("/getAllCustomers", authenticateToken, authenticateAdmin, adminController.getAllCustomers);
router.post("/getAllBookings", authenticateToken, authenticateAdmin, adminController.getAllBookings);
router.get("/getAllQueries", authenticateToken, authenticateAdmin, adminController.getAllQueries);
router.get("/getAllPayments", authenticateToken, authenticateAdmin, adminController.getAllPayments);
router.get("/getAllAgents", authenticateToken, authenticateAdmin, adminController.getAllAgents);
router.get("/getAllPayments", authenticateToken, authenticateAdmin, adminController.getAllPayments);
router.post("/getAllSuperAgents", authenticateToken, authenticateAdmin, adminController.getAllSuperAgents);
router.post("/getAllAgents", authenticateToken, authenticateAdmin, adminController.getAllAgents);
router.post("/getAllPayments", authenticateToken, authenticateAdmin, adminController.getAllPayments);
router.get("/yatchOwner", authenticateToken, authenticateAdmin, adminController.getYatchOwner);
router.get("/owners-Booking", authenticateToken, authenticateAdmin, adminController.getAllBookingByOwner);

export default router;