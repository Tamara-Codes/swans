'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PipelineTable } from '@/components/pipeline-table'
import { AnalyticsSection } from '@/components/analytics-section'
import { UploadDialog } from '@/components/upload-dialog'
import { Separator } from '@/components/ui/separator'
import type { Intake } from '@/types/intake'

export default function DashboardPage() {
  const [intakes, setIntakes] = useState<Intake[]>([])
  const [uploadOpen, setUploadOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchIntakes = useCallback(async () => {
    try {
      const res = await fetch('/api/intakes', { cache: 'no-store' })
      if (res.ok) setIntakes(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchIntakes()
  }, [fetchIntakes])

  // Poll every 10s if any intake is still extracting
  useEffect(() => {
    const hasActive = intakes.some((i) =>
      i.status === 'Extracting' || i.status === 'Uploading'
    )
    if (!hasActive) return
    const interval = setInterval(fetchIntakes, 10000)
    return () => clearInterval(interval)
  }, [intakes, fetchIntakes])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <Scale className="h-5 w-5 text-slate-800" strokeWidth={1.5} />
            <span className="font-semibold text-slate-900 tracking-tight">Richards & Law</span>
          </div>
          <Separator orientation="vertical" className="h-4 mx-1" />
          <span className="text-sm text-slate-400">Intake Pipeline</span>
          <div className="ml-auto">
            <Button
              size="sm"
              className="bg-slate-900 hover:bg-slate-800 text-white gap-1.5"
              onClick={() => setUploadOpen(true)}
            >
              <Plus className="h-4 w-4" />
              New Intake
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Pipeline */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-base font-semibold text-slate-800">Intake Pipeline</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {intakes.length} total intake{intakes.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-sm text-slate-400">Loading…</div>
          ) : (
            <PipelineTable intakes={intakes} />
          )}
        </div>

        {/* Analytics */}
        {!loading && <AnalyticsSection intakes={intakes} />}
      </main>

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={fetchIntakes}
      />
    </div>
  )
}
