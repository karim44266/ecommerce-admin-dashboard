import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CAlert, CButton, CFormLabel, CFormSelect } from '@coreui/react'
import api from '../../services/api'
import FormCard from '../../shared/components/FormCard'
import PageHeader from '../../shared/components/PageHeader'

const OrderStatusUpdate = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('processing')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      // TODO: Replace with real order status update endpoint.
      await api.patch(`/orders/${id}/status`, { status })
      navigate(`/orders/${id}`, { replace: true })
    } catch (err) {
      setError('Unable to update order status. Connect the backend endpoint to proceed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Update Order Status" subtitle={`Order ${id}`} />
      {error && <CAlert color="danger">{error}</CAlert>}
      <FormCard
        title="Status"
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
          <CFormLabel>Order Status</CFormLabel>
          <CFormSelect value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="processing">Processing</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </CFormSelect>
        </div>
      </FormCard>
    </div>
  )
}

export default OrderStatusUpdate
