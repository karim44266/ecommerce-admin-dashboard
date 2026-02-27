const TOKEN_KEY = 'ecom_admin_token'
const ROLE_KEY = 'ecom_admin_roles'
const MFA_EMAIL_KEY = 'ecom_admin_mfa_email'

export const getToken = () => localStorage.getItem(TOKEN_KEY)

export const getRoles = () => {
  const raw = localStorage.getItem(ROLE_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
    }
  } catch (error) {
    // ignore parsing errors
  }

  return []
}

export const getRole = () => getRoles()[0] || null

export const getRolesFromToken = (token) => {
  if (!token) {
    return []
  }

  try {
    const payloadSegment = token.split('.')[1]
    if (!payloadSegment) {
      return []
    }

    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(normalized))
    const roles = Array.isArray(payload.roles) ? payload.roles : []
    return roles.map((role) => String(role).toUpperCase())
  } catch (error) {
    return []
  }
}

export const setAuth = (token, roles = []) => {
  localStorage.setItem(TOKEN_KEY, token)
  const rolesArray = Array.isArray(roles) ? roles : [roles]
  localStorage.setItem(ROLE_KEY, JSON.stringify(rolesArray))
}

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
}

export const setPendingMfaEmail = (email) => {
  if (email) {
    localStorage.setItem(MFA_EMAIL_KEY, email)
  }
}

export const getPendingMfaEmail = () => localStorage.getItem(MFA_EMAIL_KEY)

export const clearPendingMfaEmail = () => {
  localStorage.removeItem(MFA_EMAIL_KEY)
}

export const isAuthenticated = () => Boolean(getToken())

export const hasRole = (role) => getRoles().includes(role)

export const isAdmin = () => hasRole('ADMIN')
