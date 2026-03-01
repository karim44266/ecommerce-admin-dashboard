import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CAlert, CButton, CFormInput, CFormLabel, CFormTextarea } from '@coreui/react'
import api from '../../services/api'
import FormCard from '../../shared/components/FormCard'
import PageHeader from '../../shared/components/PageHeader'

const OrderTracking = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trackingNumber, setTrackingNumber] = useState('')
  const [carrier, setCarrier] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then((res) => {
        if (res.data.trackingNumber) setTrackingNumber(res.data.trackingNumber)
        if (res.data.carrier) setCarrier(res.data.carrier)
      })
      .catch(() => setError('Unable to load order details.'))
      .finally(() => setLoading(false))
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
        trackingNumber: trackingNumber.trim(),
        carrier: carrier.trim(),
        note: note || undefined,
      })
      setSuccess('Tracking information updated successfully.')
      setNote('')
    } catch (err) {
      const msg = err?.response?.data?.message
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Unable to update tracking.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Delivery Tracking"
        subtitle={`Order ${id?.slice(0, 8)}...`}
        actions={
          <CButton color="outline-primary" size="sm" onClick={() => navigate(`/orders/${id}`)}>
            View Order
          </CButton>
        }
      />
      {error && <CAlert color="danger">{error}</CAlert>}
      {success && <CAlert color="success">{success}</CAlert>}
      <FormCard
        title="Tracking Details"
        onSubmit={handleSubmit}
        actions={
          <>
            <CButton color="primary" type="submit" disabled={submitting || loading}>
              {submitting ? 'Saving...' : 'Save Tracking'}
            </CButton>
            <CButton color="secondary" type="button" onClick={() => navigate(-1)}>
              Cancel
            </CButton>
          </>
        }
      >
        <div className="mb-3">
          <CFormLabel>Carrier</CFormLabel>
          <CFormInput
            value={carrier}
            onChange={(event) => setCarrier(event.target.value)}
            placeholder="e.g. FedEx, UPS, USPS..."
          />
        </div>
        <div className="mb-3">
          <CFormLabel>Tracking Number</CFormLabel>
          <CFormInput
            value={trackingNumber}
            onChange={(event) => setTrackingNumber(event.target.value)}
            placeholder="e.g. 1Z999AA..."
          />
        </div>
        <div className="mb-3">
          <CFormLabel>Note (optional)</CFormLabel>
          <CFormTextarea
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Additional tracking notes..."
          />
        </div>
      </FormCard>
    </div>
  )
}

export default OrderTracking
