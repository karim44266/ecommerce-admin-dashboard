import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { getRole, isAuthenticated } from './authStorage'

const ProtectedRoute = ({ roles = ['admin'] }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  if (roles.length > 0 && !roles.includes(getRole())) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
