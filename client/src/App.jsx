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
import CartPage from "./pages/customer/CartPage"; // Add this import

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

function App() {
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={token ? `/dashboard/${role}` : `/login`} />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* All routes below will have Header and Footer */}
        <Route element={<Layout />}>
          {/* Routes protected by auth */}
          <Route element={<ProtectedRoute />}>
            {/* Profile pages */}
            <Route path="/profile/customer" element={<CustomerProfile />} />
            <Route path="/profile/shop" element={<ShopProfile />} />
            <Route path="/profile/delivery" element={<DeliveryProfile />} />

            {/* Dashboards */}
            <Route path="/dashboard/customer" element={<CustomerDashboard />} />
            <Route path="/dashboard/shop" element={<ShopDashboard />} />
            <Route path="/dashboard/delivery" element={<DeliveryDashboard />} />

            {/* Other protected pages */}
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} /> {/* Add this route */}
          </Route>
        </Route>
      </Routes>
      <ToastContainer />
    </>
  );
}

export default App;