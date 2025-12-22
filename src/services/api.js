import axios from 'axios';

const API_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://backend-mlst-1.onrender.com/api'
    : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    const url = String(config.url || '');
    const isAdmin = url.startsWith('/admin');
    const isCustomer = url.startsWith('/auth') || url.startsWith('/orders');

    if (isAdmin) {
      const token = localStorage.getItem('adminToken');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } else if (isCustomer) {
      const token = localStorage.getItem('customerToken');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Produtos
export const getProducts = (params) => api.get('/products', { params });
export const getProductBySlug = (slug) => api.get(`/products/${slug}`);
export const createProduct = (formData) => api.post('/products', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateProduct = (id, formData) => api.put(`/products/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Admin
export const adminLogin = (credentials) => api.post('/admin/login', credentials);
export const verifyAdmin = () => api.get('/admin/verify');
export const getAdminUsers = (params) => api.get('/admin/users', { params });
export const deleteAdminUser = (userId) => api.delete(`/admin/users/${userId}`);
export const adminSetCustomerPassword = (userId, password) => api.put(`/admin/users/${userId}/password`, { password });
export const adminResetCustomerPassword = (userId) => api.post(`/admin/users/${userId}/reset-password`);
export const adminVerifyCustomerPassword = (userId, password) => api.post(`/admin/users/${userId}/verify-password`, { password });

// Settings
export const getPublicSettings = () => api.get('/settings/public');
export const getAdminSettings = () => api.get('/admin/settings');
export const updateAdminSettings = (payload) => api.put('/admin/settings', payload);

// Orders
export const createOrder = (payload) => api.post('/orders', payload);
export const getAdminOrders = (params) => api.get('/admin/orders', { params });
export const updateAdminOrder = (id, payload) => api.put(`/admin/orders/${id}`, payload);
export const deleteAdminOrder = (id) => api.delete(`/admin/orders/${id}`);

// Customer Auth
export const customerRegister = (payload) => api.post('/auth/register', payload)
export const customerRegisterLogin = (payload) => api.post('/auth/register/login', payload);
export const customerLogin = (payload) => api.post('/auth/register/login', payload);
export const customerMe = () => api.get('/auth/me');

export default api;
