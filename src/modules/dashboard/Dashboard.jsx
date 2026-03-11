import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
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
  CWidgetStatsF,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCart,
  cilDollar,
  cilClock,
  cilTruck,
  cilClipboard,
  cilPeople,
  cilPlus,
  cilArrowRight,
} from '@coreui/icons'
import api from '../../services/api'
import PageHeader from '../../shared/components/PageHeader'
import { STATUS_COLORS, STATUS_LABELS } from '../orders/orderConstants'

const Dashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    pendingOrders: 0,
    activeDeliveries: 0,
  })
  const [recentOrders, setRecentOrders] = useState([])

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        // Fetch all orders (first page) and shipments in parallel
        const [ordersRes, shipmentsRes] = await Promise.all([
          api.get('/orders', { params: { limit: 200, page: 1 } }),
          api.get('/shipments', { params: { limit: 200, page: 1 } }),
        ])

        const allOrders = ordersRes.data?.data || []
        const shipments = shipmentsRes.data?.data || shipmentsRes.data || []

        // KPI calculations
        const totalOrders = ordersRes.data?.meta?.total || allOrders.length
        const revenue = allOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
        const pendingOrders = allOrders.filter((o) => o.status === 'PENDING').length
        const activeDeliveries = shipments.filter(
          (s) => s.status === 'ASSIGNED' || s.status === 'IN_TRANSIT',
        ).length

        setStats({ totalOrders, revenue, pendingOrders, activeDeliveries })
        setRecentOrders(allOrders.slice(0, 5))
      } catch {
        // silently fail — dashboard is non-critical
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Operational snapshot for your ecommerce store." />

      {/* ── KPI Cards ─────────────────────────────────────────── */}
      <CRow className="mb-4">
        <CCol sm={6} xl={3}>
          <CWidgetStatsF
            className="mb-3"
            color="primary"
            icon={<CIcon icon={cilCart} height={24} />}
            title="Total Orders"
            value={stats.totalOrders}
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <CWidgetStatsF
            className="mb-3"
            color="success"
            icon={<CIcon icon={cilDollar} height={24} />}
            title="Revenue"
            value={`$${stats.revenue.toFixed(2)}`}
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <CWidgetStatsF
            className="mb-3"
            color="warning"
            icon={<CIcon icon={cilClock} height={24} />}
            title="Pending Orders"
            value={stats.pendingOrders}
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <CWidgetStatsF
            className="mb-3"
            color="info"
            icon={<CIcon icon={cilTruck} height={24} />}
            title="Active Deliveries"
            value={stats.activeDeliveries}
          />
        </CCol>
      </CRow>

      <CRow>
        {/* ── Recent Orders ───────────────────────────────────── */}
        <CCol lg={8} className="mb-4">
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Recent Orders</strong>
              <CButton
                color="link"
                size="sm"
                onClick={() => navigate('/orders')}
              >
                View all <CIcon icon={cilArrowRight} size="sm" />
              </CButton>
            </CCardHeader>
            <CCardBody className="p-0">
              <CTable hover responsive align="middle" className="mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Order</CTableHeaderCell>
                    <CTableHeaderCell>Customer</CTableHeaderCell>
                    <CTableHeaderCell>Amount</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {recentOrders.map((o) => (
                    <CTableRow
                      key={o.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/orders/${o.id}`)}
                    >
                      <CTableDataCell className="text-truncate" style={{ maxWidth: 120 }}>
                        {o.id?.slice(0, 8)}...
                      </CTableDataCell>
                      <CTableDataCell>{o.customerEmail || '—'}</CTableDataCell>
                      <CTableDataCell>${(o.totalAmount || 0).toFixed(2)}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={STATUS_COLORS[o.status] || 'secondary'}>
                          {STATUS_LABELS[o.status] || o.status}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                  {recentOrders.length === 0 && (
                    <CTableRow>
                      <CTableDataCell colSpan={5} className="text-center text-medium-emphasis py-3">
                        No orders yet
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>

        {/* ── Quick Actions ───────────────────────────────────── */}
        <CCol lg={4} className="mb-4">
          <CCard className="h-100">
            <CCardHeader>
              <strong>Quick Actions</strong>
            </CCardHeader>
            <CCardBody className="d-grid gap-2">
              <CButton
                color="primary"
                variant="outline"
                onClick={() => navigate('/products/create')}
              >
                <CIcon icon={cilPlus} className="me-2" />
                Add Product
              </CButton>
              <CButton
                color="info"
                variant="outline"
                onClick={() => navigate('/orders')}
              >
                <CIcon icon={cilClipboard} className="me-2" />
                Manage Orders
              </CButton>
              <CButton
                color="warning"
                variant="outline"
                onClick={() => navigate('/delivery/assign')}
              >
                <CIcon icon={cilTruck} className="me-2" />
                Assign Deliveries
              </CButton>
              <CButton
                color="success"
                variant="outline"
                onClick={() => navigate('/users')}
              >
                <CIcon icon={cilPeople} className="me-2" />
                Manage Users
              </CButton>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

export default Dashboard
