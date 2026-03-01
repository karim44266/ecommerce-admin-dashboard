import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCol,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'
import api from '../../services/api'
import DataTable from '../../shared/components/DataTable'
import PageHeader from '../../shared/components/PageHeader'
import TruncatedPagination from '../../shared/components/TruncatedPagination'
import { useToast } from '../../shared/components/ToastProvider'

const statusBadgeColor = (status) => {
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

const ProductsList = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 })
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const debounceRef = useRef(null)

  // Load categories for the filter dropdown
  useEffect(() => {
    api
      .get('/categories/simple')
      .then((res) => setCategories(res.data || []))
      .catch(() => {})
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        page,
        limit: 20,
        ...(search && { search }),
        ...(categoryId && { categoryId }),
        ...(status && { status }),
        sortBy,
        sortOrder,
      }
      const response = await api.get('/products', { params })
      setProducts(response.data?.data || [])
      setMeta(response.data?.meta || { total: 0, page: 1, limit: 20, totalPages: 0 })
    } catch (err) {
      setError('Unable to load products. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }, [page, search, categoryId, status, sortBy, sortOrder])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleSearchChange = (e) => {
    const val = e.target.value
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(val)
      setPage(1)
    }, 400)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/products/${deleteTarget.id}`)
      setConfirmOpen(false)
      setDeleteTarget(null)
      fetchProducts()
    } catch {
      setError('Failed to delete product.')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'image',
      label: '',
      render: (row) =>
        row.image ? (
          <img
            src={row.image}
            alt={row.name}
            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
          />
        ) : (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 4,
              backgroundColor: '#eee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: '#999',
            }}
          >
            N/A
          </div>
        ),
    },
    { key: 'name', label: 'Product' },
    { key: 'sku', label: 'SKU' },
    {
      key: 'price',
      label: 'Price',
      render: (row) => `$${Number(row.price).toFixed(2)}`,
    },
    { key: 'inventory', label: 'Stock' },
    {
      key: 'category',
      label: 'Category',
      render: (row) =>
        row.category ? <CBadge color="primary">{row.category}</CBadge> : '\u2014',
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <CBadge color={statusBadgeColor(row.status)}>{row.status}</CBadge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="d-flex gap-2">
          <CButton
            color="primary"
            size="sm"
            onClick={() => navigate(`/products/${row.id}`)}
          >
            Edit
          </CButton>
          <CButton
            color="danger"
            size="sm"
            onClick={() => {
              setDeleteTarget(row)
              setConfirmOpen(true)
            }}
          >
            Delete
          </CButton>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage catalog items, pricing, and inventory."
        actions={
          <CButton color="primary" onClick={() => navigate('/products/new')}>
            Add Product
          </CButton>
        }
      />
      {error && <CAlert color="danger">{error}</CAlert>}

      <CRow className="mb-3 g-2">
        <CCol md={4}>
          <CInputGroup>
            <CInputGroupText>
              <CIcon icon={cilSearch} />
            </CInputGroupText>
            <CFormInput
              placeholder="Search by name…"
              defaultValue={search}
              onChange={handleSearchChange}
            />
          </CInputGroup>
        </CCol>
        <CCol md={3}>
          <CFormSelect
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </CFormSelect>
        </CCol>
        <CCol md={2}>
          <CFormSelect
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </CFormSelect>
        </CCol>
        <CCol md={3}>
          <CFormSelect
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => {
              const [f, d] = e.target.value.split(':')
              setSortBy(f)
              setSortOrder(d)
              setPage(1)
            }}
          >
            <option value="createdAt:desc">Newest first</option>
            <option value="createdAt:asc">Oldest first</option>
            <option value="name:asc">Name A-Z</option>
            <option value="name:desc">Name Z-A</option>
            <option value="price:asc">Price: Low → High</option>
            <option value="price:desc">Price: High → Low</option>
            <option value="inventory:asc">Stock: Low → High</option>
            <option value="inventory:desc">Stock: High → Low</option>
          </CFormSelect>
        </CCol>
      </CRow>

      <DataTable
        title={`Product List (${meta.total})`}
        columns={columns}
        data={products}
        loading={loading}
        emptyMessage="No products found."
      />

      {meta.totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-3">
          <CButton
            color="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </CButton>
          <span className="align-self-center text-muted">
            Page {meta.page} of {meta.totalPages}
          </span>
          <CButton
            color="secondary"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </CButton>
        </div>
      )}

      <CModal visible={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <CModalHeader>
          <CModalTitle>Confirm Delete</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setConfirmOpen(false)}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default ProductsList
