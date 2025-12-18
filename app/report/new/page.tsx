'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MobileNav } from '@/components/layout/MobileNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/lib/supabase/client'
import { FRAUD_TYPES, BANKS, PROVINCES, MAX_FILE_SIZE, MAX_FILES_PER_REPORT } from '@/lib/constants'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Upload,
  X,
  Check,
  Store,
  AlertTriangle,
  ImageIcon,
  FileCheck,
} from 'lucide-react'

// Import checkbox component
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'

const steps = [
  { id: 1, title: 'ข้อมูลร้าน', icon: Store },
  { id: 2, title: 'รายละเอียดการโกง', icon: AlertTriangle },
  { id: 3, title: 'หลักฐาน', icon: ImageIcon },
  { id: 4, title: 'ยืนยัน', icon: FileCheck },
]

export default function NewReportPage() {
  const router = useRouter()
  const supabase = createClient()

  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [formData, setFormData] = useState({
    // Step 1
    shop_name: '',
    phone: '',
    facebook_url: '',
    facebook_page_name: '',
    line_id: '',
    province: '',
    area: '',
    // Step 2
    fraud_type: '',
    damage_amount: '',
    incident_date: '',
    description: '',
    has_police_report: false,
    police_report_number: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    // Step 4
    is_anonymous: false,
    agree_terms: false,
  })

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])

    // Validate file count
    if (files.length + selectedFiles.length > MAX_FILES_PER_REPORT) {
      toast.error(`สามารถอัปโหลดได้สูงสุด ${MAX_FILES_PER_REPORT} ไฟล์`)
      return
    }

    // Validate file size
    const validFiles = selectedFiles.filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`ไฟล์ ${file.name} มีขนาดใหญ่เกิน 5MB`)
        return false
      }
      return true
    })

    setFiles((prev) => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.shop_name.trim()) {
          toast.error('กรุณากรอกชื่อร้าน')
          return false
        }
        if (!formData.province) {
          toast.error('กรุณาเลือกจังหวัด')
          return false
        }
        return true
      case 2:
        if (!formData.fraud_type) {
          toast.error('กรุณาเลือกประเภทการโกง')
          return false
        }
        if (!formData.description.trim() || formData.description.length < 50) {
          toast.error('กรุณากรอกรายละเอียดอย่างน้อย 50 ตัวอักษร')
          return false
        }
        return true
      case 3:
        return true
      case 4:
        if (!formData.agree_terms) {
          toast.error('กรุณายอมรับเงื่อนไขการใช้งาน')
          return false
        }
        return true
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return

    setIsLoading(true)

    try {
      // Check authentication
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('กรุณาเข้าสู่ระบบก่อนรายงาน')
        router.push('/login?redirect=/report/new')
        return
      }

      // Upload files
      const evidenceUrls: string[] = []

      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

        const { error: uploadError, data } = await supabase.storage
          .from('evidence')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from('evidence').getPublicUrl(fileName)

        evidenceUrls.push(publicUrl)
      }

      // Create report
      const { error, data: report } = await supabase
        .from('scam_reports')
        .insert({
          shop_name: formData.shop_name,
          phone: formData.phone || null,
          facebook_url: formData.facebook_url || null,
          facebook_page_name: formData.facebook_page_name || null,
          line_id: formData.line_id || null,
          province: formData.province,
          area: formData.area || null,
          fraud_type: formData.fraud_type,
          damage_amount: parseInt(formData.damage_amount) || 0,
          incident_date: formData.incident_date || null,
          description: formData.description,
          has_police_report: formData.has_police_report,
          police_report_number: formData.police_report_number || null,
          bank_name: formData.bank_name || null,
          bank_account_number: formData.bank_account_number || null,
          bank_account_name: formData.bank_account_name || null,
          evidence_images: evidenceUrls,
          reporter_id: user.id,
          is_anonymous: formData.is_anonymous,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error

      toast.success('รายงานสำเร็จ!')
      router.push(`/report/${report.id}`)
    } catch (error) {
      console.error(error)
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pb-20 md:pb-0">
        <div className="container py-8 max-w-3xl">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับ
            </Link>
          </Button>

          <h1 className="text-2xl font-bold mb-6">รายงานร้านโกง</h1>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex flex-col items-center ${
                      index < steps.length - 1 ? 'flex-1' : ''
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-600 text-white'
                          : isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 hidden sm:block ${
                        isActive ? 'font-medium' : 'text-muted-foreground'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded ${
                        isCompleted ? 'bg-green-600' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Step Content */}
          <Card>
            <CardHeader>
              <CardTitle>
                {steps.find((s) => s.id === currentStep)?.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Shop Info */}
              {currentStep === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="shop_name">
                      ชื่อร้าน <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="shop_name"
                      value={formData.shop_name}
                      onChange={(e) => updateFormData('shop_name', e.target.value)}
                      placeholder="เช่น ร้านเช่ารถ ABC"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="province">
                        จังหวัด <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.province}
                        onValueChange={(value) => updateFormData('province', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกจังหวัด" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROVINCES.map((province) => (
                            <SelectItem key={province} value={province}>
                              {province}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="area">เขต/อำเภอ</Label>
                      <Input
                        id="area"
                        value={formData.area}
                        onChange={(e) => updateFormData('area', e.target.value)}
                        placeholder="เช่น บางนา"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">เบอร์โทร</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      placeholder="08X-XXX-XXXX"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="facebook_page_name">ชื่อ Facebook</Label>
                      <Input
                        id="facebook_page_name"
                        value={formData.facebook_page_name}
                        onChange={(e) =>
                          updateFormData('facebook_page_name', e.target.value)
                        }
                        placeholder="ชื่อเพจหรือโปรไฟล์"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="line_id">LINE ID</Label>
                      <Input
                        id="line_id"
                        value={formData.line_id}
                        onChange={(e) => updateFormData('line_id', e.target.value)}
                        placeholder="@lineID"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Fraud Details */}
              {currentStep === 2 && (
                <>
                  <div className="space-y-2">
                    <Label>
                      ประเภทการโกง <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {FRAUD_TYPES.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => updateFormData('fraud_type', type.id)}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            formData.fraud_type === type.id
                              ? 'border-primary bg-primary/10'
                              : 'border-muted hover:border-primary/50'
                          }`}
                        >
                          <span className="text-sm font-medium">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="damage_amount">จำนวนเงินที่เสียหาย (บาท)</Label>
                      <Input
                        id="damage_amount"
                        type="number"
                        min="0"
                        value={formData.damage_amount}
                        onChange={(e) =>
                          updateFormData('damage_amount', e.target.value)
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="incident_date">วันที่เกิดเหตุ</Label>
                      <Input
                        id="incident_date"
                        type="date"
                        value={formData.incident_date}
                        onChange={(e) =>
                          updateFormData('incident_date', e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      รายละเอียด <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateFormData('description', e.target.value)}
                      placeholder="อธิบายเหตุการณ์ที่เกิดขึ้นอย่างละเอียด (อย่างน้อย 50 ตัวอักษร)"
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.description.length}/50 ตัวอักษร
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has_police_report"
                      checked={formData.has_police_report}
                      onCheckedChange={(checked) =>
                        updateFormData('has_police_report', !!checked)
                      }
                    />
                    <Label htmlFor="has_police_report">ได้แจ้งความแล้ว</Label>
                  </div>

                  {formData.has_police_report && (
                    <div className="space-y-2">
                      <Label htmlFor="police_report_number">เลขที่แจ้งความ</Label>
                      <Input
                        id="police_report_number"
                        value={formData.police_report_number}
                        onChange={(e) =>
                          updateFormData('police_report_number', e.target.value)
                        }
                        placeholder="เลขที่แจ้งความ (ถ้ามี)"
                      />
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">บัญชีธนาคาร (ถ้ามี)</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bank_name">ธนาคาร</Label>
                        <Select
                          value={formData.bank_name}
                          onValueChange={(value) => updateFormData('bank_name', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกธนาคาร" />
                          </SelectTrigger>
                          <SelectContent>
                            {BANKS.map((bank) => (
                              <SelectItem key={bank.id} value={bank.name}>
                                {bank.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bank_account_number">เลขบัญชี</Label>
                          <Input
                            id="bank_account_number"
                            value={formData.bank_account_number}
                            onChange={(e) =>
                              updateFormData('bank_account_number', e.target.value)
                            }
                            placeholder="เลขบัญชี"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bank_account_name">ชื่อบัญชี</Label>
                          <Input
                            id="bank_account_name"
                            value={formData.bank_account_name}
                            onChange={(e) =>
                              updateFormData('bank_account_name', e.target.value)
                            }
                            placeholder="ชื่อเจ้าของบัญชี"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 3: Evidence */}
              {currentStep === 3 && (
                <>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">อัปโหลดหลักฐาน</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      สูงสุด {MAX_FILES_PER_REPORT} ไฟล์ ขนาดไม่เกิน 5MB ต่อไฟล์
                    </p>
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleFileChange}
                    />
                    <Button asChild variant="outline">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        เลือกไฟล์
                      </label>
                    </Button>
                  </div>

                  {files.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                      {files.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {file.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">หลักฐานที่แนะนำ:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• แชทการสนทนา</li>
                      <li>• สลิปการโอนเงิน</li>
                      <li>• รูปโปรไฟล์/เพจ Facebook</li>
                      <li>• หลักฐานการแจ้งความ</li>
                    </ul>
                  </div>
                </>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === 4 && (
                <>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                    <h4 className="font-medium">สรุปข้อมูล</h4>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ชื่อร้าน:</span>
                        <span className="font-medium">{formData.shop_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">จังหวัด:</span>
                        <span>{formData.province}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ประเภทการโกง:</span>
                        <Badge variant="outline">
                          {FRAUD_TYPES.find((t) => t.id === formData.fraud_type)
                            ?.label || '-'}
                        </Badge>
                      </div>
                      {formData.damage_amount && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ความเสียหาย:</span>
                          <span>฿{parseInt(formData.damage_amount).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">หลักฐาน:</span>
                        <span>{files.length} ไฟล์</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_anonymous"
                      checked={formData.is_anonymous}
                      onCheckedChange={(checked) =>
                        updateFormData('is_anonymous', !!checked)
                      }
                    />
                    <Label htmlFor="is_anonymous">
                      รายงานแบบไม่ระบุตัวตน
                    </Label>
                  </div>

                  <div className="border rounded-lg p-4 bg-amber-50 text-sm space-y-2">
                    <h4 className="font-medium text-amber-800">
                      ข้อกำหนดและเงื่อนไข
                    </h4>
                    <ul className="text-amber-700 space-y-1">
                      <li>• ข้อมูลที่ให้ต้องเป็นความจริงตามความรู้ของท่าน</li>
                      <li>• การให้ข้อมูลเท็จอาจมีความผิดทางกฎหมาย</li>
                      <li>• ข้อมูลจะถูกใช้เพื่อป้องกันการโกงเท่านั้น</li>
                      <li>• RentSafe ไม่รับผิดชอบต่อความถูกต้องของข้อมูล</li>
                    </ul>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agree_terms"
                      checked={formData.agree_terms}
                      onCheckedChange={(checked) =>
                        updateFormData('agree_terms', !!checked)
                      }
                    />
                    <Label htmlFor="agree_terms">
                      ข้าพเจ้ายอมรับข้อกำหนดและเงื่อนไข{' '}
                      <span className="text-red-500">*</span>
                    </Label>
                  </div>
                </>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  ก่อนหน้า
                </Button>

                {currentStep < 4 ? (
                  <Button type="button" onClick={nextStep}>
                    ถัดไป
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    ส่งรายงาน
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}
