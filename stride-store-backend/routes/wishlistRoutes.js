import express from "express";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from "../controllers/wishlistController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, addToWishlist);
router.get("/", authenticate, getWishlist);
router.delete("/:id", authenticate, removeFromWishlist);
export default router;