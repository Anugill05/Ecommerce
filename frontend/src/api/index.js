// // import axios from "axios";

// // const api = axios.create({
// //   baseURL: process.env.REACT_APP_API_URL || "/api",
// //   timeout: 15000,
// //   headers: { "Content-Type": "application/json" },
// // });

// // // Attach JWT on every request
// // api.interceptors.request.use(
// //   (config) => {
// //     const token = localStorage.getItem("fk_token");
// //     if (token) config.headers.Authorization = `Bearer ${token}`;
// //     return config;
// //   },
// //   (err) => Promise.reject(err)
// // );

// // // Normalize errors
// // api.interceptors.response.use(
// //   (res) => res,
// //   (err) => {
// //     const message =
// //       err.response?.data?.message ||
// //       (err.code === "ECONNABORTED" ? "Request timed out. Please try again." : null) ||
// //       err.message ||
// //       "Something went wrong";
// //     return Promise.reject(new Error(message));
// //   }
// // );

// // // ── Auth ──────────────────────────────────────────────────────────────────────
// // export const sendOtp = (phone) => api.post("/auth/send-otp", { phone });
// // export const verifyOtp = (data) => api.post("/auth/verify-otp", data);
// // export const adminLogin = (data) => api.post("/auth/admin/login", data);
// // export const getMe = () => api.get("/auth/me");
// // export const updateMe = (data) => api.patch("/auth/me", data);

// // // ── Products ──────────────────────────────────────────────────────────────────
// // export const getProducts = (params) => api.get("/products", { params });
// // export const getFeatured = () => api.get("/products/featured");
// // export const getFlashSales = () => api.get("/products/flash-sales");
// // export const getProduct = (id) => api.get(`/products/${id}`);
// // export const adminGetProducts = (params) => api.get("/products/admin/all", { params });
// // export const createProduct = (data) => api.post("/products", data);
// // export const updateProduct = (id, data) => api.patch(`/products/${id}`, data);
// // export const deleteProduct = (id) => api.delete(`/products/${id}`);
// // export const setFlashSale = (id, data) => api.post(`/products/${id}/flash-sale`, data);
// // export const cancelFlashSale = (id) => api.delete(`/products/${id}/flash-sale`);

// // // ── Cart ──────────────────────────────────────────────────────────────────────
// // export const getCart = () => api.get("/cart");
// // export const addToCart = (data) => api.post("/cart", data);
// // export const updateCartItem = (productId, data) => api.patch(`/cart/${productId}`, data);
// // export const removeFromCart = (productId) => api.delete(`/cart/${productId}`);
// // export const clearCart = () => api.delete("/cart");

// // // ── Orders ────────────────────────────────────────────────────────────────────
// // export const createOrder = (data) => api.post("/orders", data);
// // export const verifyPayment = (data) => api.post("/orders/verify-payment", data);
// // export const createFlashOrder = (data) => api.post("/orders/flash", data);
// // export const verifyFlashPayment = (data) => api.post("/orders/flash/verify-payment", data);
// // export const getMyOrders = (params) => api.get("/orders/my", { params });
// // export const getOrder = (id) => api.get(`/orders/${id}`);
// // export const adminGetOrders = (params) => api.get("/orders/admin/all", { params });
// // export const updateOrderStatus = (id, status) => api.patch(`/orders/admin/${id}/status`, { status });

// // export default api;


// import axios from "axios";

// // ─────────────────────────────────────────────
// // Axios Instance
// // ─────────────────────────────────────────────
// const api = axios.create({
//   baseURL: process.env.REACT_APP_API_URL || "/api",
//   timeout: 15000,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // ─────────────────────────────────────────────
// // Attach JWT token automatically
// // ─────────────────────────────────────────────
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("fk_token");
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // ─────────────────────────────────────────────
// // Normalize errors
// // ─────────────────────────────────────────────
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     const message =
//       error.response?.data?.message ||
//       (error.code === "ECONNABORTED"
//         ? "Request timed out. Please try again."
//         : null) ||
//       error.message ||
//       "Something went wrong";

//     return Promise.reject(new Error(message));
//   }
// );

// // ─────────────────────────────────────────────
// // AUTH APIs
// // ─────────────────────────────────────────────
// export const sendOtp = async (phone) => {
//   const res = await api.post("/auth/send-otp", { phone });
//   return res.data;
// };

// export const verifyOtp = async (data) => {
//   const res = await api.post("/auth/verify-otp", data);
//   return res.data;
// };

// export const adminLogin = async (data) => {
//   const res = await api.post("/auth/admin/login", data);
//   return res.data;
// };

// export const getMe = async () => {
//   const res = await api.get("/auth/me");
//   return res.data;
// };

// export const updateMe = async (data) => {
//   const res = await api.patch("/auth/me", data);
//   return res.data;
// };

// // ─────────────────────────────────────────────
// // PRODUCTS APIs
// // ─────────────────────────────────────────────
// export const getProducts = async (params) => {
//   const res = await api.get("/products", { params });
//   return res.data;
// };

// export const getFeatured = async () => {
//   const res = await api.get("/products/featured");
//   return res.data;
// };

// export const getFlashSales = async () => {
//   const res = await api.get("/products/flash-sales");
//   return res.data;
// };

// export const getProduct = async (id) => {
//   const res = await api.get(`/products/${id}`);
//   return res.data;
// };

// export const adminGetProducts = async (params) => {
//   const res = await api.get("/products/admin/all", { params });
//   return res.data;
// };

