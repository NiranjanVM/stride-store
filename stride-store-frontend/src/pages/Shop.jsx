import React, { useEffect, useMemo, useState } from "react";
import { FiCheck, FiChevronDown, FiGrid } from "react-icons/fi";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/format";

function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [categories, setCategories] = useState([]);
  const [data, setData] = useState({
    products: [],
    page: 1,
    totalPages: 1,
    totalProducts: 0,
  });
  const [images, setImages] = useState({});
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Mobile filters
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const filters = useMemo(
    () => ({
      search: searchParams.get("search") || "",
      category: searchParams.get("category") || "",
      gender: searchParams.get("gender") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      sort: searchParams.get("sort") || "",
      page: searchParams.get("page") || 1,
      limit: 12,
    }),
    [searchParams]
  );

  // Fetch categories
  useEffect(() => {
    api
      .getCategories()
      .then((result) =>
        setCategories(
          Array.isArray(result) ? result : result?.categories || []
        )
      )
      .catch(() => setCategories([]));
  }, []);

  // Fetch products
  useEffect(() => {
    setLoading(true);
    setMessage("");

    api
      .getProducts(filters)
      .then(async (result) => {
        setData(result);

        const imageEntries = await Promise.all(
          result.products.map(async (product) => {
            try {
              const imageData = await api.getProductImages(product.id);

              return [
                product.id,
                imageData?.[0]?.image_url || null,
              ];
            } catch {
              return [product.id, null];
            }
          })
        );

        setImages(Object.fromEntries(imageEntries));
      })
      .catch((err) => setMessage(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [
    filters.search,
    filters.category,
    filters.gender,
    filters.minPrice,
    filters.maxPrice,
    filters.sort,
    filters.page,
  ]);

  // Fetch wishlist
  useEffect(() => {
    if (!isAuthenticated) {
      setWishlistIds(new Set());
      return;
    }

    api
      .getWishlist()
      .then((result) =>
        setWishlistIds(
          new Set(
            (result.items || []).map(
              (item) => item.product_id
            )
          )
        )
      )
      .catch(() => {});
  }, [isAuthenticated]);

  // Update URL filters
  function updateFilter(name, value) {
    const next = new URLSearchParams(searchParams);

    if (value) {
      next.set(name, value);
    } else {
      next.delete(name);
    }

    // Reset to page 1 when changing filters
    if (name !== "page") {
      next.set("page", "1");
    }

    setSearchParams(next);
  }

  function selectCategory(name) {
    updateFilter("category", name);
  }

  // Wishlist
  async function toggleWishlist(product) {
    if (!isAuthenticated) {
      setMessage("Sign in to use your wishlist.");
      return;
    }

    try {
      if (wishlistIds.has(product.id)) {
        const result = await api.getWishlist();

        const item = (result.items || []).find(
          (entry) => entry.product_id === product.id
        );

        if (item) {
          await api.removeFromWishlist(item.id);
        }

        setWishlistIds((current) => {
          const next = new Set(current);
          next.delete(product.id);
          return next;
        });
      } else {
        await api.addToWishlist(product.id);

        setWishlistIds(
          (current) => new Set(current).add(product.id)
        );
      }
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  }

  const activeCategory = filters.category || "All products";

  return (
    <section className="container section shop-page">

      {/* =========================
          SHOP HEADER
      ========================== */}
      <div className="shop-header">
        <div>
          <span className="eyebrow">COLLECTION</span>

          <h1>
            {filters.category || "Shop all"}
          </h1>

          <p>
            {data.totalProducts} products
          </p>
        </div>

        {/* Sort */}
        <label className="sort-select">
          <span>Sort</span>

          <select
            value={filters.sort}
            onChange={(e) =>
              updateFilter("sort", e.target.value)
            }
          >
            <option value="">Newest</option>
            <option value="price_asc">
              Price: low to high
            </option>
            <option value="price_desc">
              Price: high to low
            </option>
            <option value="name_asc">
              Name: A–Z
            </option>
            <option value="name_desc">
              Name: Z–A
            </option>
          </select>
        </label>
      </div>

      {/* =========================
          CATEGORY FILTER
      ========================== */}
      <div className="category-filter-section">

        <div className="category-filter-heading">
          <div>
            <FiGrid />
            <span>Browse categories</span>
          </div>

          <strong>
            {activeCategory}
          </strong>
        </div>

        <div className="category-pills">

          {/* All */}
          <button
            className={!filters.category ? "active" : ""}
            onClick={() => selectCategory("")}
          >
            All

            <FiCheck />
          </button>

          {/* Categories */}
          {categories.map((category) => (
            <button
              key={category.id}
              className={
                filters.category === category.name
                  ? "active"
                  : ""
              }
              onClick={() =>
                selectCategory(category.name)
              }
            >
              {category.name}

              {filters.category === category.name && (
                <FiCheck />
              )}
            </button>
          ))}

        </div>
      </div>

      {/* =========================
          MOBILE FILTER BUTTON
      ========================== */}
      <button
        className="mobile-filter-button"
        onClick={() =>
          setShowMobileFilters((prev) => !prev)
        }
      >
        <span>Filters</span>

        <FiChevronDown
          className={
            showMobileFilters
              ? "filter-chevron open"
              : "filter-chevron"
          }
        />
      </button>

      {/* =========================
          SEARCH / FILTER TOOLBAR
      ========================== */}
      <div
        className={`shop-toolbar ${
          showMobileFilters
            ? "mobile-filters-open"
            : ""
        }`}
      >

        {/* Search */}
        <input
          className="search-input"
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) =>
            updateFilter("search", e.target.value)
          }
        />

        {/* Gender */}
        <select
          value={filters.gender}
          onChange={(e) =>
            updateFilter("gender", e.target.value)
          }
        >
          <option value="">All genders</option>
          <option value="men">Men</option>
          <option value="women">Women</option>
          <option value="unisex">Unisex</option>
        </select>

        {/* Minimum price */}
        <input
          type="number"
          placeholder="Min ₹"
          value={filters.minPrice}
          onChange={(e) =>
            updateFilter("minPrice", e.target.value)
          }
        />

        {/* Maximum price */}
        <input
          type="number"
          placeholder="Max ₹"
          value={filters.maxPrice}
          onChange={(e) =>
            updateFilter("maxPrice", e.target.value)
          }
        />

        {/* Clear */}
        <button
          className="button button-outline"
          onClick={() => {
            setSearchParams({});
            setShowMobileFilters(false);
          }}
        >
          Clear
        </button>

      </div>

      {/* =========================
          MESSAGE
      ========================== */}
      {message && (
        <div className="notice">
          {message}
        </div>
      )}

      {/* =========================
          PRODUCTS
      ========================== */}
      {loading ? (

        <div className="product-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

      ) : data.products.length ? (

        <div className="product-grid">
          {data.products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              image={images[product.id]}
              wished={wishlistIds.has(product.id)}
              onWishlist={toggleWishlist}
            />
          ))}
        </div>

      ) : (

        <div className="empty-state">
          <div className="empty-icon">
            ⌕
          </div>

          <h2>
            No products found
          </h2>

          <p>
            Try changing your filters or search.
          </p>
        </div>

      )}

      {/* =========================
          PAGINATION
      ========================== */}
      {data.totalPages > 1 && (
        <div className="pagination">

          <button
            disabled={Number(data.page) <= 1}
            onClick={() =>
              updateFilter(
                "page",
                Number(data.page) - 1
              )
            }
          >
            ←
          </button>

          <span>
            Page {data.page} of {data.totalPages}
          </span>

          <button
            disabled={
              Number(data.page) >= data.totalPages
            }
            onClick={() =>
              updateFilter(
                "page",
                Number(data.page) + 1
              )
            }
          >
            →
          </button>

        </div>
      )}

    </section>
  );
}


/* =========================
   SKELETON CARD
========================= */

function SkeletonCard() {
  return (
    <div className="product-card skeleton">

      <div className="skeleton-image" />

      <div className="skeleton-lines">
        <span />
        <span />
        <span />
      </div>

    </div>
  );
}

export default Shop;