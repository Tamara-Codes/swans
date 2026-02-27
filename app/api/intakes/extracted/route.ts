import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { ExtractedPayload } from '@/types/intake'

// POST /api/intakes/extracted — called by Make.com after extraction
export async function POST(req: NextRequest) {
  try {
    const body: ExtractedPayload = await req.json()
    const { intake_id, ...fields } = body

    if (!intake_id) {
      return NextResponse.json({ error: 'intake_id required' }, { status: 400 })
    }

    const status = fields.clio_flagged ? 'Flagged' : 'Review'

    const { error } = await supabaseAdmin
      .from('intakes')
      .update({
        status,
        clio_matter_id: fields.clio_matter_id,
        clio_flagged: fields.clio_flagged ?? false,
        client_name: fields.client_name,
        client_gender: fields.client_gender,
        date_of_accident: fields.date_of_accident,
        accident_location: fields.accident_location,
        defendant_name: fields.defendant_name,
        client_plate_number: fields.client_plate_number,
        number_of_injured: fields.number_of_injured,
        injury_flag: fields.injury_flag ?? false,
        use_bodily_injury_paragraph: fields.use_bodily_injury_paragraph,
        accident_description: fields.accident_description,
        statute_of_limitations_date: fields.statute_of_limitations_date,
        extracted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', intake_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, status })
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
