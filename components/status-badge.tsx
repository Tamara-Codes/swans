'use client'

import { Badge } from '@/components/ui/badge'
import type { IntakeStatus } from '@/types/intake'

const statusConfig: Record<IntakeStatus, { label: string; className: string }> = {
  Uploading: { label: 'Uploading', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  Extracting: { label: 'Extracting', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  Review: { label: 'Review', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  Flagged: { label: 'Flagged', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  Approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Sent: { label: 'Sent', className: 'bg-green-50 text-green-700 border-green-200' },
  Rejected: { label: 'Rejected', className: 'bg-red-50 text-red-600 border-red-200' },
  Failed: { label: 'Failed', className: 'bg-red-100 text-red-700 border-red-300' },
}

export function StatusBadge({ status }: { status: IntakeStatus }) {
  const config = statusConfig[status] ?? statusConfig.Review
  return (
    <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
      {config.label}
    </Badge>
  )
}
