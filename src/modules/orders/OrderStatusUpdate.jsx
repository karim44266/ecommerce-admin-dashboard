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
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilArrowLeft,
  cilArrowRight,
  cilCheckCircle,
  cilXCircle,
  cilTruck,
} from '@coreui/icons'
import api from '../../services/api'
import PageHeader from '../../shared/components/PageHeader'
import { formatCurrency } from '../../shared/utils/formatters'
import { STATUS_COLORS, STATUS_LABELS, STATUS_TRANSITIONS, ALL_STATUSES } from './orderConstants'
import useUnsavedWarning from '../../shared/hooks/useUnsavedWarning'

const HAPPY_PATH = ['DRAFT', 'CONFIRMED', 'IN_PREPARATION', 'DELIVERED', 'SETTLED']
const DESTRUCTIVE = ['CANCELLED']

const ACTION_META = {
  CONFIRMED: { icon: cilCheckCircle, verb: 'Confirm' },
  IN_PREPARATION: { icon: cilArrowRight, verb: 'Prepare' },
  DELIVERED: { icon: cilTruck, verb: 'Mark Delivered' },
  SETTLED: { icon: cilCheckCircle, verb: 'Settle' },
  CANCELLED: { icon: cilXCircle, verb: 'Cancel' },
}

const OrderStatusUpdate = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // staff users for process + assign flow
  const [staffUsers, setStaffUsers] = useState([])
  const [staffLoading, setStaffLoading] = useState(false)
  const [staffId, setStaffId] = useState('')

  useUnsavedWarning(selected !== '' || note !== '')

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
  const happyNext = allowedStatuses.filter((s) => !DESTRUCTIVE.includes(s))
  const destructiveNext = allowedStatuses.filter((s) => DESTRUCTIVE.includes(s))

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

  // pick a status → if destructive, gate through confirm
  const pickStatus = (s) => {
    setSelected(s)
    setStaffId('')
    if (s === 'IN_PREPARATION') fetchStaff()
    if (DESTRUCTIVE.includes(s)) {
      setShowConfirm(true)
    }
  }

  const handleSubmit = async () => {
    if (!selected) return
    if (selected === 'IN_PREPARATION' && !staffId) {
      setError('Please select a staff member to assign delivery.')
      return
    }
    if (DESTRUCTIVE.includes(selected) && !showConfirm) {
      setShowConfirm(true)
      return
    }
    setShowConfirm(false)
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await api.patch(`/orders/${id}/status`, {
        status: selected,
        ...(note.trim() ? { note: note.trim() } : {}),
      })
      if (selected === 'IN_PREPARATION' && staffId) {
        try {
          await api.post('/shipments', {
            orderId: id,
            staffUserId: staffId,
          })
        } catch { /* best-effort */ }
      }
      setSuccess(`Status updated to ${STATUS_LABELS[selected]}`)
      setTimeout(() => navigate(`/orders/${id}`, { replace: true }), 800)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update order status.')
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

  // index of the current status in the happy path
  const currentIdx = HAPPY_PATH.indexOf(order?.status)

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-3">
        <PageHeader title="Update Order Status" subtitle={`Order #${id.slice(0, 8)}`} />
        <CButton
          color="secondary"
          variant="outline"
          size="sm"
          className="flex-shrink-0 mt-1 nx-utility-btn"
          onClick={() => navigate(`/orders/${id}`)}
        >
          <CIcon icon={cilArrowLeft} className="me-1" />
          Back to Details
        </CButton>
      </div>

      {error && <CAlert color="danger">{error}</CAlert>}
      {success && <CAlert color="success">{success}</CAlert>}

      {/* ─── Visual Status Pipeline ─────────────────────────── */}
      {order && (
        <CCard className="mb-4">
          <CCardHeader className="fw-semibold">Order Progress</CCardHeader>
          <CCardBody>
            <div className="d-flex align-items-center justify-content-between mb-2">
              {HAPPY_PATH.map((step, idx) => {
                const stepIdx = HAPPY_PATH.indexOf(step)
                const isCurrent = step === order.status
                const isPast = currentIdx >= 0 && stepIdx < currentIdx
                const isFuture = currentIdx >= 0 && stepIdx > currentIdx
                // is this step reachable from current status?
                const isNext = allowedStatuses.includes(step)

                let badgeColor = 'light'
                if (isCurrent) badgeColor = STATUS_COLORS[step] || 'primary'
                else if (isPast) badgeColor = 'success'
                else if (isFuture) badgeColor = 'light'

                return (
                  <React.Fragment key={step}>
                    {idx > 0 && (
                      <div
                        className="flex-grow-1 mx-1"
                        style={{
                          height: 3,
                          background: isPast || isCurrent ? '#2eb85c' : '#d8dbe0',
                          borderRadius: 2,
                        }}
                      />
                    )}
                    <div className="text-center" style={{ minWidth: 80 }}>
                      <CBadge
                        color={badgeColor}
                        shape="rounded-pill"
                        className={`px-3 py-2 ${isCurrent ? 'border border-2' : ''} ${isFuture ? 'text-medium-emphasis' : ''}`}
                        style={{
                          cursor: isNext ? 'pointer' : 'default',
                          opacity: isFuture && !isNext ? 0.5 : 1,
                          transition: 'all 0.2s',
                          ...(selected === step
                            ? { boxShadow: `0 0 0 3px var(--cui-${STATUS_COLORS[step] || 'primary'})` }
                            : {}),
                        }}
                        onClick={isNext ? () => pickStatus(step) : undefined}
                      >
                        {STATUS_LABELS[step]}
                      </CBadge>
                      {isCurrent && (
                        <div className="small text-medium-emphasis mt-1">Current</div>
                      )}
                      {selected === step && !isCurrent && (
                        <div className="small text-primary mt-1 fw-semibold">Selected</div>
                      )}
                    </div>
                  </React.Fragment>
                )
              })}
            </div>

            {/* Info for terminal / non-happy-path states */}
            {currentIdx < 0 && (
              <CAlert color="info" className="mt-3 mb-0 small">
                This order is in <strong>{STATUS_LABELS[order.status] || order.status}</strong> state
                {allowedStatuses.length === 0 ? ' (terminal — no further transitions).' : '.'}
              </CAlert>
            )}
          </CCardBody>
        </CCard>
      )}

      {/* ─── Quick-Action Buttons ───────────────────────────── */}
      {order && allowedStatuses.length > 0 && (
        <CRow className="mb-4 g-3">
          {/* Happy-path actions */}
          {happyNext.map((s) => {
            const meta = ACTION_META[s] || {}
            const isSelected = selected === s
            return (
              <CCol key={s} xs={6} md={3}>
                <CButton
                  color={STATUS_COLORS[s] || 'primary'}
                  variant={isSelected ? undefined : 'outline'}
                  className="w-100 py-3 fw-semibold"
                  onClick={() => pickStatus(s)}
                >
                  <CIcon icon={meta.icon || cilArrowRight} className="me-2" />
                  {meta.verb || STATUS_LABELS[s]}
                </CButton>
              </CCol>
            )
          })}

          {/* Destructive actions (smaller, ghost style) */}
          {destructiveNext.map((s) => {
            const meta = ACTION_META[s] || {}
            const isSelected = selected === s
            return (
              <CCol key={s} xs={6} md={3}>
                <CButton
                  color="danger"
                  variant={isSelected ? undefined : 'ghost'}
                  className="w-100 py-3"
                  onClick={() => pickStatus(s)}
                >
                  <CIcon icon={meta.icon || cilXCircle} className="me-2" />
                  {meta.verb || STATUS_LABELS[s]}
                </CButton>
              </CCol>
            )
          })}
        </CRow>
      )}

      {/* ─── Note + Submit ──────────────────────────────────── */}
      {selected && (
        <CCard className="mb-4 border-top border-3"
          style={{ borderTopColor: `var(--cui-${DESTRUCTIVE.includes(selected) ? 'danger' : STATUS_COLORS[selected] || 'primary'})` }}
        >
          <CCardBody>
            <div className="d-flex align-items-center gap-2 mb-3">
              <CBadge color={STATUS_COLORS[order.status]} shape="rounded-pill" className="px-3 py-1">
                {STATUS_LABELS[order.status]}
              </CBadge>
              <CIcon icon={cilArrowRight} className="text-medium-emphasis" />
              <CBadge color={STATUS_COLORS[selected]} shape="rounded-pill" className="px-3 py-1">
                {STATUS_LABELS[selected]}
              </CBadge>
              <span className="text-medium-emphasis ms-auto small">
                {formatCurrency(order.totalAmount)} · {order.customerEmail || '—'}
              </span>
            </div>

            <CFormTextarea
              rows={2}
              placeholder="Add a note (optional)…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mb-3"
            />

            {/* ── Staff picker for IN_PREPARATION ── */}
            {selected === 'IN_PREPARATION' && (
              <div className="mb-3">
                <CFormLabel className="fw-semibold">Assign delivery staff *</CFormLabel>
                {staffLoading ? (
                  <div className="text-center py-2"><CSpinner size="sm" /></div>
                ) : (
                  <CFormSelect
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
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

            <div className="d-flex gap-2">
              <CButton
                color={DESTRUCTIVE.includes(selected) ? 'danger' : STATUS_COLORS[selected] || 'primary'}
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <CSpinner size="sm" className="me-1" />
                ) : (
                  <CIcon icon={ACTION_META[selected]?.icon || cilArrowRight} size="sm" className="me-1" />
                )}
                {submitting ? 'Updating…' : `${ACTION_META[selected]?.verb || STATUS_LABELS[selected]}`}
              </CButton>
              <CButton
                color="secondary"
                variant="ghost"
                onClick={() => { setSelected(''); setNote(''); setStaffId('') }}
              >
                <CIcon icon={cilXCircle} className="me-1" />
                Clear
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      )}

      {allowedStatuses.length === 0 && order && (
        <CAlert color="info">
          This order is in a terminal state (<strong>{STATUS_LABELS[order.status] || order.status}</strong>). No further transitions allowed.
        </CAlert>
      )}

      {/* ── Confirm Destructive Status Change ─────────────────── */}
      <CModal visible={showConfirm} onClose={() => { setShowConfirm(false); setSelected('') }}>
        <CModalHeader>
          <CModalTitle>⚠️ {ACTION_META[selected]?.verb || STATUS_LABELS[selected]} Order</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="d-flex align-items-center gap-2 mb-3">
            <CBadge color={STATUS_COLORS[order?.status]} shape="rounded-pill" className="px-2">
              {STATUS_LABELS[order?.status]}
            </CBadge>
            <CIcon icon={cilArrowRight} size="sm" className="text-medium-emphasis" />
            <CBadge color={STATUS_COLORS[selected]} shape="rounded-pill" className="px-2">
              {STATUS_LABELS[selected]}
            </CBadge>
          </div>
          <p className="mb-2">
            Are you sure you want to <strong>{(ACTION_META[selected]?.verb || '').toLowerCase()}</strong> order{' '}
            <strong>#{id.slice(0, 8)}</strong>?
          </p>
          <p className="text-danger small mb-0">This action cannot be easily undone.</p>

          <CFormTextarea
            rows={2}
            placeholder="Reason (optional)…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-3"
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={() => { setShowConfirm(false); setSelected('') }}>
            <CIcon icon={cilArrowLeft} className="me-1" />
            Go Back
          </CButton>
          <CButton
            color="danger"
            disabled={submitting}
            onClick={handleSubmit}
          >
            <CIcon icon={cilXCircle} className="me-1" />
            {submitting ? 'Updating…' : `Yes, ${ACTION_META[selected]?.verb || STATUS_LABELS[selected]}`}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default OrderStatusUpdate
