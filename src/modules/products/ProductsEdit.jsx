import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CAlert, CButton, CFormInput, CFormLabel, CFormSelect, CFormTextarea } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilXCircle } from '@coreui/icons'
import api from '../../services/api'
import FormCard from '../../shared/components/FormCard'
import PageHeader from '../../shared/components/PageHeader'
import { useToast } from '../../shared/components/ToastProvider'
import useUnsavedWarning from '../../shared/hooks/useUnsavedWarning'

const ProductsEdit = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { addToast } = useToast()
  const [categories, setCategories] = useState([])
  const [formState, setFormState] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    image: '',
    status: 'active',
    categoryId: '',
  })
  const [initialState, setInitialState] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const dirty = initialState !== null && JSON.stringify(formState) !== JSON.stringify(initialState)
  useUnsavedWarning(dirty)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const [productRes, catRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get('/categories/simple'),
        ])
        setCategories(catRes.data || [])
        const p = productRes.data
        const loaded = {
          name: p?.name || '',
          sku: p?.sku || '',
          description: p?.description || '',
          price: p?.price != null ? String(p.price) : '',
          image: p?.image || '',
          status: p?.status || 'active',
          categoryId: p?.categoryId || '',
        }
        setFormState(loaded)
        setInitialState(loaded)
      } catch (err) {
        setError('Unable to load product details.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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
      const parsedPrice = Number(formState.price)
      if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
        setError('Price must be greater than 0.')
        setSubmitting(false)
        return
      }

      const payload = {
        name: formState.name,
        sku: formState.sku,
        description: formState.description || undefined,
        price: parsedPrice,
        image: formState.image || undefined,
        status: formState.status,
        categoryId: formState.categoryId || undefined,
      }
      await api.patch(`/products/${id}`, payload)
      addToast(`Product "${formState.name}" updated successfully.`, 'success')
      navigate('/products', { replace: true })
    } catch (err) {
      const msg =
        err?.response?.data?.message || 'Unable to update product. Please try again.'
      setError(Array.isArray(msg) ? msg.join(', ') : msg)
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
              <CIcon icon={cilPencil} className="me-1" />
              {submitting ? 'Saving...' : 'Save Changes'}
            </CButton>
            <CButton color="secondary" type="button" onClick={() => navigate(-1)}>
              <CIcon icon={cilXCircle} className="me-1" />
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
            min="0.01"
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
          {formState.image && (
            <div className="mt-2">
              <img
                src={formState.image}
                alt="Preview"
                style={{ maxWidth: 200, maxHeight: 200, objectFit: 'contain', borderRadius: 4, border: '1px solid var(--cui-border-color)' }}
                onError={(e) => { e.target.style.display = 'none' }}
                onLoad={(e) => { e.target.style.display = 'block' }}
              />
            </div>
          )}
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

export default ProductsEdit
