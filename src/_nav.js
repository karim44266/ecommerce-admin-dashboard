import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilClipboard, cilSpeedometer, cilCart, cilPeople, cilTruck } from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Management',
  },
  {
    component: CNavGroup,
    name: 'Products',
    to: '/products',
    icon: <CIcon icon={cilCart} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'All Products',
        to: '/products',
      },
      {
        component: CNavItem,
        name: 'Add Product',
        to: '/products/new',
      },
    ],
  },
  {
    component: CNavGroup,
    name: 'Orders',
    to: '/orders',
    icon: <CIcon icon={cilClipboard} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Order List',
        to: '/orders',
      },
    ],
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
    items: [
      {
        component: CNavItem,
        name: 'User List',
        to: '/users',
      },
      {
        component: CNavItem,
        name: 'Roles & Access',
        to: '/users',
      },
    ],
  },
]

export default _nav
