import React from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { formatPrice, getErrorMessage } from "../utils/format";
import { FormInput } from "./Login";

const emptyAddress = {
  full_name: "",
  phone: "",
  address_line: "",
  city: "",
  state: "",
  pincode: "",
};

function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [newAddress, setNewAddress] = useState(emptyAddress);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    Promise.all([api.getCart(), api.getAddresses()])
      .then(([cartData, addressData]) => {
        setCart(cartData);
        setAddresses(addressData);
        if (addressData[0]) setSelectedAddress(String(addressData[0].id));
      })
      .catch((err) => setMessage(getErrorMessage(err)));
  }, []);

  async function saveAddress(event) {
    event.preventDefault();
    try {
      const data = await api.createAddress(newAddress);
      setAddresses((current) => [data.address, ...current]);
      setSelectedAddress(String(data.address.id));
      setNewAddress(emptyAddress);
      setShowForm(false);
      setMessage("Address saved.");
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  }

  async function placeOrder() {
    if (!selectedAddress) {
      setMessage("Select or add a delivery address.");
      return;
    }
    setPlacing(true);
    try {
      const data = await api.createOrder(Number(selectedAddress));
      navigate(`/orders/${data.order.id}`);
    } catch (err) {
      setMessage(getErrorMessage(err));
    } finally {
      setPlacing(false);
    }
  }

  if (!cart) return <div className="page-loader"><div className="spinner" /><p>Preparing checkout...</p></div>;

  if (!cart.items.length) return <div className="container empty-state section"><h1>Your cart is empty</h1><Link to="/shop" className="button button-dark">Shop now</Link></div>;

  return (
    <section className="container section">
      <div className="page-heading"><span className="eyebrow">CHECKOUT</span><h1>Complete your order</h1></div>
      {message && <div className="notice">{message}</div>}
      <div className="checkout-layout">
        <div>
          <div className="checkout-card">
            <div className="card-heading"><div><span className="eyebrow">STEP 01</span><h2>Delivery address</h2></div><button className="text-button" onClick={() => setShowForm((open) => !open)}>{showForm ? "Cancel" : "+ Add new"}</button></div>

            {showForm && (
              <form className="address-form" onSubmit={saveAddress}>
                <div className="form-grid">
                  <FormInput label="Full name" value={newAddress.full_name} onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })} required />
                  <FormInput label="Phone" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} required />
                  <FormInput label="Address" value={newAddress.address_line} onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })} required />
                  <FormInput label="City" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} required />
                  <FormInput label="State" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} required />
                  <FormInput label="Pincode" value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} required />
                </div>
                <button className="button button-dark">Save address</button>
              </form>
            )}

            <div className="address-list">
              {addresses.map((address) => (
                <label className={`address-card ${selectedAddress === String(address.id) ? "selected" : ""}`} key={address.id}>
                  <input type="radio" name="address" value={address.id} checked={selectedAddress === String(address.id)} onChange={(e) => setSelectedAddress(e.target.value)} />
                  <div><strong>{address.full_name}</strong><p>{address.address_line}, {address.city}, {address.state} - {address.pincode}</p><span>{address.phone}</span></div>
                </label>
              ))}
              {!addresses.length && !showForm && <div className="notice">You do not have a saved address yet. Click “+ Add new”.</div>}
            </div>
          </div>

          <div className="checkout-card">
            <div className="card-heading"><div><span className="eyebrow">STEP 02</span><h2>Order items</h2></div></div>
            <div className="mini-order-list">
              {cart.items.map((item) => (
                <div className="mini-order-item" key={item.id}>
                  <div><strong>{item.name}</strong><span>{item.color} / {item.size} × {item.quantity}</span></div>
                  <strong>{formatPrice(item.subtotal)}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="summary-card sticky">
          <span className="eyebrow">ORDER TOTAL</span>
          <h2>{formatPrice(cart.total)}</h2>
          <p className="muted">There is no payment gateway in the supplied backend. Placing the order creates the order and reserves stock.</p>
          <button className="button button-dark button-full" disabled={placing || !selectedAddress} onClick={placeOrder}>{placing ? "Placing order..." : "Place order"}</button>
          <Link to="/cart" className="text-link centered">← Back to cart</Link>
        </aside>
      </div>
    </section>
  );
}

export default Checkout;
