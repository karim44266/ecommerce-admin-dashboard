import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CAlert, CCard, CCardBody, CCardHeader } from '@coreui/react'
import api from '../../services/api'
import PageHeader from '../../shared/components/PageHeader'

const OrderDetails = () => {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true)
      setError('')
      try {
        // TODO: Replace with real order details endpoint.
        const response = await api.get(`/orders/${id}`)
        setOrder(response.data || null)
      } catch (err) {
        setError('Unable to load order details. Connect the backend endpoint to proceed.')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [id])

  return (
    <div>
      <PageHeader title="Order Details" subtitle={`Order ${id}`} />
      {error && <CAlert color="danger">{error}</CAlert>}
      <CCard>
        <CCardHeader>Summary</CCardHeader>
        <CCardBody>
          {loading ? (
            <p className="text-medium-emphasis">Loading order details...</p>
          ) : (
            <div>
              <p className="text-medium-emphasis">
                {order ? 'Order details loaded from API.' : 'No order data available.'}
              </p>
              <p className="text-medium-emphasis">
                TODO: Render customer, items, payments, and shipping information.
              </p>
            </div>
          )}
        </CCardBody>
      </CCard>
    </div>
  )
}

export default OrderDetails
