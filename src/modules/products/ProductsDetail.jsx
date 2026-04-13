import React, { useEffect, useMemo, useState } from 'react'
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
import { cilReload, cilArrowLeft, cilPencil } from '@coreui/icons'
import { CChartBar } from '@coreui/react-chartjs'
import api from '../../services/api'
import PerformanceOverviewCard from './components/PerformanceOverviewCard'
import PageHeader from '../../shared/components/PageHeader'

const statusColor = (status) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'draft':
      return 'warning'
    case 'archived':
      return 'secondary'
    default:
      return 'info'
  }
}

const money = (value) => `$${Number(value || 0).toFixed(2)}`

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ProductsDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [inventory, setInventory] = useState(null)
  const [insights, setInsights] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDetails = async () => {
    setLoading(true)
    setError('')
    try {
      const [productRes, inventoryRes, insightsRes, historyRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get(`/inventory/${id}`),
        api.get(`/analytics/dashboard/products/${id}`, { params: { days: 30 } }),
        api.get(`/inventory/${id}/history`, { params: { page: 1, limit: 10 } }),
      ])

      setProduct(productRes.data)
      setInventory(inventoryRes.data)
      setInsights(insightsRes.data)
      setHistory(historyRes.data?.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load product details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetails()
  }, [id])

  const lastRefill = useMemo(() => {
    return history.find((entry) => Number(entry.adjustment) > 0) || null
  }, [history])

  const grossMargin = useMemo(() => {
    if (!product || !inventory) return 0
    return Number((Number(product.price || 0) - Number(inventory.currentCostPrice || 0)).toFixed(2))
  }, [product, inventory])

  const refillChartData = useMemo(() => {
    const recentHistory = [...history].slice(0, 8).reverse()
    return {
      labels: recentHistory.map((entry) => formatDate(entry.createdAt).split(',')[0]),
      datasets: [
        {
          label: 'Adjustment',
          data: recentHistory.map((entry) => Number(entry.adjustment || 0)),
          backgroundColor: recentHistory.map((entry) =>
            Number(entry.adjustment || 0) > 0 ? 'rgba(34, 197, 94, 0.75)' : 'rgba(239, 68, 68, 0.75)',
          ),
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    }
  }, [history])

  const refillChartOptions = useMemo(
    () => ({
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` ${context.parsed.y > 0 ? 'Refill' : 'Reduction'}: ${context.parsed.y}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(148, 163, 184, 0.15)' },
        },
        x: {
          grid: { display: false },
        },
      },
    }),
    [],
  )

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-3">
        <PageHeader
          title={product?.name || 'Product Detail'}
          subtitle={product ? `${product.sku} - catalog insight view` : 'Catalog insight view'}
        />
        <div className="d-flex gap-2 flex-shrink-0 pt-1 nx-utility-actions">
          <CButton color="light" size="sm" className="nx-utility-btn" onClick={fetchDetails}>
            <CIcon icon={cilReload} className="me-1" />
            Refresh
          </CButton>
          <CButton color="secondary" variant="outline" size="sm" className="nx-utility-btn" onClick={() => navigate('/products')}>
            <CIcon icon={cilArrowLeft} className="me-1" />
            Back to Catalog
          </CButton>
          <CButton color="primary" size="sm" className="nx-utility-btn" onClick={() => navigate(`/products/${id}`)}>
            <CIcon icon={cilPencil} className="me-1" />
            Edit Product
          </CButton>
        </div>
      </div>

      {error && <CAlert color="danger">{error}</CAlert>}

      {product && inventory && insights && (
        <>
          <CRow className="g-3 mb-4">
            <CCol lg={8}>
              <PerformanceOverviewCard insights={insights} marginValue={grossMargin} />
            </CCol>
            <CCol md={6} lg={2}>
              <CCard className="nx-kpi-card h-100 border-0 shadow-sm">
                <CCardBody>
                  <div className="text-medium-emphasis small mb-1">Stock</div>
                  <div className="fs-3 fw-bold">{inventory.quantity}</div>
                  <div className="text-medium-emphasis small">
                    Threshold {inventory.lowStockThreshold} | {inventory.isLowStock ? 'Low stock' : 'Healthy'}
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol md={6} lg={2}>
              <CCard className="nx-kpi-card h-100 border-0 shadow-sm">
                <CCardBody>
                  <div className="text-medium-emphasis small mb-1">Last Refill</div>
                  <div className="fs-6 fw-bold">{lastRefill ? formatDate(lastRefill.createdAt) : 'Never refilled'}</div>
                  <div className="text-medium-emphasis small">
                    {lastRefill
                      ? `${lastRefill.adjustment} units | ${lastRefill.reason || 'No reason provided'}`
                      : 'No positive stock adjustment yet'}
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          <CRow className="g-3 mb-4">
            <CCol lg={7}>
              <CCard className="h-100 shadow-sm border-0">
                <CCardHeader>
                  <strong>Product Information</strong>
                </CCardHeader>
                <CCardBody>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="text-medium-emphasis small">SKU</div>
                      <div className="fw-semibold">{product.sku}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-medium-emphasis small">Category</div>
                      <div className="fw-semibold">{product.category || 'Uncategorized'}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-medium-emphasis small">Status</div>
                      <div>
                        <CBadge color={statusColor(product.status)}>{product.status}</CBadge>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-medium-emphasis small">Stock Value</div>
                      <div className="fw-semibold">
                        {money(Number(product.price || 0) * Number(inventory.quantity || 0))}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-medium-emphasis small">Created</div>
                      <div className="fw-semibold">{formatDate(product.createdAt)}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-medium-emphasis small">Updated</div>
                      <div className="fw-semibold">{formatDate(product.updatedAt)}</div>
                    </div>
                    <div className="col-12">
                      <div className="text-medium-emphasis small">Description</div>
                      <div className="fw-semibold">{product.description || 'No description provided.'}</div>
                    </div>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol lg={5}>
              <CCard className="h-100 shadow-sm border-0">
                <CCardHeader>
                  <strong>Refill History</strong>
                </CCardHeader>
                <CCardBody>
                  <div style={{ height: 220 }} className="mb-4">
                    <CChartBar data={refillChartData} options={refillChartOptions} />
                  </div>
                  {history.length === 0 ? (
                    <div className="text-medium-emphasis">No inventory adjustments found.</div>
                  ) : (
                    <CTable responsive hover className="align-middle mb-0">
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>Date</CTableHeaderCell>
                          <CTableHeaderCell>Change</CTableHeaderCell>
                          <CTableHeaderCell>Reason</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {history.map((entry) => (
                          <CTableRow key={entry.id}>
                            <CTableDataCell>{formatDate(entry.createdAt)}</CTableDataCell>
                            <CTableDataCell>
                              <CBadge color={Number(entry.adjustment) > 0 ? 'success' : 'danger'}>
                                {entry.adjustment > 0 ? `+${entry.adjustment}` : entry.adjustment}
                              </CBadge>
                            </CTableDataCell>
                            <CTableDataCell>{entry.reason || '-'}</CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>
                  )}
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </>
      )}
    </div>
  )
}

export default ProductsDetail
