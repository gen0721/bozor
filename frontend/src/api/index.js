import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://bozor-bozor.up.railway.app//api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor — auto-attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('marketplace_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('marketplace_token');
      delete api.defaults.headers.common['Authorization'];
    }
    return Promise.reject(error);
  }
);

// ---- Auth ----
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// ---- Listings ----
export const listingsAPI = {
  getAll: (params) => api.get('/listings', { params }),
  getById: (id) => api.get(`/listings/${id}`),
  create: (data) => api.post('/listings', data),
  update: (id, data) => api.put(`/listings/${id}`, data),
  delete: (id) => api.delete(`/listings/${id}`),
  getByUser: (userId) => api.get(`/listings/user/${userId}`),
};

// ---- Categories ----
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
};

// ---- Favorites ----
export const favoritesAPI = {
  getAll: () => api.get('/favorites'),
  add: (listingId) => api.post(`/favorites/${listingId}`),
  remove: (listingId) => api.delete(`/favorites/${listingId}`),
};

// ---- Messages ----
export const messagesAPI = {
  getConversations: () => api.get('/messages'),
  getMessages: (userId) => api.get(`/messages/${userId}`),
  send: (data) => api.post('/messages', data),
};

// ---- Users ----
export const usersAPI = {
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  addReview: (data) => api.post('/reviews', data),
};

// ---- Stats ----
export const statsAPI = {
  get: () => api.get('/stats'),
};

// ---- Admin ----
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  banUser: (id) => api.put(`/admin/users/${id}/ban`),
  toggleAdmin: (id) => api.put(`/admin/users/${id}/admin`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getListings: (params) => api.get('/admin/listings', { params }),
  setListingStatus: (id, status) => api.put(`/admin/listings/${id}/status`, { status }),
  togglePremium: (id) => api.put(`/admin/listings/${id}/premium`),
  deleteListing: (id) => api.delete(`/admin/listings/${id}`),
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
};

export default api;
