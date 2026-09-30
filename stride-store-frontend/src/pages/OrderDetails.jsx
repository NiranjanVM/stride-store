import React from "react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { formatDate, formatPrice, getErrorMessage } from "../utils/format";
import { Status } from "./Orders";

function OrderDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.getOrder(id).then(setData).catch((err) => setMessage(getErrorMessage(err)));
  }, [id]);

  if (!data) return <div className="page-loader"><div className="spinner" /><p>{message || "Loading order..."}</p></div>;

  const { order, items } = data;

  return (
    <section className="container section">
      <Link to="/orders" className="back-link">← All orders</Link>
      <div className="order-detail-header">
        <div><span className="eyebrow">ORDER #{order.id}</span><h1>Order details</h1><p>Placed {formatDate(order.created_at)}</p></div>
        <Status status={order.status} />
      </div>

      <div className="order-detail-grid">
        <div className="checkout-card">
          <div className="card-heading"><div><span className="eyebrow">ITEMS</span><h2>What's in your order</h2></div></div>
          <div className="mini-order-list">
            {items.map((item) => (
              <div className="mini-order-item" key={item.id}>
                <div><strong>{item.name}</strong><span>{item.color} / {item.size} × {item.quantity}</span></div>
                <strong>{formatPrice(item.subtotal)}</strong>
              </div>
            ))}
          </div>
          <div className="summary-total"><span>Total</span><strong>{formatPrice(order.total_amount)}</strong></div>
        </div>

        <aside className="checkout-card">
          <span className="eyebrow">DELIVERY</span>
          <h2>{order.full_name}</h2>
          <p>{order.address_line}<br />{order.city}, {order.state} - {order.pincode}</p>
          <p>{order.phone}</p>
        </aside>
      </div>
    </section>
  );
}

export default OrderDetails;
