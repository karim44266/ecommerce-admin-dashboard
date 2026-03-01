import React, { useEffect, useState, useCallback } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CFormInput,
  CFormLabel,
  CFormSelect,
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

const STATUS_OPTIONS = [
  { value: 'SHIPPED', label: 'Shipped', color: 'info' },
  { value: 'DELIVERED', label: 'Delivered', color: 'success' },
  { value: 'FAILED', label: 'Failed Delivery', color: 'danger' },
]

const STATUS_COLORS = {
  SHIPPED: 'info',
  DELIVERED: 'success',
  FAILED: 'danger',
  PROCESSING: 'primary',
}

const DeliveryStatus = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [newStatus, setNewStatus] = useState('DELIVERED')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchShippedOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/orders', {
        params: { status: 'SHIPPED', limit: 50, sortBy: 'createdAt', sortOrder: 'desc' },
      })
      setOrders(response.data?.data || [])
    } catch (err) {
      if (err?.response?.status === 401) {
        setError('Session expired. Redirecting to login…')
      } else {
        setError('Unable to load shipped orders. Make sure the backend is running.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchShippedOrders()
  }, [fetchShippedOrders])

  const openUpdate = (order) => {
    setSelectedOrder(order)
    setNewStatus('DELIVERED')
    setNotes('')
    setShowModal(true)
    setSuccess('')
  }

  const handleUpdate = async () => {
    if (!newStatus) return
    setSubmitting(true)
    setError('')
    try {
      await api.patch(`/orders/${selectedOrder.id}/status`, {
        status: newStatus,
        notes: notes || undefined,
      })
      setSuccess(`Order ${selectedOrder.id.slice(0, 8)}… updated to ${newStatus.replace(/_/g, ' ')}.`)
      setShowModal(false)
      fetchShippedOrders()
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to update status. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Update Delivery Status" subtitle="Track last-mile progress and mark deliveries complete." />
      {error && <CAlert color="danger">{error}</CAlert>}
      {success && <CAlert color="success">{success}</CAlert>}

      <CCard className="mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <span>Shipped Orders ({orders.length})</span>
          <CButton color="primary" size="sm" onClick={fetchShippedOrders} disabled={loading}>
            Refresh
          </CButton>
        </CCardHeader>
        <CCardBody>
          {loading ? (
            <div className="text-center py-5"><CSpinner color="primary" /></div>
          ) : orders.length === 0 ? (
            <p className="text-body-secondary mb-0">No shipped orders to update.</p>
          ) : (
            <CTable responsive hover>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Order ID</CTableHeaderCell>
                  <CTableHeaderCell>Customer</CTableHeaderCell>
                  <CTableHeaderCell>Carrier</CTableHeaderCell>
                  <CTableHeaderCell>Tracking #</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {orders.map((order) => (
                  <CTableRow key={order.id}>
                    <CTableDataCell className="font-monospace">{order.id.slice(0, 8)}…</CTableDataCell>
                    <CTableDataCell>{order.customerEmail || '—'}</CTableDataCell>
                    <CTableDataCell>{order.trackingCarrier || '—'}</CTableDataCell>
                    <CTableDataCell className="font-monospace small">
                      {order.trackingUrl ? (
                        <a href={order.trackingUrl} target="_blank" rel="noreferrer">{order.trackingNumber || '—'}</a>
                      ) : (
                        order.trackingNumber || '—'
                      )}
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={STATUS_COLORS[order.status] || 'secondary'}>
                        {order.status.replace(/_/g, ' ')}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CButton color="success" size="sm" onClick={() => openUpdate(order)}>
                        Update Status
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* Update Status Modal */}
      <CModal visible={showModal} onClose={() => setShowModal(false)}>
        <CModalHeader>
          <CModalTitle>
            Update Delivery – {selectedOrder?.id?.slice(0, 8)}…
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <CFormLabel>New Status *</CFormLabel>
            <CFormSelect value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </CFormSelect>
          </div>
          <div className="mb-3">
            <CFormLabel>Notes (optional)</CFormLabel>
            <CFormInput
              placeholder="e.g. Left at front door"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={() => setShowModal(false)}>
            Cancel
          </CButton>
          <CButton color="success" onClick={handleUpdate} disabled={submitting || !newStatus}>
            {submitting ? 'Updating…' : 'Confirm'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default DeliveryStatus
