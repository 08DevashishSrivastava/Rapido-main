import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token from localStorage to outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ridepass_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Handle responses and expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginOrRegister = error.config.url?.includes('/login') || error.config.url?.includes('/register');
      if (!isLoginOrRegister && localStorage.getItem('ridepass_token')) {
        localStorage.removeItem('ridepass_token');
        localStorage.removeItem('ridepass_role');
        localStorage.removeItem('ridepass_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  userRegister: (data) => api.post('/users/register', data),
  userLogin: (data) => api.post('/users/login', data),
  sendUserOtp: (data) => api.post('/users/send-otp', data),
  verifyUserOtp: (data) => api.post('/users/verify-otp', data),
  userProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  userLogout: () => api.post('/users/logout'),

  captainRegister: (data) => api.post('/captains/register', data),
  captainLogin: (data) => api.post('/captains/login', data),
  sendCaptainOtp: (data) => api.post('/captains/send-otp', data),
  verifyCaptainOtp: (data) => api.post('/captains/verify-otp', data),
  captainProfile: () => api.get('/captains/profile'),
  updateCaptainProfile: (data) => api.put('/captains/profile', data),
  updateCaptainStatus: (status) => api.post('/captains/status', { status }),
  updateCaptainLocation: (ltd, lng) => api.post('/captains/location', { ltd, lng }),
  captainLogout: () => api.post('/captains/logout')
};

// Ride endpoints
export const rideAPI = {
  getFareEstimates: (pickup, destination) =>
    api.get(`/rides/get-fare?pickup=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(destination)}`),
  createRide: (data) => api.post('/rides/create', data),
  getRideDetails: (rideId) => api.get(`/rides/${rideId}`),
  confirmRide: (rideId) => api.post('/rides/confirm', { rideId }),
  markArrived: (rideId) => api.post('/rides/arrived', { rideId }),
  startTrip: (rideId, otp) => api.post('/rides/start-ride', { rideId, otp }),
  completeTrip: (rideId) => api.post('/rides/end-ride', { rideId }),
  cancelRide: (rideId, reason) => api.post('/rides/cancel', { rideId, reason }),
  rateRide: (data) => api.post('/rides/rate', data),
  getUserRides: () => api.get('/rides/user-rides'),
  getCaptainRides: () => api.get('/rides/captain-rides'),
  getAvailableRides: () => api.get('/rides/available')
};

// Subscription endpoints
export const subscriptionAPI = {
  getPlans: () => api.get('/subscriptions/plans'),
  getActiveSubscription: () => api.get('/subscriptions/active'),
  checkout: (planId, autoRenew) => api.post('/subscriptions/checkout', { planId, autoRenew }),
  activate: (subscriptionId, paymentId) => api.post('/subscriptions/activate', { subscriptionId, paymentId }),
  getHistory: () => api.get('/subscriptions/history'),
  getLedger: () => api.get('/subscriptions/ledger'),
  cancel: (subscriptionId, reason) => api.post('/subscriptions/cancel', { subscriptionId, reason }),
  updateRenew: (subscriptionId, autoRenew) => api.patch('/subscriptions/renew', { subscriptionId, autoRenew }),
  getSavingsAnalytics: () => api.get('/subscriptions/savings')
};

// Payment endpoints
export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
  getHistory: () => api.get('/payments/history')
};

// Complaint endpoints
export const complaintAPI = {
  createComplaint: (data) => api.post('/complaints', data),
  getUserComplaints: () => api.get('/complaints')
};

// Admin endpoints
export const adminAPI = {
  getOverview: () => api.get('/admin/overview'),
  getCaptains: () => api.get('/admin/captains'),
  verifyCaptain: (data) => api.post('/admin/verify-captain', data),
  getUsers: () => api.get('/admin/users'),
  getRides: () => api.get('/admin/rides'),
  createPlan: (data) => api.post('/admin/plans', data),
  updatePlan: (planId, data) => api.put(`/admin/plans/${planId}`, data),
  getSubscriptions: () => api.get('/admin/subscriptions'),
  getLedger: () => api.get('/admin/ledger'),
  getComplaints: () => api.get('/admin/complaints'),
  resolveComplaint: (data) => api.post('/admin/resolve-complaint', data)
};

export default api;
