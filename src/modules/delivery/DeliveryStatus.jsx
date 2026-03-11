import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CPagination,
  CPaginationItem,
  CSpinner,
  CCard,
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

/* ── Status colours ──────────────────────────────────────────── */
const STATUS_COLORS = {
  PENDING: 'secondary',
  ASSIGNED: 'info',
  IN_TRANSIT: 'warning',
  DELIVERED: 'success',
  FAILED: 'danger',
  RETURNED: 'secondary',
}

/* ── Allowed transitions (mirrors backend) ──────────────────── */
const TRANSITIONS = {
  PENDING: [],
  ASSIGNED: ['IN_TRANSIT', 'PENDING', 'FAILED'],
  IN_TRANSIT: ['DELIVERED', 'FAILED'],
  FAILED: ['RETURNED', 'IN_TRANSIT'],
  DELIVERED: [],
  RETURNED: [],
}

const LABEL = {
  PENDING: 'Pending',
  ASSIGNED: 'Assigned',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
  RETURNED: 'Returned',
}

/* ── Status filter tabs ──────────────────────────────────────── */
const FILTER_TABS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'RETURNED', label: 'Returned' },
]

const DeliveryStatus = () => {
  const [shipments, setShipments] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Confirm accept/decline modal
  const [confirmAction, setConfirmAction] = useState(null) // { shipment, action: 'accept'|'decline' }

  /* ── Fetch shipments ───────────────────────────────────────── */
  const fetchShipments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 20 }
      if (statusFilter) params.status = statusFilter
      const { data } = await api.get('/shipments', { params })
      setShipments(data?.data || [])
      setMeta(data?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 })
    } catch (err) {
      if (err?.response?.status === 401) {
        setError('Session expired. Redirecting to login…')
      } else {
        setError('Unable to load shipments. Make sure the backend is running.')
      }
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page])

  useEffect(() => {
    fetchShipments()
  }, [fetchShipments])

  /* ── Filtered list ──────────────────────────────────────── */
  const filtered = shipments

  /* ── Open update modal ─────────────────────────────────────── */
  const openUpdate = (shipment) => {
    const allowed = TRANSITIONS[shipment.status] || []
    setSelected(shipment)
    setNewStatus(allowed[0] || '')
    setNote('')
    setShowModal(true)
    setSuccess('')
  }

  /* ── Submit status update ──────────────────────────────────── */
  const handleUpdate = async () => {
    if (!selected || !newStatus) return
    setSubmitting(true)
    setError('')
    try {
      await api.patch(`/shipments/${selected.id}/status`, {
        status: newStatus,
        note: note || undefined,
      })
      setSuccess(
        `Shipment ${selected.id.slice(0, 8)}… updated to ${LABEL[newStatus] || newStatus}.`,
      )
      setShowModal(false)
      fetchShipments()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Unable to update status. Please try again.'
      setError(Array.isArray(msg) ? msg.join(', ') : msg)
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Allowed next statuses for selected shipment ───────────── */
  const allowedNext = selected ? TRANSITIONS[selected.status] || [] : []

  return (
    <div>
      <PageHeader
        title="Delivery Status Updates"
        subtitle="Track shipment progress and update delivery status."
      />

      {error && (
        <CAlert color="danger" dismissible onClose={() => setError('')}>
          {error}
        </CAlert>
      )}
      {success && (
        <CAlert color="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </CAlert>
      )}

      {/* ── Filter bar ──────────────────────────────────────── */}
      <CCard className="mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span>Shipments ({filtered.length})</span>
          <div className="d-flex gap-1 flex-wrap">
            {FILTER_TABS.map((tab) => (
              <CButton
                key={tab.value}
                color={statusFilter === tab.value ? 'primary' : 'light'}
                size="sm"
                onClick={() => { setStatusFilter(tab.value); setPage(1) }}
              >
                {tab.label}
              </CButton>
            ))}
            <CButton color="light" size="sm" onClick={fetchShipments} disabled={loading}>
              ↻ Refresh
            </CButton>
          </div>
        </CCardHeader>
        {loading ? (
          <div className="text-center py-5">
            <CSpinner color="primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4">
            <p className="text-body-secondary mb-0">
              {statusFilter
                ? `No shipments with status "${LABEL[statusFilter] || statusFilter}".`
                : 'No shipments found.'}
            </p>
          </div>
        ) : (
          <CTable responsive hover align="middle" className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Shipment</CTableHeaderCell>
                  <CTableHeaderCell>Order</CTableHeaderCell>
                  <CTableHeaderCell>Address</CTableHeaderCell>
                  <CTableHeaderCell>Staff</CTableHeaderCell>
                  <CTableHeaderCell>Tracking</CTableHeaderCell>
                  <CTableHeaderCell>Order Status</CTableHeaderCell>
                  <CTableHeaderCell>Shipment Status</CTableHeaderCell>
                  <CTableHeaderCell>Assigned</CTableHeaderCell>
                  <CTableHeaderCell>Delivered</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filtered.map((s) => {
                  const canUpdate = (TRANSITIONS[s.status] || []).length > 0
                  return (
                    <CTableRow key={s.id}>
                      <CTableDataCell className="font-monospace">
                        {s.id.slice(0, 8)}…
                      </CTableDataCell>
                      <CTableDataCell className="font-monospace">
                        {s.orderId.slice(0, 8)}…
                      </CTableDataCell>
                      <CTableDataCell className="small">
                        {s.shippingAddress
                          ? [s.shippingAddress.street, s.shippingAddress.city, s.shippingAddress.state, s.shippingAddress.zip].filter(Boolean).join(', ')
                          : '—'}
                      </CTableDataCell>
                      <CTableDataCell>
                        {s.staffName || s.staffEmail || s.staffUserId?.slice(0, 8)}
                      </CTableDataCell>
                      <CTableDataCell className="font-monospace small">
                        {s.trackingNumber || '—'}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="secondary">{s.orderStatus || '—'}</CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={STATUS_COLORS[s.status] || 'secondary'}>
                          {LABEL[s.status] || s.status}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        {s.assignedAt ? new Date(s.assignedAt).toLocaleDateString() : '—'}
                      </CTableDataCell>
                      <CTableDataCell>
                        {s.deliveredAt ? new Date(s.deliveredAt).toLocaleDateString() : '—'}
                      </CTableDataCell>
                      <CTableDataCell>
                        {s.status === 'ASSIGNED' ? (
                          <div className="d-flex gap-1">
                            <CButton
                              color="success"
                              size="sm"
                              disabled={submitting}
                              onClick={() => setConfirmAction({ shipment: s, action: 'accept' })}
                            >
                              Accept
                            </CButton>
                            <CButton
                              color="danger"
                              size="sm"
                              variant="outline"
                              disabled={submitting}
                              onClick={() => setConfirmAction({ shipment: s, action: 'decline' })}
                            >
                              Decline
                            </CButton>
                          </div>
                        ) : canUpdate ? (
                          <CButton
                            color="success"
                            size="sm"
                            onClick={() => openUpdate(s)}
                          >
                            Update
                          </CButton>
                        ) : (
                          <span className="text-body-secondary small">—</span>
                        )}
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
              </CTableBody>
          </CTable>
        )}
      </CCard>

      {meta.totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <small className="text-medium-emphasis">
            Page {meta.page} of {meta.totalPages} ({meta.total} shipments)
          </small>
          <CPagination className="mb-0">
            <CPaginationItem disabled={meta.page <= 1} onClick={() => setPage(1)}>«</CPaginationItem>
            <CPaginationItem disabled={meta.page <= 1} onClick={() => setPage(meta.page - 1)}>‹</CPaginationItem>
            {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
              const start = Math.max(1, meta.page - 2)
              const p = start + i
              if (p > meta.totalPages) return null
              return (
                <CPaginationItem key={p} active={p === meta.page} onClick={() => setPage(p)}>
                  {p}
                </CPaginationItem>
              )
            })}
            <CPaginationItem disabled={meta.page >= meta.totalPages} onClick={() => setPage(meta.page + 1)}>›</CPaginationItem>
            <CPaginationItem disabled={meta.page >= meta.totalPages} onClick={() => setPage(meta.totalPages)}>»</CPaginationItem>
          </CPagination>
        </div>
      )}

      {/* ── Update Status Modal ─────────────────────────────── */}
      <CModal visible={showModal} onClose={() => setShowModal(false)}>
        <CModalHeader>
          <CModalTitle>
            Update Shipment – {selected?.id?.slice(0, 8)}…
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <p className="text-body-secondary mb-1 small">
              Current status:{' '}
              <CBadge color={STATUS_COLORS[selected?.status] || 'secondary'}>
                {LABEL[selected?.status] || selected?.status}
              </CBadge>
            </p>
          </div>
          <div className="mb-3">
            <CFormLabel>New Status *</CFormLabel>
            <CFormSelect
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {allowedNext.length === 0 && (
                <option value="">No transitions available</option>
              )}
              {allowedNext.map((s) => (
                <option key={s} value={s}>
                  {LABEL[s] || s}
                </option>
              ))}
            </CFormSelect>
          </div>
          <div className="mb-3">
            <CFormLabel>Note (optional)</CFormLabel>
            <CFormTextarea
              rows={3}
              placeholder="e.g. Left at front door, Customer not home…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            variant="ghost"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </CButton>
          <CButton
            color="success"
            onClick={handleUpdate}
            disabled={submitting || !newStatus}
          >
            {submitting ? 'Updating…' : 'Confirm'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ── Confirm Accept / Decline Modal ──────────────────── */}
      <CModal visible={!!confirmAction} onClose={() => setConfirmAction(null)}>
        <CModalHeader>
          <CModalTitle>
            {confirmAction?.action === 'accept' ? 'Accept' : 'Decline'} Delivery
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          Are you sure you want to{' '}
          <strong>{confirmAction?.action === 'accept' ? 'accept' : 'decline'}</strong>{' '}
          shipment <strong>{confirmAction?.shipment?.id?.slice(0, 8)}…</strong>?
          {confirmAction?.action === 'decline' &&
            ' The shipment will be returned to the assignment queue.'}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={() => setConfirmAction(null)}>
            Cancel
          </CButton>
          <CButton
            color={confirmAction?.action === 'accept' ? 'success' : 'danger'}
            disabled={submitting}
            onClick={async () => {
              const s = confirmAction.shipment
              const isAccept = confirmAction.action === 'accept'
              setConfirmAction(null)
              setSubmitting(true)
              setError('')
              try {
                await api.patch(`/shipments/${s.id}/status`, {
                  status: isAccept ? 'IN_TRANSIT' : 'PENDING',
                  note: isAccept ? 'Delivery accepted by staff' : 'Delivery declined by staff',
                })
                setSuccess(
                  isAccept
                    ? `Shipment ${s.id.slice(0, 8)}… accepted – now In Transit.`
                    : `Shipment ${s.id.slice(0, 8)}… declined – awaiting reassignment.`,
                )
                fetchShipments()
              } catch (err) {
                const msg = err?.response?.data?.message || `Failed to ${confirmAction?.action}.`
                setError(Array.isArray(msg) ? msg.join(', ') : msg)
              } finally {
                setSubmitting(false)
              }
            }}
          >
            {submitting ? 'Processing…' : confirmAction?.action === 'accept' ? 'Accept' : 'Decline'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default DeliveryStatus
