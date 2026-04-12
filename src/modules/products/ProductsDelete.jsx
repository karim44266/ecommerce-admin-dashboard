import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CAlert, CButton, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilTrash, cilXCircle } from '@coreui/icons'
import api from '../../services/api'
import FormCard from '../../shared/components/FormCard'
import PageHeader from '../../shared/components/PageHeader'
import { useToast } from '../../shared/components/ToastProvider'

const ProductsDelete = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [product, setProduct] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch(() => setLoadError('Unable to load product details.'))
  }, [id])

  const handleDelete = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await api.delete(`/products/${id}`)
      addToast(`Product "${product?.name || id}" deleted.`, 'success')
      navigate('/products', { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.message || 'Unable to delete product. Please try again.'
      setError(Array.isArray(msg) ? msg.join(', ') : msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Delete Product"
        subtitle={product ? `Confirm removal of "${product.name}"` : `Confirm removal for product ${id}`}
      />
      {loadError && <CAlert color="warning">{loadError}</CAlert>}
      {error && <CAlert color="danger">{error}</CAlert>}
      <FormCard
        title="Confirm Deletion"
        onSubmit={handleDelete}
        actions={
          <>
            <CButton color="danger" type="submit" disabled={submitting}>
              <CIcon icon={cilTrash} className="me-1" />
              {submitting ? 'Deleting…' : 'Delete Product'}
            </CButton>
            <CButton color="secondary" type="button" onClick={() => navigate('/products')}>
              <CIcon icon={cilXCircle} className="me-1" />
              Cancel
            </CButton>
          </>
        }
      >
        {product ? (
          <div>
            <p className="text-medium-emphasis mb-2">
              You are about to permanently delete the following product:
            </p>
            <ul className="list-unstyled ms-3 mb-0">
              <li>
                <strong>Name:</strong> {product.name}
              </li>
              <li>
                <strong>SKU:</strong> {product.sku}
              </li>
              <li>
                <strong>Price:</strong> ${Number(product.price).toFixed(2)}
              </li>
            </ul>
            <p className="text-danger mt-3 mb-0">This action cannot be undone.</p>
          </div>
        ) : loadError ? (
          <p className="text-medium-emphasis">
            Could not load product details, but you can still proceed with deletion.
          </p>
        ) : (
          <div className="text-center py-3">
            <CSpinner size="sm" />
          </div>
        )}
      </FormCard>
    </div>
  )
}

export default ProductsDelete
