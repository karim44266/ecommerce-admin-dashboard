import React, { useState } from 'react'
import { CAlert, CButton, CFormInput, CFormLabel, CFormSelect } from '@coreui/react'
import api from '../../services/api'
import FormCard from '../../shared/components/FormCard'
import PageHeader from '../../shared/components/PageHeader'

const DeliveryStatus = () => {
  const [shipmentId, setShipmentId] = useState('')
  const [status, setStatus] = useState('in_transit')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      // TODO: Replace with real delivery status update endpoint.
      await api.patch(`/delivery/${shipmentId}/status`, { status, notes })
      setShipmentId('')
      setNotes('')
    } catch (err) {
      setError('Unable to update delivery status. Connect the backend endpoint to proceed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Update Delivery Status" subtitle="Track last-mile progress." />
      {error && <CAlert color="danger">{error}</CAlert>}
      <FormCard
        title="Status Update"
        onSubmit={handleSubmit}
        actions={
          <CButton color="primary" type="submit" disabled={submitting}>
            {submitting ? 'Updating...' : 'Update Status'}
          </CButton>
        }
      >
        <div className="mb-3">
          <CFormLabel>Shipment ID</CFormLabel>
          <CFormInput value={shipmentId} onChange={(event) => setShipmentId(event.target.value)} />
        </div>
        <div className="mb-3">
          <CFormLabel>Status</CFormLabel>
          <CFormSelect value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="in_transit">In transit</option>
            <option value="out_for_delivery">Out for delivery</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed delivery</option>
          </CFormSelect>
        </div>
        <div className="mb-3">
          <CFormLabel>Notes</CFormLabel>
          <CFormInput value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>
      </FormCard>
    </div>
  )
}

export default DeliveryStatus
