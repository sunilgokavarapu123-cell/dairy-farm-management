// API Configuration
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:4000',
  ENDPOINTS: {
    ORDERS: '/orders'
  }
};

export const getApiUrl = (endpoint) => {
  // Add /api prefix if not already present
  const apiEndpoint = endpoint.startsWith('/api/') ? endpoint : `/api${endpoint}`;
  return `${API_CONFIG.BASE_URL}${apiEndpoint}`;
};

export default API_CONFIG;