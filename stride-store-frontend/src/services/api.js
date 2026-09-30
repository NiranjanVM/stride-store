const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.message || "Something went wrong");
    error.status = response.status;
    throw error;
  }

  return data;
}

function queryString(params) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, value);
    }
  });

  const result = searchParams.toString();
  return result ? `?${result}` : "";
}

export const api = {
  register: (body) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(body) }),

  login: (body) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(body) }),

  profile: () => request("/profile"),

  getProducts: (params = {}) =>
    request(`/products${queryString(params)}`),

  getCategories: () => request("/categories"),

  getProduct: (id) => request(`/products/${id}`),

  getProductImages: (productId) =>
    request(`/products/${productId}/images`),

  getProductVariants: (productId) =>
    request(`/products/${productId}/variants`),

  addToCart: (body) =>
    request("/cart", { method: "POST", body: JSON.stringify(body) }),

  getCart: () => request("/cart"),

  updateCartItem: (id, quantity) =>
    request(`/cart/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    }),

  removeCartItem: (id) =>
    request(`/cart/${id}`, { method: "DELETE" }),

  addToWishlist: (product_id) =>
    request("/wishlist", {
      method: "POST",
      body: JSON.stringify({ product_id }),
    }),

  getWishlist: () => request("/wishlist"),

  removeFromWishlist: (id) =>
    request(`/wishlist/${id}`, { method: "DELETE" }),

  getAddresses: () => request("/addresses"),

  createAddress: (body) =>
    request("/addresses", { method: "POST", body: JSON.stringify(body) }),

  updateAddress: (id, body) =>
    request(`/addresses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deleteAddress: (id) =>
    request(`/addresses/${id}`, { method: "DELETE" }),

  createOrder: (address_id) =>
    request("/orders", {
      method: "POST",
      body: JSON.stringify({ address_id }),
    }),

  getOrders: () => request("/orders"),

  getOrder: (id) => request(`/orders/${id}`),

  adminGetOrders: () => request("/admin/orders"),

  adminUpdateOrder: (id, status) =>
    request(`/admin/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  adminCreateProduct: (body) =>
    request("/products", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  adminUpdateProduct: (id, body) =>
    request(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  adminDeleteProduct: (id) =>
    request(`/products/${id}`, { method: "DELETE" }),

  adminAddImage: (productId, image_url) =>
    request(`/products/${productId}/images`, {
      method: "POST",
      body: JSON.stringify({ image_url }),
    }),

  adminDeleteImage: (productId, imageId) =>
    request(`/products/${productId}/images/${imageId}`, {
      method: "DELETE",
    }),

  adminCreateVariant: (productId, body) =>
    request(`/products/${productId}/variants`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  adminUpdateVariant: (productId, variantId, body) =>
    request(`/products/${productId}/variants/${variantId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  adminDeleteVariant: (productId, variantId) =>
    request(`/products/${productId}/variants/${variantId}`, {
      method: "DELETE",
    }),
};

export { API_URL };
