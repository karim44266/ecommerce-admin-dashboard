import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked } from '@coreui/icons'
import { setAuth } from '../modules/auth/authStorage'
import { getApiErrorMessage, verifyMfa } from '../services/authService'

const Mfa = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const email = useMemo(() => {
    const stateEmail = (location.state as { email?: string } | null)?.email
    return stateEmail || sessionStorage.getItem('mfa_email') || ''
  }, [location.state])

  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true })
    }
  }, [email, navigate])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await verifyMfa(email, otp)
      if (response?.accessToken) {
        setAuth(response.accessToken, 'admin')
        sessionStorage.removeItem('mfa_email')
        navigate('/', { replace: true })
        return
      }

      setError('Unable to verify the code. Please try again.')
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-light min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={6} lg={4}>
            <CCard className="p-4 shadow-sm">
              <CCardBody>
                <h1>Verify code</h1>
                <p className="text-body-secondary">Enter the 6-digit code sent to {email || 'your email'}.</p>
                {error && <CAlert color="danger">{error}</CAlert>}
                <CForm onSubmit={handleSubmit}>
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type="text"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(event) => setOtp(event.target.value)}
                      required
                    />
                  </CInputGroup>
                  <CRow>
                    <CCol xs={12}>
                      <CButton color="primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Verifying...' : 'Verify'}
                      </CButton>
                    </CCol>
                  </CRow>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Mfa
