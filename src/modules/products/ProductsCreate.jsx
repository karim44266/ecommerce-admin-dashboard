import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CAlert, CButton, CFormInput, CFormLabel, CFormSelect, CFormTextarea } from '@coreui/react'
import api from '../../services/api'
import FormCard from '../../shared/components/FormCard'
import PageHeader from '../../shared/components/PageHeader'
import { useToast } from '../../shared/components/ToastProvider'

const ProductsCreate = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [categories, setCategories] = useState([])
  const [formState, setFormState] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    image: '',
    inventory: '',
    status: 'active',
    categoryId: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api
      .get('/categories/simple')
      .then((res) => setCategories(res.data || []))
      .catch(() => {})
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const payload = {
        name: formState.name,
        sku: formState.sku,
        description: formState.description || undefined,
        price: Number(formState.price),
        image: formState.image || undefined,
        inventory: formState.inventory ? Number(formState.inventory) : 0,
        status: formState.status,
        categoryId: formState.categoryId || undefined,
      }
      await api.post('/products', payload)
      addToast(`Product "${formState.name}" created successfully.`, 'success')
      navigate('/products', { replace: true })
    } catch (err) {
      const msg =
        err?.response?.data?.message || 'Unable to create product. Please try again.'
      setError(Array.isArray(msg) ? msg.join(', ') : msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Create Product" subtitle="Add a new item to the catalog." />
      {error && <CAlert color="danger">{error}</CAlert>}
      <FormCard
        title="Product Details"
        onSubmit={handleSubmit}
        actions={
          <>
            <CButton color="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Product'}
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
          <CFormLabel>Description</CFormLabel>
          <CFormTextarea
            name="description"
            rows={3}
            value={formState.description}
            onChange={handleChange}
          />
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
          <CFormLabel>Image URL</CFormLabel>
          <CFormInput
            name="image"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={formState.image}
            onChange={handleChange}
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
          />
        </div>
        <div className="mb-3">
          <CFormLabel>Category</CFormLabel>
          <CFormSelect name="categoryId" value={formState.categoryId} onChange={handleChange}>
            <option value="">No category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </CFormSelect>
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

export default ProductsCreate
