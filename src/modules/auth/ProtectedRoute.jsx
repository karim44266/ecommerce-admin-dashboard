import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { getRoles, isAuthenticated } from './authStorage'
import useInactivityLogout from './useInactivityLogout'

const ProtectedRoute = ({ roles = ['ADMIN'] }) => {
  // Activate inactivity auto-logout for authenticated users
  useInactivityLogout()

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  const userRoles = getRoles()
  const requiredRoles = roles.map((role) => role.toUpperCase())

  if (requiredRoles.length > 0 && !requiredRoles.some((role) => userRoles.includes(role))) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
