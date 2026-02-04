import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CAlert, CButton } from '@coreui/react'
import api from '../../services/api'
import FormCard from '../../shared/components/FormCard'
import PageHeader from '../../shared/components/PageHeader'

const ProductsDelete = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleDelete = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      // TODO: Replace with real product delete endpoint.
      await api.delete(`/products/${id}`)
      navigate('/products', { replace: true })
    } catch (err) {
      setError('Unable to delete product. Connect the backend endpoint to proceed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Delete Product" subtitle={`Confirm removal for product ${id}`} />
      {error && <CAlert color="danger">{error}</CAlert>}
      <FormCard
        title="Confirm Deletion"
        onSubmit={handleDelete}
        actions={
          <>
            <CButton color="danger" type="submit" disabled={submitting}>
              {submitting ? 'Deleting...' : 'Delete Product'}
            </CButton>
            <CButton color="secondary" type="button" onClick={() => navigate(-1)}>
              Cancel
            </CButton>
          </>
        }
      >
        <p className="text-medium-emphasis">
          This action cannot be undone. Make sure the product is not attached to active orders.
        </p>
      </FormCard>
    </div>
  )
}

export default ProductsDelete
