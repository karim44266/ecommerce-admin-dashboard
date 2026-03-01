import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CButtonGroup,
  CCol,
  CFormInput,
  CFormSelect,
  CPagination,
  CPaginationItem,
  CRow,
  CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilReload, cilClipboard, cilLoop, cilTruck } from '@coreui/icons'
import api from '../../services/api'
import PageHeader from '../../shared/components/PageHeader'

const STATUS_COLORS = {
  PENDING_PAYMENT: 'warning',
  PAID: 'info',
  PROCESSING: 'primary',
  SHIPPED: 'dark',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  REFUNDED: 'secondary',
  FAILED: 'danger',
}

const STATUS_LABELS = {
  PENDING_PAYMENT: 'Pending Payment',
  PAID: 'Paid',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
  FAILED: 'Failed',
}

const ALL_STATUSES = [
  'PENDING_PAYMENT',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
  'FAILED',
]

const OrdersList = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 20 }
      if (statusFilter) params.status = statusFilter
      if (search.trim()) params.search = search.trim()
      const response = await api.get('/orders', { params })
      setOrders(response.data?.data || [])
      setMeta(response.data?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 })
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load orders.')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, search])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchOrders()
  }

  const columns = [
    {
      key: 'id',
      label: 'Order ID',
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
        <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
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
      label: 'Actions',
      render: (row) => (
        <CButtonGroup size="sm">
          <CTooltip content="View Details">
            <CButton
              color="primary"
              variant="outline"
              onClick={() => navigate(`/orders/${row.id}`)}
            >
              <CIcon icon={cilClipboard} size="sm" />
            </CButton>
          </CTooltip>
          <CTooltip content="Update Status">
            <CButton
              color="warning"
              variant="outline"
              onClick={() => navigate(`/orders/${row.id}/status`)}
            >
              <CIcon icon={cilLoop} size="sm" />
            </CButton>
          </CTooltip>
          <CTooltip content="Update Tracking">
            <CButton
              color="info"
              variant="outline"
              onClick={() => navigate(`/orders/${row.id}/tracking`)}
            >
              <CIcon icon={cilTruck} size="sm" />
            </CButton>
          </CTooltip>
        </CButtonGroup>
      ),
    },
  ]

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

  return (
    <div>
      <PageHeader title="Orders" subtitle="Review customer orders and manage fulfillment." />

      {/* Filters */}
      <CRow className="mb-3 g-2 align-items-end">
        <CCol md={3}>
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
        <CCol md={4}>
          <form onSubmit={handleSearchSubmit} className="d-flex gap-2">
            <CFormInput
              placeholder="Search by order ID or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <CButton type="submit" color="primary" variant="outline" size="sm">
              <CIcon icon={cilSearch} />
            </CButton>
          </form>
        </CCol>
        <CCol md={2}>
          <CButton color="light" size="sm" onClick={fetchOrders} disabled={loading}>
            <CIcon icon={cilReload} className={`me-1 ${loading ? 'spin-animation' : ''}`} />
            Refresh
          </CButton>
        </CCol>
      </CRow>

      {error && (
        <CAlert color="danger" dismissible onClose={() => setError('')}>
          {error}
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
    </div>
  )
}

export default OrdersList
