import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'
import PageHeader from '../../shared/components/PageHeader'
import DataTable from '../../shared/components/DataTable'
import {
  getApiErrorMessage,
  getClientPurchases,
} from '../../services/usersService'
import { isAdmin } from '../auth/authStorage'

const statusBadgeColor = (status) => {
  switch (status) {
    case 'SETTLED':
      return 'primary'
    case 'DELIVERED':
      return 'success'
    case 'IN_PREPARATION':
      return 'info'
    case 'CONFIRMED':
      return 'warning'
    case 'CANCELLED':
      return 'danger'
    case 'DRAFT':
    default:
      return 'secondary'
  }
}

const formatMoney = (amount) => `$${Number(amount || 0).toFixed(2)}`

const ClientTracking = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [client, setClient] = useState(null)
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalSpent: 0,
    averageOrderValue: 0,
    lastPurchaseDate: null,
  })
  const [orders, setOrders] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    from: '',
    to: '',
    minTotal: '',
    maxTotal: '',
  })
  const [page, setPage] = useState(1)

  const fetchData = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setError('')
    try {
      const payload = await getClientPurchases(id, {
        page,
        limit: 20,
        ...(filters.search.trim() && { search: filters.search.trim() }),
        ...(filters.status && { status: filters.status }),
        ...(filters.from && { from: filters.from }),
        ...(filters.to && { to: filters.to }),
        ...(filters.minTotal !== '' && { minTotal: Number(filters.minTotal) }),
        ...(filters.maxTotal !== '' && { maxTotal: Number(filters.maxTotal) }),
      })

      setClient(payload.client)
      setSummary(payload.summary)
      setOrders(payload.orders || [])
      setMeta(payload.meta || { total: 0, page: 1, limit: 20, totalPages: 1 })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load client purchase history.'))
    } finally {
      setLoading(false)
    }
  }, [id, page, filters])

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/dashboard', { replace: true })
      return
    }
    fetchData()
  }, [fetchData, navigate])

  const columns = [
    {
      key: 'id',
      label: 'Order ID',
      render: (row) => <span className="text-medium-emphasis">#{row.id.slice(-8)}</span>,
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (row) => new Date(row.createdAt).toLocaleString(),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <CBadge color={statusBadgeColor(row.status)}>{row.status}</CBadge>,
    },
    {
      key: 'itemCount',
      label: 'Items',
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      render: (row) => formatMoney(row.totalAmount),
    },
    {
      key: 'actions',
      label: 'Details',
      render: (row) => (
        <CButton
          color="info"
          size="sm"
          onClick={() => navigate(`/orders/${row.id}`)}
        >
          View Order
        </CButton>
      ),
    },
  ]

  if (loading && !client) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Client Tracking"
        subtitle={client ? `Purchase history for ${client.email}` : 'Client purchase history'}
        actions={
          <CButton color="secondary" onClick={() => navigate('/clients/tracking')}>
            Back to Tracking
          </CButton>
        }
      />

      {error && <CAlert color="danger">{error}</CAlert>}

      {client && (
        <CCard className="mb-3">
          <CCardBody className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <div className="fw-semibold">{client.name || 'Unnamed Client'}</div>
              <div className="text-medium-emphasis">{client.email}</div>
            </div>
            <CBadge color={client.status === 'active' ? 'success' : 'danger'}>{client.status}</CBadge>
          </CCardBody>
        </CCard>
      )}

      <CRow className="g-3 mb-3">
        <CCol md={3}>
          <CCard>
            <CCardBody>
              <div className="text-medium-emphasis small">Total Orders</div>
              <div className="fs-5 fw-semibold">{summary.totalOrders}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={3}>
          <CCard>
            <CCardBody>
              <div className="text-medium-emphasis small">Total Spent</div>
              <div className="fs-5 fw-semibold">{formatMoney(summary.totalSpent)}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={3}>
          <CCard>
            <CCardBody>
              <div className="text-medium-emphasis small">Average Order</div>
              <div className="fs-5 fw-semibold">{formatMoney(summary.averageOrderValue)}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={3}>
          <CCard>
            <CCardBody>
              <div className="text-medium-emphasis small">Last Purchase</div>
              <div className="fs-6 fw-semibold">
                {summary.lastPurchaseDate
                  ? new Date(summary.lastPurchaseDate).toLocaleString()
                  : '\u2014'}
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="g-2 mb-3">
        <CCol md={3}>
          <CInputGroup>
            <CInputGroupText>
              <CIcon icon={cilSearch} />
            </CInputGroupText>
            <CFormInput
              placeholder="Search order ID"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
          </CInputGroup>
        </CCol>
        <CCol md={2}>
          <CFormSelect
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="IN_PREPARATION">IN_PREPARATION</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="SETTLED">SETTLED</option>
            <option value="CANCELLED">CANCELLED</option>
          </CFormSelect>
        </CCol>
        <CCol md={2}>
          <CFormInput
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
          />
        </CCol>
        <CCol md={2}>
          <CFormInput
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
          />
        </CCol>
        <CCol md={1}>
          <CFormInput
            type="number"
            min="0"
            placeholder="Min"
            value={filters.minTotal}
            onChange={(e) => setFilters((prev) => ({ ...prev, minTotal: e.target.value }))}
          />
        </CCol>
        <CCol md={1}>
          <CFormInput
            type="number"
            min="0"
            placeholder="Max"
            value={filters.maxTotal}
            onChange={(e) => setFilters((prev) => ({ ...prev, maxTotal: e.target.value }))}
          />
        </CCol>
        <CCol md={1} className="d-grid">
          <CButton
            color="primary"
            onClick={() => {
              setPage(1)
              fetchData()
            }}
          >
            Apply
          </CButton>
        </CCol>
      </CRow>

      <DataTable
        title={`Purchase History (${meta.total})`}
        columns={columns}
        data={orders}
        loading={loading}
        emptyMessage="No purchases found for this client."
      />

      {meta.totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <small className="text-medium-emphasis">
            Page {meta.page} of {meta.totalPages}
          </small>
          <div className="d-flex gap-2">
            <CButton
              color="secondary"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </CButton>
            <CButton
              color="secondary"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            >
              Next
            </CButton>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientTracking
