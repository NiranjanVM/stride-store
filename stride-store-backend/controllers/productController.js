import pool from "../db/db.js";

export const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      gender,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    const values = [];
    const conditions = [];

    // Search
    if (search) {
      values.push(`%${search}%`);

      conditions.push(`
        (
          products.name ILIKE $${values.length}
          OR products.description ILIKE $${values.length}
        )
      `);
    }

    // Category
    if (category) {
      values.push(category);

      conditions.push(
        `categories.name ILIKE $${values.length}`
      );
    }

    // Gender
    if (gender) {
      values.push(gender);

      conditions.push(
        `products.gender ILIKE $${values.length}`
      );
    }

    // Minimum price
    if (minPrice) {
      values.push(minPrice);

      conditions.push(
        `products.price >= $${values.length}`
      );
    }

    // Maximum price
    if (maxPrice) {
      values.push(maxPrice);

      conditions.push(
        `products.price <= $${values.length}`
      );
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    // Sorting
    let orderBy = "products.id DESC";

    if (sort === "price_asc") {
      orderBy = "products.price ASC";
    } else if (sort === "price_desc") {
      orderBy = "products.price DESC";
    } else if (sort === "name_asc") {
      orderBy = "products.name ASC";
    } else if (sort === "name_desc") {
      orderBy = "products.name DESC";
    }

    // Pagination
    const pageNumber = Math.max(Number(page), 1);

    const limitNumber = Math.min(
      Math.max(Number(limit), 1),
      50
    );

    const offset =
      (pageNumber - 1) * limitNumber;

    // Save filter values before adding pagination values
    const filterValues = [...values];

    // Add LIMIT and OFFSET
    values.push(limitNumber);
    const limitIndex = values.length;

    values.push(offset);
    const offsetIndex = values.length;

    // Get products
    const result = await pool.query(
      `
      SELECT
        products.id,
        products.name,
        products.description,
        products.price,
        products.stock,
        products.gender,
        categories.name AS category

      FROM products

      JOIN categories
        ON products.category_id = categories.id

      ${whereClause}

      ORDER BY ${orderBy}

      LIMIT $${limitIndex}
      OFFSET $${offsetIndex};
      `,
      values
    );

    // Get total matching products
    const countResult = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM products

      JOIN categories
        ON products.category_id = categories.id

      ${whereClause};
      `,
      filterValues
    );

    const totalProducts = Number(
      countResult.rows[0].total
    );

    const totalPages = Math.ceil(
      totalProducts / limitNumber
    );

    res.status(200).json({
      page: pageNumber,
      limit: limitNumber,
      totalProducts,
      totalPages,
      products: result.rows,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch products",
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        products.id,
        products.name,
        products.description,
        products.price,
        products.stock,
        products.gender,
        categories.name AS category
      FROM products
      JOIN categories
        ON products.category_id = categories.id
      WHERE products.id = $1;
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch product",
    });
  }
};


export const createProduct = async (req, res) => {
  try {
    const {
      category_id,
      name,
      description,
      price,
      stock,
      gender,
    } = req.body;

    if (!category_id || !name || price === undefined) {
      return res.status(400).json({
        message: "category_id, name and price are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO products
      (category_id, name, description, price, stock, gender)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
      `,
      [
        category_id,
        name,
        description,
        price,
        stock ?? 0,
        gender,
      ]
    );

    res.status(201).json({
      message: "Product created successfully",
      product: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create product",
    });
  }
};


export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      category_id,
      name,
      description,
      price,
      stock,
      gender,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE products
      SET
        category_id = COALESCE($1, category_id),
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        price = COALESCE($4, price),
        stock = COALESCE($5, stock),
        gender = COALESCE($6, gender)
      WHERE id = $7
      RETURNING *;
      `,
      [
        category_id,
        name,
        description,
        price,
        stock,
        gender,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json({
      message: "Product updated successfully",
      product: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update product",
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM products
      WHERE id = $1
      RETURNING *;
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json({
      message: "Product deleted successfully",
      product: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete product",
    });
  }
};

