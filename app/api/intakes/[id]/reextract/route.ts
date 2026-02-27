import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/intakes/[id]/reextract
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data: intake, error: fetchError } = await supabaseAdmin
    .from('intakes')
    .select('pdf_url')
    .eq('id', params.id)
    .single()

  if (fetchError || !intake) {
    return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
  }

  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from('intakes')
    .update({
      status: 'Extracting',
      clio_matter_id: null,
      clio_flagged: false,
      client_name: null,
      client_gender: null,
      date_of_accident: null,
      accident_location: null,
      defendant_name: null,
      client_plate_number: null,
      number_of_injured: null,
      injury_flag: false,
      use_bodily_injury_paragraph: null,
      accident_description: null,
      statute_of_limitations_date: null,
      extracted_at: null,
      approved_at: null,
      updated_at: now,
    })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Re-send to Make.com webhook 1
  const webhookUrl = process.env.MAKE_WEBHOOK_1_URL
  if (webhookUrl) {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdf_url: intake.pdf_url, intake_id: params.id }),
    })
  }

  return NextResponse.json({ success: true })
}
