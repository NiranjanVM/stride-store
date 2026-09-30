import pool from "../db/db.js";

export const getProductImages = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM product_images
      WHERE product_id = $1
      ORDER BY id;
      `,
      [productId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch product images",
    });
  }
};


export const addProductImage = async (req, res) => {
  try {
    const { productId } = req.params;
    const { image_url } = req.body;

    if (!image_url) {
      return res.status(400).json({
        message: "image_url is required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO product_images (product_id, image_url)
      VALUES ($1, $2)
      RETURNING *;
      `,
      [productId, image_url]
    );

    res.status(201).json({
      message: "Product image added successfully",
      image: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to add product image",
    });
  }
};

export const deleteProductImage = async (req, res) => {
  try {
    const { productId, imageId } = req.params;

    const result = await pool.query(
      `
      DELETE FROM product_images
      WHERE id = $1 AND product_id = $2
      RETURNING *;
      `,
      [imageId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product image not found",
      });
    }

    res.status(200).json({
      message: "Product image deleted successfully",
      image: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete product image",
    });
  }
};