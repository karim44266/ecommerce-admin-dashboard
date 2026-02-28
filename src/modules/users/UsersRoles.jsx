import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CAlert, CBadge, CButton, CFormLabel, CFormSelect, CSpinner } from '@coreui/react'
import api from '../../services/api'
import FormCard from '../../shared/components/FormCard'
import PageHeader from '../../shared/components/PageHeader'

const UsersRoles = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [role, setRole] = useState('')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await api.get(`/users/${id}`)
        setUser(response.data)
        setRole(response.data.role)
      } catch (err) {
        setError('Unable to load user details.')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [id])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await api.patch(`/users/${id}/role`, { role })
      setUser(response.data)
      setSuccess(`Role updated to "${response.data.role}" successfully.`)
    } catch (err) {
      setError('Unable to update user role. Please try again.')
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
