import React from 'react'

const Dashboard = React.lazy(() => import('../modules/dashboard/Dashboard'))

const ProductsList = React.lazy(() => import('../modules/products/ProductsList'))
const ProductsCreate = React.lazy(() => import('../modules/products/ProductsCreate'))
const ProductsEdit = React.lazy(() => import('../modules/products/ProductsEdit'))
const ProductsDelete = React.lazy(() => import('../modules/products/ProductsDelete'))

const OrdersList = React.lazy(() => import('../modules/orders/OrdersList'))
const OrderDetails = React.lazy(() => import('../modules/orders/OrderDetails'))
const OrderStatusUpdate = React.lazy(() => import('../modules/orders/OrderStatusUpdate'))
const OrderTracking = React.lazy(() => import('../modules/orders/OrderTracking'))

const UsersList = React.lazy(() => import('../modules/users/UsersList'))
const UsersRoles = React.lazy(() => import('../modules/users/UsersRoles'))
const UsersBlock = React.lazy(() => import('../modules/users/UsersBlock'))

const DeliveryAssign = React.lazy(() => import('../modules/delivery/DeliveryAssign'))
const DeliveryStatus = React.lazy(() => import('../modules/delivery/DeliveryStatus'))

const routes = [
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },

  { path: '/products', name: 'Products', element: ProductsList },
  { path: '/products/new', name: 'Create Product', element: ProductsCreate },
  { path: '/products/:id', name: 'Edit Product', element: ProductsEdit },
  { path: '/products/:id/delete', name: 'Delete Product', element: ProductsDelete },

  { path: '/orders', name: 'Orders', element: OrdersList },
  { path: '/orders/:id', name: 'Order Details', element: OrderDetails },
  { path: '/orders/:id/status', name: 'Update Order Status', element: OrderStatusUpdate },
  { path: '/orders/:id/tracking', name: 'Delivery Tracking', element: OrderTracking },

  { path: '/users', name: 'Users', element: UsersList },
  { path: '/users/:id/roles', name: 'Update User Role', element: UsersRoles },
  { path: '/users/:id/status', name: 'Block / Unblock User', element: UsersBlock },

  { path: '/delivery/assign', name: 'Assign Delivery', element: DeliveryAssign },
  { path: '/delivery/status', name: 'Delivery Status', element: DeliveryStatus },
]

export default routes
