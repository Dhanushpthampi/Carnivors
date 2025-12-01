import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import ShopDashboard from "./pages/shop/ShopDashboard";
import DeliveryDashboard from "./pages/delivery/DeliveryDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ProductDetailPage from "./pages/customer/ProductDetailPage";
import CustomerProfile from "./pages/profile/CustomerProfile";
import ShopProfile from "./pages/profile/ShopProfile";
import DeliveryProfile from "./pages/profile/DeliveryProfile";
import Layout from "./components/Layout";
import CartPage from "./pages/customer/CartPage";
import OrdersPage from "./pages/customer/OrdersPage";
import ShopOrderDashboard from "./pages/shop/ShopOrderDashboard";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ScrollToTop from "./components/ScrollToTop";

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* All routes below will have Header and Footer */}
        <Route element={<Layout />}>
          {/* Public Routes with Layout */}
          <Route path="/" element={<CustomerDashboard />} />
          <Route path="/dashboard/customer" element={<CustomerDashboard />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />

          {/* Routes protected by auth */}
          <Route element={<ProtectedRoute />}>
            {/* Profile pages */}
            <Route path="/profile/customer" element={<CustomerProfile />} />
            <Route path="/profile/shop" element={<ShopProfile />} />
            <Route path="/profile/delivery" element={<DeliveryProfile />} />

            {/* Dashboards */}
            <Route path="/dashboard/shop" element={<ShopDashboard />} />
            <Route path="/dashboard/delivery" element={<DeliveryDashboard />} />

            {/* Other protected pages */}
            <Route path="/cart" element={<CartPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/shop-orders" element={<ShopOrderDashboard />} />
          </Route>
        </Route>
      </Routes>
      <ToastContainer />
    </>
  );
}

export default App;