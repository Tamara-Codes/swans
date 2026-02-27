import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/intakes/[id]/reject
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from('intakes')
    .update({ status: 'Rejected', updated_at: now })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
