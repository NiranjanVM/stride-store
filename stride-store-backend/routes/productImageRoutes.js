import express from "express";

import {
  getProductImages,
  addProductImage,
  deleteProductImage,
} from "../controllers/productImageController.js";
import {
  authenticate,
  authorizeAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:productId/images", getProductImages);

router.post(
  "/:productId/images",
  authenticate,
  authorizeAdmin,
  addProductImage
);

router.delete(
  "/:productId/images/:imageId",
  authenticate,
  authorizeAdmin,
  deleteProductImage
);

export default router;