import React, { useState } from 'react'
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
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CRow,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import api from '../../services/api'
import { setAuth } from './authStorage'

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
      // TODO: Replace with real authentication endpoint.
      const response = await api.post('/auth/login', {
        email: formState.email,
        password: formState.password,
      })

      const { token, role } = response.data
      setAuth(token, role || 'admin')
      navigate('/', { replace: true })
    } catch (err) {
      setError('Unable to authenticate. Connect the backend auth endpoint to proceed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-light min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
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
                    <div className="mb-4" />
                    <CRow>
                      <CCol xs={6}>
                        <CButton color="primary" type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Signing in...' : 'Sign in'}
                        </CButton>
                      </CCol>
                      <CCol xs={6} className="text-end">
                        <CButton color="link" className="px-0" disabled>
                          Forgot password?
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
                    <p>
                      Manage products, orders, users, and delivery operations from your ecommerce
                      admin dashboard.
                    </p>
                    <CButton color="light" variant="outline" disabled>
                      Contact support
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

export default Login
