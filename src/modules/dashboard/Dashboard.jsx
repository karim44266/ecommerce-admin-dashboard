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
        const [ordersRes, shipmentsRes] = await Promise.all([
          api.get('/orders', { params: { limit: 200, page: 1 } }),
          api.get('/shipments', { params: { limit: 200, page: 1 } }),
        ])

        const allOrders = ordersRes.data?.data || []
        const shipments = shipmentsRes.data?.data || shipmentsRes.data || []

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

  const kpiCards = [
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      icon: cilCart,
      variant: '--primary',
    },
    {
      label: 'Revenue',
      value: `$${stats.revenue.toFixed(2)}`,
      icon: cilDollar,
      variant: '--success',
    },
    {
      label: 'Pending Orders',
      value: stats.pendingOrders,
      icon: cilClock,
      variant: '--warning',
    },
    {
      label: 'Active Deliveries',
      value: stats.activeDeliveries,
      icon: cilTruck,
      variant: '--info',
    },
  ]

  const quickActions = [
    { label: 'Add Product', icon: cilPlus, path: '/products/create' },
    { label: 'Manage Orders', icon: cilClipboard, path: '/orders' },
    { label: 'Manage Users', icon: cilPeople, path: '/users' },
  ]

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Operational snapshot for your ecommerce store." />

      {/* ── KPI Stat Cards ────────────────────────────────────── */}
      <CRow className="mb-4 g-3">
        {kpiCards.map((card, i) => (
          <CCol sm={6} xl={3} key={card.label}>
            <div className={`nx-stat-card nx-fade-in nx-fade-in-d${i > 0 ? i : ''}`} style={{ '--stat-color': `var(${card.variant})` }}>
              <div className="nx-stat-icon">
                <CIcon icon={card.icon} height={22} />
              </div>
              <div className="nx-stat-body">
                <div className="nx-stat-label">{card.label}</div>
                <div className="nx-stat-value">{card.value}</div>
              </div>
            </div>
          </CCol>
        ))}
      </CRow>

      <CRow>
        {/* ── Recent Orders ───────────────────────────────────── */}
        <CCol lg={8} className="mb-4">
          <CCard className="nx-fade-in nx-fade-in-d2">
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
                      <CTableDataCell
                        className="text-truncate"
                        style={{ maxWidth: 120, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem' }}
                      >
                        {o.id?.slice(0, 8)}…
                      </CTableDataCell>
                      <CTableDataCell>{o.customerEmail || '—'}</CTableDataCell>
                      <CTableDataCell style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>
                        ${(o.totalAmount || 0).toFixed(2)}
                      </CTableDataCell>
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
          <h6
            className="text-uppercase text-medium-emphasis mb-3 nx-fade-in nx-fade-in-d3"
            style={{ fontSize: '0.7rem', letterSpacing: '0.1em', fontWeight: 600 }}
          >
            Quick Actions
          </h6>
          <div className="d-grid gap-2">
            {quickActions.map((action, i) => (
              <div
                key={action.label}
                className={`nx-action-card nx-fade-in nx-fade-in-d${Math.min(i + 1, 4)}`}
                onClick={() => navigate(action.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(action.path)}
              >
                <span className="nx-action-icon">
                  <CIcon icon={action.icon} height={18} />
                </span>
                <span className="nx-action-label">{action.label}</span>
                <CIcon icon={cilArrowRight} height={14} className="ms-auto text-medium-emphasis" />
              </div>
            ))}
          </div>
        </CCol>
      </CRow>
    </div>
  )
}

export default Dashboard
