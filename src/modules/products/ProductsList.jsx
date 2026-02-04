import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CAlert, CButton } from '@coreui/react'
import api from '../../services/api'
import DataTable from '../../shared/components/DataTable'
import PageHeader from '../../shared/components/PageHeader'

const ProductsList = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setError('')
      try {
        // TODO: Replace with real products list endpoint.
        const response = await api.get('/products')
        setProducts(response.data || [])
      } catch (err) {
        setError('Unable to load products. Connect the backend endpoint to proceed.')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const columns = [
    { key: 'name', label: 'Product' },
    { key: 'sku', label: 'SKU' },
    { key: 'price', label: 'Price' },
    { key: 'inventory', label: 'Inventory' },
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
      <DataTable
        title="Product List"
        columns={columns}
        data={products}
        loading={loading}
        emptyMessage="No products found."
      />
    </div>
  )
}

export default ProductsList
