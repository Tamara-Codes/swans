-- Run this in Supabase SQL Editor

CREATE TABLE intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'Uploading',
  -- 'Uploading' | 'Extracting' | 'Review' | 'Flagged' | 'Approved' | 'Sent' | 'Rejected'
  clio_matter_id TEXT,
  clio_flagged BOOLEAN DEFAULT false,
  pdf_url TEXT,
  client_name TEXT,
  client_gender TEXT,
  date_of_accident DATE,
  accident_location TEXT,
  defendant_name TEXT,
  client_plate_number TEXT,
  number_of_injured INTEGER,
  injury_flag BOOLEAN DEFAULT false,
  use_bodily_injury_paragraph TEXT,
  -- 'Yes' | 'No' | 'Needs Review'
  accident_description TEXT,
  statute_of_limitations_date DATE,
  notes TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  extracted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Storage bucket for PDFs
-- Run this separately in Supabase Storage or via Dashboard:
-- Create a bucket named "intakes" and set it to Public
