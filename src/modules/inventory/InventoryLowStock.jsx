import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CBadge, CButton } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilReload } from '@coreui/icons'
import useInventoryApi from '../../shared/hooks/useInventoryApi'
import DataTable from '../../shared/components/DataTable'
import PageHeader from '../../shared/components/PageHeader'
import TruncatedPagination from '../../shared/components/TruncatedPagination'

const InventoryLowStock = () => {
  const navigate = useNavigate()
  const { fetchLowStock } = useInventoryApi()
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const loadLowStock = useCallback(async () => {
    setLoading(true)
    const res = await fetchLowStock({ page, limit: 20 })
    if (res?.data) {
      const data = res.data?.data || res.data || []
      const resMeta = res.data?.meta || { total: data.length, page: 1, limit: 20, totalPages: 1 }
      setItems(data)
      setMeta(resMeta)
    } else {
      setItems([])
    }
    setLoading(false)
  }, [page, fetchLowStock])

  useEffect(() => {
    loadLowStock()
  }, [loadLowStock])

  const columns = [
    { key: 'productName', label: 'Product' },
    { key: 'productSku', label: 'SKU' },
    {
      key: 'quantity',
      label: 'Current Stock',
      render: (row) => (
        <span className="fw-bold text-danger">{row.quantity}</span>
      ),
    },
    {
      key: 'lowStockThreshold',
      label: 'Threshold',
    },
    {
      key: 'severity',
      label: 'Severity',
      render: (row) =>
        row.quantity <= 0 ? (
          <CBadge color="danger">Out of Stock</CBadge>
        ) : (
          <CBadge color="warning">Low Stock</CBadge>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <CButton
          color="warning"
          size="sm"
          onClick={() => navigate(`/inventory/${row.productId}/adjust`)}
        >
          Restock
        </CButton>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Low Stock Alerts"
        subtitle={`${meta.total} item${meta.total !== 1 ? 's' : ''} below threshold`}
        actions={
          <CButton color="light" size="sm" onClick={loadLowStock} title="Refresh">
            <CIcon icon={cilReload} /> Refresh
          </CButton>
        }
      />
      <DataTable
        title="Low Stock Items"
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage="All products are adequately stocked."
      />
      <TruncatedPagination
        page={page}
        totalPages={meta.totalPages}
        onPageChange={setPage}
      />
    </div>
  )
}

export default InventoryLowStock
