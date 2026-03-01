import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
} from '@coreui/react'
import api from '../../services/api'
import FormCard from '../../shared/components/FormCard'
import PageHeader from '../../shared/components/PageHeader'

const STATUS_COLORS = {
  PENDING_PAYMENT: 'warning',
  PAID: 'info',
  PROCESSING: 'primary',
  SHIPPED: 'secondary',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  REFUNDED: 'dark',
  FAILED: 'danger',
}

const OrderStatusUpdate = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [currentStatus, setCurrentStatus] = useState('')
  const [status, setStatus] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then((res) => {
        setCurrentStatus(res.data.status)
        setStatus(res.data.status)
      })
      .catch(() => setError('Unable to load order.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await api.patch(`/orders/${id}/status`, { status, note: note || undefined })
      setSuccess(`Order status updated to ${status}`)
      setCurrentStatus(status)
      setNote('')
    } catch (err) {
      const msg = err?.response?.data?.message
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Unable to update order status.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Update Order Status"
        subtitle={`Order ${id?.slice(0, 8)}...`}
        actions={
          <CButton color="outline-primary" size="sm" onClick={() => navigate(`/orders/${id}`)}>
            View Order
          </CButton>
        }
      />
      {error && <CAlert color="danger">{error}</CAlert>}
      {success && <CAlert color="success">{success}</CAlert>}

      {!loading && currentStatus && (
        <p className="mb-3">
          Current status:{' '}
          <CBadge color={STATUS_COLORS[currentStatus] || 'secondary'}>{currentStatus}</CBadge>
        </p>
      )}

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
          <CFormLabel>New Status</CFormLabel>
          <CFormSelect value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="PENDING_PAYMENT">Pending Payment</option>
            <option value="PAID">Paid</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
            <option value="FAILED">Failed</option>
          </CFormSelect>
        </div>
        <div className="mb-3">
          <CFormLabel>Note (optional)</CFormLabel>
          <CFormTextarea
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. Payment verified, order packed..."
          />
        </div>
      </FormCard>
    </div>
  )
}

export default OrderStatusUpdate
