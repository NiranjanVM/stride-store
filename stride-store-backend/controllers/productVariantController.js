import pool from "../db/db.js";

export const getProductVariants = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM product_variants
      WHERE product_id = $1
      ORDER BY id;
      `,
      [productId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch product variants",
    });
  }
};

export const createProductVariant = async (req, res) => {
  try {
    const { productId } = req.params;
    const { size, color, stock } = req.body;

    if (!size || !color) {
      return res.status(400).json({
        message: "size and color are required",
      });
    }

    if (stock === undefined || stock < 0) {
      return res.status(400).json({
        message: "stock must be 0 or greater",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO product_variants
      (product_id, size, color, stock)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
      `,
      [productId, size, color, stock]
    );

    res.status(201).json({
      message: "Product variant created successfully",
      variant: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    // PostgreSQL unique constraint violation
    if (error.code === "23505") {
      return res.status(409).json({
        message: "This size and color variant already exists",
      });
    }

    res.status(500).json({
      message: "Failed to create product variant",
    });
  }
};



export const updateProductVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const { size, color, stock } = req.body;

    if (stock !== undefined && stock < 0) {
      return res.status(400).json({
        message: "stock cannot be negative",
      });
    }

    const result = await pool.query(
      `
      UPDATE product_variants
      SET
        size = COALESCE($1, size),
        color = COALESCE($2, color),
        stock = COALESCE($3, stock)
      WHERE id = $4
        AND product_id = $5
      RETURNING *;
      `,
      [size, color, stock, variantId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product variant not found",
      });
    }

    res.status(200).json({
      message: "Product variant updated successfully",
      variant: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "This size and color variant already exists",
      });
    }

    res.status(500).json({
      message: "Failed to update product variant",
    });
  }
};




export const deleteProductVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;

    const result = await pool.query(
      `
      DELETE FROM product_variants
      WHERE id = $1
        AND product_id = $2
      RETURNING *;
      `,
      [variantId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product variant not found",
      });
    }

    res.status(200).json({
      message: "Product variant deleted successfully",
      variant: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete product variant",
    });
  }
};