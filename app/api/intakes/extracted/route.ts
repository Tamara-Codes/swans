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

    // Generate client-facing email description before saving
    let email_description: string | null = null
    const geminiKey = process.env.GEMINI_API_KEY
    console.log('[extracted] geminiKey present:', !!geminiKey)
    console.log('[extracted] accident_description:', fields.accident_description)
    if (fields.accident_description && geminiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Rewrite the accident description for a client email from their attorney. Rules: never use "Vehicle 1", "Vehicle 2", or the client's name. Always use "you"/"your vehicle" for the client and "the other driver"/"their vehicle" for the other party. If there is a dispute, mention it. Output only the rewritten text.\n\nExample input: Vehicle 1, driven by John Smith, was stopped at a red light when Vehicle 2 rear-ended Vehicle 1. Vehicle 2 claims Vehicle 1 reversed into them.\nExample output: You were stopped at a red light when the other driver rear-ended your vehicle. The other driver is claiming you reversed into them, which we will dispute.\n\nNow rewrite this:\n${fields.accident_description}`
                }]
              }]
            })
          }
        )
        const geminiData = await geminiRes.json()
        console.log('[extracted] gemini response:', JSON.stringify(geminiData))
        email_description = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null
        console.log('[extracted] email_description:', email_description)
      } catch (err) {
        console.error('[extracted] gemini error:', err)
      }
    }

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
        email_description,
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
