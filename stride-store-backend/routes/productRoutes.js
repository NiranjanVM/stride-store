import express from "express";

import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

import {
  authenticate,
  authorizeAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getProducts);

router.get("/:id", getProductById);

router.post(
  "/",
  authenticate,
  authorizeAdmin,
  createProduct
);

router.patch(
  "/:id",
  authenticate,
  authorizeAdmin,
  updateProduct
);

router.delete(
  "/:id",
  authenticate,
  authorizeAdmin,
  deleteProduct
);

export default router;