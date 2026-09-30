import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import productRoutes from "./routes/productRoutes.js";
import productImageRoutes from "./routes/productImageRoutes.js";
import productVariantRoutes from "./routes/productVariantRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { authenticate } from "./middleware/authMiddleware.js";
import addressRoutes from "./routes/addressRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminOrderRoutes from "./routes/adminOrderRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";

dotenv.config();

const app = express();


app.use(cors());
app.use(express.json());
app.use("/api/products", productRoutes);
app.use("/api/products", productImageRoutes);
app.use("/api/products", productVariantRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/categories", categoryRoutes);



app.get("/", (req, res) => {
  res.json({
    message: "Adidas Store API is running🔥",
  });
});


app.get("/api/profile", authenticate, (req, res) => {
  res.json({
    message: "You accessed a protected route",
    user: req.user,
  });
});


export default app;