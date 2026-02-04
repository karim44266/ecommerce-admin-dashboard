import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CAlert, CButton, CFormInput, CFormLabel } from '@coreui/react'
import api from '../../services/api'
import FormCard from '../../shared/components/FormCard'
import PageHeader from '../../shared/components/PageHeader'

const OrderTracking = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trackingNumber, setTrackingNumber] = useState('')
  const [carrier, setCarrier] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      // TODO: Replace with real delivery tracking endpoint.
      await api.post(`/orders/${id}/tracking`, { trackingNumber, carrier })
      navigate(`/orders/${id}`, { replace: true })
    } catch (err) {
      setError('Unable to update tracking. Connect the backend endpoint to proceed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Delivery Tracking" subtitle={`Order ${id}`} />
      {error && <CAlert color="danger">{error}</CAlert>}
      <FormCard
        title="Tracking Details"
        onSubmit={handleSubmit}
        actions={
          <>
            <CButton color="primary" type="submit" disabled={submitting}>
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
          <CFormInput value={carrier} onChange={(event) => setCarrier(event.target.value)} />
        </div>
        <div className="mb-3">
          <CFormLabel>Tracking Number</CFormLabel>
          <CFormInput
            value={trackingNumber}
            onChange={(event) => setTrackingNumber(event.target.value)}
          />
        </div>
      </FormCard>
    </div>
  )
}

export default OrderTracking
