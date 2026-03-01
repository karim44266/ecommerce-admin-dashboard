import React, { useEffect, useState, useCallback } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CFormInput,
  CFormLabel,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import api from '../../services/api'
import PageHeader from '../../shared/components/PageHeader'

const DeliveryAssign = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Modal state for assigning tracking
  const [showModal, setShowModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [carrier, setCarrier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchShippableOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch orders with PROCESSING status (ready to ship) and SHIPPED (already assigned)
      const [processingRes, shippedRes] = await Promise.all([
        api.get('/orders', { params: { status: 'PROCESSING', limit: 50, sortBy: 'createdAt', sortOrder: 'desc' } }),
        api.get('/orders', { params: { status: 'SHIPPED', limit: 50, sortBy: 'createdAt', sortOrder: 'desc' } }),
      ])
      const processing = (processingRes.data?.data || []).map((o) => ({ ...o, _group: 'PROCESSING' }))
      const shipped = (shippedRes.data?.data || []).map((o) => ({ ...o, _group: 'SHIPPED' }))
      setOrders([...processing, ...shipped])
    } catch (err) {
      if (err?.response?.status === 401) {
        setError('Session expired. Redirecting to login…')
      } else {
        setError('Unable to load orders. Make sure the backend is running.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchShippableOrders()
  }, [fetchShippableOrders])

  const openAssign = (order) => {
    setSelectedOrder(order)
    setCarrier(order.trackingCarrier || '')
    setTrackingNumber(order.trackingNumber || '')
    setTrackingUrl(order.trackingUrl || '')
    setShowModal(true)
    setSuccess('')
  }

  const handleAssign = async () => {
    if (!carrier || !trackingNumber) return
    setSubmitting(true)
    setError('')
    try {
      // Add tracking info
      await api.post(`/orders/${selectedOrder.id}/tracking`, {
        trackingNumber,
        carrier,
        trackingUrl: trackingUrl || undefined,
      })
      // If order is still PROCESSING, move it to SHIPPED
      if (selectedOrder.status === 'PROCESSING') {
        await api.patch(`/orders/${selectedOrder.id}/status`, {
          status: 'SHIPPED',
          notes: `Shipped via ${carrier} – ${trackingNumber}`,
        })
      }
      setSuccess(`Tracking assigned to order ${selectedOrder.id.slice(0, 8)}…`)
      setShowModal(false)
      fetchShippableOrders()
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to assign tracking. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const statusColor = (status) => {
    if (status === 'PROCESSING') return 'primary'
    if (status === 'SHIPPED') return 'info'
    return 'secondary'
  }

  return (
    <div>
      <PageHeader title="Assign Delivery" subtitle="Add tracking info and ship orders that are ready." />
      {error && <CAlert color="danger">{error}</CAlert>}
      {success && <CAlert color="success">{success}</CAlert>}

      <CCard className="mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <span>Orders Ready for Delivery ({orders.length})</span>
          <CButton color="primary" size="sm" onClick={fetchShippableOrders} disabled={loading}>
            Refresh
          </CButton>
        </CCardHeader>
        <CCardBody>
          {loading ? (
            <div className="text-center py-5"><CSpinner color="primary" /></div>
          ) : orders.length === 0 ? (
            <p className="text-body-secondary mb-0">No orders waiting for delivery assignment.</p>
          ) : (
            <CTable responsive hover>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Order ID</CTableHeaderCell>
                  <CTableHeaderCell>Customer</CTableHeaderCell>
                  <CTableHeaderCell>Total</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Tracking</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {orders.map((order) => (
                  <CTableRow key={order.id}>
                    <CTableDataCell className="font-monospace">{order.id.slice(0, 8)}…</CTableDataCell>
                    <CTableDataCell>{order.customerEmail || '—'}</CTableDataCell>
                    <CTableDataCell>${Number(order.totalAmount).toFixed(2)}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={statusColor(order.status)}>{order.status.replace(/_/g, ' ')}</CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      {order.trackingNumber ? (
                        <span className="font-monospace small">{order.trackingCarrier} – {order.trackingNumber}</span>
                      ) : (
                        <span className="text-body-secondary">Not assigned</span>
                      )}
                    </CTableDataCell>
                    <CTableDataCell>
                      <CButton color="primary" size="sm" onClick={() => openAssign(order)}>
                        {order.trackingNumber ? 'Update Tracking' : 'Assign Tracking'}
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* Assign Tracking Modal */}
      <CModal visible={showModal} onClose={() => setShowModal(false)}>
        <CModalHeader>
          <CModalTitle>
            Assign Tracking – {selectedOrder?.id?.slice(0, 8)}…
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <CFormLabel>Carrier *</CFormLabel>
            <CFormInput
              placeholder="e.g. FedEx, UPS, DHL"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <CFormLabel>Tracking Number *</CFormLabel>
            <CFormInput
              placeholder="e.g. 1Z999AA10123456784"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <CFormLabel>Tracking URL (optional)</CFormLabel>
            <CFormInput
              placeholder="https://track.example.com/..."
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
            />
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={() => setShowModal(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleAssign} disabled={submitting || !carrier || !trackingNumber}>
            {submitting ? 'Saving…' : 'Save & Ship'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default DeliveryAssign
