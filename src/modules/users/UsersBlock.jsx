import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CAlert, CButton, CFormLabel, CFormSelect } from '@coreui/react'
import api from '../../services/api'
import FormCard from '../../shared/components/FormCard'
import PageHeader from '../../shared/components/PageHeader'

const UsersBlock = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('active')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      // TODO: Replace with real user status update endpoint.
      await api.patch(`/users/${id}/status`, { status })
      navigate('/users', { replace: true })
    } catch (err) {
      setError('Unable to update user status. Connect the backend endpoint to proceed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Block / Unblock User" subtitle={`User ${id}`} />
      {error && <CAlert color="danger">{error}</CAlert>}
      <FormCard
        title="Access Status"
        onSubmit={handleSubmit}
        actions={
          <>
            <CButton color="primary" type="submit" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Status'}
            </CButton>
            <CButton color="secondary" type="button" onClick={() => navigate(-1)}>
              Cancel
            </CButton>
          </>
        }
      >
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
