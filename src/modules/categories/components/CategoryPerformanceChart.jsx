import React, { useMemo } from 'react'
import { CChartBar } from '@coreui/react-chartjs'

const CategoryPerformanceChart = ({ trend }) => {
  const chartData = useMemo(() => {
    const labels = trend?.labels || []
    const ordersPerDay = trend?.ordersPerDay || []
    const revenuePerDay = trend?.revenuePerDay || []
    const marginPercentPerDay = trend?.marginPercentPerDay || []

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
          backgroundColor: 'rgba(14, 165, 233, 0.18)',
          tension: 0.35,
          fill: false,
          yAxisID: 'y1',
        },
        {
          type: 'line',
          label: 'Margin (%)',
          data: marginPercentPerDay,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.16)',
          borderDash: [6, 6],
          tension: 0.3,
          fill: false,
          yAxisID: 'y2',
        },
      ],
    }
  }, [trend])

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
              if (label.includes('Revenue')) {
                return ` ${label}: $${Number(context.parsed.y || 0).toFixed(2)}`
              }
              if (label.includes('Margin')) {
                return ` ${label}: ${Number(context.parsed.y || 0).toFixed(1)}%`
              }
              return ` ${label}: ${context.parsed.y}`
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Orders' },
          grid: { color: 'rgba(148, 163, 184, 0.12)' },
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          title: { display: true, text: 'Revenue ($)' },
          grid: { drawOnChartArea: false },
        },
        y2: {
          display: false,
          beginAtZero: true,
          position: 'right',
          suggestedMax: 100,
          grid: { drawOnChartArea: false },
          ticks: { display: false, callback: (value) => `${value}%` },
        },
      },
    }),
    [],
  )

  return <CChartBar className="nx-dashboard-chart" height={170} data={chartData} options={chartOptions} />
}

export default CategoryPerformanceChart
