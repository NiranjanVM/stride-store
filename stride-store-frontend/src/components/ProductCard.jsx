import React from "react";
import { Link } from "react-router-dom";

function ProductCard({ product, image, onWishlist, wished }) {
  const outOfStock = Number(product.stock) <= 0;

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <Link to={`/products/${product.id}`}>
          {image ? (
            <img src={image} alt={product.name} className="product-image" />
          ) : (
            <div className="image-placeholder">
              <span>STRIDE</span>
            </div>
          )}
        </Link>
        <button
          className={`wishlist-button ${wished ? "active" : ""}`}
          onClick={() => onWishlist?.(product)}
          aria-label="Wishlist"
        >
          {wished ? "♥" : "♡"}
        </button>
      </div>

      <div className="product-card-body">
        <div className="product-meta">
          <span>{product.category || "Collection"}</span>
          <span>{product.gender || "Unisex"}</span>
        </div>
        <Link to={`/products/${product.id}`} className="product-name">
          {product.name}
        </Link>
        <p className="product-description">{product.description}</p>
        <div className="product-card-bottom">
          <strong className="product-price">₹{Number(product.price).toLocaleString("en-IN")}</strong>
          {outOfStock ? (
            <span className="stock out">Out of stock</span>
          ) : (
            <span className="stock">In stock</span>
          )}
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
