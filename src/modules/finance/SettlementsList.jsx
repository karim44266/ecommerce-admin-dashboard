import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCol,
  CFormInput,
  CFormSelect,
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
  cilCheckCircle,
  cilXCircle,
  cilClock,
  cilArrowRight,
} from '@coreui/icons'
import api from '../../services/api'
import DataTable from '../../shared/components/DataTable'
import PageHeader from '../../shared/components/PageHeader'

const STATUS_COLORS = {
  PENDING_VALIDATION: 'warning',
  VALIDATED: 'success',
  REJECTED: 'danger',
}

const STATUS_LABELS = {
  PENDING_VALIDATION: 'Pending Validation',
  VALIDATED: 'Validated',
  REJECTED: 'Rejected',
}

const STATUS_ICONS = {
  PENDING_VALIDATION: cilClock,
  VALIDATED: cilCheckCircle,
  REJECTED: cilXCircle,
}

const METHOD_LABELS = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  check: 'Check',
  other: 'Other',
}

const ALL_STATUSES = ['PENDING_VALIDATION', 'VALIDATED', 'REJECTED']

const SettlementsList = () => {
  const navigate = useNavigate()
  const [settlements, setSettlements] = useState([])
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  const fetchSettlements = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 20 }
      if (statusFilter) params.status = statusFilter
      if (dateFrom) params.from = dateFrom
      if (dateTo) params.to = dateTo
      const response = await api.get('/finance/settlements', { params })
      setSettlements(response.data?.data || [])
      setMeta(
        response.data?.meta || {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      )
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load payment history.',
      )
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, dateFrom, dateTo])

  useEffect(() => {
    fetchSettlements()
  }, [fetchSettlements])

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(''), 3000)
    return () => clearTimeout(t)
  }, [success])

  const columns = [
    {
      key: 'id',
      label: 'Settlement',
      render: (row) => (
        <span
          role="button"
          className="text-primary text-decoration-none fw-semibold"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/finance/settlements/${row.id}`)}
        >
          #{row.id?.slice(0, 8)}
        </span>
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
          <CIcon
            icon={STATUS_ICONS[row.status] || cilClock}
            size="sm"
            className="me-1"
          />
          {STATUS_LABELS[row.status] || row.status}
        </CBadge>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => (
        <span
          className="fw-semibold"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.85rem',
          }}
        >
          ${Number(row.amount).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'method',
      label: 'Method',
      render: (row) => (
        <span className="text-capitalize">
          {METHOD_LABELS[row.method] || row.method}
        </span>
      ),
    },
    {
      key: 'orderCount',
      label: 'Orders',
      render: (row) => (
        <CBadge color="info" shape="rounded-pill" className="px-2">
          {row.orderCount ?? (row.orderIds?.length || 0)}
        </CBadge>
      ),
    },
    {
      key: 'reference',
      label: 'Reference',
      render: (row) => (
        <span
          className="text-medium-emphasis text-truncate d-inline-block"
          style={{ maxWidth: 120 }}
        >
          {row.reference || '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (row) => (
        <span className="text-medium-emphasis small">
          {row.createdAt
            ? new Date(row.createdAt).toLocaleDateString()
            : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <CTooltip content="View Details">
          <CButton
            color="primary"
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/finance/settlements/${row.id}`)}
          >
            <CIcon icon={cilArrowRight} size="sm" />
          </CButton>
        </CTooltip>
      ),
    },
  ]

  // Pagination
  const paginationItems = []
  const maxVisiblePages = 5
  let startPage = Math.max(1, meta.page - Math.floor(maxVisiblePages / 2))
  let endPage = Math.min(meta.totalPages, startPage + maxVisiblePages - 1)
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }
  for (let i = startPage; i <= endPage; i++) {
    paginationItems.push(
      <CPaginationItem
        key={i}
        active={i === meta.page}
        onClick={() => setPage(i)}
      >
        {i}
      </CPaginationItem>,
    )
  }

  return (
    <div>
      <PageHeader
        title="Payment History"
        subtitle="View all settlement declarations and their validation status."
        actions={
          <CButton
            color="primary"
            onClick={() => navigate('/finance/declare-payment')}
          >
            Declare Payment
          </CButton>
        }
      />

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
          <CTooltip content="Refresh">
            <CButton
              color="primary"
              variant="ghost"
              className="refresh-btn"
              onClick={fetchSettlements}
              disabled={loading}
            >
              <CIcon
                icon={cilReload}
                className={loading ? 'spin-animation' : ''}
              />
            </CButton>
          </CTooltip>
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
        title={`Settlements (${meta.total})`}
        columns={columns}
        data={settlements}
        loading={loading}
        emptyMessage="No settlement declarations found."
      />

      {meta.totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <small className="text-medium-emphasis">
            Showing page {meta.page} of {meta.totalPages} ({meta.total}{' '}
            total)
          </small>
          <CPagination className="mb-0">
            <CPaginationItem
              disabled={meta.page <= 1}
              onClick={() => setPage(1)}
            >
              «
            </CPaginationItem>
            <CPaginationItem
              disabled={meta.page <= 1}
              onClick={() => setPage(meta.page - 1)}
            >
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

export default SettlementsList
