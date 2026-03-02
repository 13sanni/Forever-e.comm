import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/auth.js";
import {
  listOrders,
  placeOrder,
  verifyStripePayment,
  updateOrderStatus,
  userOrders,
} from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.post("/place", authUser, placeOrder);
orderRouter.post("/verify-stripe", authUser, verifyStripePayment);
orderRouter.get("/user", authUser, userOrders);
orderRouter.get("/list", adminAuth, listOrders);
orderRouter.post("/status", adminAuth, updateOrderStatus);

export default orderRouter;
