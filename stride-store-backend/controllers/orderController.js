import pool from "../db/db.js";

export const createOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const { address_id } = req.body;

    if (!address_id) {
      return res.status(400).json({
        message: "Address ID is required",
      });
    }

    await client.query("BEGIN");

    // 1. Check that the address belongs to the user
    const addressResult = await client.query(
      `
      SELECT id
      FROM addresses
      WHERE id = $1
        AND user_id = $2;
      `,
      [address_id, userId]
    );

    if (addressResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Address not found",
      });
    }

    // 2. Get user's cart
    const cartResult = await client.query(
      `
      SELECT
        cart_items.id,
        cart_items.product_id,
        cart_items.variant_id,
        cart_items.quantity,

        products.price,

        product_variants.stock

      FROM cart_items

      JOIN products
        ON cart_items.product_id = products.id

      JOIN product_variants
        ON cart_items.variant_id = product_variants.id

      WHERE cart_items.user_id = $1

      FOR UPDATE;
      `,
      [userId]
    );

    if (cartResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    // 3. Check stock and calculate total
    let totalAmount = 0;

    for (const item of cartResult.rows) {
      if (item.quantity > item.stock) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: `Not enough stock for product ID ${item.product_id}`,
        });
      }

      totalAmount +=
        Number(item.price) * item.quantity;
    }

    // 4. Create order
    const orderResult = await client.query(
      `
      INSERT INTO orders
      (user_id, address_id, total_amount)
      VALUES ($1, $2, $3)
      RETURNING *;
      `,
      [userId, address_id, totalAmount]
    );

    const order = orderResult.rows[0];

    // 5. Create order items
    for (const item of cartResult.rows) {
      await client.query(
        `
        INSERT INTO order_items
        (order_id, product_id, variant_id, quantity, price)
        VALUES ($1, $2, $3, $4, $5);
        `,
        [
          order.id,
          item.product_id,
          item.variant_id,
          item.quantity,
          item.price,
        ]
      );

      // 6. Reduce variant stock
      await client.query(
        `
        UPDATE product_variants
        SET stock = stock - $1
        WHERE id = $2;
        `,
        [item.quantity, item.variant_id]
      );
    }

    // 7. Clear cart
    await client.query(
      `
      DELETE FROM cart_items
      WHERE user_id = $1;
      `,
      [userId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(error);

    res.status(500).json({
      message: "Failed to create order",
    });
  } finally {
    client.release();
  }
};


export const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        id,
        total_amount,
        status,
        created_at
      FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC;
      `,
      [userId]
    );

    res.status(200).json({
      orders: result.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
};


export const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    const orderResult = await pool.query(
      `
      SELECT
        orders.id,
        orders.total_amount,
        orders.status,
        orders.created_at,

        addresses.full_name,
        addresses.phone,
        addresses.address_line,
        addresses.city,
        addresses.state,
        addresses.pincode

      FROM orders

      JOIN addresses
        ON orders.address_id = addresses.id

      WHERE orders.id = $1
        AND orders.user_id = $2;
      `,
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
      `
      SELECT
        order_items.id,

        order_items.product_id,
        products.name,

        order_items.variant_id,
        product_variants.size,
        product_variants.color,

        order_items.quantity,
        order_items.price,

        (order_items.price * order_items.quantity) AS subtotal

      FROM order_items

      JOIN products
        ON order_items.product_id = products.id

      JOIN product_variants
        ON order_items.variant_id = product_variants.id

      WHERE order_items.order_id = $1

      ORDER BY order_items.id;
      `,
      [orderId]
    );

    res.status(200).json({
      order,
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch order",
    });
  }
};



export const getAllOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        orders.id,
        orders.total_amount,
        orders.status,
        orders.created_at,

        users.id AS user_id,
        users.name AS customer_name,
        users.email AS customer_email

      FROM orders

      JOIN users
        ON orders.user_id = users.id

      ORDER BY orders.created_at DESC;
      `
    );

    res.status(200).json({
      orders: result.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
};


export const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }

    const result = await pool.query(
      `
      UPDATE orders
      SET status = $1
      WHERE id = $2
      RETURNING *;
      `,
      [status, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.status(200).json({
      message: "Order status updated successfully",
      order: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update order status",
    });
  }
};