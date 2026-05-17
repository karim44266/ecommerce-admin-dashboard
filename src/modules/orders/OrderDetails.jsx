import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilArrowLeft,
  cilArrowRight,
  cilCheckCircle,
  cilXCircle,
  cilTruck,
  cilReload,
} from '@coreui/icons'
import api from '../../services/api'
import PageHeader from '../../shared/components/PageHeader'
import { formatCurrency } from '../../shared/utils/formatters'
import { STATUS_COLORS, STATUS_LABELS, STATUS_TRANSITIONS } from './orderConstants'

const DESTRUCTIVE = ['CANCELLED']
const ACTION_META = {
  CONFIRMED: { icon: cilCheckCircle, verb: 'Confirm', color: 'info' },
  IN_PREPARATION: { icon: cilArrowRight, verb: 'Prepare', color: 'primary' },
  DELIVERED: { icon: cilTruck, verb: 'Mark Delivered', color: 'success' },
  SETTLED: { icon: cilCheckCircle, verb: 'Settle', color: 'success' },
  CANCELLED: { icon: cilXCircle, verb: 'Cancel', color: 'danger' },
}

const OrderDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // staff users for process + assign flow
  const [staffUsers, setStaffUsers] = useState([])
  const [staffLoading, setStaffLoading] = useState(false)

  // inline status modal
  const [modal, setModal] = useState({
    visible: false,
    targetStatus: '',
    note: '',
    staffId: '',
    deliveryCode: '',
    submitting: false,
  })

  const fetchOrder = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(`/orders/${id}`)
      setOrder(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load order details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
  }, [id])

  // clear success after 3 s
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(''), 3000)
    return () => clearTimeout(t)
  }, [success])

  // fetch staff for process+assign
  const fetchStaff = async () => {
    if (staffUsers.length > 0) return
    setStaffLoading(true)
    try {
      const { data } = await api.get('/shipments/staff')
      setStaffUsers(data || [])
    } catch { /* ignore */ }
    setStaffLoading(false)
  }

  const openStatusModal = (targetStatus) => {
    if (targetStatus === 'IN_PREPARATION') fetchStaff()
    setModal({ visible: true, targetStatus, note: '', staffId: '', deliveryCode: '', submitting: false })
  }
  const closeModal = () =>
    setModal({ visible: false, targetStatus: '', note: '', staffId: '', deliveryCode: '', submitting: false })

  const confirmStatusUpdate = async () => {
    const { targetStatus, note, staffId, deliveryCode } = modal
    if (targetStatus === 'IN_PREPARATION' && !staffId) {
      setError('Please select a staff member to assign delivery.')
      return
    }
    if (targetStatus === 'DELIVERED') {
      if (!deliveryCode || deliveryCode.length !== 4) {
        setError('A 4-digit delivery PIN is required to confirm delivery.')
        return
      }
    }
    setModal((m) => ({ ...m, submitting: true }))
    try {
      await api.patch(`/orders/${id}/status`, {
        status: targetStatus,
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(targetStatus === 'DELIVERED' ? { deliveryCode } : {}),
      })
      if (targetStatus === 'IN_PREPARATION' && staffId) {
        try {
          await api.post('/shipments', {
            orderId: id,
            staffUserId: staffId,
          })
        } catch { /* best-effort */ }
      }
      setSuccess(`Status updated to ${STATUS_LABELS[targetStatus]}`)
      closeModal()
      fetchOrder()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update status.')
      setModal((m) => ({ ...m, submitting: false }))
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Order Details" subtitle={`Order ${id}`} />
        <CAlert color="danger">{error}</CAlert>
      </div>
    )
  }

  if (!order) return null

  const allowedStatuses = STATUS_TRANSITIONS[order.status] || []
  const happyNext = allowedStatuses.filter((s) => !DESTRUCTIVE.includes(s))
  const destructiveNext = allowedStatuses.filter((s) => DESTRUCTIVE.includes(s))
  const isDestructive = DESTRUCTIVE.includes(modal.targetStatus)

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-3">
        <PageHeader title="Order Details" subtitle={`Order #${order.id.slice(0, 8)}`} />
        <div className="d-flex gap-2 flex-shrink-0 pt-1 nx-utility-actions">
          <CButton color="light" size="sm" className="nx-utility-btn" onClick={() => fetchOrder()} disabled={loading}>
            <CIcon icon={cilReload} className="me-1" />
            Refresh
          </CButton>
          <CButton color="secondary" variant="outline" size="sm" className="nx-utility-btn" onClick={() => navigate('/orders')}>
            <CIcon icon={cilArrowLeft} className="me-1" />
            Back
          </CButton>
        </div>
      </div>

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

      {/* ── Quick-action bar ──────────────────────────────────── */}
      {allowedStatuses.length > 0 && (
        <CCard className="mb-4 border-0 bg-light">
          <CCardBody className="d-flex flex-wrap align-items-center gap-2 py-2 nx-utility-actions">
            <span className="text-medium-emphasis small fw-semibold me-2">Quick Actions:</span>
            {happyNext.map((s) => {
              const m = ACTION_META[s] || {}
              return (
                <CButton
                  key={s}
                  color={m.color || 'primary'}
                  size="sm"
                  className="fw-semibold nx-utility-btn"
                  onClick={() => openStatusModal(s)}
                >
                  <CIcon icon={m.icon || cilArrowRight} size="sm" className="me-1" />
                  {m.verb || STATUS_LABELS[s]}
                </CButton>
              )
            })}
            {destructiveNext.map((s) => {
              const m = ACTION_META[s] || {}
              return (
                <CButton
                  key={s}
                  color="danger"
                  variant="ghost"
                  size="sm"
                  className="nx-utility-btn"
                  onClick={() => openStatusModal(s)}
                >
                  <CIcon icon={m.icon || cilXCircle} size="sm" className="me-1" />
                  {m.verb || STATUS_LABELS[s]}
                </CButton>
              )
            })}
          </CCardBody>
        </CCard>
      )}

      {/* Order Summary */}
      <CRow className="mb-4">
        <CCol md={6}>
          <CCard className="mb-3">
            <CCardHeader>Order Information</CCardHeader>
            <CCardBody>
              <dl className="row mb-0">
                <dt className="col-sm-5">Status</dt>
                <dd className="col-sm-7">
                  <CBadge
                    color={STATUS_COLORS[order.status] || 'secondary'}
                    shape="rounded-pill"
                    className="px-3 py-1"
                  >
                    {STATUS_LABELS[order.status] || order.status}
                  </CBadge>
                </dd>
                <dt className="col-sm-5">Total</dt>
                <dd className="col-sm-7">{formatCurrency(order.totalAmount)}</dd>
                <dt className="col-sm-5">Customer</dt>
                <dd className="col-sm-7">{order.customerEmail || '—'}</dd>
                {order.deliveryCode && (
                  <>
                    <dt className="col-sm-5 text-success">Delivery PIN</dt>
                    <dd className="col-sm-7">
                      <CBadge color="success" shape="rounded-pill" className="fw-bold tracking-widest">{order.deliveryCode}</CBadge>
                    </dd>
                  </>
                )}
                <dt className="col-sm-5">Shipping Address</dt>
                <dd className="col-sm-7">
                  {order.shippingAddress && typeof order.shippingAddress === 'object' ? (
                    <div>
                      <div className="fw-semibold">{order.shippingAddress.fullName}</div>
                      <div className="text-medium-emphasis small">
                        {order.shippingAddress.addressLine1}
                        {order.shippingAddress.addressLine2 && (
                          <>, {order.shippingAddress.addressLine2}</>
                        )}
                      </div>
                      <div className="text-medium-emphasis small">
                        {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                        {order.shippingAddress.postalCode}
                      </div>
                      <div className="text-medium-emphasis small">
                        {order.shippingAddress.country}
                      </div>
                    </div>
                  ) : (
                    order.shippingAddress || '—'
                  )}
                </dd>
                <dt className="col-sm-5">Created</dt>
                <dd className="col-sm-7">{new Date(order.createdAt).toLocaleString()}</dd>
                <dt className="col-sm-5">Updated</dt>
                <dd className="col-sm-7">{new Date(order.updatedAt).toLocaleString()}</dd>
              </dl>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={6}>
          <CCard className="mb-3">
            <CCardHeader>Tracking Information</CCardHeader>
            <CCardBody>
              {order.carrier || order.trackingNumber ? (
                <dl className="row mb-0">
                  <dt className="col-sm-5">Carrier</dt>
                  <dd className="col-sm-7">{order.carrier || '—'}</dd>
                  <dt className="col-sm-5">Tracking Number</dt>
                  <dd className="col-sm-7">{order.trackingNumber || '—'}</dd>
                </dl>
              ) : (
                <p className="text-medium-emphasis mb-0">No tracking information yet.</p>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Order Items */}
      <CCard className="mb-4">
        <CCardHeader>Items ({order.items?.length || 0})</CCardHeader>
          <CTable responsive hover align="middle" className="mb-0">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Product</CTableHeaderCell>
                <CTableHeaderCell>Qty</CTableHeaderCell>
                <CTableHeaderCell>Unit Price</CTableHeaderCell>
                <CTableHeaderCell>Subtotal</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {(order.items || []).map((item) => (
                <CTableRow key={item.id}>
                  <CTableDataCell>{item.name}</CTableDataCell>
                  <CTableDataCell>{item.quantity}</CTableDataCell>
                  <CTableDataCell>{formatCurrency(item.unitPrice)}</CTableDataCell>
                  <CTableDataCell>
                    {formatCurrency(Number(item.unitPrice) * item.quantity)}
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
      </CCard>

      {/* Status History / Audit Trail */}
      <CCard className="mb-4">
        <CCardHeader>Status History (Audit Trail)</CCardHeader>
        <CCardBody>
          {order.statusHistory && order.statusHistory.length > 0 ? (
            <div className="timeline">
              {order.statusHistory.map((entry, idx) => (
                <div
                  key={entry.id}
                  className={`d-flex mb-3 ${idx === order.statusHistory.length - 1 ? '' : 'border-bottom pb-3'}`}
                >
                  <div className="me-3">
                    <CBadge
                      color={STATUS_COLORS[entry.status] || 'secondary'}
                      shape="rounded-pill"
                      className="px-3 py-1"
                    >
                      {STATUS_LABELS[entry.status] || entry.status}
                    </CBadge>
                  </div>
                  <div className="flex-grow-1">
                    <div className="text-medium-emphasis small">
                      {new Date(entry.createdAt).toLocaleString()} — by{' '}
                      <strong>{entry.changedByEmail || entry.changedBy}</strong>
                    </div>
                    {entry.note && <div className="mt-1">{entry.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-medium-emphasis mb-0">No status history available.</p>
          )}
        </CCardBody>
      </CCard>

      {/* ── Inline Status-Update Modal ── */}
      <CModal visible={modal.visible} onClose={closeModal} alignment="center">
        <CModalHeader closeButton>
          <CModalTitle>
            {isDestructive ? '⚠️ ' : ''}
            {ACTION_META[modal.targetStatus]?.verb || 'Update'} Order
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="d-flex align-items-center gap-2 mb-3">
            <CBadge
              color={STATUS_COLORS[order.status]}
              shape="rounded-pill"
              className="px-2"
            >
              {STATUS_LABELS[order.status]}
            </CBadge>
            <CIcon icon={cilArrowRight} size="sm" className="text-medium-emphasis" />
            <CBadge
              color={STATUS_COLORS[modal.targetStatus]}
              shape="rounded-pill"
              className="px-2"
            >
              {STATUS_LABELS[modal.targetStatus]}
            </CBadge>
          </div>

          {isDestructive && (
            <CAlert color="danger" className="py-2 small">
              This is a destructive action and cannot be easily undone.
            </CAlert>
          )}

          {/* ── Staff picker for IN_PREPARATION ── */}
          {modal.targetStatus === 'IN_PREPARATION' && (
            <div className="mb-3">
              <CFormLabel className="fw-semibold">Assign delivery staff *</CFormLabel>
              {staffLoading ? (
                <div className="text-center py-2"><CSpinner size="sm" /></div>
              ) : (
                <CFormSelect
                  value={modal.staffId}
                  onChange={(e) => setModal((m) => ({ ...m, staffId: e.target.value }))}
                >
                  <option value="">— select staff member —</option>
                  {staffUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email} ({u.email})
                    </option>
                  ))}
                </CFormSelect>
              )}
            </div>
          )}

          {/* ── Delivery PIN for DELIVERED ── */}
          {modal.targetStatus === 'DELIVERED' && (
            <div className="mb-3">
              <CFormLabel className="fw-semibold text-success">Delivery Code (4-digit PIN) *</CFormLabel>
               <CFormInput
                 type="text"
                 maxLength="4"
                 className="fw-bold tracking-widest text-lg"
                 placeholder="e.g. 1234"
                 value={modal.deliveryCode}
                 onChange={(e) => setModal((m) => ({ ...m, deliveryCode: e.target.value.replace(/\D/g, '') }))}
               />
            </div>
          )}

          <CFormTextarea
            rows={2}
            placeholder="Add a note (optional)…"
            value={modal.note}
            onChange={(e) => setModal((m) => ({ ...m, note: e.target.value }))}
          />
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            variant="ghost"
            onClick={closeModal}
            disabled={modal.submitting}
          >
            <CIcon icon={cilXCircle} className="me-1" />
            Cancel
          </CButton>
          <CButton
            color={isDestructive ? 'danger' : ACTION_META[modal.targetStatus]?.color || 'primary'}
            disabled={modal.submitting}
            onClick={confirmStatusUpdate}
          >
            {modal.submitting ? (
              <CSpinner size="sm" className="me-1" />
            ) : (
              <CIcon
                icon={ACTION_META[modal.targetStatus]?.icon || cilArrowRight}
                size="sm"
                className="me-1"
              />
            )}
            {modal.submitting
              ? 'Updating…'
              : ACTION_META[modal.targetStatus]?.verb || 'Confirm'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default OrderDetails
