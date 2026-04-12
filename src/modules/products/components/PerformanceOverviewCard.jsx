import React, { useMemo } from 'react'
import { CCard, CCardBody, CCardHeader } from '@coreui/react'
import { CChartBar } from '@coreui/react-chartjs'

const money = (value) => `$${Number(value || 0).toFixed(2)}`

const PerformanceOverviewCard = ({ insights, marginValue }) => {
  const chartData = useMemo(() => {
    const labels = insights?.trend?.labels || []
    const ordersPerDay = insights?.trend?.ordersPerDay || []
    const revenuePerDay = insights?.trend?.revenuePerDay || []
    const marginPercentPerDay = insights?.trend?.marginPercentPerDay || []

    return {
      labels,
      datasets: [
        {
          type: 'bar',
          label: 'Orders',
          data: ordersPerDay,
          backgroundColor: 'rgba(13, 148, 136, 0.35)',
          borderRadius: 6,
          yAxisID: 'y',
        },
        {
          type: 'line',
          label: 'Net Revenue ($)',
          data: revenuePerDay,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14, 165, 233, 0.15)',
          tension: 0.35,
          fill: false,
          yAxisID: 'y1',
        },
        {
          type: 'line',
          label: 'Margin (%)',
          data: marginPercentPerDay,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.12)',
          borderDash: [6, 6],
          tension: 0.3,
          fill: false,
          yAxisID: 'y2',
        },
      ],
    }
  }, [insights])

  const chartOptions = useMemo(
    () => ({
      maintainAspectRatio: false,
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || ''
              if (label.includes('Revenue')) return ` ${label}: $${Number(context.parsed.y || 0).toFixed(2)}`
              if (label.includes('Margin')) return ` ${label}: ${Number(context.parsed.y || 0).toFixed(1)}%`
              return ` ${label}: ${context.parsed.y}`
            },
          },
        },
      },
      layout: {
        padding: {
          left: 12,
          right: 12,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Orders' },
          grid: { color: 'rgba(148, 163, 184, 0.12)' },
          afterFit: (scale) => {
            scale.width = 56
          },
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          title: { display: true, text: 'Revenue ($)' },
          grid: { drawOnChartArea: false },
          afterFit: (scale) => {
            scale.width = 56
          },
        },
        y2: {
          display: false,
          beginAtZero: true,
          position: 'right',
          suggestedMax: 100,
          title: { display: false, text: 'Margin %' },
          grid: { drawOnChartArea: false },
          ticks: { display: false, callback: (value) => `${value}%` },
        },
      },
    }),
    [],
  )

  return (
    <CCard className="h-100 shadow-sm border-0 d-flex">
      <CCardHeader className="pb-2">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
          <div>
            <strong>30-Day Performance Overview</strong>
            <div className="text-medium-emphasis small">
              Orders, net revenue, and margin trends over the last 30 days.
            </div>
          </div>
          <div className="d-flex flex-wrap gap-3">
            <div>
              <div className="text-medium-emphasis small">Total Orders</div>
              <div className="fw-semibold fs-6">{insights?.totalOrders ?? 0}</div>
            </div>
            <div>
              <div className="text-medium-emphasis small">Total Revenue</div>
              <div className="fw-semibold fs-6">{money(insights?.netRevenue ?? 0)}</div>
            </div>
            <div>
              <div className="text-medium-emphasis small">Margin</div>
              <div className="fw-semibold fs-6">{money(marginValue)}</div>
            </div>
          </div>
        </div>
      </CCardHeader>
      <CCardBody className="pt-2 d-flex align-items-center justify-content-center">
        <div style={{ height: 230, width: '90%', maxWidth: 860 }}>
          <CChartBar data={chartData} options={chartOptions} />
        </div>
      </CCardBody>
    </CCard>
  )
}

export default PerformanceOverviewCard