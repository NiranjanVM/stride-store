import React from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { formatPrice, getErrorMessage } from "../utils/format";
import { IoBagHandle } from "react-icons/io5";
import { AiOutlineDelete } from "react-icons/ai";

function Cart() {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [images, setImages] = useState({});
  const navigate = useNavigate();

  function loadCart() {
    setLoading(true);
    api.getCart()
      .then(async (data) => {
        setCart(data);
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
      })
      .catch((err) => setMessage(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadCart(); }, []);

  async function updateQuantity(id, quantity) {
    try {
      const data = await api.updateCartItem(id, quantity);
      setCart((current) => ({
        ...current,
        items: current.items.map((item) => item.id === id ? { ...item, ...data.item, quantity } : item),
        total: current.items.reduce((sum, item) => sum + (item.id === id ? Number(item.price) * quantity : Number(item.subtotal)), 0),
      }));
      loadCart();
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  }

  async function remove(id) {
    try {
      await api.removeCartItem(id);
      setCart((current) => ({ ...current, items: current.items.filter((item) => item.id !== id) }));
      loadCart();
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  }

  if (loading) return <div className="page-loader"><div className="spinner" /><p>Loading cart...</p></div>;

  if (!cart.items.length) {
    return <div className="container empty-state section"><div className="empty-icon"><IoBagHandle /></div><h1>Your cart is empty</h1><p>Add something you love from the collection.</p><Link className="button button-dark" to="/shop">Start shopping</Link></div>;
  }

  return (
    <section className="container section">
      <div className="page-heading"><span className="eyebrow">YOUR BAG</span><h1>YOUR BAG</h1></div>
      {message && <div className="notice">{message}</div>}
      <div className="cart-layout">
        <div className="cart-list">
          {cart.items.map((item) => (
            <article className="cart-item" key={item.id}>
              <div className="cart-item-image">
                {images[item.product_id] ? (
                  <img src={images[item.product_id]} alt={item.name} className="cart-product-image" />
                ) : (
                  <div className="image-placeholder"><span>STRIDE</span></div>
                )}
              </div>
              <div className="cart-item-info">
                <span className="eyebrow">{item.color} / {item.size}</span>
                <Link to={`/products/${item.product_id}`}><h3>{item.name}</h3></Link>
                <strong>{formatPrice(item.price)}</strong>
                <span className="stock">Stock: {item.stock}</span>
              </div>
              <div className="cart-item-actions">
                <div className="quantity">
                  <button disabled={item.quantity <= 1} onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button disabled={item.quantity >= item.stock} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
                <strong>{formatPrice(item.subtotal)}</strong>
                <button className="text-button danger" onClick={() => remove(item.id)}><AiOutlineDelete />
</button>
              </div>
            </article>
          ))}
        </div>

        <aside className="summary-card">
          <h2>Summary</h2>
          <div className="summary-row"><span>Subtotal</span><strong>{formatPrice(cart.total)}</strong></div>
          <div className="summary-row"><span>Shipping</span><span>Calculated at checkout</span></div>
          <div className="summary-total"><span>Total</span><strong>{formatPrice(cart.total)}</strong></div>
          <button className="button button-dark button-full" onClick={() => navigate("/checkout")}>Continue to checkout</button>
        </aside>
      </div>
    </section>
  );
}

export default Cart;
