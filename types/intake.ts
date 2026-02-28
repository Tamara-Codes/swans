export type IntakeStatus =
  | 'Uploading'
  | 'Extracting'
  | 'Review'
  | 'Flagged'
  | 'Approved'
  | 'Sent'
  | 'Rejected'
  | 'Failed'

export type BodilyInjuryOption = 'Yes' | 'No' | 'Needs Review'

export interface Intake {
  id: string
  status: IntakeStatus
  clio_matter_id: string | null
  clio_flagged: boolean
  pdf_url: string | null
  client_name: string | null
  client_gender: string | null
  date_of_accident: string | null
  accident_location: string | null
  defendant_name: string | null
  client_plate_number: string | null
  number_of_injured: number | null
  injury_flag: boolean
  use_bodily_injury_paragraph: BodilyInjuryOption | null
  accident_description: string | null
  statute_of_limitations_date: string | null
  notes: string | null
  uploaded_at: string
  extracted_at: string | null
  approved_at: string | null
  sent_at: string | null
  created_at: string
  updated_at: string
}

export interface ExtractedPayload {
  intake_id: string
  clio_matter_id: string | null
  clio_flagged: boolean
  client_name: string | null
  client_gender: string | null
  date_of_accident: string | null
  accident_location: string | null
  defendant_name: string | null
  client_plate_number: string | null
  number_of_injured: number | null
  injury_flag: boolean
  use_bodily_injury_paragraph: BodilyInjuryOption | null
  accident_description: string | null
  statute_of_limitations_date: string | null
}
