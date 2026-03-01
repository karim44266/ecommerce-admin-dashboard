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
import { cilArrowLeft, cilLoop, cilTruck, cilReload } from '@coreui/icons'
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

const OrderDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-3">
        <PageHeader title="Order Details" subtitle={`Order #${order.id.slice(0, 8)}`} />
        <div className="d-flex gap-2 flex-shrink-0 pt-1">
          <CButton color="light" size="sm" onClick={() => fetchOrder()} disabled={loading}>
            <CIcon icon={cilReload} className="me-1" />
            Refresh
          </CButton>
          <CButton color="warning" size="sm" onClick={() => navigate(`/orders/${id}/status`)}>
            <CIcon icon={cilLoop} className="me-1" />
            Update Status
          </CButton>
          <CButton color="info" size="sm" onClick={() => navigate(`/orders/${id}/tracking`)}>
            <CIcon icon={cilTruck} className="me-1" />
            Update Tracking
          </CButton>
          <CButton color="secondary" variant="outline" size="sm" onClick={() => navigate('/orders')}>
            <CIcon icon={cilArrowLeft} className="me-1" />
            Back
          </CButton>
        </div>
      </div>

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
                <dd className="col-sm-7">${Number(order.totalAmount).toFixed(2)}</dd>
                <dt className="col-sm-5">Customer</dt>
                <dd className="col-sm-7">{order.customerEmail || '—'}</dd>
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
        <CCardBody>
          <CTable responsive hover>
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
                  <CTableDataCell>${Number(item.unitPrice).toFixed(2)}</CTableDataCell>
                  <CTableDataCell>
                    ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
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
    </div>
  )
}

export default OrderDetails
