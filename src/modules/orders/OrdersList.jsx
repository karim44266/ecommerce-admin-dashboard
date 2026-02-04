import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CAlert, CButton, CBadge } from '@coreui/react'
import api from '../../services/api'
import DataTable from '../../shared/components/DataTable'
import PageHeader from '../../shared/components/PageHeader'

const OrdersList = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      setError('')
      try {
        // TODO: Replace with real orders list endpoint.
        const response = await api.get('/orders')
        setOrders(response.data || [])
      } catch (err) {
        setError('Unable to load orders. Connect the backend endpoint to proceed.')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const columns = [
    { key: 'orderNumber', label: 'Order' },
    { key: 'customer', label: 'Customer' },
    { key: 'total', label: 'Total' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <CBadge color="info">{row.status}</CBadge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="d-flex gap-2">
          <CButton color="primary" size="sm" component={Link} to={`/orders/${row.id}`}>
            Details
          </CButton>
          <CButton color="warning" size="sm" component={Link} to={`/orders/${row.id}/status`}>
            Update Status
          </CButton>
          <CButton color="secondary" size="sm" component={Link} to={`/orders/${row.id}/tracking`}>
            Tracking
          </CButton>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Orders" subtitle="Review customer orders and manage fulfillment." />
      {error && <CAlert color="danger">{error}</CAlert>}
      <DataTable title="Order List" columns={columns} data={orders} loading={loading} />
    </div>
  )
}

export default OrdersList
