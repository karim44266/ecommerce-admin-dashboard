const TOKEN_KEY = 'ecom_admin_token'
const ROLE_KEY = 'ecom_admin_role'

export const getToken = () => localStorage.getItem(TOKEN_KEY)

export const getRole = () => localStorage.getItem(ROLE_KEY)

export const setAuth = (token, role) => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ROLE_KEY, role)
}

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
}

export const isAuthenticated = () => Boolean(getToken())

export const isAdmin = () => getRole() === 'admin'
