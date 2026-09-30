import express from "express";
import {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
} from "../controllers/cartController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, addToCart);
router.get("/", authenticate, getCart);
router.patch("/:id", authenticate, updateCartItem);
router.delete("/:id", authenticate, removeCartItem);

export default router;