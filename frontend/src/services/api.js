import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach Firebase ID tokens or bypass headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('wab_token');
    const bypassUid = localStorage.getItem('wab_bypass_uid');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (bypassUid) {
      // In development bypass mode, we send the bypass uid as the token
      config.headers.Authorization = `Bearer ${bypassUid}`;
      config.headers['x-bypass-uid'] = bypassUid;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Endpoints Mapping
export const authAPI = {
  sync: (role) => api.post('/auth/sync', { role }),
  health: () => api.get('/health')
};

export const profileAPI = {
  getMe: () => api.get('/profiles/me'),
  upsertClient: (data) => api.post('/profiles/client', data),
  upsertMaid: (data) => api.post('/profiles/maid', data)
};

export const discoveryAPI = {
  getMaids: (params) => api.get('/discovery/maids', { params }),
  getServices: () => api.get('/admin/services') // Used for list filters and dropdowns
};

export const bookingAPI = {
  getMyBookings: () => api.get('/bookings/my'),
  initializeThread: (maidProfileId) => api.post('/bookings/thread', { maidProfileId }),
  raiseRequest: (data) => api.post('/bookings/request', data),
  respondToRequest: (requestId, action) => api.post(`/bookings/request/${requestId}/action`, { action }),
  requestTermination: (appointmentId) => api.post(`/bookings/terminate/${appointmentId}`),
  approveTermination: (appointmentId) => api.post(`/bookings/terminate/${appointmentId}/approve`)
};

export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`)
};

export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  createService: (data) => api.post('/admin/services', data),
  deleteService: (serviceId) => api.delete(`/admin/services/${serviceId}`),
  getUsers: () => api.get('/admin/users'),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  promoteToAdmin: (email) => api.post('/admin/users/promote', { email }),
  getBookings: () => api.get('/admin/bookings'),
  cancelAppointment: (appointmentId) => api.post(`/admin/appointments/${appointmentId}/cancel`)
};

export default api;
