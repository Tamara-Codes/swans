'use client'

import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/status-badge'
import { SpeedTimer } from '@/components/speed-timer'
import { formatDate } from '@/lib/utils'
import type { Intake, IntakeStatus } from '@/types/intake'

const TABS: { label: string; value: string; statuses: IntakeStatus[] | 'all' }[] = [
  { label: 'All', value: 'all', statuses: 'all' },
  { label: 'Review', value: 'review', statuses: ['Review', 'Flagged'] },
  { label: 'Approved', value: 'approved', statuses: ['Approved'] },
  { label: 'Sent', value: 'sent', statuses: ['Sent'] },
]

function filterIntakes(intakes: Intake[], statuses: IntakeStatus[] | 'all') {
  if (statuses === 'all') return intakes
  return intakes.filter((i) => statuses.includes(i.status))
}

function IntakeTable({ intakes }: { intakes: Intake[] }) {
  const router = useRouter()

  if (intakes.length === 0) {
    return (
      <div className="text-center py-16 text-sm text-slate-400">
        No intakes in this category yet.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-slate-100">
          <TableHead className="text-xs font-medium text-slate-500">Client</TableHead>
          <TableHead className="text-xs font-medium text-slate-500">Accident Date</TableHead>
          <TableHead className="text-xs font-medium text-slate-500">Location</TableHead>
          <TableHead className="text-xs font-medium text-slate-500">Status</TableHead>
          <TableHead className="text-xs font-medium text-slate-500">Speed-to-Lead</TableHead>
          <TableHead className="text-xs font-medium text-slate-500">Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {intakes.map((intake) => (
          <TableRow
            key={intake.id}
            className="cursor-pointer hover:bg-slate-50 border-slate-100 transition-colors"
            onClick={() => router.push(`/intakes/${intake.id}`)}
          >
            <TableCell className="font-medium text-slate-800 text-sm">
              {intake.client_name ?? <span className="text-slate-400 italic">Extracting…</span>}
            </TableCell>
            <TableCell className="text-sm text-slate-600">
              {formatDate(intake.date_of_accident)}
            </TableCell>
            <TableCell className="text-sm text-slate-600 max-w-[200px] truncate">
              {intake.accident_location ?? '—'}
            </TableCell>
            <TableCell>
              <StatusBadge status={intake.status} />
            </TableCell>
            <TableCell className="text-sm text-slate-500 font-mono">
              <SpeedTimer from={intake.uploaded_at} to={intake.sent_at} />
            </TableCell>
            <TableCell className="text-sm text-slate-400">
              {formatDate(intake.created_at)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function PipelineTable({ intakes }: { intakes: Intake[] }) {
  return (
    <Tabs defaultValue="all">
      <TabsList className="bg-slate-100 p-1 rounded-lg mb-4">
        {TABS.map((tab) => {
          const count =
            tab.statuses === 'all'
              ? intakes.length
              : intakes.filter((i) => (tab.statuses as IntakeStatus[]).includes(i.status)).length
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4"
            >
              {tab.label}
              <span className="ml-1.5 text-xs text-slate-400">{count}</span>
            </TabsTrigger>
          )
        })}
      </TabsList>

      {TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-0">
          <IntakeTable intakes={filterIntakes(intakes, tab.statuses)} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
