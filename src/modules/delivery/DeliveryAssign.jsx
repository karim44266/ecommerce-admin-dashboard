import React, { useEffect, useState } from 'react'
import { CAlert, CButton, CFormLabel, CFormSelect } from '@coreui/react'
import api from '../../services/api'
import FormCard from '../../shared/components/FormCard'
import PageHeader from '../../shared/components/PageHeader'

const DeliveryAssign = () => {
  const [orders, setOrders] = useState([])
  const [drivers, setDrivers] = useState([])
  const [orderId, setOrderId] = useState('')
  const [driverId, setDriverId] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // TODO: Replace with real order and driver endpoints.
        const [ordersResponse, driversResponse] = await Promise.all([
          api.get('/orders?status=ready'),
          api.get('/delivery/drivers'),
        ])
        setOrders(ordersResponse.data || [])
        setDrivers(driversResponse.data || [])
      } catch (err) {
        setError('Unable to load delivery resources. Connect the backend endpoint to proceed.')
      }
    }

    fetchOptions()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      // TODO: Replace with real delivery assignment endpoint.
      await api.post('/delivery/assign', { orderId, driverId })
      setOrderId('')
      setDriverId('')
    } catch (err) {
      setError('Unable to assign delivery. Connect the backend endpoint to proceed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Assign Delivery" subtitle="Match ready orders with drivers." />
      {error && <CAlert color="danger">{error}</CAlert>}
      <FormCard
        title="Assignment"
        onSubmit={handleSubmit}
        actions={
          <CButton color="primary" type="submit" disabled={submitting}>
            {submitting ? 'Assigning...' : 'Assign Delivery'}
          </CButton>
        }
      >
        <div className="mb-3">
          <CFormLabel>Order</CFormLabel>
          <CFormSelect value={orderId} onChange={(event) => setOrderId(event.target.value)}>
            <option value="">Select order</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.orderNumber || order.id}
              </option>
            ))}
          </CFormSelect>
        </div>
        <div className="mb-3">
          <CFormLabel>Driver</CFormLabel>
          <CFormSelect value={driverId} onChange={(event) => setDriverId(event.target.value)}>
            <option value="">Select driver</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name || driver.id}
              </option>
            ))}
          </CFormSelect>
        </div>
      </FormCard>
    </div>
  )
}

export default DeliveryAssign
