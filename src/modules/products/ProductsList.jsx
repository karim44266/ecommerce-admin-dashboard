import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CAlert, CBadge, CButton, CFormInput, CInputGroup, CInputGroupText } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'
import api from '../../services/api'
import DataTable from '../../shared/components/DataTable'
import PageHeader from '../../shared/components/PageHeader'

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
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await api.get('/products')
        setProducts(response.data || [])
      } catch (err) {
        setError('Unable to load products. Make sure the backend is running.')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const filtered = products.filter((product) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (product.name && product.name.toLowerCase().includes(q)) ||
      (product.sku && product.sku.toLowerCase().includes(q)) ||
      (product.category && product.category.toLowerCase().includes(q))
    )
  })

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
          <CButton color="primary" size="sm" component={Link} to={`/products/${row.id}`}>
            Edit
          </CButton>
          <CButton color="danger" size="sm" component={Link} to={`/products/${row.id}/delete`}>
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
          <CButton color="primary" component={Link} to="/products/new">
            Add Product
          </CButton>
        }
      />
      {error && <CAlert color="danger">{error}</CAlert>}
      <CInputGroup className="mb-3">
        <CInputGroupText>
          <CIcon icon={cilSearch} />
        </CInputGroupText>
        <CFormInput
          placeholder="Search by name, SKU, or category\u2026"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </CInputGroup>
      <DataTable
        title={`Product List (${filtered.length})`}
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMessage="No products found."
      />
    </div>
  )
}

export default ProductsList