// export const createProduct = async (data) => {
//   const res = await api.post("/products", data);
//   return res.data;
// };

// export const updateProduct = async (id, data) => {
//   const res = await api.patch(`/products/${id}`, data);
//   return res.data;
// };

// export const deleteProduct = async (id) => {
//   const res = await api.delete(`/products/${id}`);
//   return res.data;
// };

// export const setFlashSale = async (id, data) => {
//   const res = await api.post(`/products/${id}/flash-sale`, data);
//   return res.data;
// };

// export const cancelFlashSale = async (id) => {
//   const res = await api.delete(`/products/${id}/flash-sale`);
//   return res.data;
// };

// // ─────────────────────────────────────────────
// // CART APIs
// // ─────────────────────────────────────────────
// export const getCart = async () => {
//   const res = await api.get("/cart");
//   return res.data;
// };

// export const addToCart = async (data) => {
//   const res = await api.post("/cart", data);
//   return res.data;
// };

// export const updateCartItem = async (productId, data) => {
//   const res = await api.patch(`/cart/${productId}`, data);
//   return res.data;
// };

// export const removeFromCart = async (productId) => {
//   const res = await api.delete(`/cart/${productId}`);
//   return res.data;
// };

// export const clearCart = async () => {
//   const res = await api.delete("/cart");
//   return res.data;
// };

// // ─────────────────────────────────────────────
// // ORDERS APIs
// // ─────────────────────────────────────────────
// export const createOrder = async (data) => {
//   const res = await api.post("/orders", data);
//   return res.data;
// };

// export const verifyPayment = async (data) => {
//   const res = await api.post("/orders/verify-payment", data);
//   return res.data;
// };

// export const createFlashOrder = async (data) => {
//   const res = await api.post("/orders/flash", data);
//   return res.data;
// };

// export const verifyFlashPayment = async (data) => {
//   const res = await api.post("/orders/flash/verify-payment", data);
//   return res.data;
// };

// export const getMyOrders = async (params) => {
//   const res = await api.get("/orders/my", { params });
//   return res.data;
// };

// export const getOrder = async (id) => {
//   const res = await api.get(`/orders/${id}`);
//   return res.data;
// };

// export const adminGetOrders = async (params) => {
//   const res = await api.get("/orders/admin/all", { params });
//   return res.data;
// };

// export const updateOrderStatus = async (id, status) => {
//   const res = await api.patch(`/orders/admin/${id}/status`, { status });
//   return res.data;
// };

// // ─────────────────────────────────────────────
// // Export instance (optional use)
// // ─────────────────────────────────────────────
// export default api;


import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("fk_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// Normalize error messages
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("fk_token");
      localStorage.removeItem("fk_user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    const message =
      err.response?.data?.message ||
      (err.code === "ECONNABORTED" ? "Request timed out. Please try again." : null) ||
      err.message ||
      "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
// Firebase login — send Firebase ID token, receive our JWT
export const firebaseLogin = (data) => api.post("/auth/firebase-login", data);
export const adminLogin    = (data) => api.post("/auth/admin/login", data);
export const getMe         = ()     => api.get("/auth/me");
export const updateMe      = (data) => api.patch("/auth/me", data);

// ── Products ──────────────────────────────────────────────────────────────────
export const getProducts      = (params) => api.get("/products", { params });
export const getFeatured      = ()       => api.get("/products/featured");
export const getFlashSales    = ()       => api.get("/products/flash-sales");
export const getProduct       = (id)     => api.get(`/products/${id}`);
export const adminGetProducts = (params) => api.get("/products/admin/all", { params });
export const createProduct    = (data)   => api.post("/products", data);
export const updateProduct    = (id, data) => api.patch(`/products/${id}`, data);
export const deleteProduct    = (id)     => api.delete(`/products/${id}`);
export const setFlashSale     = (id, data) => api.post(`/products/${id}/flash-sale`, data);
export const cancelFlashSale  = (id)     => api.delete(`/products/${id}/flash-sale`);

// ── Cart ──────────────────────────────────────────────────────────────────────
export const getCart        = ()           => api.get("/cart");
export const addToCart      = (data)       => api.post("/cart", data);
export const updateCartItem = (pid, qty)   => api.patch(`/cart/${pid}`, { quantity: qty });
export const removeFromCart = (pid)        => api.delete(`/cart/${pid}`);
export const clearCart      = ()           => api.delete("/cart");

// ── Orders ────────────────────────────────────────────────────────────────────
export const createOrder       = (data)   => api.post("/orders", data);
export const verifyPayment     = (data)   => api.post("/orders/verify-payment", data);
export const createFlashOrder  = (data)   => api.post("/orders/flash", data);
export const verifyFlashPayment = (data)  => api.post("/orders/flash/verify-payment", data);
export const getMyOrders       = (params) => api.get("/orders/my", { params });
export const getOrder          = (id)     => api.get(`/orders/${id}`);
export const adminGetOrders    = (params) => api.get("/orders/admin/all", { params });
export const updateOrderStatus = (id, status) => api.patch(`/orders/admin/${id}/status`, { status });

// ── Payment (dedicated routes) ────────────────────────────────────────────────
export const createPaymentOrder    = (data)        => api.post("/payment/create-order", data);
export const verifyRazorpayPayment = (data)        => api.post("/payment/verify", data);
export const getPaymentStatus      = (orderId)     => api.get(`/payment/status/${orderId}`);
export const issueRefund           = (pid, data)   => api.post(`/payment/refund/${pid}`, data);

export default api;