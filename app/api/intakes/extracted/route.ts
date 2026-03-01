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

    // Generate client-facing email description
    if (fields.accident_description) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Rewrite the following accident description in 2-3 sentences from the client's perspective for a warm attorney email. Use "you" and "your vehicle" instead of the client's name. If there is a disputed version of events, mention it briefly. Do not include any intro or explanation, just the rewritten text.

Raw description: ${fields.accident_description}`
                }]
              }]
            })
          }
        )
        const geminiData = await geminiRes.json()
        const emailDescription = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        if (emailDescription) {
          await supabaseAdmin
            .from('intakes')
            .update({ email_description: emailDescription })
            .eq('id', intake_id)
        }
      } catch {
        // Non-fatal — email preview will fall back to raw description
      }
    }

    return NextResponse.json({ success: true, status })
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
