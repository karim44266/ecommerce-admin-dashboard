import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ecom_admin_token')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ecom_admin_token')
      localStorage.removeItem('ecom_admin_roles')
      // Only redirect if not already on the login page
      if (!window.location.hash.includes('/login') && !window.location.pathname.includes('/login')) {
        window.location.href = '/#/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api
