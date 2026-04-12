import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from '@coreui/react'

import { AppSidebarNav } from './AppSidebarNav'

import { getRoles } from '../modules/auth/authStorage'

// sidebar nav config
import navigation from '../_nav'

const filterNavByRole = (items, userRoles) => {
  return items
    .filter((item) => {
      if (!item.roles || item.roles.length === 0) return true
      return item.roles.some((role) => userRoles.includes(role))
    })
    .map((item) => {
      if (item.items) {
        return { ...item, items: filterNavByRole(item.items, userRoles) }
      }
      return item
    })
    .filter((item) => !item.items || item.items.length > 0)
}

const AppSidebar = () => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)
  const userRoles = getRoles()

  return (
    <CSidebar
      className="nx-app-sidebar border-end"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: 'set', sidebarShow: visible })
      }}
    >
      <CSidebarHeader className="nx-sidebar-header border-bottom">
        <CSidebarBrand to="/" className="nx-sidebar-brand">
          <span className="sidebar-brand-full d-flex align-items-center gap-2">
            <span className="nx-brand-mark">PB</span>
            <span className="d-flex flex-column">
              <span className="nx-brand-text">ProBuild</span>
              <span className="nx-brand-sub">ADMIN CONSOLE</span>
            </span>
          </span>
          <span className="sidebar-brand-narrow nx-brand-mark-narrow">PB</span>
        </CSidebarBrand>
        <CCloseButton
          className="d-lg-none"
          dark
          onClick={() => dispatch({ type: 'set', sidebarShow: false })}
        />
      </CSidebarHeader>
      <AppSidebarNav items={filterNavByRole(navigation, userRoles)} />
      <CSidebarFooter className="nx-sidebar-footer border-top d-none d-lg-flex">
        <CSidebarToggler
          onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })}
        />
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
