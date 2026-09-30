import React from "react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { formatDate, formatPrice, getErrorMessage } from "../utils/format";
import { Status } from "./Orders";
import { FormInput } from "./Login";

const emptyProduct = {
  category_id: "",
  name: "",
  description: "",
  price: "",
  stock: 0,
  gender: "",
};

const emptyVariant = { size: "", color: "", stock: 0 };

function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  function load() {
    setLoading(true);
    Promise.all([
      api.getProducts({ limit: 50 }),
      api.adminGetOrders(),
    ])
      .then(([productData, orderData]) => {
        setProducts(productData.products);
        setOrders(orderData.orders);
      })
      .catch((err) => setMessage(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    products: products.length,
    orders: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    revenue: orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
  }), [products, orders]);

  async function deleteProduct(id) {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.adminDeleteProduct(id);
      setProducts((current) => current.filter((product) => product.id !== id));
      setMessage("Product deleted.");
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  }

  async function changeStatus(id, status) {
    try {
      const data = await api.adminUpdateOrder(id, status);
      setOrders((current) => current.map((order) => order.id === id ? { ...order, ...data.order } : order));
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  }

  if (loading) return <div className="page-loader"><div className="spinner" /><p>Loading admin dashboard...</p></div>;

  return (
    <section className="container section admin-page">
      <div className="admin-heading">
        <div><span className="eyebrow">ADMIN</span><h1>Store control center</h1><p>Manage products, variants, images and order status.</p></div>
      </div>

      {message && <div className="notice">{message}</div>}

      <div className="admin-tabs">
        {["overview", "products", "orders"].map((name) => (
          <button key={name} className={tab === name ? "active" : ""} onClick={() => setTab(name)}>{name}</button>
        ))}
      </div>

      {tab === "overview" && <Overview stats={stats} orders={orders} setTab={setTab} />}
      {tab === "products" && <ProductManager products={products} setProducts={setProducts} onDelete={deleteProduct} />}
      {tab === "orders" && <OrderManager orders={orders} onStatus={changeStatus} />}
    </section>
  );
}

