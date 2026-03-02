import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilArrowRight } from '@coreui/icons'
import api from '../../services/api'
import FormCard from '../../shared/components/FormCard'
import PageHeader from '../../shared/components/PageHeader'

const STATUS_COLORS = {
  PENDING_PAYMENT: 'warning',
  PAID: 'info',
  PROCESSING: 'primary',
  SHIPPED: 'dark',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  REFUNDED: 'secondary',
  FAILED: 'danger',
}

const STATUS_LABELS = {
  PENDING_PAYMENT: 'Pending Payment',
  PAID: 'Paid',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
  FAILED: 'Failed',
}

/** Mirrors STATUS_TRANSITIONS from the backend DTO */
const STATUS_TRANSITIONS = {
  PENDING_PAYMENT: ['PAID', 'CANCELLED', 'FAILED'],
  PAID: ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'FAILED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
  FAILED: ['PROCESSING'],
}

const OrderStatusUpdate = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await api.get(`/orders/${id}`)
        setOrder(response.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load order.')
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [id])

  const allowedStatuses = order ? STATUS_TRANSITIONS[order.status] || [] : []

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!status) {
      setError('Please select a status.')
      return
    }
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await api.patch(`/orders/${id}/status`, {
        status,
        ...(note.trim() ? { note: note.trim() } : {}),
      })
      setSuccess(`Status updated to ${status}`)
      setTimeout(() => navigate(`/orders/${id}`, { replace: true }), 800)
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to update order status.',
      )
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
      <div className="d-flex justify-content-between align-items-start mb-3">
        <PageHeader title="Update Order Status" subtitle={`Order #${id.slice(0, 8)}`} />
        <CButton
          color="secondary"
          variant="outline"
          size="sm"
          className="flex-shrink-0 mt-1"
          onClick={() => navigate(`/orders/${id}`)}
        >
          <CIcon icon={cilArrowLeft} className="me-1" />
          Back to Details
        </CButton>
      </div>

      {error && <CAlert color="danger">{error}</CAlert>}
      {success && <CAlert color="success">{success}</CAlert>}

      {/* Current Status Card */}
      {order && (
        <CCard className="mb-3">
          <CCardHeader>Current Status</CCardHeader>
          <CCardBody className="d-flex align-items-center gap-3">
            <CBadge
              color={STATUS_COLORS[order.status] || 'secondary'}
              shape="rounded-pill"
              className="fs-6 px-3 py-2"
            >
              {STATUS_LABELS[order.status] || order.status}
            </CBadge>
            {allowedStatuses.length > 0 && (
              <CIcon icon={cilArrowRight} size="lg" className="text-medium-emphasis" />
            )}
            {status && (
              <CBadge
                color={STATUS_COLORS[status] || 'secondary'}
                shape="rounded-pill"
                className="fs-6 px-3 py-2"
              >
                {STATUS_LABELS[status] || status}
              </CBadge>
            )}
            <span className="text-medium-emphasis ms-auto">
              Total: ${Number(order.totalAmount).toFixed(2)} — Customer:{' '}
              {order.customerEmail || '—'}
            </span>
          </CCardBody>
        </CCard>
      )}

      <FormCard
        title="Change Status"
        onSubmit={handleSubmit}
        actions={
          <>
            <CButton
              color="primary"
              type="submit"
              disabled={submitting || allowedStatuses.length === 0}
            >
              {submitting ? 'Updating…' : 'Update Status'}
            </CButton>
            <CButton color="secondary" type="button" onClick={() => navigate(`/orders/${id}`)}>
              Cancel
            </CButton>
          </>
        }
      >
        <div className="mb-3">
          <CFormLabel>New Status</CFormLabel>
          {allowedStatuses.length === 0 ? (
            <CAlert color="info" className="mb-0">
              This order is in a terminal state ({order?.status}). No further transitions allowed.
            </CAlert>
          ) : (
            <CFormSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">— select status —</option>
              {allowedStatuses.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s] || s}
                </option>
              ))}
            </CFormSelect>
          )}
        </div>
        <div className="mb-3">
          <CFormLabel>Note (optional)</CFormLabel>
          <CFormTextarea
            rows={3}
            placeholder="Reason for status change…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
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
