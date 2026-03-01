import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CFormInput,
  CFormSelect,
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

const STATUS_COLORS = {
  PENDING_PAYMENT: 'warning',
  PAID: 'info',
  PROCESSING: 'primary',
  SHIPPED: 'secondary',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  REFUNDED: 'dark',
  FAILED: 'danger',
}

const OrdersList = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchOrders = useCallback(async (overridePage) => {
    setLoading(true)
    setError('')
    try {
      const params = { page: overridePage ?? page, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const response = await api.get('/orders', { params })
      setOrders(response.data?.data || [])
      setMeta(response.data?.meta || { total: 0, totalPages: 0 })
    } catch (err) {
      if (err?.response?.status === 401) {
        setError('Session expired. Redirecting to login…')
      } else {
        setError('Unable to load orders. Make sure the backend is running.')
      }
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    if (page !== 1) {
      setPage(1)
      fetchOrders(1)
    }
  }, [search, statusFilter])

  return (
    <div>
      <PageHeader title="Orders" subtitle="Review customer orders and manage fulfillment." />
      {error && <CAlert color="danger">{error}</CAlert>}

      <div className="d-flex gap-3 mb-3">
        <CFormInput
          placeholder="Search by order ID or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 300 }}
        />
        <CFormSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ maxWidth: 200 }}
        >
          <option value="">All Statuses</option>
          <option value="PENDING_PAYMENT">Pending Payment</option>
          <option value="PAID">Paid</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REFUNDED">Refunded</option>
          <option value="FAILED">Failed</option>
        </CFormSelect>
      </div>

      <CCard className="mb-4">
        <CCardHeader>
          Order List ({meta.total} total)
        </CCardHeader>
        <CCardBody>
          {loading ? (
            <div className="text-center py-5">
              <CSpinner color="primary" />
            </div>
          ) : (
            <>
              <CTable responsive hover>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Order ID</CTableHeaderCell>
                    <CTableHeaderCell>Customer</CTableHeaderCell>
                    <CTableHeaderCell>Total</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                    <CTableHeaderCell>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {orders.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={6} className="text-center text-medium-emphasis">
                        No orders found.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    orders.map((order) => (
                      <CTableRow key={order.id}>
                        <CTableDataCell>
                          <code>{order.id.slice(0, 8)}...</code>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div>{order.customerName || '—'}</div>
                          <small className="text-medium-emphasis">{order.customerEmail}</small>
                        </CTableDataCell>
                        <CTableDataCell>${order.totalAmount?.toFixed(2)}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={STATUS_COLORS[order.status] || 'secondary'}>
                            {order.status}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="d-flex gap-2">
                            <CButton
                              color="primary"
                              size="sm"
                              onClick={() => navigate(`/orders/${order.id}`)}
                            >
                              Details
                            </CButton>
                            <CButton
                              color="warning"
                              size="sm"
                              onClick={() => navigate(`/orders/${order.id}/status`)}
                            >
                              Status
                            </CButton>
                            <CButton
                              color="secondary"
                              size="sm"
                              onClick={() => navigate(`/orders/${order.id}/tracking`)}
                            >
                              Tracking
                            </CButton>
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>

              {meta.totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <span className="text-medium-emphasis">
                    Page {page} of {meta.totalPages}
                  </span>
                  <div className="d-flex gap-2">
                    <CButton
                      color="outline-primary"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </CButton>
                    <CButton
                      color="outline-primary"
                      size="sm"
                      disabled={page >= meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </CButton>
                  </div>
                </div>
              )}
            </>
          )}
        </CCardBody>
      </CCard>
    </div>
  )
}

export default OrdersList
