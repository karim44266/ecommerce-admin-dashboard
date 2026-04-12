import React from 'react'
import { AppContent, AppSidebar, AppFooter, AppHeader } from '../components/index'

const DefaultLayout = () => {
  return (
    <div className="nx-layout-shell">
      <AppSidebar />
      <div className="wrapper nx-layout-wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="body flex-grow-1 nx-layout-body">
          <div className="nx-layout-content">
            <AppContent />
          </div>
        </div>
        <AppFooter />
      </div>
    </div>
  )
}

export default DefaultLayout
