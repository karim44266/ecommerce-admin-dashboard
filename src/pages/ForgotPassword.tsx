import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  CAlert,
  CButton,
  CForm,
  CFormInput,
  CFormTextarea,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser, cilCommentSquare } from '@coreui/icons'
import { forgotPassword, getApiErrorMessage } from '../services/authService'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await forgotPassword(identifier, message || undefined)
      setSuccess(response.message)
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
          <span
            style={{
              width: 42,
              height: 42,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #2dd4bf, #0d9488)',
              borderRadius: 12,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              fontSize: 16,
              color: '#042f2e',
              letterSpacing: '-0.04em',
              flexShrink: 0,
            }}
          >
            PB
          </span>
          <div>
            <div
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: '#e2e8f0',
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
              }}
            >
              ProBuild
            </div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 400,
                fontSize: 10,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: '#64748b',
              }}
            >
              Admin Console
            </div>
          </div>
        </div>

        <h1>Forgot Password</h1>
        <p className="nx-login-subtitle">
          Enter your identifier and an optional message. Our team will contact you.
        </p>

        {error && (
          <CAlert color="danger" className="py-2" style={{ fontSize: '0.85rem' }}>
            {error}
          </CAlert>
        )}

        {success && (
          <CAlert color="success" className="py-2" style={{ fontSize: '0.85rem' }}>
            {success}
          </CAlert>
        )}

        {!success && (
          <CForm onSubmit={handleSubmit}>
            <CInputGroup className="mb-3">
              <CInputGroupText>
                <CIcon icon={cilUser} />
              </CInputGroupText>
              <CFormInput
                type="text"
                name="identifier"
                placeholder="Email or account number"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </CInputGroup>

            <CInputGroup className="mb-4">
              <CInputGroupText>
                <CIcon icon={cilCommentSquare} />
              </CInputGroupText>
              <CFormTextarea
                name="message"
                placeholder="Optional message..."
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </CInputGroup>

            <CButton color="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit Request'}
            </CButton>
          </CForm>
        )}

        <div
          style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            fontSize: '0.85rem',
          }}
        >
          <Link to="/login" style={{ color: '#2dd4bf', textDecoration: 'none' }}>
            ← Back to login
          </Link>
        </div>

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
          ProBuild Supply © {new Date().getFullYear()} — Operations Console
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
