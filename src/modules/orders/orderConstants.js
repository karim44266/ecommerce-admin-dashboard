/**
 * Unified order status constants used across all order-related pages.
 * Single source of truth – update here to propagate everywhere.
 */

export const STATUS_COLORS = {
  DRAFT: 'warning',
  CONFIRMED: 'info',
  IN_PREPARATION: 'primary',
  DELIVERED: 'success',
  SETTLED: 'primary',
  CANCELLED: 'danger',
}

export const STATUS_LABELS = {
  DRAFT: 'Draft',
  CONFIRMED: 'Confirmed',
  IN_PREPARATION: 'In Preparation',
  DELIVERED: 'Delivered',
  SETTLED: 'Settled',
  CANCELLED: 'Cancelled',
}

/** Mirrors STATUS_TRANSITIONS from the backend DTO */
export const STATUS_TRANSITIONS = {
  DRAFT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PREPARATION', 'CANCELLED'],
  IN_PREPARATION: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['SETTLED'],
  SETTLED: [],
  CANCELLED: [],
}

export const ALL_STATUSES = [
  'DRAFT',
  'CONFIRMED',
  'IN_PREPARATION',
  'DELIVERED',
  'SETTLED',
  'CANCELLED',
]
