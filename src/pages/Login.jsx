import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAlert,
  CButton,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser, cilCheckCircle } from '@coreui/icons'
import { getRolesFromToken, setAuth, setPendingMfaEmail } from '../modules/auth/authStorage'
import { getApiErrorMessage, login } from '../services/authService'
import { company } from '../shared/company'

const Login = () => {
  const navigate = useNavigate()
  const [formState, setFormState] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await login(formState.email, formState.password)

      if (response?.accessToken) {
        const roles = getRolesFromToken(response.accessToken)
        setAuth(response.accessToken, roles)
        navigate('/', { replace: true })
        return
      }

      if (response?.mfaRequired) {
        setPendingMfaEmail(formState.email)
        navigate('/mfa', { replace: true })
        return
      }

      setError('Unexpected response from server. Please try again.')
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="nx-login-page">
      <div className="nx-login-card">
        <div className="nx-login-brand">
          <img
            src={company.logo.primary}
            alt={company.logo.alt}
            className="nx-login-logo"
          />
          <span className="visually-hidden">{company.legalName}</span>
        </div>

        <h1>Welcome back</h1>
        <p className="nx-login-subtitle">Sign in to the operations console</p>

        {error && (
          <CAlert color="danger" className="py-2" style={{ fontSize: '0.85rem' }}>
            {error}
          </CAlert>
        )}

        <CForm onSubmit={handleSubmit}>
          <CInputGroup className="mb-3">
            <CInputGroupText>
              <CIcon icon={cilUser} />
            </CInputGroupText>
            <CFormInput
              type="email"
              name="email"
              placeholder="admin@emmtn.com"
              autoComplete="email"
              value={formState.email}
              onChange={handleChange}
              required
            />
          </CInputGroup>

          <CInputGroup className="mb-4">
            <CInputGroupText>
              <CIcon icon={cilLockLocked} />
            </CInputGroupText>
            <CFormInput
              type="password"
              name="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={formState.password}
              onChange={handleChange}
              required
            />
          </CInputGroup>

          <CButton color="primary" type="submit" disabled={isSubmitting}>
            <CIcon icon={cilCheckCircle} className="me-1" />
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </CButton>
        </CForm>

        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: '#475569',
          }}
        >
          {company.legalName} © {new Date().getFullYear()} — {company.operationsLabel}
        </div>
      </div>
    </div>
  )
}

export default Login
