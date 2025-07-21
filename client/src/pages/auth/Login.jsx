import { useState } from 'react';
import { loginUser } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await loginUser(form);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);
      navigate(`/dashboard/${user.role}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-red-700 tracking-tight drop-shadow-sm">
          Welcome back to <span className="text-black">CARNIVORS</span> 🥩
        </h1>
        <p className="mt-2 text-sm text-gray-600">Log in to get your meat fix 😋</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg space-y-6"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800">Login</h2>

        <div>
          <label className="block mb-1 text-sm text-gray-600">Email</label>
          <input
            name="email"
            placeholder="Enter your email"
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 transition"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm text-gray-600">Password</label>
          <input
            name="password"
            type="password"
            placeholder="Enter your password"
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 transition"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition"
        >
          Login
        </button>

        <p className="text-center text-sm text-gray-600">
          Don’t have an account?{' '}
          <a href="/register" className="text-red-600 hover:underline font-medium">
            Register here
          </a>
        </p>
      </form>
    </div>
  );
}
