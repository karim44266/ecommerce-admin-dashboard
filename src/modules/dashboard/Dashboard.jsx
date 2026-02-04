import React from 'react'
import { CCard, CCardBody, CCardHeader, CRow, CCol } from '@coreui/react'
import PageHeader from '../../shared/components/PageHeader'

const Dashboard = () => {
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Operational snapshot for your ecommerce store." />
      <CRow>
        <CCol lg={6} className="mb-4">
          <CCard>
            <CCardHeader>Sales Overview</CCardHeader>
            <CCardBody>
              <p className="text-medium-emphasis mb-0">
                TODO: Connect analytics endpoints to render sales KPIs.
              </p>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={6} className="mb-4">
          <CCard>
            <CCardHeader>Fulfillment Health</CCardHeader>
            <CCardBody>
              <p className="text-medium-emphasis mb-0">
                TODO: Connect fulfillment endpoints to track SLA performance.
              </p>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

export default Dashboard
