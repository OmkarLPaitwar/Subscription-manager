import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

<<<<<<< HEAD

=======
// ─── Request interceptor: attach token ────────────────────────────────────────
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, err => Promise.reject(err));

<<<<<<< HEAD

=======
// ─── Response interceptor: auto-refresh token ─────────────────────────────────
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && err.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (_) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

<<<<<<< HEAD

=======
// ─── Auth ──────────────────────────────────────────────────────────────────────
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
export const authAPI = {
  register:       data => api.post('/auth/register', data),
  login:          data => api.post('/auth/login', data),
  googleAuth:     data => api.post('/auth/google', data),
  logout:         ()   => api.post('/auth/logout'),
  getMe:          ()   => api.get('/auth/me'),
  forgotPassword: data => api.post('/auth/forgot-password', data),
  resetPassword:  (token, data) => api.put(`/auth/reset-password/${token}`, data),
};

<<<<<<< HEAD

=======
// ─── Subscriptions ────────────────────────────────────────────────────────────
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
export const subscriptionAPI = {
  getAll:       params => api.get('/subscriptions', { params }),
  getOne:       id     => api.get(`/subscriptions/${id}`),
  create:       data   => api.post('/subscriptions', data),
  update:       (id, data) => api.put(`/subscriptions/${id}`, data),
  remove:       id     => api.delete(`/subscriptions/${id}`),
  updateStatus: (id, status) => api.patch(`/subscriptions/${id}/status`, { status }),
  getSummary:   ()     => api.get('/subscriptions/summary'),
  getUpcoming:  days   => api.get('/subscriptions/upcoming', { params: { days } }),
  bulkImport:   data   => api.post('/subscriptions/bulk-import', data),
};

<<<<<<< HEAD

=======
// ─── Analytics ────────────────────────────────────────────────────────────────
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
export const analyticsAPI = {
  monthlySpend:       months => api.get('/analytics/monthly-spend', { params: { months } }),
  categoryBreakdown:  ()     => api.get('/analytics/category-breakdown'),
  forecast:           ()     => api.get('/analytics/forecast'),
  renewalCalendar:    (year, month) => api.get('/analytics/renewal-calendar', { params: { year, month } }),
  topSubscriptions:   limit  => api.get('/analytics/top-subscriptions', { params: { limit } }),
};

<<<<<<< HEAD

=======
// ─── AI ───────────────────────────────────────────────────────────────────────
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
export const aiAPI = {
  chat:       (message, history) => api.post('/ai/chat', { message, history }),
  analyze:    () => api.get('/ai/analyze'),
  getInsights:() => api.get('/ai/insights'),
};

<<<<<<< HEAD

=======
// ─── Notifications ────────────────────────────────────────────────────────────
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
export const notificationAPI = {
  getAll:        params => api.get('/notifications', { params }),
  markRead:      id     => api.patch(`/notifications/${id}/read`),
  markAllRead:   ()     => api.patch('/notifications/mark-all-read'),
  remove:        id     => api.delete(`/notifications/${id}`),
  unreadCount:   ()     => api.get('/notifications/unread-count'),
};

<<<<<<< HEAD

=======
// ─── Billing ──────────────────────────────────────────────────────────────────
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
export const billingAPI = {
  getCurrentPlan: () => api.get('/billing/current-plan'),
  getPlans:       () => api.get('/billing/plans'),
  upgrade:        plan => api.post('/billing/upgrade', { plan }),
};

<<<<<<< HEAD

=======
// ─── Users ────────────────────────────────────────────────────────────────────
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
export const userAPI = {
  updateProfile:     data => api.put('/users/profile', data),
  updatePreferences: data => api.put('/users/preferences', data),
  changePassword:    data => api.put('/users/change-password', data),
  deleteAccount:     ()   => api.delete('/users/account'),
};

export default api;
