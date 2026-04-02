import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CSpinner,
} from '@coreui/react'
import DataTable from '../../shared/components/DataTable'
import PageHeader from '../../shared/components/PageHeader'
import { getApiErrorMessage, getClientPurchases } from '../../services/usersService'

const ClientTracking = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [payload, setPayload] = useState(null)
  const [filters, setFilters] = useState({ status: 'ALL', from: '', to: '', page: 1, limit: 10 })

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const data = await getClientPurchases(id, {
        status: filters.status,
        from: filters.from || undefined,
        to: filters.to || undefined,
        page: filters.page,
        limit: filters.limit,
      })
      setPayload(data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load client purchase history.'))
    } finally {
      setLoading(false)
    }
  }, [id, filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const summary = payload?.summary
  const client = payload?.client
  const rows = payload?.purchases || []
  const meta = payload?.meta || { page: 1, totalPages: 1 }

  return (
    <div>
      <PageHeader
        title="Client Tracking"
        subtitle={client ? `Purchase history for ${client.email}` : 'Purchase history'}
        actions={
          <CButton color="secondary" variant="outline" onClick={() => navigate('/clients/tracking')}>
            Back to Clients
          </CButton>
        }
      />

      {error && (
        <CAlert color="danger" dismissible onClose={() => setError('')}>
          {error}
        </CAlert>
      )}

      <CCard className="mb-4">
        <CCardHeader>Filters</CCardHeader>
        <CCardBody>
          <CRow className="g-3 align-items-end">
            <CCol md={3}>
              <CFormLabel>Status</CFormLabel>
              <CFormSelect
                value={filters.status}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, status: event.target.value, page: 1 }))
                }
              >
                <option value="ALL">All</option>
                <option value="DRAFT">Draft</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="IN_PREPARATION">In Preparation</option>
                <option value="DELIVERED">Delivered</option>
                <option value="SETTLED">Settled</option>
                <option value="CANCELLED">Cancelled</option>
              </CFormSelect>
            </CCol>
            <CCol md={3}>
              <CFormLabel>From</CFormLabel>
              <CFormInput
                type="date"
                value={filters.from}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, from: event.target.value, page: 1 }))
                }
              />
            </CCol>
            <CCol md={3}>
              <CFormLabel>To</CFormLabel>
              <CFormInput
                type="date"
                value={filters.to}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, to: event.target.value, page: 1 }))
                }
              />
            </CCol>
            <CCol md={3}>
              <div className="d-flex gap-2">
                <CButton color="primary" onClick={fetchData} disabled={loading}>
                  {loading ? <CSpinner size="sm" /> : 'Apply'}
                </CButton>
                <CButton
                  color="light"
                  onClick={() => setFilters({ status: 'ALL', from: '', to: '', page: 1, limit: 10 })}
                  disabled={loading}
                >
                  Reset
                </CButton>
              </div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      <CRow className="g-3 mb-4">
        <CCol md={3}>
          <CCard>
            <CCardBody>
              <div className="text-medium-emphasis small">Total Orders</div>
              <div className="fs-4 fw-semibold">{summary?.totalOrders ?? 0}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={3}>
          <CCard>
            <CCardBody>
              <div className="text-medium-emphasis small">Total Spent</div>
              <div className="fs-4 fw-semibold">${Number(summary?.totalSpent || 0).toFixed(2)}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={3}>
          <CCard>
            <CCardBody>
              <div className="text-medium-emphasis small">Average Order</div>
              <div className="fs-4 fw-semibold">${Number(summary?.averageOrderValue || 0).toFixed(2)}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={3}>
          <CCard>
            <CCardBody>
              <div className="text-medium-emphasis small">Last Purchase</div>
              <div className="fw-semibold">
                {summary?.lastPurchaseAt ? new Date(summary.lastPurchaseAt).toLocaleDateString() : '—'}
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <DataTable
        title={`Purchase History (${payload?.meta?.total || 0})`}
        loading={loading}
        data={rows}
        emptyMessage="No purchases for the selected filters."
        columns={[
          { key: 'id', label: 'Order ID', render: (row) => <span className="font-monospace">{row.id.slice(0, 8)}…</span> },
          { key: 'status', label: 'Status' },
          { key: 'itemCount', label: 'Items' },
          { key: 'totalAmount', label: 'Total', render: (row) => `$${Number(row.totalAmount).toFixed(2)}` },
          {
            key: 'createdAt',
            label: 'Created',
            render: (row) => new Date(row.createdAt).toLocaleDateString(),
          },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
              <CButton color="secondary" size="sm" onClick={() => navigate(`/orders/${row.id}`)}>
                View Order
              </CButton>
            ),
          },
        ]}
      />

      {meta.totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <small className="text-medium-emphasis">
            Page {meta.page} of {meta.totalPages}
          </small>
          <div className="d-flex gap-2">
            <CButton
              color="light"
              size="sm"
              disabled={filters.page <= 1 || loading}
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </CButton>
            <CButton
              color="light"
              size="sm"
              disabled={filters.page >= meta.totalPages || loading}
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
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
