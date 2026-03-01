import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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

const OrderDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await api.get(`/orders/${id}`)
        setOrder(response.data)
      } catch {
        setError('Unable to load order details.')
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [id])

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div>
        <PageHeader title="Order Details" />
        <CAlert color="danger">{error || 'Order not found.'}</CAlert>
      </div>
    )
  }

  const address = order.shippingAddress || {}

  return (
    <div>
      <PageHeader
        title="Order Details"
        subtitle={`Order ${id.slice(0, 8)}...`}
        actions={
          <div className="d-flex gap-2">
            <CButton color="warning" size="sm" onClick={() => navigate(`/orders/${id}/status`)}>
              Update Status
            </CButton>
            <CButton color="secondary" size="sm" onClick={() => navigate(`/orders/${id}/tracking`)}>
              Add Tracking
            </CButton>
            <CButton color="outline-primary" size="sm" onClick={() => navigate('/orders')}>
              Back to Orders
            </CButton>
          </div>
        }
      />

      <CRow>
        {/* Order Summary */}
        <CCol lg={6}>
          <CCard className="mb-4">
            <CCardHeader>Summary</CCardHeader>
            <CCardBody>
              <table className="table table-borderless mb-0">
                <tbody>
                  <tr>
                    <td className="text-medium-emphasis">Status</td>
                    <td>
                      <CBadge color={STATUS_COLORS[order.status] || 'secondary'}>
                        {order.status}
                      </CBadge>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-medium-emphasis">Customer</td>
                    <td>{order.customerEmail || '—'}</td>
                  </tr>
                  <tr>
                    <td className="text-medium-emphasis">Total</td>
                    <td className="fw-bold">${order.totalAmount?.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="text-medium-emphasis">Created</td>
                    <td>{new Date(order.createdAt).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="text-medium-emphasis">Updated</td>
                    <td>{new Date(order.updatedAt).toLocaleString()}</td>
                  </tr>
                  {order.carrier && (
                    <tr>
                      <td className="text-medium-emphasis">Carrier</td>
                      <td>{order.carrier}</td>
                    </tr>
                  )}
                  {order.trackingNumber && (
                    <tr>
                      <td className="text-medium-emphasis">Tracking #</td>
                      <td><code>{order.trackingNumber}</code></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CCardBody>
          </CCard>
        </CCol>

        {/* Shipping Address */}
        <CCol lg={6}>
          <CCard className="mb-4">
            <CCardHeader>Shipping Address</CCardHeader>
            <CCardBody>
              {address.fullName ? (
                <>
                  <p className="mb-1 fw-bold">{address.fullName}</p>
                  <p className="mb-1">{address.addressLine1}</p>
                  {address.addressLine2 && <p className="mb-1">{address.addressLine2}</p>}
                  <p className="mb-0">
                    {address.city}, {address.state} {address.postalCode}
                  </p>
                  <p className="mb-0">{address.country}</p>
                </>
              ) : (
                <p className="text-medium-emphasis mb-0">No shipping address provided.</p>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Order Items */}
      <CCard className="mb-4">
        <CCardHeader>Order Items</CCardHeader>
        <CCardBody>
          <CTable responsive hover>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Product</CTableHeaderCell>
                <CTableHeaderCell>Unit Price</CTableHeaderCell>
                <CTableHeaderCell>Quantity</CTableHeaderCell>
                <CTableHeaderCell>Subtotal</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {(order.items || []).map((item) => (
                <CTableRow key={item.id || item.productId}>
                  <CTableDataCell>{item.name}</CTableDataCell>
                  <CTableDataCell>${item.unitPrice?.toFixed(2)}</CTableDataCell>
                  <CTableDataCell>{item.quantity}</CTableDataCell>
                  <CTableDataCell className="fw-bold">
                    ${(item.unitPrice * item.quantity).toFixed(2)}
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* Status History Timeline */}
      <CCard className="mb-4">
        <CCardHeader>Status History</CCardHeader>
        <CCardBody>
          {order.statusHistory && order.statusHistory.length > 0 ? (
            <div className="timeline-container">
              {order.statusHistory.map((entry, idx) => (
                <div key={entry.id || idx} className="d-flex gap-3 mb-3">
                  <div className="d-flex flex-column align-items-center" style={{ minWidth: 24 }}>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: idx === order.statusHistory.length - 1 ? '#321fdb' : '#9da5b1',
                        marginTop: 4,
                      }}
                    />
                    {idx < order.statusHistory.length - 1 && (
                      <div style={{ width: 2, flex: 1, backgroundColor: '#d8dbe0', marginTop: 4 }} />
                    )}
                  </div>
                  <div className="pb-2">
                    <CBadge color={STATUS_COLORS[entry.status] || 'secondary'} className="me-2">
                      {entry.status}
                    </CBadge>
                    <small className="text-medium-emphasis">
                      {new Date(entry.createdAt).toLocaleString()}
                    </small>
                    {entry.note && (
                      <p className="mb-0 mt-1 text-medium-emphasis small">{entry.note}</p>
                    )}
                    {entry.changedByEmail && (
                      <small className="text-medium-emphasis">by {entry.changedByEmail}</small>
                    )}
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
