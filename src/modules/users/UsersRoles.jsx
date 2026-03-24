import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CAlert, CBadge, CButton, CFormLabel, CFormSelect, CSpinner } from '@coreui/react'
import {
  getApiErrorMessage,
  getUserById,
  updateUserRole,
} from '../../services/usersService'
import FormCard from '../../shared/components/FormCard'
import PageHeader from '../../shared/components/PageHeader'
import useUnsavedWarning from '../../shared/hooks/useUnsavedWarning'
import { useToast } from '../../shared/components/ToastProvider'
import { isAdmin } from '../auth/authStorage'

const UsersRoles = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [role, setRole] = useState('')
  const [originalRole, setOriginalRole] = useState('')
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
        setRole(payload.role)
        setOriginalRole(payload.role)
      } catch (err) {
        setError(getApiErrorMessage(err, 'Unable to load user details.'))
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [id, navigate])

  useUnsavedWarning(role !== originalRole)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const payload = await updateUserRole(id, role)
      setUser(payload)
      setOriginalRole(payload.role)
      setSuccess(`Role updated to "${payload.role}" successfully.`)
      addToast(`Role updated to ${payload.role}.`, 'success')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to update user role. Please try again.'))
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
      <PageHeader title="Update User Role" subtitle={user ? `${user.email}` : `User ${id}`} />
      {error && <CAlert color="danger">{error}</CAlert>}
      {success && <CAlert color="success">{success}</CAlert>}
      <FormCard
        title="Role Settings"
        onSubmit={handleSubmit}
        actions={
          <>
            <CButton color="primary" type="submit" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Role'}
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
              Current role: <CBadge color="info">{user.role}</CBadge>
            </p>
          </div>
        )}
        <div className="mb-3">
          <CFormLabel>New Role</CFormLabel>
          <CFormSelect value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="customer">Customer</option>
          </CFormSelect>
        </div>
      </FormCard>
    </div>
  )
}

export default UsersRoles
