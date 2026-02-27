import React, { useEffect, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormSwitch,
  CRow,
  CSpinner,
} from '@coreui/react'
import api from '../../services/api'

const MfaSettings = () => {
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/me')
        // The /auth/me endpoint returns { userId, email, roles }
        // We need to check if MFA is enabled - fetch from a profile-like source
        // For now, we'll track it locally after toggle
        setMfaEnabled(false) // Default: unknown until toggled
      } catch (err) {
        setError('Failed to load profile.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleToggle = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    const newState = !mfaEnabled

    try {
      const response = await api.patch('/auth/mfa', { enabled: newState })
      setMfaEnabled(response.data.mfaEnabled)
      setSuccess(
        newState
          ? 'MFA has been enabled. You will receive a code on your next login.'
          : 'MFA has been disabled.',
      )
    } catch (err) {
      setError('Failed to update MFA settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <CRow>
      <CCol md={8} lg={6}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>MFA Settings</strong>
          </CCardHeader>
          <CCardBody>
            <p className="text-body-secondary mb-3">
              Multi-Factor Authentication adds an extra layer of security by requiring a 6-digit
              code sent to your email during login.
            </p>

            {error && <CAlert color="danger">{error}</CAlert>}
            {success && <CAlert color="success">{success}</CAlert>}

            <div className="d-flex align-items-center justify-content-between">
              <div>
                <strong>Email OTP Verification</strong>
                <br />
                <small className="text-body-secondary">
                  {mfaEnabled
                    ? 'A verification code will be sent to your email at each login.'
                    : 'MFA is currently disabled for your account.'}
                </small>
              </div>
              <CFormSwitch
                size="xl"
                id="mfa-toggle"
                checked={mfaEnabled}
                onChange={handleToggle}
                disabled={saving}
                label={mfaEnabled ? 'Enabled' : 'Disabled'}
              />
            </div>

            <hr />

            <CButton
              color={mfaEnabled ? 'danger' : 'primary'}
              variant="outline"
              onClick={handleToggle}
              disabled={saving}
            >
              {saving ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  Updating...
                </>
              ) : mfaEnabled ? (
                'Disable MFA'
              ) : (
                'Enable MFA'
              )}
            </CButton>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default MfaSettings
