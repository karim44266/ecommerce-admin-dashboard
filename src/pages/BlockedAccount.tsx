import React, { useState } from 'react'
import { Link } from 'react-router-dom'
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
import { cilUser, cilShieldAlt, cilCommentSquare } from '@coreui/icons'
import { submitBlockedAppeal, getApiErrorMessage } from '../services/authService'

const BlockedAccount = () => {
  const [name, setName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [explanation, setExplanation] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await submitBlockedAppeal(name, accountNumber, explanation)
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
              background: 'linear-gradient(135deg, #f87171, #dc2626)',
              borderRadius: 12,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              fontSize: 16,
              color: '#fff',
              letterSpacing: '-0.04em',
              flexShrink: 0,
            }}
          >
            !
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
              Account Suspended
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
              ProBuild Admin Console
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 12,
            padding: '1.25rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#fca5a5', margin: 0, fontSize: '0.95rem', lineHeight: 1.6 }}>
            Your account has been temporarily suspended.
            <br />
            Please contact the administration or fill out the form below.
          </p>
        </div>

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
                name="name"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </CInputGroup>

            <CInputGroup className="mb-3">
              <CInputGroupText>
                <CIcon icon={cilShieldAlt} />
              </CInputGroupText>
              <CFormInput
                type="text"
                name="accountNumber"
                placeholder="Account number (e.g. RES-00042)"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
              />
            </CInputGroup>

            <CInputGroup className="mb-4">
              <CInputGroupText>
                <CIcon icon={cilCommentSquare} />
              </CInputGroupText>
              <CFormTextarea
                name="explanation"
                placeholder="Explain your situation in detail..."
                rows={4}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                required
                minLength={10}
              />
            </CInputGroup>

            <CButton color="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit Appeal'}
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

export default BlockedAccount
