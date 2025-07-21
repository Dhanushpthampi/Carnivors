import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getMe } from '../utils/auth';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Header() {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef();

  // Fetch user on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getMe(token)
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.clear();
          setUser(null);
        });
    }
  }, []);

  // Fetch cart items and count
  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await axios.get(`${API_BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setCartItems(res.data.items || []);
        setCartCount(res.data.totalItems || 0);
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
    }
  };

  // Fetch cart when user changes
  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setCartItems([]);
    setCartCount(0);
    navigate('/login');
  };

  return (
    <header className="bg-white/90 backdrop-blur sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Brand */}
        <Link to="/" className="text-2xl font-bold text-gray-900 tracking-tight hover:opacity-80 transition">
          CARNIVORS<span role="img" aria-label="meat">🥩</span>
        </Link>

        {/* Navigation */}
        <nav className="space-x-6 hidden sm:flex items-center text-sm font-medium">
          <NavLink to="/" label="Home" currentPath={location.pathname} />
          <NavLink to="/orders" label="Orders" currentPath={location.pathname} />
          {user && (
            <NavLink to={`/profile/${user.role}`} label="Profile" currentPath={location.pathname} />
          )}
        </nav>

        {/* Right side: Cart + Profile/Login */}
        <div className="flex items-center gap-4">
          {/* Cart Icon (only show if user is logged in) */}
          {user && (
            <Link to="/cart" className="relative group p-1.5 rounded-full hover:bg-gray-100 transition">
              <CartIcon className="w-6 h-6 text-gray-700 group-hover:text-blue-600" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] leading-4 min-w-[1.15rem] px-1 rounded-full text-center font-bold shadow-lg animate-pulse">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          )}

          {/* Login / Profile Dropdown */}
          {!user ? (
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 active:scale-[.97] shadow-sm transition text-sm sm:text-base"
            >
              Login
            </Link>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-gray-800 bg-gray-100 hover:bg-gray-200 active:scale-[.97] transition font-medium shadow-sm"
              >
                <span className="capitalize text-sm sm:text-base">
                  {user.name.split(' ')[0]}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl z-50 border border-gray-100/50 backdrop-blur-sm animate-fade-in overflow-hidden">
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-semibold text-gray-900 truncate">{user.name}</p>
                        <p className="text-sm text-gray-600 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <button
                      onClick={() => {
                        localStorage.clear();
                        navigate('/login');
                      }}
                      className="w-full px-6 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition flex items-center space-x-3"
                    >
                      <span className="text-lg">🔁</span>
                      <span className="font-medium">Switch Account</span>
                    </button>

                    <div className="mx-4 border-t border-gray-100"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full px-6 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition flex items-center space-x-3"
                    >
                      <span className="text-lg">🚪</span>
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// -----------
// NavLink Component with active highlighting
// -----------
function NavLink({ to, label, currentPath }) {
  const isActive = currentPath === to;
  return (
    <Link
      to={to}
      className={`relative group px-1 py-0.5 transition-colors ${
        isActive ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-blue-600'
      }`}
    >
      <span
        className={`absolute bottom-0 left-0 h-0.5 w-full bg-blue-600 transition-opacity ${
          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      />
      {label}
    </Link>
  );
}

// -----------
// Cart Icon SVG
// -----------
function CartIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.6 13.3a2 2 0 002 1.7h9.7a2 2 0 001.98-1.64L23 6H6" />
    </svg>
  );
}