import { FraudTypeId, ReportStatus } from '@/lib/constants'

// Database Types
export interface Profile {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface ScamReport {
  id: string
  shop_name: string
  phone: string | null
  facebook_url: string | null
  facebook_page_name: string | null
  line_id: string | null
  bank_name: string | null
  bank_account_number: string | null
  bank_account_name: string | null
  province: string
  area: string | null
  fraud_type: FraudTypeId
  damage_amount: number
  incident_date: string | null
  description: string
  evidence_images: string[]
  has_police_report: boolean
  police_report_number: string | null
  reporter_id: string
  is_anonymous: boolean
  status: ReportStatus
  verified_count: number
  admin_notes: string | null
  created_at: string
  updated_at: string
  // Joined fields
  reporter?: Profile
}

export interface Confirmation {
  id: string
  report_id: string
  user_id: string
  comment: string | null
  damage_amount: number | null
  created_at: string
  // Joined fields
  user?: Profile
}

export interface ContactRequest {
  id: string
  report_id: string
  requester_name: string
  requester_phone: string
  requester_email: string | null
  message: string
  request_type: 'correction' | 'removal' | 'other'
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected'
  admin_response: string | null
  created_at: string
  updated_at: string
  // Joined fields
  report?: ScamReport
}

// Form Types
export interface ReportFormData {
  // Step 1: Shop Info
  shop_name: string
  phone: string
  facebook_url: string
  facebook_page_name: string
  line_id: string
  province: string
  area: string
  // Step 2: Fraud Details
  fraud_type: FraudTypeId
  damage_amount: number
  incident_date: string
  description: string
  has_police_report: boolean
  police_report_number: string
  bank_name: string
  bank_account_number: string
  bank_account_name: string
  // Step 3: Evidence
  evidence_files: File[]
  // Step 4: Confirmation
  is_anonymous: boolean
  agree_terms: boolean
}

export interface ContactFormData {
  request_type: 'correction' | 'removal' | 'other'
  requester_name: string
  requester_phone: string
  requester_email: string
  message: string
}

export interface ConfirmationFormData {
  comment: string
  damage_amount: number
}

// API Response Types
export interface StatsData {
  total_reports: number
  verified_reports: number
  total_damage: number
  provinces_count: number
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  per_page: number
  total_pages: number
}
