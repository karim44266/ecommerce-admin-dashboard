import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilClipboard,
  cilSpeedometer,
  cilCart,
  cilPeople,
  cilChart,
  cilTruck,
  cilSettings,
  cilStorage,
  cilLayers,
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    end: true,
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'MANAGEMENT',
    className: 'nx-nav-section-title',
    roles: ['ADMIN'],
  },
  {
    component: CNavGroup,
    name: 'Products',
    to: '/products',
    icon: <CIcon icon={cilCart} customClassName="nav-icon" />,
    roles: ['ADMIN'],
    items: [
      {
        component: CNavItem,
        name: 'Catalog',
        to: '/products',
        end: true,
      },
      {
        component: CNavItem,
        name: 'Add Product',
        to: '/products/new',
        roles: ['ADMIN'],
      },
    ],
  },
  {
    component: CNavGroup,
    name: 'Categories',
    to: '/categories',
    icon: <CIcon icon={cilLayers} customClassName="nav-icon" />,
    roles: ['ADMIN'],
    items: [
      {
        component: CNavItem,
        name: 'All Categories',
        to: '/categories',
        end: true,
      },
      {
        component: CNavItem,
        name: 'Add Category',
        to: '/categories/new',
      },
    ],
  },
  {
    component: CNavGroup,
    name: 'Inventory',
    to: '/inventory',
    icon: <CIcon icon={cilStorage} customClassName="nav-icon" />,
    roles: ['ADMIN'],
    items: [
      {
        component: CNavItem,
        name: 'Stock Levels',
        to: '/inventory',
        end: true,
      },
      {
        component: CNavItem,
        name: 'Low Stock Alerts',
        to: '/inventory/low-stock',
      },
    ],
  },
  {
    component: CNavGroup,
    name: 'Orders',
    to: '/orders',
    icon: <CIcon icon={cilClipboard} customClassName="nav-icon" />,
    roles: ['ADMIN'],
    items: [
      {
        component: CNavItem,
        name: 'Order List',
        to: '/orders',
        end: true,
      },
    ],
  },
  {
    component: CNavTitle,
    name: 'Delivery',
    roles: ['STAFF'],
  },
  {
    component: CNavGroup,
    name: 'Delivery',
    to: '/delivery/assign',
    icon: <CIcon icon={cilTruck} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Assign Delivery',
        to: '/delivery/assign',
        roles: ['ADMIN'],
      },
      {
        component: CNavItem,
        name: 'Update Status',
        to: '/delivery/status',
      },
    ],
  },
  {
    component: CNavGroup,
    name: 'Users',
    to: '/users',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
    roles: ['ADMIN'],
    items: [
      {
        component: CNavItem,
        name: 'User List',
        to: '/users',
        end: true,
      },
    ],
  },
  {
    component: CNavItem,
    name: 'Client Tracking',
    to: '/clients/tracking',
    roles: ['ADMIN'],
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Account',
  },
  {
    component: CNavItem,
    name: 'MFA Settings',
    to: '/settings/mfa',
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
  },
]

export default _nav
