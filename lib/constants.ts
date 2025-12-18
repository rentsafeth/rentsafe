// Site Configuration
export const SITE_CONFIG = {
  name: 'RentSafe',
  url: 'https://rentsafe.in.th',
  tagline: 'เช็คก่อนเช่า ปลอดภัยแน่นอน',
  description: 'ตรวจสอบความน่าเชื่อถือของร้านรถเช่าก่อนใช้บริการ ป้องกันการโกง ปลอดภัย มั่นใจ 100%',
  adminLineId: '@rentsafe',
  adminEmail: 'admin@rentsafe.in.th',
}

// Pagination
export const ITEMS_PER_PAGE = 10

// File Upload Limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const MAX_FILES_PER_REPORT = 10
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Fraud Types
export const FRAUD_TYPES = [
  { id: 'no_refund', label: 'ไม่คืนเงินมัดจำ', icon: 'Ban', color: 'red' },
  { id: 'fake_car', label: 'รถไม่ตรงปก', icon: 'CarFront', color: 'orange' },
  { id: 'scam', label: 'รับเงินแล้วหนี', icon: 'Banknote', color: 'purple' },
  { id: 'overcharge', label: 'เรียกเงินเพิ่ม', icon: 'HandCoins', color: 'amber' },
  { id: 'car_seized', label: 'หลอกเอารถคืน', icon: 'Car', color: 'blue' },
  { id: 'other', label: 'อื่นๆ', icon: 'MoreHorizontal', color: 'gray' },
] as const

export type FraudTypeId = typeof FRAUD_TYPES[number]['id']

// Report Status
export const REPORT_STATUS = {
  pending: { label: 'รอตรวจสอบ', color: 'amber', bgColor: 'bg-amber-100', textColor: 'text-amber-800' },
  verified: { label: 'ยืนยันแล้ว', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  rejected: { label: 'ปฏิเสธ', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
} as const

export type ReportStatus = keyof typeof REPORT_STATUS

// Contact Request Types
export const CONTACT_REQUEST_TYPES = [
  { id: 'correction', label: 'แก้ไขข้อมูล' },
  { id: 'removal', label: 'ขอลบรายงาน' },
  { id: 'other', label: 'อื่นๆ' },
] as const

// Thai Banks
export const BANKS = [
  { id: 'kbank', name: 'ธนาคารกสิกรไทย' },
  { id: 'scb', name: 'ธนาคารไทยพาณิชย์' },
  { id: 'bbl', name: 'ธนาคารกรุงเทพ' },
  { id: 'ktb', name: 'ธนาคารกรุงไทย' },
  { id: 'bay', name: 'ธนาคารกรุงศรี' },
  { id: 'ttb', name: 'ธนาคารทหารไทยธนชาต' },
  { id: 'gsb', name: 'ธนาคารออมสิน' },
  { id: 'other', name: 'อื่นๆ' },
] as const

// Thai Provinces (Popular first)
export const PROVINCES = [
  'กรุงเทพมหานคร',
  'เชียงใหม่',
  'ภูเก็ต',
  'ชลบุรี',
  'กระบี่',
  'สุราษฎร์ธานี',
  'เชียงราย',
  'ขอนแก่น',
  'นครราชสีมา',
  'สงขลา',
  'อุดรธานี',
  'พังงา',
  'ระยอง',
  'ประจวบคีรีขันธ์',
  'นครศรีธรรมราช',
  'เพชรบุรี',
  'หัวหิน',
  'พัทยา',
  'สมุทรปราการ',
  'นนทบุรี',
  'ปทุมธานี',
  'อยุธยา',
  'ลพบุรี',
  'สระบุรี',
  'นครปฐม',
  'กาญจนบุรี',
  'ราชบุรี',
  'สมุทรสาคร',
  'อุบลราชธานี',
  'ร้อยเอ็ด',
  'มหาสารคาม',
  'ศรีสะเกษ',
  'สุรินทร์',
  'บุรีรัมย์',
  'นครพนม',
  'สกลนคร',
  'หนองคาย',
  'เลย',
  'แม่ฮ่องสอน',
  'ลำปาง',
  'ลำพูน',
  'น่าน',
  'แพร่',
  'พะเยา',
  'อุตรดิตถ์',
  'สุโขทัย',
  'พิษณุโลก',
  'ตาก',
  'กำแพงเพชร',
  'พิจิตร',
  'เพชรบูรณ์',
  'นครสวรรค์',
  'อุทัยธานี',
  'ชัยนาท',
  'สิงห์บุรี',
  'อ่างทอง',
  'ตราด',
  'จันทบุรี',
  'ฉะเชิงเทรา',
  'ปราจีนบุรี',
  'นครนายก',
  'สระแก้ว',
  'ชุมพร',
  'ระนอง',
  'ตรัง',
  'สตูล',
  'พัทลุง',
  'ยะลา',
  'ปัตตานี',
  'นราธิวาส',
] as const

// Color Scheme
export const COLORS = {
  primary: '#8290ed',
  secondary: '#6b7ce5',
  dark: '#3a4490',
  light: '#b8c5f8',
  lightest: '#e8ecfd',
}
