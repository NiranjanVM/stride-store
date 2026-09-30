import pool from "../db/db.js";

export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({
        message: "Product ID is required",
      });
    }

    // Check whether product exists
    const productResult = await pool.query(
      `
      SELECT id
      FROM products
      WHERE id = $1;
      `,
      [product_id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Check if already in wishlist
    const existingItem = await pool.query(
      `
      SELECT id
      FROM wishlist_items
      WHERE user_id = $1
        AND product_id = $2;
      `,
      [userId, product_id]
    );

    if (existingItem.rows.length > 0) {
      return res.status(409).json({
        message: "Product already in wishlist",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO wishlist_items
      (user_id, product_id)
      VALUES ($1, $2)
      RETURNING *;
      `,
      [userId, product_id]
    );

    res.status(201).json({
      message: "Product added to wishlist",
      item: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to add product to wishlist",
    });
  }
};


export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        wishlist_items.id,
        wishlist_items.created_at,

        products.id AS product_id,
        products.name,
        products.description,
        products.price,
        products.stock,
        products.gender,

        categories.name AS category

      FROM wishlist_items

      JOIN products
        ON wishlist_items.product_id = products.id

      JOIN categories
        ON products.category_id = categories.id

      WHERE wishlist_items.user_id = $1

      ORDER BY wishlist_items.id DESC;
      `,
      [userId]
    );

    res.status(200).json({
      items: result.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch wishlist",
    });
  }
};


export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const wishlistItemId = req.params.id;

    const result = await pool.query(
      `
      DELETE FROM wishlist_items
      WHERE id = $1
        AND user_id = $2
      RETURNING *;
      `,
      [wishlistItemId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Wishlist item not found",
      });
    }

    res.status(200).json({
      message: "Product removed from wishlist",
      item: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to remove product from wishlist",
    });
  }
};