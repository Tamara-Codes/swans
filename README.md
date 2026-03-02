# Swans — Intake Pipeline Dashboard

Internal tool for managing auto accident intake forms. Paralegals upload PDFs, AI extracts the case data, and the dashboard handles review, approval, and syncing to Clio.

---

## How it works

1. **Upload** — Paralegal uploads an intake PDF through the dashboard
2. **Extract** — PDF URL is sent to Make.com, which extracts structured case data and posts it back to `/api/intakes/extracted`
3. **Review** — Paralegal reviews the extracted fields, makes corrections, and sees a live email preview
4. **Approve** — Approval triggers an n8n webhook that syncs the intake to Clio and sends the client email
5. **Sent** — Status is updated to Sent; record is locked

### Intake statuses

`Uploading` → `Extracting` → `Review` | `Flagged` → `Approved` → `Sent` | `Rejected`

- **Flagged** — Make.com matched multiple Clio matters for the client name; paralegal must manually enter the correct Matter ID
- **Rejected** — Intake was discarded

---

## AI features

- **Email description** — On extraction, Gemini rewrites the raw accident description into a client-facing email paragraph (first person, anonymized, empathetic tone)
- **Bodily injury paragraph** — If `number_of_injured >= 1`, a standard bodily injury paragraph is automatically included in the client email. Paralegals can override this per intake.
- **Injury flag** — Make.com sets `injury_flag` if it detects injury language in the PDF that isn't reflected in the official injured count. Shown as an orange warning on the review page.

---

## Tech stack

- **Next.js 14** (App Router) — frontend + API routes
- **Supabase** — Postgres database + PDF storage
- **n8n** — PDF extraction automation, Clio sync and email delivery on approval
- **Gemini 2.5 Flash** — Email description generation
- **shadcn/ui + Tailwind** — UI components


---

## Project structure

```
app/
  page.tsx                        # Dashboard (pipeline table + analytics)
  intakes/[id]/page.tsx           # Intake review page
  api/
    intakes/
      route.ts                    # GET all intakes, POST upload PDF
      extracted/route.ts          # POST from Make.com with extracted fields
      [id]/
        route.ts                  # GET/PUT single intake
        approve/route.ts          # POST approve → triggers n8n
        reject/route.ts           # POST reject
        reextract/route.ts        # POST re-send PDF to Make.com
        status/route.ts           # GET status polling

components/
  pipeline-table.tsx              # Main dashboard table
  email-preview.tsx               # Live email preview (right panel on review page)
  analytics-section.tsx           # KPI cards + charts
  upload-dialog.tsx               # PDF upload modal
  status-badge.tsx                # Colored status pill
  speed-timer.tsx                 # Live elapsed time display

lib/
  supabase.ts                     # Supabase client (admin + public)
  utils.ts                        # formatElapsed, formatDate, estimatedHoursSaved, etc.

types/
  intake.ts                       # Intake and ExtractedPayload types

supabase-schema.sql               # Database schema
```

---

## Database schema

Key fields on the `intakes` table:

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `status` | TEXT | Workflow status |
| `clio_matter_id` | TEXT | Linked Clio matter |
| `clio_flagged` | BOOLEAN | Multiple Clio matches detected |
| `pdf_url` | TEXT | Supabase Storage URL |
| `client_name` | TEXT | |
| `client_gender` | TEXT | |
| `date_of_accident` | DATE | |
| `accident_location` | TEXT | |
| `defendant_name` | TEXT | |
| `client_plate_number` | TEXT | |
| `number_of_injured` | INTEGER | Drives bodily injury paragraph |
| `injury_flag` | BOOLEAN | AI-detected injury language mismatch |
| `use_bodily_injury_paragraph` | TEXT | `Yes` / `No` / `Needs Review` |
| `accident_description` | TEXT | Raw description from PDF |
| `email_description` | TEXT | Gemini-rewritten client-facing version |
| `statute_of_limitations_date` | DATE | |
| `notes` | TEXT | Internal paralegal notes |
| `uploaded_at` | TIMESTAMPTZ | |
| `extracted_at` | TIMESTAMPTZ | |
| `approved_at` | TIMESTAMPTZ | |
| `sent_at` | TIMESTAMPTZ | |

---

## Environment variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

# Webhooks
N8N_WEBHOOK_1_URL=          # Called on PDF upload (triggers Make.com extraction)
N8N_APPROVE_WEBHOOK_URL=    # Called on approval (Clio sync + email)

# AI
GEMINI_API_KEY=             # Gemini 2.5 Flash for email description generation
```

---

## Local setup

```bash
npm install
cp .env.local.example .env.local
# fill in env vars
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Supabase setup

1. Create a Supabase project
2. Run `supabase-schema.sql` in the SQL editor
3. Create a storage bucket named `intakes` and set it to **Public**
