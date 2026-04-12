import React from 'react'
import { CButton } from '@coreui/react'
import { useNavigate } from 'react-router-dom'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft } from '@coreui/icons'

const NotFound = () => {
  const navigate = useNavigate()

  return (
    <div className="nx-404 nx-fade-in">
      <div className="nx-404-code">404</div>
      <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>Page not found</h2>
      <p className="text-medium-emphasis" style={{ maxWidth: 420, margin: '0 auto 1.5rem' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <CButton color="primary" onClick={() => navigate('/')}>
        <CIcon icon={cilArrowLeft} className="me-1" />
        Back to Dashboard
      </CButton>
    </div>
  )
}

export default NotFound
