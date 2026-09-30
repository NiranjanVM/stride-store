import React from "react";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { FormInput } from "./Login";
import { getErrorMessage } from "../utils/format";
import { AiOutlineDelete } from "react-icons/ai";
import { FiEdit } from "react-icons/fi";

const blank = { full_name: "", phone: "", address_line: "", city: "", state: "", pincode: "" };

function Account() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");

  function load() {
    api.getAddresses()
      .then(setAddresses)
      .catch((err) => setMessage(getErrorMessage(err)));
  }

  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    try {
      if (editing) {
        const data = await api.updateAddress(editing, form);
        setAddresses((current) => current.map((a) => a.id === editing ? data.address : a));
        setMessage("Address updated.");
      } else {
        const data = await api.createAddress(form);
        setAddresses((current) => [data.address, ...current]);
        setMessage("Address added.");
      }
      setForm(blank);
      setEditing(null);
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  }

  function edit(address) {
    setEditing(address.id);
    setForm({
      full_name: address.full_name,
      phone: address.phone,
      address_line: address.address_line,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    });
    window.scrollTo({ top: 250, behavior: "smooth" });
  }

  async function remove(id) {
    if (!window.confirm("Delete this address?")) return;
    try {
      await api.deleteAddress(id);
      setAddresses((current) => current.filter((a) => a.id !== id));
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  }

  return (
    <section className="container section">
      <div className="page-heading"><span className="eyebrow">ACCOUNT</span><h1>{user?.name}</h1><p>{user?.email}</p></div>
      {message && <div className="notice">{message}</div>}
      <div className="account-grid">
        <div className="checkout-card">
          <div className="card-heading"><div><span className="eyebrow">PROFILE</span><h2>Saved addresses</h2></div></div>
          <div className="address-list">
            {!addresses.length && <p className="muted">No saved addresses.</p>}
            {addresses.map((address) => (
              <div className="address-card" key={address.id}>
                <div><strong>{address.full_name}</strong><p>{address.address_line}, {address.city}, {address.state} - {address.pincode}</p><span>{address.phone}</span></div>
                <div className="inline-actions"><button className="text-button" onClick={() => edit(address)}><FiEdit /></button><button className="text-button danger" onClick={() => remove(address.id)}><AiOutlineDelete />
</button></div>
              </div>
            ))}
          </div>
        </div>
        <form className="checkout-card" onSubmit={submit}>
          <div className="card-heading"><div><span className="eyebrow">{editing ? "EDIT" : "NEW"}</span><h2>{editing ? "Edit address" : "Add address"}</h2></div>{editing && <button type="button" className="text-button" onClick={() => { setEditing(null); setForm(blank); }}>Cancel</button>}</div>
          <div className="form-grid">
            <FormInput label="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            <FormInput label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            <FormInput label="Address" value={form.address_line} onChange={(e) => setForm({ ...form, address_line: e.target.value })} required />
            <FormInput label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            <FormInput label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
            <FormInput label="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} required />
          </div>
          <button className="button button-dark">{editing ? "Update address" : "Save address"}</button>
        </form>
      </div>
    </section>
  );
}

export default Account;
