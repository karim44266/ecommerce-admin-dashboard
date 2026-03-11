import React from 'react'
import {
  CCard,
  CCardHeader,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'

const DataTable = ({ title, columns, data = [], loading, emptyMessage = 'No records found.' }) => {
  return (
    <CCard className="mb-4 nx-fade-in overflow-hidden">
      {title && (
        <CCardHeader className="d-flex align-items-center justify-content-between">
          <strong>{title}</strong>
        </CCardHeader>
      )}
      {loading ? (
        <div className="text-center py-5">
          <CSpinner color="primary" />
        </div>
      ) : (
        <CTable responsive hover align="middle" className="mb-0">
          <CTableHead>
            <CTableRow>
              {columns.map((column) => (
                <CTableHeaderCell key={column.key}>{column.label}</CTableHeaderCell>
              ))}
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {data.length === 0 ? (
              <CTableRow>
                <CTableDataCell
                  colSpan={columns.length}
                  className="text-center text-medium-emphasis py-4"
                >
                  {emptyMessage}
                </CTableDataCell>
              </CTableRow>
            ) : (
              data.map((row) => (
                <CTableRow key={row.id || row.key}>
                  {columns.map((column) => (
                    <CTableDataCell key={column.key}>
                      {column.render ? column.render(row) : row[column.key]}
                    </CTableDataCell>
                  ))}
                </CTableRow>
              ))
            )}
          </CTableBody>
        </CTable>
      )}
    </CCard>
  )
}

export default DataTable
