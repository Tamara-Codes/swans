import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/intakes — all intakes
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('intakes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store' },
  })
}

// POST /api/intakes/upload — paralegal uploads PDF
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('pdf') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No PDF provided' }, { status: 400 })
    }

    // Create intake record first to get the ID
    const { data: intake, error: insertError } = await supabaseAdmin
      .from('intakes')
      .insert({ status: 'Uploading' })
      .select()
      .single()

    if (insertError || !intake) {
      return NextResponse.json({ error: insertError?.message }, { status: 500 })
    }

    // Upload PDF to Supabase Storage
    const fileName = `${intake.id}/${Date.now()}-${file.name}`
    const arrayBuffer = await file.arrayBuffer()
    const { error: storageError } = await supabaseAdmin.storage
      .from('intakes')
      .upload(fileName, arrayBuffer, { contentType: 'application/pdf' })

    if (storageError) {
      await supabaseAdmin.from('intakes').delete().eq('id', intake.id)
      return NextResponse.json({ error: storageError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('intakes')
      .getPublicUrl(fileName)

    // Update record with PDF URL and set status to Extracting
    await supabaseAdmin
      .from('intakes')
      .update({ pdf_url: publicUrl, status: 'Extracting' })
      .eq('id', intake.id)

    // Notify n8n webhook
    const webhookUrl = process.env.N8N_WEBHOOK_1_URL
    console.log('[intake] N8N_WEBHOOK_1_URL:', webhookUrl ?? 'NOT SET')
    if (webhookUrl) {
      const webhookRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_url: publicUrl, intake_id: intake.id }),
      })
      console.log('[intake] webhook response:', webhookRes.status)
    }

    return NextResponse.json({ intake_id: intake.id })
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
