import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilReload, cilPencil, cilPlus } from '@coreui/icons'
import useInventoryApi from '../../shared/hooks/useInventoryApi'
import DataTable from '../../shared/components/DataTable'
import PageHeader from '../../shared/components/PageHeader'
import TruncatedPagination from '../../shared/components/TruncatedPagination'

const InventoryList = () => {
  const navigate = useNavigate()
  const { fetchInventory, fetchSummary, backfill } = useInventoryApi()

  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [order, setOrder] = useState('asc')
  const [page, setPage] = useState(1)
  const [backfillMsg, setBackfillMsg] = useState('')
  const [backfilling, setBackfilling] = useState(false)
  const [summary, setSummary] = useState({ total: 0, low: 0, out: 0, inStock: 0 })
  const debounceRef = useRef(null)

  // ── Debounce search input by 300ms ──
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [search])

  // ── Fetch summary from dedicated endpoint (accurate counts) ──
  const loadSummary = useCallback(async () => {
    const res = await fetchSummary()
    if (res?.data) setSummary(res.data)
  }, [fetchSummary])

  // ── Fetch paginated inventory ──
  const loadInventory = useCallback(async () => {
    setLoading(true)
    const params = { page, limit: 20, sortBy, order }
    if (debouncedSearch) params.search = debouncedSearch
    if (statusFilter !== 'all') params.status = statusFilter

    const res = await fetchInventory(params)
    if (res?.data) {
      const data = res.data?.data || res.data || []
      const resMeta = res.data?.meta || { total: data.length, page: 1, limit: 20, totalPages: 1 }
      setItems(data)
      setMeta(resMeta)
    } else {
      setItems([])
    }
    setLoading(false)
  }, [page, debouncedSearch, statusFilter, sortBy, order, fetchInventory])

  useEffect(() => {
    loadInventory()
    loadSummary()
  }, [loadInventory, loadSummary])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, sortBy, order])

  const handleBackfill = async () => {
    setBackfilling(true)
    setBackfillMsg('')
    const res = await backfill()
    if (res?.data) {
      setBackfillMsg(res.data?.message || `Created ${res.data?.created} records`)
      if (res.data?.created > 0) {
        loadInventory()
        loadSummary()
      }
    } else {
      setBackfillMsg('Backfill failed')
    }
    setBackfilling(false)
  }

  const getStockBadge = (item) => {
    if (item.quantity <= 0) return <CBadge color="danger">Out of Stock</CBadge>
    if (item.isLowStock) return <CBadge color="warning">Low Stock</CBadge>
    return <CBadge color="success">In Stock</CBadge>
  }

  const columns = [
    { key: 'productName', label: 'Product' },
    { key: 'productSku', label: 'SKU' },
    {
      key: 'quantity',
      label: 'Stock',
      render: (row) => (
        <span className={`fw-semibold ${row.quantity <= 0 ? 'text-danger' : row.isLowStock ? 'text-warning' : ''}`}>
          {row.quantity}
        </span>
      ),
    },
    { key: 'lowStockThreshold', label: 'Threshold' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => getStockBadge(row),
    },
    {
      key: 'lastAdjustedAt',
      label: 'Last Adjusted',
      render: (row) =>
        row.lastAdjustedAt ? new Date(row.lastAdjustedAt).toLocaleDateString() : '—',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="nx-row-actions">
          <CButton
            color="primary"
            size="sm"
            className="nx-row-action-btn"
            onClick={() => navigate(`/inventory/${row.productId}/adjust`)}
          >
            <CIcon icon={cilPencil} className="me-1" />
            Adjust
          </CButton>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Inventory Management"
        subtitle={`${summary.total} total item${summary.total !== 1 ? 's' : ''}`}
        actions={
          <div className="d-flex gap-2 nx-utility-actions">
            <CButton color="light" size="sm" className="nx-utility-btn" onClick={() => { loadInventory(); loadSummary() }} title="Refresh">
              <CIcon icon={cilReload} />
            </CButton>
            <CButton color="info" size="sm" className="nx-utility-btn" onClick={handleBackfill} disabled={backfilling}>
              {!backfilling && <CIcon icon={cilPlus} className="me-1" />}
              {backfilling ? <CSpinner size="sm" /> : 'Backfill Missing'}
            </CButton>
          </div>
        }
      />

      {backfillMsg && (
        <CAlert color="info" dismissible onClose={() => setBackfillMsg('')}>
          {backfillMsg}
        </CAlert>
      )}

      {/* Summary Cards — counts from dedicated /inventory/summary endpoint */}
      <CRow className="mb-3">
        <CCol sm={3}>
          <CCard className="text-center">
            <CCardBody>
              <div className="text-medium-emphasis small">Total Products</div>
              <div className="fs-4 fw-semibold">{summary.total}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={3}>
          <CCard className="text-center border-success">
            <CCardBody>
              <div className="text-medium-emphasis small">In Stock</div>
              <div className="fs-4 fw-semibold text-success">{summary.inStock}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={3}>
          <CCard className="text-center border-warning">
            <CCardBody>
              <div className="text-medium-emphasis small">Low Stock</div>
              <div className="fs-4 fw-semibold text-warning">{summary.low}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={3}>
          <CCard className="text-center border-danger">
            <CCardBody>
              <div className="text-medium-emphasis small">Out of Stock</div>
              <div className="fs-4 fw-semibold text-danger">{summary.out}</div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Filters Bar */}
      <CRow className="mb-3 g-2">
        <CCol md={4}>
          <CInputGroup>
            <CInputGroupText>
              <CIcon icon={cilSearch} />
            </CInputGroupText>
            <CFormInput
              placeholder="Search by product name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </CInputGroup>
        </CCol>
        <CCol md={3}>
          <CFormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="in-stock">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </CFormSelect>
        </CCol>
        <CCol md={3}>
          <CFormSelect value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Sort by Name</option>
            <option value="quantity">Sort by Quantity</option>
            <option value="threshold">Sort by Threshold</option>
            <option value="lastAdjusted">Sort by Last Adjusted</option>
          </CFormSelect>
        </CCol>
        <CCol md={2}>
          <CFormSelect value={order} onChange={(e) => setOrder(e.target.value)}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </CFormSelect>
        </CCol>
      </CRow>

      <DataTable
        title="Stock Levels"
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage="No inventory records found."
      />

      <TruncatedPagination
        page={page}
        totalPages={meta.totalPages}
        onPageChange={setPage}
      />
    </div>
  )
}

export default InventoryList
