import pool from "../db/db.js";

export const getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT *
      FROM addresses
      WHERE user_id = $1
      ORDER BY id DESC;
      `,
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch addresses",
    });
  }
};


export const createAddress = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      full_name,
      phone,
      address_line,
      city,
      state,
      pincode,
    } = req.body;

    if (
      !full_name ||
      !phone ||
      !address_line ||
      !city ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        message: "All address fields are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO addresses
      (user_id, full_name, phone, address_line, city, state, pincode)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
      `,
      [
        userId,
        full_name,
        phone,
        address_line,
        city,
        state,
        pincode,
      ]
    );

    res.status(201).json({
      message: "Address added successfully",
      address: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to add address",
    });
  }
};


export const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;

    const {
      full_name,
      phone,
      address_line,
      city,
      state,
      pincode,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE addresses
      SET
        full_name = COALESCE($1, full_name),
        phone = COALESCE($2, phone),
        address_line = COALESCE($3, address_line),
        city = COALESCE($4, city),
        state = COALESCE($5, state),
        pincode = COALESCE($6, pincode)
      WHERE id = $7 AND user_id = $8
      RETURNING *;
      `,
      [
        full_name,
        phone,
        address_line,
        city,
        state,
        pincode,
        addressId,
        userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    res.status(200).json({
      message: "Address updated successfully",
      address: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update address",
    });
  }
};


export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;

    const result = await pool.query(
      `
      DELETE FROM addresses
      WHERE id = $1 AND user_id = $2
      RETURNING *;
      `,
      [addressId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    res.status(200).json({
      message: "Address deleted successfully",
      address: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete address",
    });
  }
};