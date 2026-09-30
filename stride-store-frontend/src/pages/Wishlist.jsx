import React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { formatPrice, getErrorMessage } from "../utils/format";

function Wishlist() {
  const [items, setItems] = useState([]);
  const [images, setImages] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getWishlist();
      setItems(data.items || []);

      const imageEntries = await Promise.all(
        (data.items || []).map(async (item) => {
          try {
            const imageData = await api.getProductImages(item.product_id);
            return [item.product_id, imageData?.[0]?.image_url || null];
          } catch {
            return [item.product_id, null];
          }
        })
      );

      setImages(Object.fromEntries(imageEntries));
    } catch (err) {
      setMessage(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id) {
    setRemovingId(id);
    setMessage("");

    try {
      await api.removeFromWishlist(id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setMessage(getErrorMessage(err));
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <p>Loading wishlist...</p>
      </div>
    );
  }

  return (
    <section className="container section">
      <div className="page-heading">
        <span className="eyebrow">SAVED</span>
        <h1>Wishlist</h1>
        <p>{items.length} saved item{items.length === 1 ? "" : "s"}</p>
      </div>

      {message && <div className="notice">{message}</div>}

      {!items.length ? (
        <div className="empty-state">
          <div className="empty-icon">♡</div>
          <h2>Your wishlist is empty</h2>
          <p>Save products here to come back to them later.</p>
          <Link className="button button-dark" to="/shop">Explore products</Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {items.map((item) => {
            const image = images[item.product_id];

            return (
              <article className="wishlist-item" key={item.id}>
                <div className="wishlist-image-wrap">
                  <Link to={`/products/${item.product_id}`}>
                    {image ? (
                      <img src={image} alt={item.name} className="wishlist-image" />
                    ) : (
                      <div className="image-placeholder">
                        <span>ADIDAS</span>
                      </div>
                    )}
                  </Link>

                  <button
                    className="wishlist-remove"
                    onClick={() => remove(item.id)}
                    disabled={removingId === item.id}
                    aria-label={`Remove ${item.name} from wishlist`}
                    title="Remove from wishlist"
                  >
                    {removingId === item.id ? "…" : "×"}
                  </button>
                </div>

                <div className="wishlist-info">
                  <span className="eyebrow">{item.category}</span>
                  <Link to={`/products/${item.product_id}`}>
                    <h3>{item.name}</h3>
                  </Link>
                  <strong>{formatPrice(item.price)}</strong>

                  <div className="wishlist-actions">
                    <Link className="button button-dark" to={`/products/${item.product_id}`}>
                      View product
                    </Link>
                  
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default Wishlist;
