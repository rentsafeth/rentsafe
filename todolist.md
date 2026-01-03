# 🚀 RentSafe - TODO List

## ✅ เสร็จแล้ว (2026-01-03)

1. ✅ แก้ TypeScript errors (admin/contact, BlacklistDetail, blacklist/[id]/page)
2. ✅ แก้ Invalid Date ใน notification panel
3. ✅ สร้าง `admin_notification_reads` table + แก้ API notification
4. ✅ เพิ่ม Emergency Action Card (1441, แจ้งความออนไลน์, คัดลอกข้อมูล)
5. ✅ แก้การค้นหา blacklist ให้รองรับ partial match (fon → Fon)
6. ✅ เพิ่ม Tutorial Spotlight สำหรับ Facebook links
7. ✅ แสดงคำเตือนตลอดเวลาสำหรับลิงก์ Facebook
8. ✅ เพิ่ม `scam_provinces` column ใน database (reports + blacklist_entries)

---

## 🔥 งานด่วน - Province & Internationalization

### 1️⃣ เพิ่ม Province Selector ในฟอร์ม Report
**ไฟล์:** `src/components/features/report/ReportForm.tsx`

**Tasks:**
- [ ] เพิ่ม `scam_provinces: z.string().array().optional()` ใน formSchema (บรรทัด 37-50)
- [ ] เพิ่ม field ใน defaultValues
- [ ] สร้าง Multi-select component สำหรับเลือกจังหวัด (optional, multiple)
- [ ] วาง field หลังบรรทัด 406 (หลัง id_card field)
- [ ] อัพเดท onSubmit function เพื่อส่ง `scam_provinces` ไปยัง API (บรรทัด 165-185)

**Component ที่ต้องสร้าง:**
```tsx
// Multi-select provinces component
<FormField
  control={form.control}
  name="scam_provinces"
  render={({ field }) => (
    <FormItem>
      <FormLabel>จังหวัดที่มิจฉาชีพแอบอ้าง (ถ้าทราบ)</FormLabel>
      <FormDescription>
        เลือกจังหวัดที่มิจฉาชีพอ้างว่าอยู่/ให้บริการ (เลือกได้หลายจังหวัด)
      </FormDescription>
      <MultiSelect
        options={ALL_PROVINCES.map(p => ({ label: p, value: p }))}
        selected={field.value || []}
        onChange={field.onChange}
        placeholder="เลือกจังหวัด (ไม่บังคับ)"
      />
      <FormMessage />
    </FormItem>
  )}
/>
```

**ต้อง import:**
```tsx
const ALL_PROVINCES = [
  'กรุงเทพมหานคร', 'กระบี่', 'กาญจนบุรี', ... // 76 จังหวัด
];
```

---

### 2️⃣ แก้ API Route - รับ scam_provinces
**ไฟล์:** `src/app/api/reports/route.ts`

**Tasks:**
- [ ] เพิ่ม `scam_provinces` ใน INSERT body (ประมาณบรรทัด 50-80)
- [ ] Validate array format

---

### 3️⃣ สร้าง Database Function - Aggregate Provinces
**รัน SQL นี้ใน Supabase SQL Editor:**

```sql
CREATE OR REPLACE FUNCTION aggregate_scam_provinces()
RETURNS TRIGGER AS $$
BEGIN
  -- Update blacklist_entries with unique provinces from all its reports
  UPDATE blacklist_entries
  SET scam_provinces = (
    SELECT ARRAY_AGG(DISTINCT province)
    FROM (
      SELECT UNNEST(scam_provinces) as province
      FROM reports
      WHERE blacklist_entry_id = NEW.blacklist_entry_id
      AND scam_provinces IS NOT NULL
      AND scam_provinces != '{}'
    ) subquery
  )
  WHERE id = NEW.blacklist_entry_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- สร้าง trigger
DROP TRIGGER IF EXISTS trigger_aggregate_provinces ON reports;
CREATE TRIGGER trigger_aggregate_provinces
AFTER INSERT OR UPDATE ON reports
FOR EACH ROW
WHEN (NEW.blacklist_entry_id IS NOT NULL)
EXECUTE FUNCTION aggregate_scam_provinces();
```

---

### 4️⃣ แสดงจังหวัดใน BlacklistDetail + แก้ภาษาอังกฤษ
**ไฟล์:** `src/components/features/blacklist/BlacklistDetail.tsx`

**Tasks:**
- [ ] เพิ่ม `locale` prop ใน interface Props
- [ ] เพิ่มการแสดงจังหวัดในส่วน Header Card (หลังบรรทัด 409)
- [ ] แปลภาษาทั้งหมด:
  - [ ] FacebookLink component (ระวัง, tutorial popup, คำเตือน)
  - [ ] Emergency Action Card (พบบัญชี, โทร 1441, แจ้งความ, คัดลอก)
  - [ ] Heart tooltips
  - [ ] Copy scammer details text
  - [ ] severity labels

**ตัวอย่าง Province Display:**
```tsx
{/* Scam Provinces */}
{entry.scam_provinces?.length > 0 && (
  <div className="bg-white/80 rounded-xl p-4 mt-4">
    <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
      <MapPin className="w-4 h-4" />
      {isThai ? 'จังหวัดที่มีรายงาน' : 'Reported Provinces'}
    </h4>
    <div className="flex flex-wrap gap-2">
      {entry.scam_provinces.map((province, i) => (
        <Badge key={i} variant="outline" className="bg-red-50 border-red-200 text-red-700">
          📍 {province}
        </Badge>
      ))}
    </div>
  </div>
)}
```

**i18n Helper (สร้างที่ต้นไฟล์):**
```tsx
const getLocalizedText = (isThai: boolean, th: string, en: string) => isThai ? th : en;
```

---

### 5️⃣ แก้ page.tsx ส่ง locale
**ไฟล์:** `src/app/[locale]/blacklist/[id]/page.tsx`

**Tasks:**
- [ ] เพิ่ม `locale={locale}` prop ให้ BlacklistDetail (บรรทัด 68)

---

## 📝 วิธีสั่งทำต่อ

### Option 1: ทำทีละงาน (แนะนำ)
```
ทำ Task 1: เพิ่ม Province Selector ในฟอร์ม Report
```

### Option 2: ทำหมดเลย
```
ทำงานใน todolist.md ให้เสร็จหมด เริ่มจาก Task 1-5
```

### Option 3: ทำเฉพาะ i18n
```
แก้ภาษาอังกฤษทั้งหมดใน BlacklistDetail.tsx ตาม Task 4
```

---

## 🎯 Priority Order (แนะนำ)

1. **Task 1** → เพิ่ม Province Selector (30 นาที)
2. **Task 2** → แก้ API รับ provinces (5 นาที)
3. **Task 3** → สร้าง DB Function (5 นาที)
4. **Task 5** → ส่ง locale prop (2 นาที)
5. **Task 4** → แปลภาษา + แสดงจังหวัด (45 นาที)

**รวม:** ~1.5 ชั่วโมง

---

## 📌 Notes

- ใช้ `ALL_PROVINCES` array จาก SearchResults.tsx (มีอยู่แล้ว)
- Province selector ต้อง optional (ไม่บังคับ)
- ต้อง support multiple selection
- i18n ต้องครอบคลุม EN + TH ทั้งหมด

---

**Last Updated:** 2026-01-03 21:24  
**Status:** 🟡 In Progress  
**Next Session:** ทำ Task 1-5
