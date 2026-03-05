import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft } from '@coreui/icons'
import api from '../../services/api'
import FormCard from '../../shared/components/FormCard'
import PageHeader from '../../shared/components/PageHeader'

const STATUS_COLORS = {
  PENDING: 'warning',
  ACCEPTED: 'info',
  PROCESSING: 'primary',
  DELIVERED: 'success',
  COMPLETED: 'primary',
  CANCELLED: 'danger',
  REFUNDED: 'secondary',
  FAILED: 'danger',
}

const STATUS_LABELS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  PROCESSING: 'Processing',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
  FAILED: 'Failed',
}

const OrderTracking = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [carrier, setCarrier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
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
        const data = response.data
        setOrder(data)
        setCarrier(data.carrier || '')
        setTrackingNumber(data.trackingNumber || '')
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load order.')
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [id])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!carrier.trim() || !trackingNumber.trim()) {
      setError('Carrier and tracking number are required.')
      return
    }
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await api.post(`/orders/${id}/tracking`, {
        carrier: carrier.trim(),
        trackingNumber: trackingNumber.trim(),
        ...(note.trim() ? { note: note.trim() } : {}),
      })
      setSuccess('Tracking information updated successfully.')
      setTimeout(() => navigate(`/orders/${id}`, { replace: true }), 800)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update tracking.')
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
        <PageHeader title="Delivery Tracking" subtitle={`Order #${id.slice(0, 8)}`} />
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

      {/* Current Order Info */}
      {order && (
        <CCard className="mb-3">
          <CCardHeader>Order Info</CCardHeader>
          <CCardBody className="d-flex align-items-center gap-3 flex-wrap">
            <CBadge
              color={STATUS_COLORS[order.status] || 'secondary'}
              shape="rounded-pill"
              className="px-3 py-2"
            >
              {STATUS_LABELS[order.status] || order.status}
            </CBadge>
            <span>Total: ${Number(order.totalAmount).toFixed(2)}</span>
            {order.carrier && (
              <span className="text-medium-emphasis">
                Current: {order.carrier} — {order.trackingNumber}
              </span>
            )}
          </CCardBody>
        </CCard>
      )}

      <FormCard
        title="Tracking Details"
        onSubmit={handleSubmit}
        actions={
          <>
            <CButton color="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Tracking'}
            </CButton>
            <CButton color="secondary" type="button" onClick={() => navigate(`/orders/${id}`)}>
              Cancel
            </CButton>
          </>
        }
      >
        <div className="mb-3">
          <CFormLabel>Carrier</CFormLabel>
          <CFormInput
            placeholder="e.g. FedEx, UPS, DHL, USPS"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <CFormLabel>Tracking Number</CFormLabel>
          <CFormInput
            placeholder="Tracking number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <CFormLabel>Note (optional)</CFormLabel>
          <CFormTextarea
            rows={2}
            placeholder="Additional notes about the shipment…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </FormCard>
    </div>
  )
}

export default OrderTracking
