import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('lhm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('lhm_token');
      localStorage.removeItem('lhm_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export const personnelAPI = {
  list: (params) => api.get('/personnel', { params }),
  get: (id) => api.get(`/personnel/${id}`),
  create: (data) => api.post('/personnel', data),
  update: (id, data) => api.put(`/personnel/${id}`, data),
  delete: (id) => api.delete(`/personnel/${id}`),
  stats: () => api.get('/personnel/stats/summary'),
};

export const volunteersAPI = {
  list: (params) => api.get('/volunteers', { params }),
  get: (id) => api.get(`/volunteers/${id}`),
  create: (data) => api.post('/volunteers', data),
  update: (id, data) => api.put(`/volunteers/${id}`, data),
  delete: (id) => api.delete(`/volunteers/${id}`),
  stats: () => api.get('/volunteers/stats/summary'),
};

export const stockAPI = {
  categories: () => api.get('/stock/categories'),
  items: (params) => api.get('/stock/items', { params }),
  getItem: (id) => api.get(`/stock/items/${id}`),
  createItem: (data) => api.post('/stock/items', data),
  updateItem: (id, data) => api.put(`/stock/items/${id}`, data),
  movements: (params) => api.get('/stock/movements', { params }),
  addMovement: (data) => api.post('/stock/movements', data),
  stats: () => api.get('/stock/stats/summary'),
};

export const projectsAPI = {
  list: (params) => api.get('/projects', { params }),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
};

export const absencesAPI = {
  list: (params) => api.get('/absences', { params }),
  create: (data) => api.post('/absences', data),
  validate: (id, data) => api.put(`/absences/${id}/validate`, data),
};

export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats'),
  alerts: () => api.get('/dashboard/alerts'),
  audit: () => api.get('/dashboard/audit'),
};

export const servicesAPI = { list: () => api.get('/services') };

export const usersAPI = {
  list: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  unlock: (id) => api.put(`/users/${id}/unlock`),
};

export default api;
