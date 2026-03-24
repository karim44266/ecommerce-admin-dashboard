import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CAlert, CBadge, CButton, CFormLabel, CFormSelect, CSpinner } from '@coreui/react'
import {
  getApiErrorMessage,
  getUserById,
  updateUserStatus,
} from '../../services/usersService'
import FormCard from '../../shared/components/FormCard'
import PageHeader from '../../shared/components/PageHeader'
import useUnsavedWarning from '../../shared/hooks/useUnsavedWarning'
import { useToast } from '../../shared/components/ToastProvider'
import { isAdmin } from '../auth/authStorage'

const statusBadgeColor = (status) => (status === 'active' ? 'success' : 'danger')

const UsersBlock = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [originalStatus, setOriginalStatus] = useState('')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const { addToast } = useToast()

  useEffect(() => {
    const fetchUser = async () => {
      if (!isAdmin()) {
        navigate('/dashboard', { replace: true })
        return
      }
      setLoading(true)
      setError('')
      try {
        const payload = await getUserById(id)
        setUser(payload)
        setStatus(payload.status)
        setOriginalStatus(payload.status)
      } catch (err) {
        setError(getApiErrorMessage(err, 'Unable to load user details.'))
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [id, navigate])

  useUnsavedWarning(status !== originalStatus)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const payload = await updateUserStatus(id, status)
      setUser(payload)
      setOriginalStatus(payload.status)
      setSuccess(`User status updated to "${payload.status}" successfully.`)
      addToast(`User status updated to ${payload.status}.`, 'success')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to update user status. Please try again.'))
    } finally {
      setSubmitting(false)
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
    <div>
      <PageHeader title="Block / Unblock User" subtitle={user ? `${user.email}` : `User ${id}`} />
      {error && <CAlert color="danger">{error}</CAlert>}
      {success && <CAlert color="success">{success}</CAlert>}
      <FormCard
        title="Access Status"
        onSubmit={handleSubmit}
        actions={
          <>
            <CButton color="primary" type="submit" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Status'}
            </CButton>
            <CButton color="secondary" type="button" onClick={() => navigate('/users')}>
              Back to Users
            </CButton>
          </>
        }
      >
        {user && (
          <div className="mb-3">
            <p className="text-medium-emphasis mb-2">
              Current status: <CBadge color={statusBadgeColor(user.status)}>{user.status}</CBadge>
            </p>
          </div>
        )}
        <div className="mb-3">
          <CFormLabel>Status</CFormLabel>
          <CFormSelect value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </CFormSelect>
        </div>
      </FormCard>
    </div>
  )
}

export default UsersBlock
