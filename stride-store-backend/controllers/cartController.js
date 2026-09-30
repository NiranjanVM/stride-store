import pool from "../db/db.js";

export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const { product_id, variant_id, quantity = 1 } = req.body;

    if (!product_id || !variant_id) {
      return res.status(400).json({
        message: "Product and variant are required",
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than 0",
      });
    }

    // Check product and variant
    const variantResult = await pool.query(
      `
      SELECT
        product_variants.id,
        product_variants.product_id,
        product_variants.stock
      FROM product_variants
      WHERE product_variants.id = $1
        AND product_variants.product_id = $2;
      `,
      [variant_id, product_id]
    );

    if (variantResult.rows.length === 0) {
      return res.status(404).json({
        message: "Product variant not found",
      });
    }

    const variant = variantResult.rows[0];

    if (quantity > variant.stock) {
      return res.status(400).json({
        message: "Not enough stock available",
      });
    }

    // Check whether item already exists
    const existingItem = await pool.query(
      `
      SELECT id, quantity
      FROM cart_items
      WHERE user_id = $1
        AND variant_id = $2;
      `,
      [userId, variant_id]
    );

    if (existingItem.rows.length > 0) {
      const newQuantity =
        existingItem.rows[0].quantity + quantity;

      if (newQuantity > variant.stock) {
        return res.status(400).json({
          message: "Not enough stock available",
        });
      }

      const updatedItem = await pool.query(
        `
        UPDATE cart_items
        SET quantity = $1
        WHERE id = $2
        RETURNING *;
        `,
        [newQuantity, existingItem.rows[0].id]
      );

      return res.status(200).json({
        message: "Cart updated successfully",
        item: updatedItem.rows[0],
      });
    }

    // Add new item
    const result = await pool.query(
      `
      INSERT INTO cart_items
      (user_id, product_id, variant_id, quantity)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
      `,
      [userId, product_id, variant_id, quantity]
    );

    res.status(201).json({
      message: "Item added to cart",
      item: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to add item to cart",
    });
  }
};


export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        cart_items.id,
        cart_items.quantity,

        products.id AS product_id,
        products.name,
        products.price,

        product_variants.id AS variant_id,
        product_variants.size,
        product_variants.color,
        product_variants.stock,

        (products.price * cart_items.quantity) AS subtotal

      FROM cart_items

      JOIN products
        ON cart_items.product_id = products.id

      JOIN product_variants
        ON cart_items.variant_id = product_variants.id

      WHERE cart_items.user_id = $1

      ORDER BY cart_items.id DESC;
      `,
      [userId]
    );

    const total = result.rows.reduce(
      (sum, item) => sum + Number(item.subtotal),
      0
    );

    res.status(200).json({
      items: result.rows,
      total,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch cart",
    });
  }
};



export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItemId = req.params.id;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than 0",
      });
    }

    // Find the cart item and its variant stock
    const cartItemResult = await pool.query(
      `
      SELECT
        cart_items.id,
        product_variants.stock
      FROM cart_items
      JOIN product_variants
        ON cart_items.variant_id = product_variants.id
      WHERE cart_items.id = $1
        AND cart_items.user_id = $2;
      `,
      [cartItemId, userId]
    );

    if (cartItemResult.rows.length === 0) {
      return res.status(404).json({
        message: "Cart item not found",
      });
    }

    const availableStock = cartItemResult.rows[0].stock;

    if (quantity > availableStock) {
      return res.status(400).json({
        message: `Only ${availableStock} items available in stock`,
      });
    }

    // Update quantity
    const result = await pool.query(
      `
      UPDATE cart_items
      SET quantity = $1
      WHERE id = $2
        AND user_id = $3
      RETURNING *;
      `,
      [quantity, cartItemId, userId]
    );

    res.status(200).json({
      message: "Cart item updated successfully",
      item: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update cart item",
    });
  }
};


export const removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItemId = req.params.id;

    const result = await pool.query(
      `
      DELETE FROM cart_items
      WHERE id = $1
        AND user_id = $2
      RETURNING *;
      `,
      [cartItemId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Cart item not found",
      });
    }

    res.status(200).json({
      message: "Cart item removed successfully",
      item: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to remove cart item",
    });
  }
};