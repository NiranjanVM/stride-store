import express from "express";

import {
  getProductVariants,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
} from "../controllers/productVariantController.js";

import {
  authenticate,
  authorizeAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:productId/variants", getProductVariants);

router.post(
  "/:productId/variants",
  authenticate,
  authorizeAdmin,
  createProductVariant
);

router.patch(
  "/:productId/variants/:variantId",
  authenticate,
  authorizeAdmin,
  updateProductVariant
);

router.delete(
  "/:productId/variants/:variantId",
  authenticate,
  authorizeAdmin,
  deleteProductVariant
);
export default router;