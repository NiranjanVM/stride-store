import express from "express";

import {
  getAllOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";

import {
  authenticate,
  authorizeAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorizeAdmin,
  getAllOrders
);

router.patch(
  "/:id",
  authenticate,
  authorizeAdmin,
  updateOrderStatus
);

export default router;