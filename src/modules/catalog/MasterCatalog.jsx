import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCol,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilPlus, cilTrash } from '@coreui/icons'
import api from '../../services/api'
import { fetchMasterCatalog, togglePersonalCatalogItem } from '../../services/productsService'
import DataTable from '../../shared/components/DataTable'
import PageHeader from '../../shared/components/PageHeader'

const statusBadgeColor = (status) => {
  switch (status) {
    case 'active': return 'success'
    case 'draft': return 'warning'
    case 'archived': return 'secondary'
    default: return 'info'
  }
}

const MasterCatalog = () => {
  const [products, setProducts] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 })
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [toggling, setToggling] = useState(null)
  const [error, setError] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const debounceRef = useRef(null)

  useEffect(() => {
    api
      .get('/categories/simple')
      .then((res) => setCategories(res.data || []))
      .catch(() => {})
  }, [])

  const loadCatalog = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        page,
        limit: 20,
        ...(search && { search }),
        ...(categoryId && { categoryId }),
        sortBy,
        sortOrder,
      }
      const response = await fetchMasterCatalog(params)
      setProducts(response.data || [])
      setMeta(response.meta || { total: 0, page: 1, limit: 20, totalPages: 0 })
    } catch (err) {
      setError('Unable to load master catalog.')
    } finally {
      setLoading(false)
    }
  }, [page, search, categoryId, sortBy, sortOrder])

  useEffect(() => {
    loadCatalog()
  }, [loadCatalog])

  const handleSearchChange = (e) => {
    const val = e.target.value
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(val)
      setPage(1)
    }, 400)
  }

  const handleToggle = async (productId) => {
    setToggling(productId)
    try {
      const { added } = await togglePersonalCatalogItem(productId)
      setProducts((current) =>
        current.map((p) => (p.id === productId ? { ...p, inPersonalCatalog: added } : p))
      )
    } catch {
      setError('Failed to update personal catalog.')
    } finally {
      setToggling(null)
    }
  }

  const columns = [
    {
      key: 'image',
      label: '',
      render: (row) =>
        row.image ? (
          <img src={row.image} alt={row.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
        ) : (
          <div style={{ width: 40, height: 40, borderRadius: 4, backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#999' }}>N/A</div>
        ),
    },
    { key: 'name', label: 'Product' },
    { key: 'sku', label: 'SKU' },
    {
      key: 'price',
      label: 'Price',
      render: (row) => (
        <div>
          {row.resellerPrice ? (
            <>
              <span className="text-decoration-line-through text-muted small me-2">${Number(row.price).toFixed(2)}</span>
              <strong className="text-success">${Number(row.resellerPrice).toFixed(2)}</strong>
            </>
          ) : (
            <span>${Number(row.price).toFixed(2)}</span>
          )}
        </div>
      )
    },
    { key: 'inventory', label: 'Stock' },
    {
      key: 'category',
      label: 'Category',
      render: (row) => row.category ? <CBadge color="primary">{row.category}</CBadge> : '\u2014',
    },
    {
      key: 'actions',
      label: 'Personal Catalog',
      render: (row) => (
        <CButton
          color={row.inPersonalCatalog ? 'danger' : 'success'}
          variant={row.inPersonalCatalog ? 'outline' : 'solid'}
          size="sm"
          disabled={toggling === row.id}
          onClick={() => handleToggle(row.id)}
        >
          <CIcon icon={row.inPersonalCatalog ? cilTrash : cilPlus} className="me-1" />
          {row.inPersonalCatalog ? 'Remove' : 'Add'}
        </CButton>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Master Catalog"
        subtitle="Browse all available products from the company and add them to your personal storefront."
      />
      {error && <CAlert color="danger">{error}</CAlert>}

      <CRow className="mb-3 g-2">
        <CCol md={4}>
          <CInputGroup>
            <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
            <CFormInput placeholder="Search by name…" defaultValue={search} onChange={handleSearchChange} />
          </CInputGroup>
        </CCol>
        <CCol md={4}>
          <CFormSelect value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}>
            <option value="">All categories</option>
            {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </CFormSelect>
        </CCol>
        <CCol md={4}>
          <CFormSelect value={`${sortBy}:${sortOrder}`} onChange={(e) => {
            const [f, d] = e.target.value.split(':')
            setSortBy(f); setSortOrder(d); setPage(1);
          }}>
            <option value="createdAt:desc">Newest first</option>
            <option value="name:asc">Name A-Z</option>
            <option value="price:asc">Price: Low → High</option>
            <option value="price:desc">Price: High → Low</option>
          </CFormSelect>
        </CCol>
      </CRow>

      <DataTable
        title={`Company Products (${meta.total})`}
        columns={columns}
        data={products}
        loading={loading}
        emptyMessage="No products available."
      />

      {meta.totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-3">
          <CButton color="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</CButton>
          <span className="align-self-center text-muted">Page {meta.page} of {meta.totalPages}</span>
          <CButton color="secondary" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</CButton>
        </div>
      )}
    </div>
  )
}

export default MasterCatalog
