import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CAlert, CButton, CFormInput, CFormLabel, CFormSelect } from '@coreui/react'
import api from '../../services/api'
import FormCard from '../../shared/components/FormCard'
import PageHeader from '../../shared/components/PageHeader'

const ProductsEdit = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [formState, setFormState] = useState({
    name: '',
    sku: '',
    price: '',
    inventory: '',
    status: 'active',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      setError('')
      try {
        // TODO: Replace with real product details endpoint.
        const response = await api.get(`/products/${id}`)
        setFormState({
          name: response.data?.name || '',
          sku: response.data?.sku || '',
          price: response.data?.price || '',
          inventory: response.data?.inventory || '',
          status: response.data?.status || 'active',
        })
      } catch (err) {
        setError('Unable to load product details. Connect the backend endpoint to proceed.')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      // TODO: Replace with real product update endpoint.
      await api.put(`/products/${id}`, formState)
      navigate('/products', { replace: true })
    } catch (err) {
      setError('Unable to update product. Connect the backend endpoint to proceed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Edit Product" subtitle={`Update product ${id}`} />
      {error && <CAlert color="danger">{error}</CAlert>}
      <FormCard
        title="Product Details"
        onSubmit={handleSubmit}
        actions={
          <>
            <CButton color="primary" type="submit" disabled={submitting || loading}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </CButton>
            <CButton color="secondary" type="button" onClick={() => navigate(-1)}>
              Cancel
            </CButton>
          </>
        }
      >
        <div className="mb-3">
          <CFormLabel>Product Name</CFormLabel>
          <CFormInput name="name" value={formState.name} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <CFormLabel>SKU</CFormLabel>
          <CFormInput name="sku" value={formState.sku} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <CFormLabel>Price</CFormLabel>
          <CFormInput
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={formState.price}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <CFormLabel>Inventory</CFormLabel>
          <CFormInput
            name="inventory"
            type="number"
            min="0"
            value={formState.inventory}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <CFormLabel>Status</CFormLabel>
          <CFormSelect name="status" value={formState.status} onChange={handleChange}>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </CFormSelect>
        </div>
      </FormCard>
    </div>
  )
}

export default ProductsEdit
