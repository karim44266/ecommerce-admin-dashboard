import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CAlert, CButton, CFormLabel, CFormSelect } from '@coreui/react'
import api from '../../services/api'
import FormCard from '../../shared/components/FormCard'
import PageHeader from '../../shared/components/PageHeader'

const UsersRoles = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [role, setRole] = useState('admin')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      // TODO: Replace with real user role update endpoint.
      await api.patch(`/users/${id}/role`, { role })
      navigate('/users', { replace: true })
    } catch (err) {
      setError('Unable to update user role. Connect the backend endpoint to proceed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Update User Role" subtitle={`User ${id}`} />
      {error && <CAlert color="danger">{error}</CAlert>}
      <FormCard
        title="Role Settings"
        onSubmit={handleSubmit}
        actions={
          <>
            <CButton color="primary" type="submit" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Role'}
            </CButton>
            <CButton color="secondary" type="button" onClick={() => navigate(-1)}>
              Cancel
            </CButton>
          </>
        }
      >
        <div className="mb-3">
          <CFormLabel>Role</CFormLabel>
          <CFormSelect value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="support">Support</option>
          </CFormSelect>
        </div>
      </FormCard>
    </div>
  )
}

export default UsersRoles
