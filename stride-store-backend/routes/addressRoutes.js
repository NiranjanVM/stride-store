import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";

import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/addressController.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  getAddresses
);

router.post("/", authenticate, createAddress);
router.patch("/:id", authenticate, updateAddress);
router.delete("/:id", authenticate, deleteAddress);

export default router;