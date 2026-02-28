import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// PUT /api/intakes/[id] — paralegal edits fields
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { error } = await supabaseAdmin
      .from('intakes')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

// GET /api/intakes/[id] — single intake
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabaseAdmin
    .from('intakes')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
