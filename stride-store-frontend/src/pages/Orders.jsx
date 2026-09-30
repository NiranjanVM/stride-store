import React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { formatDate, formatPrice, getErrorMessage } from "../utils/format";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.getOrders().then((data) => setOrders(data.orders)).catch((err) => setMessage(getErrorMessage(err)));
  }, []);

  return (
    <section className="container section">
      <div className="page-heading"><span className="eyebrow">ACCOUNT</span><h1>Your orders</h1></div>
      {message && <div className="notice">{message}</div>}
      {!orders.length ? (
        <div className="empty-state"><div className="empty-icon">□</div><h2>No orders yet</h2><p>Your completed orders will appear here.</p><Link className="button button-dark" to="/shop">Start shopping</Link></div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <Link className="order-row" to={`/orders/${order.id}`} key={order.id}>
              <div><span className="eyebrow">ORDER #{order.id}</span><strong>{formatDate(order.created_at)}</strong></div>
              <div><strong>{formatPrice(order.total_amount)}</strong><Status status={order.status} /></div>
              <span className="order-arrow">→</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function Status({ status }) {
  return <span className={`status status-${status}`}>{status}</span>;
}

export default Orders;
