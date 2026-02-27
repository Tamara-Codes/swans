'use client'

import { getSchedulingLink, getClientFirstName, formatDate } from '@/lib/utils'
import type { Intake } from '@/types/intake'
import { Calendar, Video, Paperclip } from 'lucide-react'

const BODILY_INJURY_PARAGRAPH =
  'Please be aware that based on the information provided, there may be bodily injuries that require medical attention. Our legal team will ensure that your personal injury claim fully accounts for all injuries sustained in this accident, and we will work diligently to secure appropriate compensation for your medical expenses, pain and suffering, and related damages.'

interface EmailPreviewProps {
  intake: Partial<Intake>
}

export function EmailPreview({ intake }: EmailPreviewProps) {
  const scheduling = getSchedulingLink()
  const firstName = getClientFirstName(intake.client_name ?? null)
  const accidentDate = formatDate(intake.date_of_accident ?? null)
  const description = intake.accident_description ?? ''
  const showBodilyInjury = intake.use_bodily_injury_paragraph === 'Yes'
  const clientName = intake.client_name ?? 'Client Name'

  return (
    <div className="h-full flex flex-col">
      {/* Scheduling indicator */}
      <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-md mb-4 font-medium ${
        scheduling.label === 'In-Office Appointment'
          ? 'bg-blue-50 text-blue-700'
          : 'bg-violet-50 text-violet-700'
      }`}>
        {scheduling.label === 'In-Office Appointment'
          ? <Calendar className="h-3.5 w-3.5" />
          : <Video className="h-3.5 w-3.5" />
        }
        <span>{scheduling.reason}</span>
      </div>

      {/* Email card */}
      <div className="border border-slate-200 rounded-lg overflow-hidden flex-1 bg-white text-sm">
        {/* Email header */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-2">
          <div className="flex gap-2">
            <span className="text-xs text-slate-400 w-12 pt-0.5 shrink-0">To</span>
            <span className="text-xs text-slate-600">talent.legal-engineer.hackathon.automation-email@swans.co</span>
          </div>
          <div className="flex gap-2">
            <span className="text-xs text-slate-400 w-12 shrink-0">Subject</span>
            <span className="text-xs font-medium text-slate-800">Retainer Agreement for Your Review – Richards & Law</span>
          </div>
        </div>

        {/* Email body */}
        <div className="p-5 space-y-4 text-slate-700 leading-relaxed text-xs">
          <p>Hello {firstName},</p>

          <p>
            I hope you&apos;re doing well. I wanted to follow up regarding your car accident
            {intake.date_of_accident ? ` on ${accidentDate}` : ''}. I know dealing with the aftermath of a crash
            is stressful, and I want to make sure we move things forward as smoothly as possible for you.
          </p>

          {description && (
            <p>
              From the details shared, I understand that {description}
            </p>
          )}

          {showBodilyInjury && (
            <p className="border-l-2 border-orange-200 pl-3 text-slate-600">
              {BODILY_INJURY_PARAGRAPH}
            </p>
          )}

          <p>
            Attached is your Retainer Agreement, which sets the foundation for our partnership. It details
            the specific legal services we will provide and the mutual responsibilities needed to move your
            claim forward effectively. Please take a moment to review it before we meet.
          </p>

          <p>
            When you&apos;re ready, you can book an appointment with us using this link:{' '}
            <a
              href={scheduling.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline break-all"
            >
              {scheduling.url}
            </a>
            . At that meeting, we&apos;ll go through the agreement in detail and discuss next steps.
          </p>

          <div className="pt-2">
            <p className="font-medium text-slate-800">Andrew Richards</p>
            <p className="text-slate-500">Richards & Law</p>
          </div>

          {/* Attachment indicator */}
          <div className="flex items-center gap-2 pt-1 text-slate-400 border-t border-slate-100">
            <Paperclip className="h-3.5 w-3.5" />
            <span className="text-xs">{clientName} [Retainer Agreement].pdf</span>
          </div>
        </div>
      </div>
    </div>
  )
}
