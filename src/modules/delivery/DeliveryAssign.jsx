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

const DeliveryAssign = () => {
  // ── Assignable orders + staff ──────────────────────────
  const [orders, setOrders] = useState([])
  const [staffUsers, setStaffUsers] = useState([])
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ── Create-shipment modal ──────────────────────────────
  const [showCreate, setShowCreate] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ── Reassign modal ────────────────────────────────────
  const [showReassign, setShowReassign] = useState(false)
  const [reassignShipment, setReassignShipment] = useState(null)
  const [reassignStaffId, setReassignStaffId] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [ordersRes, staffRes, shipmentsRes] = await Promise.all([
        api.get('/shipments/assignable-orders'),
        api.get('/shipments/staff'),
        api.get('/shipments'),
      ])
      setOrders(ordersRes.data || [])
      setStaffUsers(staffRes.data || [])
      setShipments(shipmentsRes.data || [])
    } catch (err) {
      if (err?.response?.status === 401) {
        setError('Session expired. Redirecting to login…')
      } else {
        setError('Unable to load data. Make sure the backend is running.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Create shipment ───────────────────────────────────
  const openCreate = () => {
    setSelectedOrderId(orders[0]?.id || '')
    setSelectedStaffId(staffUsers[0]?.id || '')
    setTrackingNumber('')
    setShowCreate(true)
    setSuccess('')
  }

  const handleCreate = async () => {
    if (!selectedOrderId || !selectedStaffId) return
    setSubmitting(true)
    setError('')
    try {
      await api.post('/shipments', {
        orderId: selectedOrderId,
        staffUserId: selectedStaffId,
        trackingNumber: trackingNumber || undefined,
      })
      setSuccess('Shipment created successfully.')
      setShowCreate(false)
      fetchData()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Unable to create shipment.'
      setError(Array.isArray(msg) ? msg.join(', ') : msg)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Reassign shipment ─────────────────────────────────
  const openReassign = (shipment) => {
    setReassignShipment(shipment)
    setReassignStaffId(shipment.staffUserId)
    setShowReassign(true)
    setSuccess('')
  }

  const handleReassign = async () => {
    if (!reassignStaffId || !reassignShipment) return
    setSubmitting(true)
    setError('')
    try {
      await api.patch(`/shipments/${reassignShipment.id}/assign`, {
        staffUserId: reassignStaffId,
      })
      setSuccess(`Shipment ${reassignShipment.id.slice(0, 8)}… reassigned.`)
      setShowReassign(false)
      fetchData()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Unable to reassign shipment.'
      setError(Array.isArray(msg) ? msg.join(', ') : msg)
    } finally {
      setSubmitting(false)
    }
  }

  const shipmentStatusColor = (status) => {
    const map = {
      ASSIGNED: 'info',
      IN_TRANSIT: 'warning',
      DELIVERED: 'success',
      FAILED: 'danger',
      RETURNED: 'secondary',
    }
    return map[status] || 'secondary'
  }

  return (
    <div>
      <PageHeader title="Delivery Assignment" subtitle="Assign shipments to delivery staff and manage logistics." />
      {error && <CAlert color="danger" dismissible onClose={() => setError('')}>{error}</CAlert>}
      {success && <CAlert color="success" dismissible onClose={() => setSuccess('')}>{success}</CAlert>}

      {/* ── Assignable Orders ───────────────────────────── */}
      <CCard className="mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <span>Orders Ready for Assignment ({orders.length})</span>
          <div className="d-flex gap-2">
            <CButton color="primary" size="sm" onClick={openCreate} disabled={loading || orders.length === 0 || staffUsers.length === 0}>
              Create Shipment
            </CButton>
            <CButton color="light" size="sm" onClick={fetchData} disabled={loading}>
              Refresh
            </CButton>
          </div>
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
                  <CTableHeaderCell>Created</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {orders.map((order) => (
                  <CTableRow key={order.id}>
                    <CTableDataCell className="font-monospace">{order.id.slice(0, 8)}…</CTableDataCell>
                    <CTableDataCell>{order.customerEmail || '—'}</CTableDataCell>
                    <CTableDataCell>${Number(order.totalAmount).toFixed(2)}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={order.status === 'PAID' ? 'success' : 'primary'}>{order.status}</CBadge>
                    </CTableDataCell>
                    <CTableDataCell>{new Date(order.createdAt).toLocaleDateString()}</CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* ── Existing Shipments ──────────────────────────── */}
      <CCard className="mb-4">
        <CCardHeader>
          <span>Active Shipments ({shipments.length})</span>
        </CCardHeader>
        <CCardBody>
          {shipments.length === 0 ? (
            <p className="text-body-secondary mb-0">No shipments yet.</p>
          ) : (
            <CTable responsive hover>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Shipment ID</CTableHeaderCell>
                  <CTableHeaderCell>Order ID</CTableHeaderCell>
                  <CTableHeaderCell>Staff</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Tracking</CTableHeaderCell>
                  <CTableHeaderCell>Assigned</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {shipments.map((s) => (
                  <CTableRow key={s.id}>
                    <CTableDataCell className="font-monospace">{s.id.slice(0, 8)}…</CTableDataCell>
                    <CTableDataCell className="font-monospace">{s.orderId.slice(0, 8)}…</CTableDataCell>
                    <CTableDataCell>{s.staffName || s.staffEmail || s.staffUserId?.slice(0, 8)}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={shipmentStatusColor(s.status)}>{s.status.replace(/_/g, ' ')}</CBadge>
                    </CTableDataCell>
                    <CTableDataCell>{s.trackingNumber || '—'}</CTableDataCell>
                    <CTableDataCell>{new Date(s.assignedAt).toLocaleDateString()}</CTableDataCell>
                    <CTableDataCell>
                      {s.status === 'ASSIGNED' && (
                        <CButton color="warning" size="sm" variant="outline" onClick={() => openReassign(s)}>
                          Reassign
                        </CButton>
                      )}
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* ── Create Shipment Modal ───────────────────────── */}
      <CModal visible={showCreate} onClose={() => setShowCreate(false)}>
        <CModalHeader>
          <CModalTitle>Create Shipment</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <CFormLabel>Order *</CFormLabel>
            <CFormSelect value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)}>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id.slice(0, 8)}… – {o.customerEmail} – ${Number(o.totalAmount).toFixed(2)} ({o.status})
                </option>
              ))}
            </CFormSelect>
          </div>
          <div className="mb-3">
            <CFormLabel>Assign to Staff *</CFormLabel>
            <CFormSelect value={selectedStaffId} onChange={(e) => setSelectedStaffId(e.target.value)}>
              {staffUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </CFormSelect>
          </div>
          <div className="mb-3">
            <CFormLabel>Tracking Number (optional)</CFormLabel>
            <CFormInput
              placeholder="e.g. 1Z999AA10123456784"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>
          {staffUsers.length === 0 && (
            <CAlert color="warning" className="mb-0">
              No staff users found. Create a user with the &quot;staff&quot; role first.
            </CAlert>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={() => setShowCreate(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleCreate} disabled={submitting || !selectedOrderId || !selectedStaffId}>
            {submitting ? 'Creating…' : 'Create Shipment'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ── Reassign Shipment Modal ─────────────────────── */}
      <CModal visible={showReassign} onClose={() => setShowReassign(false)}>
        <CModalHeader>
          <CModalTitle>Reassign Shipment – {reassignShipment?.id?.slice(0, 8)}…</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <CFormLabel>New Staff Member *</CFormLabel>
            <CFormSelect value={reassignStaffId} onChange={(e) => setReassignStaffId(e.target.value)}>
              {staffUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </CFormSelect>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={() => setShowReassign(false)}>
            Cancel
          </CButton>
          <CButton color="warning" onClick={handleReassign} disabled={submitting || !reassignStaffId}>
            {submitting ? 'Reassigning…' : 'Reassign'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default DeliveryAssign
