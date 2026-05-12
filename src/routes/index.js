import React from 'react'

const Dashboard = React.lazy(() => import('../modules/dashboard/Dashboard'))

const ProductsList = React.lazy(() => import('../modules/products/ProductsList'))
const ProductsCreate = React.lazy(() => import('../modules/products/ProductsCreate'))
const ProductsDetail = React.lazy(() => import('../modules/products/ProductsDetail'))
const ProductsEdit = React.lazy(() => import('../modules/products/ProductsEdit'))
const ProductsDelete = React.lazy(() => import('../modules/products/ProductsDelete'))

const CategoriesList = React.lazy(() => import('../modules/categories/CategoriesList'))
const CategoriesCreate = React.lazy(() => import('../modules/categories/CategoriesCreate'))
const CategoryDetailsPage = React.lazy(() => import('../modules/categories/CategoryDetailsPage'))
const CategoriesEdit = React.lazy(() => import('../modules/categories/CategoriesEdit'))

const OrdersList = React.lazy(() => import('../modules/orders/OrdersList'))
const OrderDetails = React.lazy(() => import('../modules/orders/OrderDetails'))
const OrderStatusUpdate = React.lazy(() => import('../modules/orders/OrderStatusUpdate'))
const OrderTracking = React.lazy(() => import('../modules/orders/OrderTracking'))

const UsersList = React.lazy(() => import('../modules/users/UsersList'))
const UsersRoles = React.lazy(() => import('../modules/users/UsersRoles'))
const UsersBlock = React.lazy(() => import('../modules/users/UsersBlock'))
const ClientTracking = React.lazy(() => import('../modules/users/ClientTracking'))
const ClientTrackingIndex = React.lazy(() => import('../modules/users/ClientTrackingIndex'))
const DiscountSuggestions = React.lazy(() => import('../modules/promotions/DiscountSuggestions'))

const DeliveryAssign = React.lazy(() => import('../modules/delivery/DeliveryAssign'))
const DeliveryStatus = React.lazy(() => import('../modules/delivery/DeliveryStatus'))

const InventoryList = React.lazy(() => import('../modules/inventory/InventoryList'))
const InventoryAdjust = React.lazy(() => import('../modules/inventory/InventoryAdjust'))
const InventoryLowStock = React.lazy(() => import('../modules/inventory/InventoryLowStock'))

const MfaSettings = React.lazy(() => import('../modules/auth/MfaSettings'))

const routes = [
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },

  { path: '/products', name: 'Products', element: ProductsList },
  { path: '/products/new', name: 'Create Product', element: ProductsCreate },
  { path: '/products/:id/details', name: 'Product Details', element: ProductsDetail },
  { path: '/products/:id', name: 'Edit Product', element: ProductsEdit },
  { path: '/products/:id/delete', name: 'Delete Product', element: ProductsDelete },

  { path: '/categories', name: 'Categories', element: CategoriesList },
  { path: '/categories/new', name: 'Create Category', element: CategoriesCreate },
  { path: '/categories/:id/details', name: 'Category Details', element: CategoryDetailsPage },
  { path: '/categories/:id', name: 'Edit Category', element: CategoriesEdit },

  { path: '/orders', name: 'Orders', element: OrdersList },
  { path: '/orders/:id', name: 'Order Details', element: OrderDetails },
  { path: '/orders/:id/status', name: 'Update Order Status', element: OrderStatusUpdate },
  { path: '/orders/:id/tracking', name: 'Delivery Tracking', element: OrderTracking },

  { path: '/users', name: 'Users', element: UsersList },
  { path: '/users/:id/roles', name: 'Update User Role', element: UsersRoles },
  { path: '/users/:id/status', name: 'Block / Unblock User', element: UsersBlock },
  { path: '/clients/tracking', name: 'Client Tracking', element: ClientTrackingIndex },
  { path: '/clients/:id/tracking', name: 'Client Tracking Details', element: ClientTracking },
  { path: '/promotions/suggestions', name: 'Discount Suggestions', element: DiscountSuggestions },

  { path: '/delivery/assign', name: 'Assign Delivery', element: DeliveryAssign },
  { path: '/delivery/status', name: 'Delivery Status', element: DeliveryStatus },

  { path: '/inventory', name: 'Inventory', element: InventoryList },
  { path: '/inventory/low-stock', name: 'Low Stock Alerts', element: InventoryLowStock },
  { path: '/inventory/:productId/adjust', name: 'Adjust Inventory', element: InventoryAdjust },

  { path: '/settings/mfa', name: 'MFA Settings', element: MfaSettings },
]

export default routes
