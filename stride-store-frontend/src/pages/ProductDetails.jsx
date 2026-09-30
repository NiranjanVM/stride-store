import React from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatPrice, getErrorMessage } from "../utils/format";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getProduct(id),
      api.getProductImages(id),
      api.getProductVariants(id),
    ])
      .then(([productData, imageData, variantData]) => {
        setProduct(productData);
        setImages(imageData);
        setVariants(variantData);
        setSelectedVariant(variantData.find((v) => Number(v.stock) > 0) || variantData[0] || null);
      })
      .catch((err) => setMessage(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  async function addToCart() {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/products/${id}` } });
      return;
    }
    if (!selectedVariant) {
      setMessage("Please choose a size and color.");
      return;
    }

    try {
      await api.addToCart({
        product_id: product.id,
        variant_id: selectedVariant.id,
        quantity,
      });
      setMessage("Added to cart.");
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  }

  async function addWishlist() {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    try {
      await api.addToWishlist(product.id);
      setMessage("Added to wishlist.");
    } catch (err) {
      setMessage(err.status === 409 ? "Already in wishlist." : getErrorMessage(err));
    }
  }

  if (loading) return <div className="page-loader"><div className="spinner" /><p>Loading product...</p></div>;
  if (!product) return <div className="container empty-state"><h2>{message || "Product not found"}</h2></div>;

  return (
    <section className="container section product-details">
      <Link to="/shop" className="back-link">← Back to shop</Link>

      <div className="product-detail-grid">
        <div className="gallery">
          <div className="gallery-main">
            {images.length ? (
              <img src={images[activeImage]?.image_url} alt={product.name} />
            ) : (
              <div className="image-placeholder large"><span>ADIDAS</span></div>
            )}
          </div>
          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((image, index) => (
                <button className={index === activeImage ? "selected" : ""} key={image.id} onClick={() => setActiveImage(index)}>
                  <img src={image.image_url} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <div className="product-meta"><span>{product.category}</span><span>{product.gender || "Unisex"}</span></div>
          <h1>{product.name}</h1>
          <div className="detail-price">{formatPrice(product.price)}</div>
          <p className="detail-description">{product.description || "Designed for everyday movement."}</p>

          <div className="variant-section">
            <div className="variant-heading"><strong>Choose variant</strong>{selectedVariant && <span>{selectedVariant.color} / {selectedVariant.size}</span>}</div>
            {variants.length ? (
              <div className="variant-grid">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    disabled={Number(variant.stock) <= 0}
                    className={`variant-button ${selectedVariant?.id === variant.id ? "selected" : ""}`}
                    onClick={() => { setSelectedVariant(variant); setQuantity(1); }}
                  >
                    <strong>{variant.size}</strong>
                    <span>{variant.color}</span>
                    {Number(variant.stock) <= 0 && <small>Sold out</small>}
                  </button>
                ))}
              </div>
            ) : (
              <div className="notice">No variants are configured for this product yet. A size/color variant is required before it can be added to the cart.</div>
            )}
          </div>

          <div className="purchase-row">
            <div className="quantity">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity((q) => Math.min(Number(selectedVariant?.stock || 1), q + 1))}>+</button>
            </div>
            <button className="button button-dark grow" disabled={!selectedVariant || Number(selectedVariant.stock) <= 0} onClick={addToCart}>Add to cart</button>
            <button className="button button-outline" onClick={addWishlist}>♡</button>
          </div>

          {message && <div className="notice">{message}</div>}

          <div className="detail-points">
            <div><strong>✓</strong><span>Secure account-based cart</span></div>
            <div><strong>✓</strong><span>Live variant stock checks</span></div>
            <div><strong>✓</strong><span>Easy order tracking</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductDetails;
