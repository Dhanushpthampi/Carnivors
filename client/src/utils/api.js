import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Products
export const addProduct = (data) => API.post('/products', data);
export const getProducts = (category) =>
  API.get('/products', { params: { category } });
export const getProductById = (id) => API.get(`/products/${id}`);
