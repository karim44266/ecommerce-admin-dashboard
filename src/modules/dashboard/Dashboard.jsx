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
import { CChartBar, CChartDoughnut, CChartLine } from '@coreui/react-chartjs'
import CIcon from '@coreui/icons-react'
import {
  cilCart,
  cilDollar,
  cilChart,
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
    totalRevenue: 0,
    grossSales: 0,
    totalCost: 0,
    pendingOrders: 0,
    activeDeliveries: 0,
    avgOrderValue: 0,
    fulfilmentRate: 0,
  })
  const [trendData, setTrendData] = useState({
    labels: [],
    ordersPerDay: [],
    grossSalesPerDay: [],
    totalCostPerDay: [],
    revenuePerDay: [],
    marginPercentPerDay: [],
  })
  const [statusDistribution, setStatusDistribution] = useState([])
  const [recentOrders, setRecentOrders] = useState([])

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        const [summaryRes, trendsRes, statusRes, recentOrdersRes] = await Promise.all([
          api.get('/analytics/dashboard/summary'),
          api.get('/analytics/dashboard/trends', { params: { days: 7 } }),
          api.get('/analytics/dashboard/status-distribution'),
          api.get('/orders', { params: { limit: 5, page: 1 } }),
        ])

        setStats(summaryRes.data || {})
        setTrendData(
          trendsRes.data || {
            labels: [],
            ordersPerDay: [],
            grossSalesPerDay: [],
            totalCostPerDay: [],
            revenuePerDay: [],
            marginPercentPerDay: [],
          },
        )
        setStatusDistribution(statusRes.data?.statuses || [])
        setRecentOrders(recentOrdersRes.data?.data || [])
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
      label: 'Net Revenue',
      value: `$${Number(stats.totalRevenue || 0).toFixed(2)}`,
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

  const quickKpis = [
    { label: 'Gross Sales', value: `$${Number(stats.grossSales || 0).toFixed(2)}` },
    { label: 'Total Cost', value: `$${Number(stats.totalCost || 0).toFixed(2)}` },
    { label: 'Fulfilment Rate', value: `${Number(stats.fulfilmentRate || 0).toFixed(0)}%` },
  ]

  const trendChartData = {
    labels: trendData.labels,
    datasets: [
      {
        type: 'bar',
        label: 'Orders',
        data: trendData.ordersPerDay,
        backgroundColor: 'rgba(13, 148, 136, 0.35)',
        borderRadius: 6,
      },
      {
        type: 'line',
        label: 'Projected Revenue ($)',
        data: trendData.revenuePerDay,
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.15)',
        tension: 0.35,
        fill: false,
        yAxisID: 'y1',
      },
    ],
  }

  const financeBreakdownData = {
    labels: trendData.labels,
    datasets: [
      {
        type: 'bar',
        label: 'Gross Sales ($)',
        data: trendData.grossSalesPerDay,
        backgroundColor: 'rgba(14, 165, 233, 0.35)',
        borderRadius: 6,
      },
      {
        type: 'bar',
        label: 'Cost ($)',
        data: trendData.totalCostPerDay,
        backgroundColor: 'rgba(245, 158, 11, 0.35)',
        borderRadius: 6,
      },
      {
        type: 'line',
        label: 'Net Revenue ($)',
        data: trendData.revenuePerDay,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        tension: 0.35,
        fill: false,
      },
    ],
  }

  const financeBreakdownOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
    },
  }

  const marginTrendData = {
    labels: trendData.labels,
    datasets: [
      {
        label: 'Margin (%)',
        data: trendData.marginPercentPerDay,
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.15)',
        tension: 0.35,
        fill: true,
      },
    ],
  }

  const marginTrendOptions = {
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: 100,
        title: { display: true, text: 'Margin %' },
      },
    },
    plugins: {
      legend: { position: 'bottom' },
    },
  }

  const trendChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Orders' },
      },
      y1: {
        beginAtZero: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Revenue ($)' },
      },
    },
    plugins: {
      legend: { position: 'bottom' },
    },
  }

  const statusChartData = {
    labels: statusDistribution.map((row) => STATUS_LABELS[row.status] || row.status),
    datasets: [
      {
        data: statusDistribution.map((row) => row.count),
        backgroundColor: ['#0d9488', '#f59e0b', '#0ea5e9', '#10b981', '#ef4444', '#64748b'],
        borderWidth: 0,
      },
    ],
  }

  const statusChartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    },
  }

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

      <CRow className="mb-4 g-3">
        {quickKpis.map((kpi, i) => (
          <CCol md={4} key={kpi.label}>
            <CCard className={`h-100 nx-dashboard-kpi-card nx-fade-in nx-fade-in-d${Math.min(i + 1, 4)}`}>
              <CCardBody>
                <div className="text-medium-emphasis text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.07em' }}>
                  {kpi.label}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.2 }}>{kpi.value}</div>
              </CCardBody>
            </CCard>
          </CCol>
        ))}
      </CRow>

      <CRow className="mb-4 g-3">
        <CCol lg={8}>
          <CCard className="nx-dashboard-chart-card nx-fade-in nx-fade-in-d2">
            <CCardHeader>
              <strong>Last 7 Days</strong>
              <div className="small text-medium-emphasis">Orders and projected revenue trend</div>
            </CCardHeader>
            <CCardBody className="nx-dashboard-chart-body">
              <CChartBar className="nx-dashboard-chart" height={170} data={trendChartData} options={trendChartOptions} />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={4}>
          <CCard className="nx-dashboard-chart-card nx-fade-in nx-fade-in-d3">
            <CCardHeader>
              <strong>Order Status</strong>
              <div className="small text-medium-emphasis">Split of all orders</div>
            </CCardHeader>
            <CCardBody className="nx-dashboard-chart-body">
              <CChartDoughnut className="nx-dashboard-chart" height={170} data={statusChartData} options={statusChartOptions} />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="mb-4 g-3">
        <CCol lg={8}>
          <CCard className="nx-dashboard-chart-card nx-fade-in nx-fade-in-d2">
            <CCardHeader>
              <strong>Financial Breakdown</strong>
              <div className="small text-medium-emphasis">Gross sales vs cost vs net revenue</div>
            </CCardHeader>
            <CCardBody className="nx-dashboard-chart-body">
              <CChartBar className="nx-dashboard-chart" height={170} data={financeBreakdownData} options={financeBreakdownOptions} />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={4}>
          <CCard className="nx-dashboard-chart-card nx-fade-in nx-fade-in-d3">
            <CCardHeader>
              <strong>Margin Trend</strong>
              <div className="small text-medium-emphasis">Daily profit margin percentage</div>
            </CCardHeader>
            <CCardBody className="nx-dashboard-chart-body">
              <CChartLine className="nx-dashboard-chart" height={170} data={marginTrendData} options={marginTrendOptions} />
            </CCardBody>
          </CCard>
        </CCol>
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
                <CIcon icon={cilChart} className="me-1" />
                View all
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
