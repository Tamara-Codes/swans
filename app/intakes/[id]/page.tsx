'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, XCircle, CheckCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/status-badge'
import { SpeedTimer } from '@/components/speed-timer'
import { EmailPreview } from '@/components/email-preview'
import { useToast } from '@/hooks/use-toast'
import { formatDate, getSchedulingLink } from '@/lib/utils'
import type { Intake } from '@/types/intake'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</Label>
      {children}
    </div>
  )
}

function ReadOnlyField({ value }: { value: string | null | undefined }) {
  return (
    <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 min-h-[36px]">
      {value ?? <span className="text-slate-400">—</span>}
    </div>
  )
}

export default function IntakeReviewPage({ params }: { params: { id: string } }) {
  const [intake, setIntake] = useState<Intake | null>(null)
  const [draft, setDraft] = useState<Partial<Intake>>({})
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const scheduling = getSchedulingLink()

  const fetchIntake = useCallback(async () => {
    const res = await fetch(`/api/intakes/${params.id}`)
    if (!res.ok) return
    const data: Intake = await res.json()
    setIntake(data)
    setDraft(data)
  }, [params.id])

  useEffect(() => {
    fetchIntake()
  }, [fetchIntake])

  // Auto-refresh every 5s while Extracting
  useEffect(() => {
    if (intake?.status !== 'Extracting' && intake?.status !== 'Uploading') return
    const interval = setInterval(fetchIntake, 5000)
    return () => clearInterval(interval)
  }, [intake?.status, fetchIntake])

  const isLocked = intake?.status === 'Approved' || intake?.status === 'Sent'

  const updateField = (key: keyof Intake, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const saveField = async (key: keyof Intake, value: unknown) => {
    if (isLocked) return
    setSaving(true)
    try {
      await fetch(`/api/intakes/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAction = async (action: 'approve' | 'reject' | 'reextract') => {
    setActionLoading(action)
    try {
      const url =
        action === 'reextract'
          ? `/api/intakes/${params.id}/reextract`
          : action === 'approve'
          ? `/api/intakes/${params.id}/approve`
          : `/api/intakes/${params.id}/reject`

      const res = await fetch(url, { method: 'POST' })
      if (!res.ok) throw new Error('Action failed')

      if (action === 'approve') {
        toast({ title: 'Approved & sent to Clio', description: 'The intake has been approved and queued.' })
        await fetchIntake()
      } else if (action === 'reject') {
        toast({ title: 'Intake rejected', description: 'Status updated to Rejected.' })
        router.push('/')
      } else {
        toast({ title: 'Re-extraction started', description: 'The PDF is being re-processed.' })
        await fetchIntake()
      }
    } catch {
      toast({ title: 'Action failed', description: 'Please try again.', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  if (!intake) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-slate-400">Loading intake…</div>
      </div>
    )
  }

  const isExtracting = intake.status === 'Extracting' || intake.status === 'Uploading'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Pipeline
          </button>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm font-medium text-slate-800">
            {intake.client_name ?? 'New Intake'}
          </span>
          <StatusBadge status={intake.status} />

          {/* Speed timer */}
          <div className="ml-auto flex items-center gap-4 text-xs text-slate-400">
            {intake.extracted_at && (
              <span>
                Extracted in{' '}
                <SpeedTimer
                  from={intake.uploaded_at}
                  to={intake.extracted_at}
                  className="font-mono text-slate-600"
                />
              </span>
            )}
            {isExtracting && (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Extracting…
              </span>
            )}
            {saving && <span className="text-slate-400">Saving…</span>}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* Left column — fields */}
        <div className="flex-1 space-y-6 min-w-0">

          {/* Seasonal badge */}
          <div className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-medium ${
            scheduling.label === 'In-Office Appointment'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-violet-50 text-violet-700 border border-violet-200'
          }`}>
            {scheduling.reason}
          </div>

          {/* Injury flag warning */}
          {intake.injury_flag && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertDescription className="text-orange-700 text-sm">
                <strong>AI flagged potential injuries</strong> not reflected in the official injured count.
                Please verify the bodily injury paragraph selection below.
              </AlertDescription>
            </Alert>
          )}

          {/* Clio flagged warning */}
          {intake.clio_flagged && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertDescription className="text-amber-700 text-sm">
                <strong>Multiple Clio matters matched this client name.</strong> Please manually enter the
                correct Clio Matter ID below.
              </AlertDescription>
            </Alert>
          )}

          {isExtracting && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Extracting data from PDF — this page will refresh automatically.
            </div>
          )}

          {/* Fields grid */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-5">
            <h3 className="text-sm font-semibold text-slate-700">Client & Accident Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Client Name">
                {isLocked ? (
                  <ReadOnlyField value={draft.client_name} />
                ) : (
                  <Input
                    value={draft.client_name ?? ''}
                    onChange={(e) => updateField('client_name', e.target.value)}
                    onBlur={() => saveField('client_name', draft.client_name)}
                    className="text-sm"
                    disabled={isExtracting}
                  />
                )}
              </Field>

              <Field label="Client Gender">
                {isLocked ? (
                  <ReadOnlyField value={draft.client_gender} />
                ) : (
                  <Input
                    value={draft.client_gender ?? ''}
                    onChange={(e) => updateField('client_gender', e.target.value)}
                    onBlur={() => saveField('client_gender', draft.client_gender)}
                    className="text-sm"
                    disabled={isExtracting}
                  />
                )}
              </Field>

              <Field label="Date of Accident">
                {isLocked ? (
                  <ReadOnlyField value={formatDate(draft.date_of_accident ?? null)} />
                ) : (
                  <Input
                    type="date"
                    value={draft.date_of_accident ?? ''}
                    onChange={(e) => updateField('date_of_accident', e.target.value)}
                    onBlur={() => saveField('date_of_accident', draft.date_of_accident)}
                    className="text-sm"
                    disabled={isExtracting}
                  />
                )}
              </Field>

              <Field label="Accident Location">
                {isLocked ? (
                  <ReadOnlyField value={draft.accident_location} />
                ) : (
                  <Input
                    value={draft.accident_location ?? ''}
                    onChange={(e) => updateField('accident_location', e.target.value)}
                    onBlur={() => saveField('accident_location', draft.accident_location)}
                    className="text-sm"
                    disabled={isExtracting}
                  />
                )}
              </Field>

              <Field label="Defendant Name">
                {isLocked ? (
                  <ReadOnlyField value={draft.defendant_name} />
                ) : (
                  <Input
                    value={draft.defendant_name ?? ''}
                    onChange={(e) => updateField('defendant_name', e.target.value)}
                    onBlur={() => saveField('defendant_name', draft.defendant_name)}
                    className="text-sm"
                    disabled={isExtracting}
                  />
                )}
              </Field>

              <Field label="Client Plate Number">
                {isLocked ? (
                  <ReadOnlyField value={draft.client_plate_number} />
                ) : (
                  <Input
                    value={draft.client_plate_number ?? ''}
                    onChange={(e) => updateField('client_plate_number', e.target.value)}
                    onBlur={() => saveField('client_plate_number', draft.client_plate_number)}
                    className="text-sm"
                    disabled={isExtracting}
                  />
                )}
              </Field>

              <Field label="Number of Injured">
                {isLocked ? (
                  <ReadOnlyField value={draft.number_of_injured?.toString()} />
                ) : (
                  <Input
                    type="number"
                    value={draft.number_of_injured ?? ''}
                    onChange={(e) => updateField('number_of_injured', e.target.value ? parseInt(e.target.value) : null)}
                    onBlur={() => saveField('number_of_injured', draft.number_of_injured)}
                    className="text-sm"
                    disabled={isExtracting}
                  />
                )}
              </Field>

              <Field label="Clio Matter ID">
                {isLocked ? (
                  <ReadOnlyField value={draft.clio_matter_id} />
                ) : (
                  <Input
                    value={draft.clio_matter_id ?? ''}
                    onChange={(e) => updateField('clio_matter_id', e.target.value)}
                    onBlur={() => saveField('clio_matter_id', draft.clio_matter_id)}
                    className={`text-sm font-mono ${intake.clio_flagged ? 'border-amber-400 focus:border-amber-500' : ''}`}
                    placeholder={intake.clio_flagged ? 'Enter correct Matter ID…' : ''}
                    disabled={isExtracting}
                  />
                )}
              </Field>
            </div>

            <Field label="Accident Description">
              {isLocked ? (
                <ReadOnlyField value={draft.accident_description} />
              ) : (
                <Textarea
                  value={draft.accident_description ?? ''}
                  onChange={(e) => updateField('accident_description', e.target.value)}
                  onBlur={() => saveField('accident_description', draft.accident_description)}
                  rows={4}
                  className="text-sm resize-none"
                  disabled={isExtracting}
                />
              )}
            </Field>

            <Field label="Bodily Injury Paragraph">
              {isLocked ? (
                <ReadOnlyField value={draft.use_bodily_injury_paragraph} />
              ) : (
                <Select
                  value={draft.use_bodily_injury_paragraph ?? ''}
                  onValueChange={(val) => {
                    updateField('use_bodily_injury_paragraph', val)
                    saveField('use_bodily_injury_paragraph', val)
                  }}
                  disabled={isExtracting}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes — include in email</SelectItem>
                    <SelectItem value="No">No — exclude</SelectItem>
                    <SelectItem value="Needs Review">Needs Review</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </Field>
          </div>

          {/* Read-only fields */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">System Fields</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Statute of Limitations">
                <ReadOnlyField value={formatDate(intake.statute_of_limitations_date ?? null)} />
              </Field>
              <Field label="Uploaded">
                <ReadOnlyField value={formatDate(intake.uploaded_at)} />
              </Field>
              {intake.extracted_at && (
                <Field label="Extracted">
                  <ReadOnlyField value={formatDate(intake.extracted_at)} />
                </Field>
              )}
              {intake.approved_at && (
                <Field label="Approved">
                  <ReadOnlyField value={formatDate(intake.approved_at)} />
                </Field>
              )}
              {intake.sent_at && (
                <Field label="Sent">
                  <ReadOnlyField value={formatDate(intake.sent_at)} />
                </Field>
              )}
              {intake.pdf_url && (
                <Field label="PDF">
                  <a
                    href={intake.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                  >
                    View PDF <ExternalLink className="h-3 w-3" />
                  </a>
                </Field>
              )}
            </div>
          </div>

          {/* Paralegal notes */}
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <Field label="Paralegal Notes">
              <Textarea
                value={draft.notes ?? ''}
                onChange={(e) => updateField('notes', e.target.value)}
                onBlur={() => saveField('notes', draft.notes)}
                rows={3}
                className="text-sm resize-none"
                placeholder="Add internal notes…"
                disabled={isLocked}
              />
            </Field>
          </div>

          {/* Action bar */}
          {!isLocked && !isExtracting && (
            <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-slate-700 gap-1.5"
                onClick={() => handleAction('reextract')}
                disabled={!!actionLoading}
              >
                <RefreshCw className="h-4 w-4" />
                Re-extract
              </Button>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                onClick={() => handleAction('reject')}
                disabled={!!actionLoading}
              >
                <XCircle className="h-4 w-4" />
                {actionLoading === 'reject' ? 'Rejecting…' : 'Reject'}
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                onClick={() => handleAction('approve')}
                disabled={!!actionLoading}
              >
                <CheckCircle className="h-4 w-4" />
                {actionLoading === 'approve' ? 'Approving…' : 'Approve & Send to Clio'}
              </Button>
            </div>
          )}

          {isLocked && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-700 text-center font-medium">
              ✓ This intake has been approved. All fields are locked.
            </div>
          )}
        </div>

        {/* Right column — email preview */}
        <div className="w-[380px] shrink-0 sticky top-20 self-start">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Email Preview</h3>
          <EmailPreview intake={draft} />
        </div>
      </div>
    </div>
  )
}
