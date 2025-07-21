import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getMe = (token) =>
  API.get('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
