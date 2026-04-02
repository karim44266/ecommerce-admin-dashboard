import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCol,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CFormInput,
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
  CRow,
  CSpinner,
  CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSearch,
  cilReload,
  cilClipboard,
  cilTruck,
  cilOptions,
  cilCheckCircle,
  cilXCircle,
  cilArrowRight,
} from '@coreui/icons'
import api from '../../services/api'
import DataTable from '../../shared/components/DataTable'
import PageHeader from '../../shared/components/PageHeader'
import {
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_TRANSITIONS,
  ALL_STATUSES,
} from './orderConstants'

// ── action button config per target status ──────────────────────
const ACTION_STYLE = {
  CONFIRMED: { color: 'info', label: 'Confirm', icon: cilCheckCircle },
  IN_PREPARATION: { color: 'primary', label: 'Prepare', icon: cilArrowRight },
  DELIVERED: { color: 'success', label: 'Deliver', icon: cilTruck },
  SETTLED: { color: 'success', label: 'Settle', icon: cilCheckCircle },
  CANCELLED: { color: 'danger', label: 'Cancel', icon: cilXCircle },
}

const DESTRUCTIVE = ['CANCELLED']

const OrdersList = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [minTotal, setMinTotal] = useState('')
  const [maxTotal, setMaxTotal] = useState('')
  const [page, setPage] = useState(1)

  // staff users for process + assign flow
  const [staffUsers, setStaffUsers] = useState([])
  const [staffLoading, setStaffLoading] = useState(false)

  // inline status-update modal state
  const [modal, setModal] = useState({
    visible: false,
    order: null,
    targetStatus: '',
    note: '',
    staffId: '',
    deliveryCode: '',
    submitting: false,
  })

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 20 }
      if (statusFilter) params.status = statusFilter
      if (search.trim()) params.search = search.trim()
      if (dateFrom) params.from = dateFrom
      if (dateTo) params.to = dateTo
      if (minTotal.trim()) params.minTotal = Number(minTotal)
      if (maxTotal.trim()) params.maxTotal = Number(maxTotal)
      const response = await api.get('/orders', { params })
      setOrders(response.data?.data || [])
      setMeta(response.data?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 })
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load orders.')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, search, dateFrom, dateTo, minTotal, maxTotal])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // clear success toast after 3s
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(''), 3000)
    return () => clearTimeout(t)
  }, [success])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
  }

  // ── fetch staff for process+assign ────────────────────────────
  const fetchStaff = async () => {
    if (staffUsers.length > 0) return
    setStaffLoading(true)
    try {
      const { data } = await api.get('/shipments/staff')
      setStaffUsers(data || [])
    } catch { /* ignore */ }
    setStaffLoading(false)
  }

  // ── inline status update ──────────────────────────────────────
  const openStatusModal = (order, targetStatus) => {
    const needsStaff = targetStatus === 'IN_PREPARATION'
    if (needsStaff) fetchStaff()
    setModal({ visible: true, order, targetStatus, note: '', staffId: '', deliveryCode: '', submitting: false })
  }
  const closeModal = () =>
    setModal({ visible: false, order: null, targetStatus: '', note: '', staffId: '', deliveryCode: '', submitting: false })

  const confirmStatusUpdate = async () => {
    const { order, targetStatus, note, staffId, deliveryCode } = modal
    // require staff for IN_PREPARATION
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
      await api.patch(`/orders/${order.id}/status`, {
        status: targetStatus,
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(targetStatus === 'DELIVERED' ? { deliveryCode } : {}),
      })
      // auto-create shipment when preparing
      if (targetStatus === 'IN_PREPARATION' && staffId) {
        try {
          await api.post('/shipments', {
            orderId: order.id,
            staffUserId: staffId,
          })
        } catch { /* shipment creation is best-effort */ }
      }
      setSuccess(`Order #${order.id.slice(0, 8)} updated to ${STATUS_LABELS[targetStatus]}`)
      closeModal()
      fetchOrders()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update status.')
      setModal((m) => ({ ...m, submitting: false }))
    }
  }

  // ── columns ───────────────────────────────────────────────────
  const columns = [
    {
      key: 'id',
      label: 'Order',
      render: (row) => (
        <span
          role="button"
          className="text-primary text-decoration-none fw-semibold"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/orders/${row.id}`)}
        >
          #{row.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: 'customerEmail',
      label: 'Customer',
      render: (row) => (
        <span className="text-truncate d-inline-block" style={{ maxWidth: '180px' }}>
          {row.customerEmail || '—'}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Total',
      render: (row) => (
        <span className="fw-semibold">${Number(row.totalAmount).toFixed(2)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <CBadge
          color={STATUS_COLORS[row.status] || 'secondary'}
          shape="rounded-pill"
          className="px-3 py-1"
        >
          {STATUS_LABELS[row.status] || row.status}
        </CBadge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (row) => (
        <span className="text-medium-emphasis small">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => {
        const transitions = STATUS_TRANSITIONS[row.status] || []
        // primary = first non-destructive transition (happy path)
        const primary = transitions.find((s) => !DESTRUCTIVE.includes(s))
        // secondary = everything else
        const secondary = transitions.filter((s) => s !== primary)
        const style = primary ? ACTION_STYLE[primary] : null

        return (
          <div className="d-flex align-items-center gap-1 justify-content-end">
            {/* ── Quick-advance button ── */}
            {primary && style && (
              <CTooltip content={`${style.label} this order`}>
                <CButton
                  color={style.color}
                  size="sm"
                  className="fw-semibold"
                  onClick={() => openStatusModal(row, primary)}
                >
                  <CIcon icon={style.icon} size="sm" className="me-1" />
                  {style.label}
                </CButton>
              </CTooltip>
            )}

            {/* ── More actions dropdown ── */}
            <CDropdown alignment="end" className="order-actions-dropdown">
              <CDropdownToggle
                caret={false}
                className="order-actions-toggle"
              >
                <CIcon icon={cilOptions} />
              </CDropdownToggle>
              <CDropdownMenu className="order-actions-menu shadow-sm">
                <CDropdownItem
                  role="button"
                  className="order-actions-item"
                  onClick={() => navigate(`/orders/${row.id}`)}
                >
                  <span className="order-actions-icon bg-primary-subtle text-primary">
                    <CIcon icon={cilClipboard} size="sm" />
                  </span>
                  <span>View Details</span>
                </CDropdownItem>
                <CDropdownItem
                  role="button"
                  className="order-actions-item"
                  onClick={() => navigate(`/orders/${row.id}/tracking`)}
                >
                  <span className="order-actions-icon bg-info-subtle text-info">
                    <CIcon icon={cilTruck} size="sm" />
                  </span>
                  <span>Update Tracking</span>
                </CDropdownItem>

                {/* secondary status transitions */}
                {secondary.length > 0 && (
                  <>
                    <div className="dropdown-divider" />
                    {secondary.map((s) => {
                      const sty = ACTION_STYLE[s] || {}
                      const isDanger = DESTRUCTIVE.includes(s)
                      return (
                        <CDropdownItem
                          key={s}
                          role="button"
                          className={`order-actions-item${isDanger ? ' order-actions-item--danger' : ''}`}
                          onClick={() => openStatusModal(row, s)}
                        >
                          <span className={`order-actions-icon ${isDanger ? 'bg-danger-subtle text-danger' : `bg-${sty.color || 'secondary'}-subtle text-${sty.color || 'secondary'}`}`}>
                            <CIcon icon={sty.icon || cilArrowRight} size="sm" />
                          </span>
                          <span>{sty.label || STATUS_LABELS[s]}</span>
                        </CDropdownItem>
                      )
                    })}
                  </>
                )}
              </CDropdownMenu>
            </CDropdown>
          </div>
        )
      },
    },
  ]

  // ── pagination ────────────────────────────────────────────────
  const paginationItems = []
  const maxVisiblePages = 5
  let startPage = Math.max(1, meta.page - Math.floor(maxVisiblePages / 2))
  let endPage = Math.min(meta.totalPages, startPage + maxVisiblePages - 1)
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }
  for (let i = startPage; i <= endPage; i++) {
    paginationItems.push(
      <CPaginationItem key={i} active={i === meta.page} onClick={() => setPage(i)}>
        {i}
      </CPaginationItem>,
    )
  }

  // ── render ────────────────────────────────────────────────────
  const isDestructive = DESTRUCTIVE.includes(modal.targetStatus)

  return (
    <div>
      <PageHeader title="Orders" subtitle="Review customer orders and manage fulfillment." />

      {/* Filters */}
      <CRow className="mb-3 g-2 align-items-end">
        <CCol md={2}>
          <CFormSelect
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s] || s}
              </option>
            ))}
          </CFormSelect>
        </CCol>
        <CCol md={3}>
          <form onSubmit={handleSearchSubmit} className="d-flex gap-2">
            <CFormInput
              placeholder="Search by order ID, email, phone, or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <CButton type="submit" color="primary" variant="outline" size="sm">
              <CIcon icon={cilSearch} />
            </CButton>
          </form>
        </CCol>
        <CCol md={2}>
          <CFormInput
            type="date"
            placeholder="From"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value)
              setPage(1)
            }}
          />
        </CCol>
        <CCol md={2}>
          <CFormInput
            type="date"
            placeholder="To"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value)
              setPage(1)
            }}
          />
        </CCol>
        <CCol md={1} className="d-flex align-items-center">
          <CTooltip content="Refresh orders">
            <CButton
              color="primary"
              variant="ghost"
              className="refresh-btn"
              onClick={fetchOrders}
              disabled={loading}
            >
              <CIcon icon={cilReload} className={loading ? 'spin-animation' : ''} />
            </CButton>
          </CTooltip>
        </CCol>
        <CCol md={2}>
          <CFormInput
            type="number"
            min="0"
            step="0.01"
            placeholder="Min Total"
            value={minTotal}
            onChange={(e) => {
              setMinTotal(e.target.value)
              setPage(1)
            }}
          />
        </CCol>
        <CCol md={2}>
          <CFormInput
            type="number"
            min="0"
            step="0.01"
            placeholder="Max Total"
            value={maxTotal}
            onChange={(e) => {
              setMaxTotal(e.target.value)
              setPage(1)
            }}
          />
        </CCol>
      </CRow>

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

      <DataTable
        title={`Orders (${meta.total})`}
        columns={columns}
        data={orders}
        loading={loading}
        emptyMessage="No orders found."
      />

      {meta.totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <small className="text-medium-emphasis">
            Showing page {meta.page} of {meta.totalPages} ({meta.total} total orders)
          </small>
          <CPagination className="mb-0">
            <CPaginationItem disabled={meta.page <= 1} onClick={() => setPage(1)}>
              «
            </CPaginationItem>
            <CPaginationItem disabled={meta.page <= 1} onClick={() => setPage(meta.page - 1)}>
              ‹
            </CPaginationItem>
            {paginationItems}
            <CPaginationItem
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage(meta.page + 1)}
            >
              ›
            </CPaginationItem>
            <CPaginationItem
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage(meta.totalPages)}
            >
              »
            </CPaginationItem>
          </CPagination>
        </div>
      )}

      {/* ── Inline Status-Update Modal ── */}
      <CModal visible={modal.visible} onClose={closeModal} alignment="center">
        <CModalHeader closeButton>
          <CModalTitle>
            {isDestructive ? '⚠️ ' : ''}
            {ACTION_STYLE[modal.targetStatus]?.label || 'Update'} Order
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {modal.order && (
            <>
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="fw-semibold">#{modal.order.id?.slice(0, 8)}</span>
                <CBadge
                  color={STATUS_COLORS[modal.order.status]}
                  shape="rounded-pill"
                  className="px-2"
                >
                  {STATUS_LABELS[modal.order.status]}
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

              <div className="mb-3 small text-medium-emphasis">
                <strong>Customer:</strong> {modal.order.customerEmail || '—'}
                {' · '}
                <strong>Total:</strong> ${Number(modal.order.totalAmount).toFixed(2)}
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
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            variant="ghost"
            onClick={closeModal}
            disabled={modal.submitting}
          >
            Cancel
          </CButton>
          <CButton
            color={
              isDestructive
                ? 'danger'
                : ACTION_STYLE[modal.targetStatus]?.color || 'primary'
            }
            disabled={modal.submitting}
            onClick={confirmStatusUpdate}
          >
            {modal.submitting ? (
              <CSpinner size="sm" className="me-1" />
            ) : (
              <CIcon
                icon={ACTION_STYLE[modal.targetStatus]?.icon || cilArrowRight}
                size="sm"
                className="me-1"
              />
            )}
            {modal.submitting
              ? 'Updating…'
              : ACTION_STYLE[modal.targetStatus]?.label || 'Confirm'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default OrdersList
