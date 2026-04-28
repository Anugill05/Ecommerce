import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/layout/Navbar";
import { ProtectedRoute, AdminRoute } from "./components/common/ProtectedRoute";
import "./styles/global.css";

import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: "#fff",
                color: "#212121",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                fontSize: "14px",
                fontFamily: "'Inter', sans-serif",
              },
              success: {
                iconTheme: { primary: "#388e3c", secondary: "#fff" },
              },
              error: {
                iconTheme: { primary: "#d32f2f", secondary: "#fff" },
              },
            }}
          />
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route
              path="/cart"
              element={<ProtectedRoute><CartPage /></ProtectedRoute>}
            />
            <Route
              path="/orders"
              element={<ProtectedRoute><OrdersPage /></ProtectedRoute>}
            />
            <Route
              path="/admin"
              element={<AdminRoute><AdminPage /></AdminRoute>}
            />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