function Overview({ stats, orders, setTab }) {
  return (
    <>
      <div className="stats-grid">
        <Stat label="Products" value={stats.products} />
        <Stat label="Orders" value={stats.orders} />
        <Stat label="Pending" value={stats.pending} />
        <Stat label="Order value" value={formatPrice(stats.revenue)} />
      </div>
      <div className="admin-two-col">
        <div className="checkout-card">
          <div className="card-heading"><div><span className="eyebrow">RECENT</span><h2>Orders</h2></div><button className="text-button" onClick={() => setTab("orders")}>View all →</button></div>
          <div className="admin-order-list">
            {orders.slice(0, 6).map((order) => (
              <div className="admin-order-row" key={order.id}>
                <div><strong>#{order.id}</strong><span>{order.customer_name}</span></div>
                <div><strong>{formatPrice(order.total_amount)}</strong><Status status={order.status} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="checkout-card dark-card">
          <span className="eyebrow">ADMIN TOOLS</span>
          <h2>Keep the catalog healthy.</h2>
          <p>Use the product manager to create, edit or remove products and manage their images and variants.</p>
          <button className="button button-light" onClick={() => setTab("products")}>Manage products →</button>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }) {
  return <div className="stat-card"><span>{label}</span><strong>{value}</strong></div>;
}

function ProductManager({ products, setProducts, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function startCreate() {
    setEditing("new");
    setForm(emptyProduct);
    setMessage("");
  }

  function startEdit(product) {
    setEditing(product.id);
    setForm({
      category_id: "",
      name: product.name,
      description: product.description || "",
      price: product.price,
      stock: product.stock,
      gender: product.gender || "",
    });
    setMessage("");
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const body = {
        ...form,
        category_id: form.category_id ? Number(form.category_id) : undefined,
        price: Number(form.price),
        stock: Number(form.stock),
      };

      if (editing === "new") {
        if (!body.category_id) throw new Error("Category ID is required when creating a product.");
        const data = await api.adminCreateProduct(body);
        setProducts((current) => [data.product, ...current]);
        setMessage("Product created.");
      } else {
        const data = await api.adminUpdateProduct(editing, body);
        setProducts((current) => current.map((p) => p.id === editing ? { ...p, ...data.product } : p));
        setMessage("Product updated.");
      }
      setEditing(null);
    } catch (err) {
      setMessage(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-two-col products-admin">
      <div className="checkout-card">
        <div className="card-heading"><div><span className="eyebrow">CATALOG</span><h2>Products</h2></div><button className="button button-dark" onClick={startCreate}>+ New product</button></div>
        {message && <div className="notice">{message}</div>}
        <div className="table-wrap">
          <table className="admin-table">
            <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td><strong>{product.name}</strong><small>#{product.id}</small></td>
                  <td>{product.category}</td>
                  <td>{formatPrice(product.price)}</td>
                  <td>{product.stock}</td>
                  <td className="table-actions"><button onClick={() => startEdit(product)}>Edit</button><button className="danger" onClick={() => onDelete(product.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <ProductEditor
          editing={editing}
          form={form}
          setForm={setForm}
          save={save}
          busy={busy}
          onCancel={() => setEditing(null)}
          product={editing === "new" ? null : products.find((p) => p.id === editing)}
        />
      )}
    </div>
  );
}

function ProductEditor({ editing, form, setForm, save, busy, onCancel, product }) {
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);
  const [imageUrl, setImageUrl] = useState("");
  const [variant, setVariant] = useState(emptyVariant);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!product) {
      setImages([]);
      setVariants([]);
      return;
    }
    Promise.all([api.getProductImages(product.id), api.getProductVariants(product.id)])
      .then(([imageData, variantData]) => { setImages(imageData); setVariants(variantData); })
      .catch((err) => setMessage(getErrorMessage(err)));
  }, [product?.id]);

  async function addImage() {
    if (!imageUrl || !product) return;
    try {
      const data = await api.adminAddImage(product.id, imageUrl);
      setImages((current) => [...current, data.image]);
      setImageUrl("");
    } catch (err) { setMessage(getErrorMessage(err)); }
  }

  async function removeImage(imageId) {
    try {
      await api.adminDeleteImage(product.id, imageId);
      setImages((current) => current.filter((image) => image.id !== imageId));
    } catch (err) { setMessage(getErrorMessage(err)); }
  }

  async function addVariant() {
    if (!product) return;
    try {
      const data = await api.adminCreateVariant(product.id, { ...variant, stock: Number(variant.stock) });
      setVariants((current) => [...current, data.variant]);
      setVariant(emptyVariant);
    } catch (err) { setMessage(getErrorMessage(err)); }
  }

  async function deleteVariant(id) {
    try {
      await api.adminDeleteVariant(product.id, id);
      setVariants((current) => current.filter((v) => v.id !== id));
    } catch (err) { setMessage(getErrorMessage(err)); }
  }

  return (
    <div className="checkout-card editor-card">
      <div className="card-heading"><div><span className="eyebrow">{editing === "new" ? "CREATE" : "EDIT"}</span><h2>{editing === "new" ? "New product" : "Edit product"}</h2></div><button className="text-button" onClick={onCancel}>Close</button></div>
      {message && <div className="notice">{message}</div>}
      <form onSubmit={save}>
        <div className="form-grid">
          {editing === "new" && <FormInput label="Category ID" type="number" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required />}
          <FormInput label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <FormInput label="Price" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <FormInput label="Stock" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          <FormInput label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} />
        </div>
        <label className="field"><span>Description</span><textarea rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <button className="button button-dark" disabled={busy}>{busy ? "Saving..." : editing === "new" ? "Create product" : "Save changes"}</button>
      </form>

      {product && (
        <>
          <div className="editor-section">
            <span className="eyebrow">IMAGES</span><h3>Product images</h3>
            <div className="inline-form"><input placeholder="https://example.com/image.jpg" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} /><button className="button button-outline" onClick={addImage}>Add image</button></div>
            <div className="editor-images">{images.map((image) => <div key={image.id}><img src={image.image_url} alt="" /><button onClick={() => removeImage(image.id)}>×</button></div>)}</div>
          </div>

          <div className="editor-section">
            <span className="eyebrow">VARIANTS</span><h3>Sizes & colors</h3>
            <div className="variant-admin-form">
              <input placeholder="Size" value={variant.size} onChange={(e) => setVariant({ ...variant, size: e.target.value })} />
              <input placeholder="Color" value={variant.color} onChange={(e) => setVariant({ ...variant, color: e.target.value })} />
              <input type="number" min="0" placeholder="Stock" value={variant.stock} onChange={(e) => setVariant({ ...variant, stock: e.target.value })} />
              <button className="button button-outline" onClick={addVariant}>Add</button>
            </div>
            <div className="variant-admin-list">
              {variants.map((v) => <div key={v.id}><span>{v.size} / {v.color}</span><strong>{v.stock}</strong><button className="text-button danger" onClick={() => deleteVariant(v.id)}>Delete</button></div>)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function OrderManager({ orders, onStatus }) {
  return (
    <div className="checkout-card">
      <div className="card-heading"><div><span className="eyebrow">FULFILLMENT</span><h2>All orders</h2></div></div>
      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td><strong>#{order.id}</strong></td>
                <td><strong>{order.customer_name}</strong><small>{order.customer_email}</small></td>
                <td>{formatDate(order.created_at)}</td>
                <td>{formatPrice(order.total_amount)}</td>
                <td>
                  <select className="status-select" value={order.status} onChange={(e) => onStatus(order.id, e.target.value)}>
                    <option value="pending">pending</option>
                    <option value="confirmed">confirmed</option>
                    <option value="shipped">shipped</option>
                    <option value="delivered">delivered</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;
