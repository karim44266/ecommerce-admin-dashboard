import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAlert,
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
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import { setAuth } from '../modules/auth/authStorage'
import { getApiErrorMessage, login } from '../services/authService'

const Login = () => {
  const navigate = useNavigate()
  const [formState, setFormState] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await login(formState.email, formState.password)

      if (response?.accessToken) {
        setAuth(response.accessToken, 'admin')
        sessionStorage.removeItem('mfa_email')
        navigate('/', { replace: true })
        return
      }

      if (response?.mfaRequired) {
        sessionStorage.setItem('mfa_email', formState.email)
        navigate('/mfa', { state: { email: formState.email } })
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
    <div className="bg-light min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8} lg={6}>
            <CCardGroup className="shadow-sm">
              <CCard className="p-4">
                <CCardBody>
                  <h1>Login</h1>
                  <p className="text-body-secondary">Sign in to your account</p>
                  {error && <CAlert color="danger">{error}</CAlert>}
                  <CForm onSubmit={handleSubmit}>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        type="email"
                        name="email"
                        placeholder="admin@company.com"
                        autoComplete="email"
                        value={formState.email}
                        onChange={handleChange}
                        required
                      />
                    </CInputGroup>
                    <CInputGroup className="mb-3">
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
                    <CRow>
                      <CCol xs={12}>
                        <CButton color="primary" type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Signing in...' : 'Sign in'}
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
              <CCard className="text-white bg-primary py-5" style={{ width: '44%' }}>
                <CCardBody className="text-center">
                  <div>
                    <h2>Welcome back</h2>
                    <p>Manage products, orders, users, and delivery operations.</p>
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

export default Login
