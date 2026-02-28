import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/intakes/[id]/approve
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data: intake, error: fetchError } = await supabaseAdmin
    .from('intakes')
    .select('*')
    .eq('id', params.id)
    .single()

  if (fetchError || !intake) {
    return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
  }

  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from('intakes')
    .update({ status: 'Approved', approved_at: now, updated_at: now })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify n8n webhook with all fields for Clio sync
  const webhookUrl = process.env.N8N_APPROVE_WEBHOOK_URL
  if (webhookUrl) {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intake_id: params.id, ...intake, approved_at: now }),
    })
  }

  return NextResponse.json({ success: true })
}
