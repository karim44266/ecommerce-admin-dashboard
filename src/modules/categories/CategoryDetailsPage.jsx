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
  CFormSelect,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilReload, cilArrowLeft } from '@coreui/icons'
import api from '../../services/api'
import PageHeader from '../../shared/components/PageHeader'
import CategoryPerformanceChart from './components/CategoryPerformanceChart'

const money = (value) => `$${Number(value || 0).toFixed(2)}`

const formatDateTime = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const CategoryDetailsPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  const [days, setDays] = useState(30)
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDetails = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get(`/categories/${id}/details`, {
        params: { days },
      })
      setDetails(res.data)
    } catch (err) {
      const msg = err?.response?.data?.message || 'Unable to load category details.'
      setError(Array.isArray(msg) ? msg.join(', ') : msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetails()
  }, [id, days])

  const category = details?.category
  const summary = details?.summary

  const avgMarginLabel = useMemo(() => {
    const value = Number(summary?.averageMarginPercent || 0)
    return `${value.toFixed(1)}%`
  }, [summary])

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <div>
      <div className="text-medium-emphasis small mb-2">
        Home / Categories / {category?.name || 'Category Details'}
      </div>

      <PageHeader
        title={category?.name || 'Category Details'}
        subtitle={category?.description || 'Category analytics and performance overview.'}
        actions={
          <div className="d-flex gap-2 nx-utility-actions">
            <CButton color="light" size="sm" className="nx-utility-btn" onClick={fetchDetails}>
              <CIcon icon={cilReload} className="me-1" />
              Refresh
            </CButton>
            <CButton color="secondary" variant="outline" size="sm" className="nx-utility-btn" onClick={() => navigate('/categories')}>
              <CIcon icon={cilArrowLeft} className="me-1" />
              Back
            </CButton>
          </div>
        }
      />

      {error && <CAlert color="danger">{error}</CAlert>}

      {details && (
        <>
          <CRow className="g-3 mb-4">
            <CCol md={3}>
              <CCard className="h-100 shadow-sm border-0">
                <CCardBody>
                  <div className="text-medium-emphasis small mb-1">Total Products</div>
                  <div className="fs-4 fw-bold">{summary?.totalProducts ?? 0}</div>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol md={3}>
              <CCard className="h-100 shadow-sm border-0">
                <CCardBody>
                  <div className="text-medium-emphasis small mb-1">Total Orders</div>
                  <div className="fs-4 fw-bold">{summary?.totalOrders ?? 0}</div>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol md={3}>
              <CCard className="h-100 shadow-sm border-0">
                <CCardBody>
                  <div className="text-medium-emphasis small mb-1">Total Revenue</div>
                  <div className="fs-4 fw-bold">{money(summary?.totalRevenue)}</div>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol md={3}>
              <CCard className="h-100 shadow-sm border-0">
                <CCardBody>
                  <div className="text-medium-emphasis small mb-1">Average Margin</div>
                  <div className="fs-4 fw-bold">{avgMarginLabel}</div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          <CCard className="mb-4 shadow-sm border-0">
            <CCardHeader className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <strong>Last {days} Days - Category Performance</strong>
                <div className="text-medium-emphasis small">
                  Orders and net revenue trend across all products in this category.
                </div>
              </div>
              <div style={{ minWidth: 120 }}>
                <CFormSelect
                  size="sm"
                  value={String(days)}
                  onChange={(event) => setDays(Number(event.target.value))}
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                </CFormSelect>
              </div>
            </CCardHeader>
            <CCardBody>
              <CategoryPerformanceChart trend={details?.trend} />
            </CCardBody>
          </CCard>

          <CRow className="g-3">
            <CCol lg={6}>
              <CCard className="h-100 shadow-sm border-0">
                <CCardHeader>
                  <strong>Category Information</strong>
                </CCardHeader>
                <CCardBody>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="text-medium-emphasis small">Slug</div>
                      <div className="fw-semibold">{category?.slug || '-'}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-medium-emphasis small">Products</div>
                      <div className="fw-semibold">{summary?.totalProducts ?? 0}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-medium-emphasis small">Created</div>
                      <div className="fw-semibold">{formatDateTime(category?.createdAt)}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-medium-emphasis small">Updated</div>
                      <div className="fw-semibold">{formatDateTime(category?.updatedAt)}</div>
                    </div>
                    <div className="col-12">
                      <div className="text-medium-emphasis small">Description</div>
                      <div className="fw-semibold">{category?.description || 'No description provided.'}</div>
                    </div>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol lg={6}>
              <CCard className="h-100 shadow-sm border-0">
                <CCardHeader>
                  <strong>Advanced Metrics</strong>
                </CCardHeader>
                <CCardBody>
                  <div className="d-flex flex-column gap-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="text-medium-emphasis small">Top Selling Product</div>
                        <div className="fw-semibold">{details?.topSellingProduct?.name || '-'}</div>
                      </div>
                      <CBadge color="success">
                        {details?.topSellingProduct?.unitsSold ?? 0} sold
                      </CBadge>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="text-medium-emphasis small">Lowest Stock Product</div>
                        <div className="fw-semibold">{details?.lowestStockProduct?.name || '-'}</div>
                      </div>
                      <CBadge color="warning">
                        {details?.lowestStockProduct?.stock ?? 0} in stock
                      </CBadge>
                    </div>

                    <div>
                      <div className="text-medium-emphasis small">Total Stock Value</div>
                      <div className="fw-semibold fs-5">{money(summary?.totalStockValue)}</div>
                    </div>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </>
      )}
    </div>
  )
}

export default CategoryDetailsPage
