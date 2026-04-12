import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilLockLocked,
  cilEnvelopeClosed,
  cilCheckCircle,
  cilArrowLeft,
  cilClipboard,
} from '@coreui/icons'
import api from '../../services/api'
import { clearPendingMfaEmail, getPendingMfaEmail, getRolesFromToken, setAuth } from './authStorage'

const Mfa = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const pendingEmail = getPendingMfaEmail()
    if (!pendingEmail) {
      navigate('/login', { replace: true })
      return
    }
    setEmail(pendingEmail)
  }, [navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await api.post('/auth/mfa/verify', { email, otp })
      const { accessToken } = response.data

      if (!accessToken) {
        setError('Unexpected response from server. Please try again.')
        return
      }

      const roles = getRolesFromToken(accessToken)
      setAuth(accessToken, roles)
      clearPendingMfaEmail()
      navigate('/', { replace: true })
    } catch (err) {
      setError('Invalid or expired code. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackToLogin = () => {
    clearPendingMfaEmail()
    navigate('/login', { replace: true })
  }

  return (
    <div className="bg-light min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup className="shadow-sm">
              <CCard className="p-4">
                <CCardBody>
                  <h1>Verify MFA</h1>
                  <p className="text-body-secondary">Enter the 6-digit code sent to your email.</p>
                  {error && <CAlert color="danger">{error}</CAlert>}
                  <CForm onSubmit={handleSubmit}>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilEnvelopeClosed} />
                      </CInputGroupText>
                      <CFormInput type="email" value={email} disabled />
                    </CInputGroup>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="text"
                        inputMode="numeric"
                        name="otp"
                        placeholder="123456"
                        value={otp}
                        onChange={(event) => setOtp(event.target.value)}
                        required
                        maxLength={6}
                      />
                    </CInputGroup>
                    <CRow>
                      <CCol xs={6}>
                        <CButton color="primary" type="submit" disabled={isSubmitting}>
                          <CIcon icon={cilCheckCircle} className="me-1" />
                          {isSubmitting ? 'Verifying...' : 'Verify'}
                        </CButton>
                      </CCol>
                      <CCol xs={6} className="text-end">
                        <CButton color="link" className="px-0" onClick={handleBackToLogin}>
                          <CIcon icon={cilArrowLeft} className="me-1" />
                          Back to login
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
              <CCard className="text-white bg-primary py-5" style={{ width: '44%' }}>
                <CCardBody className="text-center">
                  <div>
                    <h2>Secure sign-in</h2>
                    <p>We sent a one-time code to keep your account safe.</p>
                    <CButton color="light" variant="outline" disabled>
                      <CIcon icon={cilClipboard} className="me-1" />
                      Need help?
                    </CButton>
                  </div>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Mfa
