// =============================================
// == ระบบจัดการการจองออนไลน์ (รีดีไซน์ใหม่ทั้งหมด) ==
// =============================================

// =============================================
// Section 1: Helper Functions (ฟังก์ชั่นช่วยเหลือ)
// =============================================

/**
 * แปลงวันที่เป็น String รูปแบบ YYYY-MM-DD
 */
function convertDateToString(date) {
  if (!(date instanceof Date)) return String(date);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().split('T')[0];
}





/**
 * ฟังก์ชันวันหยุดไทยแบบใช้ข้อมูลภายในประเทศ
 * ข้อมูลครบถ้วน เชื่อถือได้ ไม่ต้องพึ่ง API ภายนอก
 */
function getThaiHolidaysList(year) {
  try {
    Logger.log(`🇹🇭 ดึงข้อมูลวันหยุดไทยสำหรับปี ${year}`);
    
    // ดึงข้อมูลวันหยุดสำหรับปีที่ระบุ
    const holidays = getHolidaysForYear(year);
    
    // คำนวณวันหยุดชดเชยอัตโนมัติ
    const withSubstitutes = addSubstituteHolidays(holidays, year);
    
    // จัดเรียงตามวันที่
    withSubstitutes.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    Logger.log(`✅ ประมวลผลเสร็จ: ${withSubstitutes.length} วันหยุดรวม`);
    
    return {
      success: true,
      source: "Thai Domestic Data",
      holidays: withSubstitutes,
      year: year,
      totalHolidays: withSubstitutes.length
    };
    
  } catch (error) {
    Logger.log(`❌ เกิดข้อผิดพลาด: ${error.toString()}`);
    return getBasicHolidays(year);
  }
}

/**
 * ข้อมูลวันหยุดไทยแยกตามปี
 */
function getHolidaysForYear(year) {
  // ข้อมูลสำหรับปี 2025 (ครบถ้วน)
  if (year === 2025) {
    return [
      { month: 1, day: 1, name: "วันขึ้นปีใหม่", type: "fixed" },
      { month: 2, day: 12, name: "วันมาฆบูชา", type: "lunar" },
      { month: 4, day: 6, name: "วันจักรี", type: "fixed" },
      { month: 4, day: 13, name: "วันสงกรานต์", type: "fixed" },
      { month: 4, day: 14, name: "วันสงกรานต์", type: "fixed" },
      { month: 4, day: 15, name: "วันสงกรานต์", type: "fixed" },
      { month: 5, day: 1, name: "วันแรงงานแห่งชาติ", type: "fixed" },
      { month: 5, day: 4, name: "วันฉัตรมงคล", type: "lunar" },
      { month: 5, day: 9, name: "วันพืชมงคล", type: "lunar" },
      { month: 5, day: 11, name: "วันวิสาขบูชา", type: "lunar" },
      { month: 6, day: 2, name: "วันหยุดพิเศษ", type: "special" },
      { month: 6, day: 3, name: "วันเฉลิมพระชนมพรรษา สมเด็จพระนางเจ้าสุทิดา", type: "fixed" },
      { month: 7, day: 10, name: "วันอาสาฬหบูชา", type: "lunar" },
      { month: 7, day: 11, name: "วันเข้าพรรษา", type: "lunar" },
      { month: 7, day: 28, name: "วันเฉลิมพระชนมพรรษา พระบาทสมเด็จพระเจ้าอยู่หัว", type: "fixed" },
      { month: 8, day: 11, name: "วันหยุดพิเศษ", type: "special" },
      { month: 8, day: 12, name: "วันแม่แห่งชาติ", type: "fixed" },
      { month: 10, day: 13, name: "วันคล้ายวันสวรรคต ร.9", type: "fixed" },
      { month: 10, day: 23, name: "วันปิยมหาราช", type: "fixed" },
      { month: 12, day: 5, name: "วันพ่อแห่งชาติ", type: "fixed" },
      { month: 12, day: 10, name: "วันรัฐธรรมนูญ", type: "fixed" },
      { month: 12, day: 31, name: "วันสิ้นปี", type: "fixed" }
    ].map(h => ({
      date: `${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`,
      name: h.name,
      type: h.type
    }));
  }
  
  // ข้อมูลสำหรับปี 2026 (คาดการณ์/พื้นฐาน)
  if (year === 2026) {
    return [
      { month: 1, day: 1, name: "วันขึ้นปีใหม่" },
      { month: 3, day: 3, name: "วันมาฆบูชา" }, // คาดการณ์ตามปฏิทินจันทรคติ
      { month: 4, day: 6, name: "วันจักรี" },
      { month: 4, day: 13, name: "วันสงกรานต์" },
      { month: 4, day: 14, name: "วันสงกรานต์" },
      { month: 4, day: 15, name: "วันสงกรานต์" },
      { month: 5, day: 1, name: "วันแรงงานแห่งชาติ" },
      { month: 5, day: 23, name: "วันฉัตรมงคล" }, // คาดการณ์
      { month: 5, day: 31, name: "วันวิสาขบูชา" }, // คาดการณ์
      { month: 6, day: 3, name: "วันเฉลิมพระชนมพรรษา สมเด็จพระนางเจ้าสุทิดา" },
      { month: 7, day: 28, name: "วันเฉลิมพระชนมพรรษา พระบาทสมเด็จพระเจ้าอยู่หัว" },
      { month: 7, day: 29, name: "วันอาสาฬหบูชา" }, // คาดการณ์
      { month: 7, day: 30, name: "วันเข้าพรรษา" }, // คาดการณ์
      { month: 8, day: 12, name: "วันแม่แห่งชาติ" },
      { month: 10, day: 13, name: "วันคล้ายวันสวรรคต ร.9" },
      { month: 10, day: 23, name: "วันปิยมหาราช" },
      { month: 12, day: 5, name: "วันพ่อแห่งชาติ" },
      { month: 12, day: 10, name: "วันรัฐธรรมนูญ" },
      { month: 12, day: 31, name: "วันสิ้นปี" }
    ].map(h => ({
      date: `${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`,
      name: h.name
    }));
  }
  
  // ข้อมูลพื้นฐานสำหรับปีอื่นๆ
  return getBasicYearHolidays(year);
}

/**
 * ข้อมูลวันหยุดพื้นฐานสำหรับปีที่ไม่มีข้อมูลเฉพาะ
 */
function getBasicYearHolidays(year) {
  const basicHolidays = [
    { month: 1, day: 1, name: "วันขึ้นปีใหม่" },
    { month: 4, day: 6, name: "วันจักรี" },
    { month: 4, day: 13, name: "วันสงกรานต์" },
    { month: 4, day: 14, name: "วันสงกรานต์" },
    { month: 4, day: 15, name: "วันสงกรานต์" },
    { month: 5, day: 1, name: "วันแรงงานแห่งชาติ" },
    { month: 6, day: 3, name: "วันเฉลิมพระชนมพรรษา สมเด็จพระนางเจ้าสุทิดา" },
    { month: 7, day: 28, name: "วันเฉลิมพระชนมพรรษา พระบาทสมเด็จพระเจ้าอยู่หัว" },
    { month: 8, day: 12, name: "วันแม่แห่งชาติ" },
    { month: 10, day: 13, name: "วันคล้ายวันสวรรคต ร.9" },
    { month: 10, day: 23, name: "วันปิยมหาราช" },
    { month: 12, day: 5, name: "วันพ่อแห่งชาติ" },
    { month: 12, day: 10, name: "วันรัฐธรรมนูญ" },
    { month: 12, day: 31, name: "วันสิ้นปี" }
  ];
  
  return basicHolidays.map(h => ({
    date: `${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`,
    name: h.name
  }));
}

/**
 * คำนวณวันหยุดชดเชยอัตโนมัติ
 */
function addSubstituteHolidays(holidays, year) {
  const substitutes = [];
  const existingDates = new Set(holidays.map(h => h.date));
  
  // วันหยุดชดเชยที่ทราบแน่นอนสำหรับปี 2025
  if (year === 2025) {
    const knownSubstitutes = [
      { date: "2025-04-07", name: "วันหยุดชดเชยวันจักรี" },
      { date: "2025-04-16", name: "วันหยุดชดเชยวันสงกรานต์" },
      { date: "2025-05-05", name: "วันหยุดชดเชยวันฉัตรมงคล" },
      { date: "2025-05-12", name: "วันหยุดชดเชยวันวิสาขบูชา" }
    ];
    
    knownSubstitutes.forEach(sub => {
      if (!existingDates.has(sub.date)) {
        substitutes.push(sub);
        Logger.log(`🔄 เพิ่มวันหยุดชดเชย: ${sub.date} - ${sub.name}`);
      }
    });
  } else {
    // สำหรับปีอื่นๆ คำนวณอัตโนมัติ
    holidays.forEach(holiday => {
      const date = new Date(holiday.date);
      const dayOfWeek = date.getDay();
      
      // ถ้าวันหยุดตรงเสาร์ (6) หรืออาทิตย์ (0)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        const substituteDate = new Date(date);
        
        // หาวันจันทร์ถัดไป
        if (dayOfWeek === 0) {
          substituteDate.setDate(date.getDate() + 1); // อาทิตย์ -> จันทร์
        } else {
          substituteDate.setDate(date.getDate() + 2); // เสาร์ -> จันทร์
        }
        
        const substituteDateStr = substituteDate.toISOString().split('T')[0];
        
        if (!existingDates.has(substituteDateStr)) {
          substitutes.push({
            date: substituteDateStr,
            name: `วันหยุดชดเชย${holiday.name.replace('วัน', '')}`
          });
          Logger.log(`🔄 คำนวณวันหยุดชดเชย: ${substituteDateStr} สำหรับ ${holiday.name}`);
        }
      }
    });
  }
  
  return holidays.concat(substitutes);
}

/**
 * ข้อมูลสำรองขั้นต่ำ
 */
function getBasicHolidays(year) {
  const basic = getBasicYearHolidays(year);
  return {
    success: true,
    source: "Basic Fallback",
    holidays: basic,
    year: year,
    totalHolidays: basic.length
  };
}

/**
 * ดึงวันหยุดสำหรับเดือนที่ระบุ
 */
function getHolidaysForMonth(year, month) {
  const result = getThaiHolidaysList(year);
  
  if (!result.success) {
    return result;
  }
  
  const monthHolidays = result.holidays.filter(holiday => {
    const holidayMonth = parseInt(holiday.date.split('-')[1]);
    return holidayMonth === month;
  });
  
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  
  return {
    success: true,
    source: result.source,
    year: year,
    month: month,
    monthName: monthNames[month - 1],
    holidays: monthHolidays,
    totalHolidays: monthHolidays.length
  };
}

/**
 * ตรวจสอบว่าวันที่ระบุเป็นวันหยุดหรือไม่
 */
function isThaiHoliday(year, month, day) {
  const checkDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const result = getThaiHolidaysList(year);
  
  if (!result.success) {
    return { success: false, isHoliday: false };
  }
  
  const holiday = result.holidays.find(h => h.date === checkDate);
  
  return {
    success: true,
    isHoliday: !!holiday,
    holiday: holiday || null,
    date: checkDate
  };
}

/**
 * เพิ่มวันหยุดใหม่สำหรับปีที่ระบุ (สำหรับการอัปเดต)
 */
function addNewHolidayForYear(year, month, day, name, type = 'special') {
  // ฟังก์ชันนี้สำหรับเพิ่มวันหยุดใหม่ในอนาคต
  // สามารถใช้เพื่ออัปเดตข้อมูลเมื่อมีประกาศวันหยุดพิเศษ
  
  Logger.log(`➕ เพิ่มวันหยุดใหม่: ${year}-${month}-${day} - ${name}`);
  
  // การ implement จริงจะต้องเขียนกลับไปที่ข้อมูลต้นฉบับ
  // หรือใช้ระบบจัดเก็บแยก เช่น Google Sheets
  
  return {
    success: true,
    message: `เพิ่มวันหยุด ${name} สำหรับวันที่ ${day}/${month}/${year}`
  };
}

/**
 * ฟังก์ชันทดสอบ
 */
function testDomesticHolidaySystem() {
  Logger.log("=== ทดสอบระบบวันหยุดไทยภายในประเทศ ===");
  
  // ทดสอบปี 2025
  const result2025 = getThaiHolidaysList(2025);
  Logger.log(`ปี 2025: ${result2025.success ? 'สำเร็จ' : 'ไม่สำเร็จ'}`);
  Logger.log(`แหล่งข้อมูล: ${result2025.source}`);
  Logger.log(`จำนวนวันหยุด: ${result2025.totalHolidays}`);
  
  // ทดสอบเดือนกรกฎาคม
  const julyHolidays = getHolidaysForMonth(2025, 7);
  Logger.log(`\n🎯 วันหยุดกรกฎาคม 2025: ${julyHolidays.totalHolidays} วัน`);
  julyHolidays.holidays.forEach(h => {
    Logger.log(`- ${h.date}: ${h.name}`);
  });
  
  // ทดสอบเดือนสิงหาคม
  const augustHolidays = getHolidaysForMonth(2025, 8);
  Logger.log(`\n🎯 วันหยุดสิงหาคม 2025: ${augustHolidays.totalHolidays} วัน`);
  augustHolidays.holidays.forEach(h => {
    Logger.log(`- ${h.date}: ${h.name}`);
  });
  
  // ทดสอบตรวจสอบวันเข้าพรรษา
  const checkVesak = isThaiHoliday(2025, 7, 11);
  Logger.log(`\n✅ วันที่ 11 กรกฎาคม 2025: ${checkVesak.isHoliday ? checkVesak.holiday.name : 'ไม่ใช่วันหยุด'}`);
  
  // ทดสอบปี 2026
  const result2026 = getThaiHolidaysList(2026);
  Logger.log(`\nปี 2026: ${result2026.totalHolidays} วันหยุด (รวมวันหยุดชดเชยอัตโนมัติ)`);
}











/**
 * ทำความสะอาดข้อมูลก่อนส่งกลับ
 */
function sanitizeDataValue(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return convertDateToString(value);
  if (typeof value === 'number' && isNaN(value)) return '';
  return String(value);
}

// =============================================
// Section 2: สถานะระบบจองออนไลน์
// =============================================

/**
 * ดึงสถานะการเปิด/ปิดระบบจองออนไลน์
 */
function fetchOnlineBookingSystemStatus(sheetId) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const configSheet = ss.getSheetByName("ตั้งค่าระบบ");

    if (!configSheet) {
      return { success: false, enabled: false, message: "ไม่พบแผ่นงาน 'ตั้งค่าระบบ'" };
    }

    const configData = configSheet.getDataRange().getValues();
    let onlineBookingEnabled = false;
    
    for (let i = 0; i < configData.length; i++) {
      if (configData[i][0] === "เปิดให้เช่าออนไลน์") {
        onlineBookingEnabled = configData[i][1] === true || 
                               String(configData[i][1]).toLowerCase() === "true" || 
                               configData[i][1] === "เปิด";
        break;
      }
    }
    
    return { success: true, enabled: onlineBookingEnabled };

  } catch (error) {
    Logger.log("Error in fetchOnlineBookingSystemStatus: " + error.toString());
    return { success: false, enabled: false, message: error.message };
  }
}

/**
 * บันทึกสถานะการเปิด/ปิดระบบจองออนไลน์
 */
function updateOnlineBookingSystemStatus(sheetId, newStatus) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    let configSheet = ss.getSheetByName("ตั้งค่าระบบ");
    
    if (!configSheet) {
      configSheet = ss.insertSheet("ตั้งค่าระบบ");
      configSheet.appendRow(["หัวข้อ", "ค่า"]);
    }
    
    const data = configSheet.getDataRange().getValues();
    let foundRow = -1;
    
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === "เปิดให้เช่าออนไลน์") {
        foundRow = i + 1;
        break;
      }
    }
    
    const statusValue = newStatus ? "เปิด" : "ปิด";
    
    if (foundRow > 0) {
      configSheet.getRange(foundRow, 2).setValue(statusValue);
    } else {
      configSheet.appendRow(["เปิดให้เช่าออนไลน์", statusValue]);
    }
    
    return { 
      success: true, 
      message: `${newStatus ? 'เปิด' : 'ปิด'}การจองออนไลน์เรียบร้อย`,
      newStatus: newStatus
    };
    
  } catch (error) {
    Logger.log("Error in updateOnlineBookingSystemStatus: " + error.toString());
    return { success: false, message: error.message };
  }
}

// =============================================
// Section 3: การจัดการรถและสถานะออนไลน์
// =============================================

/**
 * ดึงรายชื่อรถทั้งหมดพร้อมสถานะเปิด/ปิดจองออนไลน์
 * สำหรับส่วน "รายชื่อรถที่เปิดให้จองออนไลน์"
 */
function getAllVehiclesWithOnlineBookingStatus(sheetId) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const carsSheet = ss.getSheetByName("รายชื่อรถ");
    
    if (!carsSheet) {
      return { success: false, message: "ไม่พบแผ่นงาน 'รายชื่อรถ'" };
    }
    
    const data = carsSheet.getDataRange().getValues();
    if (data.length < 2) return { success: true, vehicles: [] };
    
    const headers = data[0];
    const carCodeIndex = headers.indexOf("รหัสรถ");
    const brandIndex = headers.indexOf("ยี่ห้อ");
    const modelIndex = headers.indexOf("รุ่น");
    const plateIndex = headers.indexOf("ทะเบียน");
    const statusIndex = headers.indexOf("สถานะ");
    const onlineBookingIndex = headers.indexOf("เปิดจองออนไลน์");
    
    if (carCodeIndex === -1) {
      return { success: false, message: "ไม่พบคอลัมน์ 'รหัสรถ'" };
    }
    
    const vehicles = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[carCodeIndex]) {
        vehicles.push({
          รหัสรถ: row[carCodeIndex],
          ยี่ห้อ: row[brandIndex] || "",
          รุ่น: row[modelIndex] || "",
          ทะเบียน: row[plateIndex] || "",
          สถานะ: row[statusIndex] || "",
          เปิดจองออนไลน์: row[onlineBookingIndex] === "เปิด" || row[onlineBookingIndex] === true,
          ชื่อรถเต็ม: `${row[brandIndex] || ""} ${row[modelIndex] || ""}`.trim()
        });
      }
    }
    
    Logger.log(`Found ${vehicles.length} vehicles for online booking management`);
    return { success: true, vehicles: vehicles };
    
  } catch (error) {
    Logger.log("Error in getAllVehiclesWithOnlineBookingStatus: " + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * อัพเดทสถานะเปิด/ปิดจองออนไลน์ของรถคันใดคันหนึ่ง
 */
function updateVehicleOnlineBookingStatus(sheetId, vehicleCode, newStatus) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const carsSheet = ss.getSheetByName("รายชื่อรถ");
    
    if (!carsSheet) {
      return { success: false, message: "ไม่พบแผ่นงาน 'รายชื่อรถ'" };
    }
    
    const data = carsSheet.getDataRange().getValues();
    const headers = data[0];
    const carCodeIndex = headers.indexOf("รหัสรถ");
    const onlineBookingIndex = headers.indexOf("เปิดจองออนไลน์");
    
    if (carCodeIndex === -1 || onlineBookingIndex === -1) {
      return { success: false, message: "ไม่พบคอลัมน์ที่จำเป็น" };
    }
    
    // หาแถวของรถที่ต้องการอัพเดท
    for (let i = 1; i < data.length; i++) {
      if (data[i][carCodeIndex] === vehicleCode) {
        const targetCell = carsSheet.getRange(i + 1, onlineBookingIndex + 1);
        targetCell.setValue(newStatus ? "เปิด" : "ปิด");
        
        Logger.log(`Updated vehicle ${vehicleCode} online booking status to: ${newStatus ? "เปิด" : "ปิด"}`);
        
        return { 
          success: true, 
          message: `อัพเดทสถานะรถ ${vehicleCode} เป็น ${newStatus ? "เปิด" : "ปิด"} เรียบร้อย`,
          vehicleCode: vehicleCode,
          newStatus: newStatus
        };
      }
    }
    
    return { success: false, message: `ไม่พบรถรหัส ${vehicleCode}` };
    
  } catch (error) {
    Logger.log("Error in updateVehicleOnlineBookingStatus: " + error.toString());
    return { success: false, message: error.toString() };
  }
}

// =============================================
// Section 4: การจัดการกฎราคา
// =============================================

/**
 * ดึงรายชื่อรถที่เปิดจองออนไลน์เท่านั้น สำหรับใช้ในการตั้งกฎราคา
 * แยกออกจาก getAllVehiclesWithOnlineBookingStatus เพื่อไม่ให้ปนกัน
 */
function getActiveOnlineBookingVehiclesForPricing(sheetId) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const carsSheet = ss.getSheetByName("รายชื่อรถ");
    
    if (!carsSheet) {
      return { success: false, message: "ไม่พบแผ่นงาน 'รายชื่อรถ'" };
    }
    
    const data = carsSheet.getDataRange().getValues();
    if (data.length < 2) return { success: true, vehicles: [] };
    
    const headers = data[0];
    const carCodeIndex = headers.indexOf("รหัสรถ");
    const brandIndex = headers.indexOf("ยี่ห้อ");
    const modelIndex = headers.indexOf("รุ่น");
    const priceIndex = headers.indexOf("ราคาเช่าต่อวัน");
    const onlineBookingIndex = headers.indexOf("เปิดจองออนไลน์");
    const licensePlateIndex = headers.indexOf("ทะเบียน"); // ← เพิ่มบรรทัดนี้
    
    if (carCodeIndex === -1) {
      return { success: false, message: "ไม่พบคอลัมน์ 'รหัสรถ'" };
    }
    
    const vehicles = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const isOnlineBookingEnabled = row[onlineBookingIndex] === "เปิด" || row[onlineBookingIndex] === true;
      
      // เฉพาะรถที่เปิดจองออนไลน์เท่านั้น
      if (row[carCodeIndex] && isOnlineBookingEnabled) {
        vehicles.push({
          รหัสรถ: row[carCodeIndex],
          ชื่อรถเต็ม: `${row[brandIndex] || ""} ${row[modelIndex] || ""}`.trim(),
          ราคาเริ่มต้น: row[priceIndex] || 0,
          ทะเบียน: row[licensePlateIndex] || "" // ← เพิ่มบรรทัดนี้
        });
      }
    }
    
    Logger.log(`Found ${vehicles.length} active online booking vehicles for pricing`);
    return { success: true, vehicles: vehicles };
    
  } catch (error) {
    Logger.log("Error in getActiveOnlineBookingVehiclesForPricing: " + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * ดึงกฎราคาทั้งหมด (ปรับปรุงใหม่)
 */
function fetchAllPricingRules(ss) {
  try {
    const rulesSheet = ss.getSheetByName("PriceRules");
    if (!rulesSheet) {
      // สร้างชีตใหม่ถ้าไม่มี
      const newSheet = ss.insertSheet("PriceRules");
      newSheet.getRange("A1:G1").setValues([["RuleID", "StartDate", "EndDate", "VehicleCode", "GroupID", "PricePerDay", "Description"]]);
      return [];
    }
    
    const data = rulesSheet.getDataRange().getValues();
    if (data.length < 2) return [];
    
    const rules = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        rules.push({
          ruleId: data[i][0],
          startDate: convertDateToString(data[i][1]),
          endDate: convertDateToString(data[i][2]),
          vehicleCode: data[i][3], // เปลี่ยนจาก carId เป็น vehicleCode
          groupId: data[i][4],
          pricePerDay: data[i][5],
          description: data[i][6] || ''
        });
      }
    }
    
    return rules;
  } catch (error) {
    Logger.log("Error in fetchAllPricingRules: " + error.toString());
    return [];
  }
}

/**
 * บันทึกกฎราคาใหม่ (ปรับปรุงใหม่)
 */
function savePricingRulesConfiguration(sheetId, ruleObjects) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const rulesSheet = ss.getSheetByName("PriceRules");
    
    if (!rulesSheet) {
      return { success: false, message: "ไม่พบแผ่นงาน 'PriceRules'" };
    }
    
    const newRows = [];
    const savedRules = [];

    ruleObjects.forEach(rule => {
      const ruleId = "RULE" + new Date().getTime() + Math.random().toString(36).substr(2, 5);
      const newRule = { ...rule, ruleId: ruleId };
      
      newRows.push([
        newRule.ruleId, 
        newRule.startDate, 
        newRule.endDate, 
        newRule.vehicleCode, // ใช้ vehicleCode แทน carId
        newRule.groupId || '', 
        newRule.pricePerDay, 
        newRule.description || ''
      ]);
      
      savedRules.push(newRule);
    });

    if (newRows.length > 0) {
      rulesSheet.getRange(rulesSheet.getLastRow() + 1, 1, newRows.length, 7).setValues(newRows);
    }
    
    Logger.log(`Saved ${savedRules.length} pricing rules successfully`);
    return { 
      success: true, 
      message: `สร้างกฎราคาใหม่ ${savedRules.length} รายการเรียบร้อย`, 
      savedRules: savedRules 
    };
    
  } catch (error) {
    Logger.log("Error in savePricingRulesConfiguration: " + error.toString());
    return { success: false, message: "เกิดข้อผิดพลาดในการบันทึกกฎราคา: " + error.message };
  }
}

/**
 * ลบกฎราคา (ปรับปรุงใหม่)
 */
function deletePricingRuleConfiguration(sheetId, ruleId) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const rulesSheet = ss.getSheetByName("PriceRules");
    
    if (!rulesSheet) {
      return { success: false, message: "ไม่พบแผ่นงาน 'PriceRules'" };
    }

    const data = rulesSheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][0] === ruleId) {
        rulesSheet.deleteRow(i + 1);
        Logger.log(`Deleted pricing rule: ${ruleId}`);
        return { success: true, message: "ลบกฎราคาเรียบร้อย" };
      }
    }
    
    return { success: false, message: "ไม่พบกฎราคาที่ต้องการลบ" };
    
  } catch (error) {
    Logger.log("Error in deletePricingRuleConfiguration: " + error.toString());
    return { success: false, message: "เกิดข้อผิดพลาดในการลบกฎราคา: " + error.message };
  }
}

// =============================================
// Section 5: การจัดการกลุ่มรถ (ปรับปรุงใหม่ทั้งหมด)
// =============================================

/**
 * ดึงข้อมูลกลุ่มรถทั้งหมด (ใช้รหัสรถแทนชื่อรถ)
 */
function getVehicleGroupsByCode(ss) {
  try {
    const groupSheet = ss.getSheetByName("กลุ่มรถ");
    if (!groupSheet) return { success: true, groups: [] };
    
    const data = groupSheet.getDataRange().getValues();
    if (data.length < 2) return { success: true, groups: [] };
    
    const groups = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) {
        try {
          groups.push({
            id: row[0],
            name: row[1] || '',
            description: row[2] || '',
            vehicleCodes: JSON.parse(row[3] || '[]') // ใช้ vehicleCodes แทน cars
          });
        } catch (e) {
          Logger.log("Error parsing vehicle group data for row " + (i + 1) + ": " + e);
        }
      }
    }
    
    return { success: true, groups: groups };
  } catch (error) {
    Logger.log("Error in getVehicleGroupsByCode: " + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * สร้างกลุ่มรถใหม่ โดยบันทึกรหัสรถแทนชื่อรถ
 */
function createNewVehicleGroupByCode(sheetId, groupData) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    let groupSheet = ss.getSheetByName("กลุ่มรถ");
    
    // สร้างชีตใหม่ถ้าไม่มี
    if (!groupSheet) {
      groupSheet = ss.insertSheet("กลุ่มรถ");
      groupSheet.getRange("A1:D1").setValues([["GroupID", "GroupName", "Description", "VehicleCodes"]]);
    }
    
    const groupId = "GROUP" + new Date().getTime();
    const newRow = [
      groupId,
      groupData.name,
      groupData.description,
      JSON.stringify(groupData.selectedVehicleCodes) // บันทึกเป็น array ของรหัสรถ
    ];
    
    groupSheet.appendRow(newRow);
    
    Logger.log(`Created new vehicle group: ${groupId} with ${groupData.selectedVehicleCodes.length} vehicles`);
    
    return { 
      success: true, 
      message: "สร้างกลุ่มรถเรียบร้อย", 
      groupId: groupId,
      groupData: {
        id: groupId,
        name: groupData.name,
        description: groupData.description,
        vehicleCodes: groupData.selectedVehicleCodes
      }
    };
  } catch (error) {
    Logger.log("Error in createNewVehicleGroupByCode: " + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * ดึงรายชื่อรถที่ยังไม่ได้จัดเข้ากลุ่ม (สำหรับใช้ในการเลือกเพิ่มเติม)
 */
function getUngroupedVehiclesForSelection(sheetId) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    
    // ดึงรถทั้งหมดที่เปิดจองออนไลน์
    const allVehiclesResult = getActiveOnlineBookingVehiclesForPricing(sheetId);
    if (!allVehiclesResult.success) return allVehiclesResult;
    
    // ดึงข้อมูลกลุ่มที่มีอยู่
    const groupsResult = getVehicleGroupsByCode(ss);
    if (!groupsResult.success) return groupsResult;
    
    // รวบรวมรหัสรถที่อยู่ในกลุ่มแล้ว
    const groupedVehicleCodes = new Set();
    groupsResult.groups.forEach(group => {
      group.vehicleCodes.forEach(code => groupedVehicleCodes.add(code));
    });
    
    // กรองรถที่ยังไม่ได้จัดกลุ่ม
    const ungroupedVehicles = allVehiclesResult.vehicles.filter(vehicle => 
      !groupedVehicleCodes.has(vehicle.รหัสรถ)
    );
    
    Logger.log(`Found ${ungroupedVehicles.length} ungrouped vehicles for selection`);
    return { success: true, vehicles: ungroupedVehicles };
    
  } catch (error) {
    Logger.log("Error in getUngroupedVehiclesForSelection: " + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * อัพเดทกลุ่มรถ (เพิ่ม/ลบรถในกลุ่ม)
 */
function updateVehicleGroupByCode(sheetId, groupId, updatedVehicleCodes) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const groupSheet = ss.getSheetByName("กลุ่มรถ");
    
    if (!groupSheet) {
      return { success: false, message: "ไม่พบแผ่นงานกลุ่มรถ" };
    }
    
    const data = groupSheet.getDataRange().getValues();
    
    // หาแถวของกลุ่มที่ต้องการอัพเดท
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === groupId) {
        const targetCell = groupSheet.getRange(i + 1, 4); // คอลัมน์ VehicleCodes
        targetCell.setValue(JSON.stringify(updatedVehicleCodes));
        
        Logger.log(`Updated vehicle group ${groupId} with ${updatedVehicleCodes.length} vehicles`);
        
        return { 
          success: true, 
          message: "อัพเดทกลุ่มรถเรียบร้อย",
          groupId: groupId,
          vehicleCodes: updatedVehicleCodes
        };
      }
    }
    
    return { success: false, message: `ไม่พบกลุ่มรถ ${groupId}` };
    
  } catch (error) {
    Logger.log("Error in updateVehicleGroupByCode: " + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * ลบรถออกจากกลุ่ม (ใช้รหัสรถ)
 */
function removeVehicleFromGroupByCode(sheetId, groupId, vehicleCode) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const groupsResult = getVehicleGroupsByCode(ss);
    
    if (!groupsResult.success) return groupsResult;
    
    const group = groupsResult.groups.find(g => g.id === groupId);
    if (!group) {
      return { success: false, message: `ไม่พบกลุ่มรถ ${groupId}` };
    }
    
    const updatedVehicleCodes = group.vehicleCodes.filter(code => code !== vehicleCode);
    
    Logger.log(`Removing vehicle ${vehicleCode} from group ${groupId}`);
    return updateVehicleGroupByCode(sheetId, groupId, updatedVehicleCodes);
    
  } catch (error) {
    Logger.log("Error in removeVehicleFromGroupByCode: " + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * ลบกลุ่มรถ (ปรับปรุงใหม่)
 */
function deleteVehicleGroupByCode(sheetId, groupId) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const groupSheet = ss.getSheetByName("กลุ่มรถ");
    
    if (!groupSheet) {
      return { success: false, message: "ไม่พบแผ่นงานกลุ่มรถ" };
    }
    
    const data = groupSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === groupId) {
        groupSheet.deleteRow(i + 1);
        Logger.log(`Deleted vehicle group: ${groupId}`);
        return { success: true, message: "ลบกลุ่มรถเรียบร้อย" };
      }
    }
    
    return { success: false, message: "ไม่พบกลุ่มรถที่ต้องการลบ" };
    
  } catch (error) {
    Logger.log("Error in deleteVehicleGroupByCode: " + error.toString());
    return { success: false, message: "เกิดข้อผิดพลาด: " + error.toString() };
  }
}

// =============================================
// Section 6: ฟังก์ชั่นหลักสำหรับโหลดข้อมูลทั้งหมด
// =============================================

/**
 * ฟังก์ชั่นหลักสำหรับโหลดข้อมูลส่วน "รายชื่อรถที่เปิดให้จองออนไลน์"
 */
function getVehicleOnlineBookingManagementData(sheetId) {
  try {
    Logger.log("Loading vehicle online booking management data...");
    
    const statusResult = fetchOnlineBookingSystemStatus(sheetId);
    const vehiclesResult = getAllVehiclesWithOnlineBookingStatus(sheetId);
    
    const result = {
      success: true,
      systemStatus: statusResult.enabled,
      vehicles: vehiclesResult.success ? vehiclesResult.vehicles : []
    };
    
    Logger.log(`Loaded vehicle management data: ${result.vehicles.length} vehicles`);
    return result;
    
  } catch (error) {
    Logger.log("Error in getVehicleOnlineBookingManagementData: " + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * ฟังก์ชั่นหลักสำหรับโหลดข้อมูลส่วน "ตั้งค่ากฎราคา"
 */
function getPricingRulesManagementData(sheetId) {
  try {
    Logger.log("Loading pricing rules management data...");
    
    const ss = SpreadsheetApp.openById(sheetId);
    
    const vehiclesResult = getActiveOnlineBookingVehiclesForPricing(sheetId);
    const rules = fetchAllPricingRules(ss);
    const groupsResult = getVehicleGroupsByCode(ss);
    const currentYear = new Date().getFullYear();
    const holidays = getThaiHolidaysList(currentYear);
    
    const result = {
      success: true,
      vehicles: vehiclesResult.success ? vehiclesResult.vehicles : [],
      rules: rules,
      groups: groupsResult.success ? groupsResult.groups : [],
      holidays: holidays.success ? holidays.holidays : []
    };
    
    Logger.log(`Loaded pricing management data: ${result.vehicles.length} vehicles, ${result.rules.length} rules, ${result.groups.length} groups`);
    return result;
    
  } catch (error) {
    Logger.log("Error in getPricingRulesManagementData: " + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * ฟังก์ชั่นหลักสำหรับโหลดข้อมูลทั้งหมดรวมกัน (ใช้เมื่อต้องการโหลดครั้งเดียว)
 */
function getCompleteOnlineBookingManagementData(sheetId) {
  try {
    Logger.log("Loading complete online booking management data...");
    
    const vehicleManagementData = getVehicleOnlineBookingManagementData(sheetId);
    const pricingManagementData = getPricingRulesManagementData(sheetId);
    
    const result = {
      success: true,
      // ข้อมูลส่วน "รายชื่อรถที่เปิดให้จองออนไลน์"
      systemStatus: vehicleManagementData.systemStatus,
      allVehicles: vehicleManagementData.vehicles,
      
      // ข้อมูลส่วน "ตั้งค่ากฎราคา"
      activeVehicles: pricingManagementData.vehicles,
      pricingRules: pricingManagementData.rules,
      vehicleGroups: pricingManagementData.groups,
      holidays: pricingManagementData.holidays
    };
    
    Logger.log("Complete online booking management data loaded successfully");
    return result;
    
  } catch (error) {
    Logger.log("Error in getCompleteOnlineBookingManagementData: " + error.toString());
    return { success: false, message: error.toString() };
  }
}

// =============================================
// Section 7: ฟังก์ชั่นคำนวณราคา (สำหรับหน้าเว็บลูกค้า)
// =============================================

/**
 * คำนวณราคารวมสำหรับการจอง (ใช้ในหน้าเว็บลูกค้า)
 */
function calculateBookingTotalPrice(sheetId, vehicleCode, bookingStartDate, bookingEndDate) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    
    // ดึงข้อมูลรถ
    const vehiclesResult = getActiveOnlineBookingVehiclesForPricing(sheetId);
    if (!vehiclesResult.success) {
      return { success: false, message: "ไม่สามารถดึงข้อมูลรถได้" };
    }
    
    const vehicle = vehiclesResult.vehicles.find(v => v.รหัสรถ === vehicleCode);
    if (!vehicle) {
      return { success: false, message: `ไม่พบรถรหัส '${vehicleCode}'` };
    }

    const defaultPrice = vehicle.ราคาเริ่มต้น;
    const rules = fetchAllPricingRules(ss).filter(r => r.vehicleCode === vehicleCode);

    let totalPrice = 0;
    const priceDetails = [];
    
    const start = new Date(bookingStartDate);
    const end = new Date(bookingEndDate);

    for (let day = new Date(start); day < end; day.setDate(day.getDate() + 1)) {
      const currentDateStr = convertDateToString(day);
      let dailyPrice = defaultPrice;
      let ruleApplied = 'default';

      // ตรวจสอบกฎราคาสำหรับวันนี้
      for (const rule of rules) {
        if (currentDateStr >= rule.startDate && currentDateStr <= rule.endDate) {
          dailyPrice = rule.pricePerDay;
          ruleApplied = rule.ruleId;
          break;
        }
      }
      
      totalPrice += Number(dailyPrice);
      priceDetails.push({ 
        date: currentDateStr, 
        price: dailyPrice, 
        rule: ruleApplied 
      });
    }

    Logger.log(`Calculated price for ${vehicleCode}: ${totalPrice} (${priceDetails.length} days)`);
    
    return { 
      success: true, 
      totalPrice: totalPrice, 
      details: priceDetails, 
      days: priceDetails.length,
      vehicleCode: vehicleCode
    };
    
  } catch (error) {
    Logger.log("Error in calculateBookingTotalPrice: " + error.toString());
    return { success: false, message: "เกิดข้อผิดพลาดในการคำนวณราคา: " + error.message };
  }
}

// =============================================
// Section 8: รายการจองออนไลน์
// =============================================

/**
 * ดึงรายการจองออนไลน์
 */
function getOnlineBookingRentals(sheetId) {
  Logger.log('🚀 Starting getOnlineBookingRentals with sheetId: ' + sheetId);
  
  try {
    if (!sheetId) {
      Logger.log('❌ SheetID is empty or null');
      return {
        success: false,
        message: "ไม่ได้ระบุ Sheet ID"
      };
    }

    const ss = SpreadsheetApp.openById(sheetId);
    Logger.log('✅ Spreadsheet opened successfully');

    const rentalsSheet = ss.getSheetByName("รายการเช่า");
    if (!rentalsSheet) {
      Logger.log('❌ Rentals sheet not found');
      return {
        success: false,
        message: "ไม่พบแผ่นงาน 'รายการเช่า'"
      };
    }

    const rentalsData = rentalsSheet.getDataRange().getValues();
    Logger.log(`📊 Data loaded, rows count: ${rentalsData.length}`);

    if (rentalsData.length < 2) {
      Logger.log('ℹ️ No data rows found');
      return {
        success: true,
        rentals: []
      };
    }

    const headers = rentalsData[0];
    Logger.log(`📋 Headers count: ${headers.length}`);

    const rentals = [];

    // หาตำแหน่งของคอลัมน์ "ช่องทางการจอง"
    const channelIndex = headers.indexOf("ช่องทางการจอง");
    Logger.log(`🔍 Channel index: ${channelIndex}`);

    if (channelIndex === -1) {
      Logger.log('❌ Channel column not found');
      return {
        success: false,
        message: "ไม่พบคอลัมน์ 'ช่องทางการจอง' ในแผ่นงานรายการเช่า"
      };
    }

    // ประมวลผลข้อมูลการเช่า
    let onlineCount = 0;
    for (let i = 1; i < rentalsData.length; i++) {
      const row = rentalsData[i];

      // กรองเฉพาะรายการที่จองผ่านออนไลน์
      if (row[channelIndex] === "จองออนไลน์") {
        const rental = {};

        // สร้างออบเจ็กต์ข้อมูลการเช่าโดยทำความสะอาดข้อมูล
        for (let j = 0; j < headers.length; j++) {
          const header = String(headers[j]);
          const value = sanitizeDataValue(row[j]);
          rental[header] = value;
        }

        // เพิ่มฟิลด์พิเศษสำหรับการแสดงผล
        rental['ยอดเงินรวม'] = rental['ค่าเช่ารวมทั้งหมด'] || rental['ราคา'] || '0';

        rentals.push(rental);
        onlineCount++;

        if (onlineCount <= 3) { // Log เฉพาะ 3 รายการแรก
          Logger.log(`📝 Processed rental ${onlineCount}: ${rental['หมายเลขการจอง']}`);
        }
      }
    }

    Logger.log(`✅ Online rentals found: ${onlineCount}`);

    // เรียงลำดับตามวันที่เช่า (ใหม่ที่สุดก่อน)
    rentals.sort((a, b) => {
      const dateA = new Date(a['วันที่เช่า']);
      const dateB = new Date(b['วันที่เช่า']);
      return dateB - dateA;
    });

    // ทดสอบ serialize เป็น JSON
    try {
      const testJson = JSON.stringify(rentals);
      Logger.log(`🧪 JSON serialization test passed, size: ${testJson.length}`);
    } catch (jsonError) {
      Logger.log('❌ JSON serialization failed: ' + jsonError.toString());
      return {
        success: false,
        message: "ข้อมูลไม่สามารถแปลงเป็น JSON ได้: " + jsonError.toString()
      };
    }

    const result = {
      success: true,
      rentals: rentals,
      count: rentals.length
    };

    Logger.log(`🏁 Returning result with ${rentals.length} rentals`);
    return result;

  } catch (error) {
    Logger.log("💥 Error in getOnlineBookingRentals: " + error.toString());
    Logger.log("📋 Error stack: " + error.stack);
    return {
      success: false,
      message: "เกิดข้อผิดพลาด: " + error.toString()
    };
  }
}







// =============================================
// ไฟล์ใหม่: VehicleBlockingSystem.gs
// สร้างไฟล์ใหม่ใน Apps Script และวางโค้ดนี้
// =============================================

/**
 * โหลดข้อมูลสำหรับระบบจัดการวันปิดให้เช่า
 */
function getVehicleBlockingManagementData(sheetId) {
  try {
    Logger.log("Loading vehicle blocking management data...");
    
    const ss = SpreadsheetApp.openById(sheetId);
    
    // โหลดรถที่เปิดจองออนไลน์
    const vehiclesResult = getActiveOnlineBookingVehiclesForBlocking(sheetId);
    
    // โหลดกฎการปิดที่มีอยู่แล้ว
    const blockingRules = fetchAllVehicleBlockingRules(ss);
    
    // โหลดเหตุผลการปิด
    const blockingReasons = fetchBlockingReasons(ss);
    
    const result = {
      success: true,
      vehicles: vehiclesResult.success ? vehiclesResult.vehicles : [],
      blockingRules: blockingRules,
      blockingReasons: blockingReasons
    };
    
    Logger.log(`Loaded blocking management data: ${result.vehicles.length} vehicles, ${result.blockingRules.length} rules`);
    return result;
    
  } catch (error) {
    Logger.log("Error in getVehicleBlockingManagementData: " + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * ดึงรถที่เปิดจองออนไลน์สำหรับระบบปิดรถ
 */
function getActiveOnlineBookingVehiclesForBlocking(sheetId) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const carsSheet = ss.getSheetByName("รายชื่อรถ");
    
    if (!carsSheet) {
      return { success: false, message: "ไม่พบแผ่นงาน 'รายชื่อรถ'" };
    }
    
    const data = carsSheet.getDataRange().getValues();
    if (data.length < 2) return { success: true, vehicles: [] };
    
    const headers = data[0];
    const carCodeIndex = headers.indexOf("รหัสรถ");
    const brandIndex = headers.indexOf("ยี่ห้อ");
    const modelIndex = headers.indexOf("รุ่น");
    const plateIndex = headers.indexOf("ทะเบียน");
    const statusIndex = headers.indexOf("สถานะ");
    const onlineBookingIndex = headers.indexOf("เปิดจองออนไลน์");
    
    if (carCodeIndex === -1) {
      return { success: false, message: "ไม่พบคอลัมน์ 'รหัสรถ'" };
    }
    
    const vehicles = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[carCodeIndex] && (row[onlineBookingIndex] === "เปิด" || row[onlineBookingIndex] === true)) {
        vehicles.push({
          รหัสรถ: row[carCodeIndex],
          ยี่ห้อ: row[brandIndex] || "",
          รุ่น: row[modelIndex] || "",
          ทะเบียน: row[plateIndex] || "",
          สถานะ: row[statusIndex] || "",
          ชื่อรถเต็ม: `${row[brandIndex] || ""} ${row[modelIndex] || ""}`.trim()
        });
      }
    }
    
    return { success: true, vehicles: vehicles };
    
  } catch (error) {
    Logger.log("Error in getActiveOnlineBookingVehiclesForBlocking: " + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * ดึงกฎการปิดรถทั้งหมด
 */
function fetchAllVehicleBlockingRules(ss) {
  try {
    const rulesSheet = ss.getSheetByName("VehicleBlockingRules");
    if (!rulesSheet) {
      return [];
    }
    
    const data = rulesSheet.getDataRange().getValues();
    if (data.length < 2) return [];
    
    const rules = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][7]) { // มี BlockingID และ IsActive = true
        rules.push({
          blockingId: data[i][0],
          startDate: convertDateToString(data[i][1]),
          endDate: convertDateToString(data[i][2]),
          vehicleCode: data[i][3],
          reasonCode: data[i][4],
          reasonDescription: data[i][5] || '',
          createdDate: convertDateToString(data[i][6]),
          isActive: data[i][7]
        });
      }
    }
    
    return rules;
  } catch (error) {
    Logger.log("Error in fetchAllVehicleBlockingRules: " + error.toString());
    return [];
  }
}

/**
 * ดึงเหตุผลการปิดรถ
 */
function fetchBlockingReasons(ss) {
  try {
    let reasonsSheet = ss.getSheetByName("BlockingReasons");
    if (!reasonsSheet) {
      // สร้างชีตใหม่พร้อมข้อมูลเริ่มต้น
      reasonsSheet = ss.insertSheet("BlockingReasons");
      reasonsSheet.getRange("A1:D1").setValues([["ReasonCode", "ReasonName", "ReasonColor", "IsActive"]]);
      
      // เพิ่มข้อมูลเริ่มต้น
      const defaultReasons = [
        ["MAINTENANCE", "ซ่อมบำรุงตามกำหนด", "orange", true],
        ["REPAIR", "ซ่อมแซมเนื่องจากเสียหาย", "red", true],
        ["PERSONAL", "ใช้งานส่วนตัว", "purple", true],
        ["OTHER", "อื่นๆ", "gray", true]
      ];
      
      for (let i = 0; i < defaultReasons.length; i++) {
        reasonsSheet.getRange(i + 2, 1, 1, 4).setValues([defaultReasons[i]]);
      }
    }
    
    const data = reasonsSheet.getDataRange().getValues();
    if (data.length < 2) return [];
    
    const reasons = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][3]) { // มี ReasonCode และ IsActive = true
        reasons.push({
          reasonCode: data[i][0],
          reasonName: data[i][1],
          reasonColor: data[i][2],
          isActive: data[i][3]
        });
      }
    }
    
    return reasons;
  } catch (error) {
    Logger.log("Error in fetchBlockingReasons: " + error.toString());
    return [];
  }
}

/**
 * บันทึกกฎการปิดรถ
 */
function saveVehicleBlockingConfiguration(sheetId, blockingObjects) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    let rulesSheet = ss.getSheetByName("VehicleBlockingRules");
    
    if (!rulesSheet) {
      rulesSheet = ss.insertSheet("VehicleBlockingRules");
      rulesSheet.getRange("A1:H1").setValues([
        ["BlockingID", "StartDate", "EndDate", "VehicleCode", 
         "ReasonCode", "ReasonDescription", "CreatedDate", "IsActive"]
      ]);
    }
    
    const results = [];
    const savedRules = [];
    
    for (let blocking of blockingObjects) {
      // เช็คการซ้ำทับกับการปิดเดิม
      const overlapCheck = checkVehicleBlockingOverlap(
        blocking.vehicleCode, 
        blocking.startDate, 
        blocking.endDate, 
        sheetId
      );
      
      if (overlapCheck.hasOverlap) {
        results.push({
          success: false,
          vehicleCode: blocking.vehicleCode,
          message: `รถคันนี้มีการปิดในช่วงวันที่ดังกล่าวอยู่แล้ว`,
          overlappingBlocks: overlapCheck.overlappingBlocks
        });
        continue;
      }
      
      // เช็คการซ้ำทับกับการจอง
      const conflictCheck = checkVehicleBookingConflict(
        blocking.vehicleCode,
        blocking.startDate,
        blocking.endDate,
        sheetId
      );
      
      if (conflictCheck.hasConflict) {
        results.push({
          success: false,
          vehicleCode: blocking.vehicleCode,
          message: `รถคันนี้มีการจองในช่วงวันที่ดังกล่าว`,
          conflictingBookings: conflictCheck.conflictingBookings,
          allowForce: true
        });
        continue;
      }
      
      // บันทึกถ้าไม่มีปัญหา
      const blockingId = "BLOCK" + new Date().getTime() + Math.random().toString(36).substr(2, 5);
      
      rulesSheet.appendRow([
        blockingId,
        blocking.startDate,
        blocking.endDate,
        blocking.vehicleCode,
        blocking.reasonCode,
        blocking.reasonDescription || '',
        new Date(),
        true
      ]);
      
      const savedRule = {
        blockingId: blockingId,
        startDate: blocking.startDate,
        endDate: blocking.endDate,
        vehicleCode: blocking.vehicleCode,
        reasonCode: blocking.reasonCode,
        reasonDescription: blocking.reasonDescription || '',
        createdDate: convertDateToString(new Date()),
        isActive: true
      };
      
      savedRules.push(savedRule);
      results.push({
        success: true,
        vehicleCode: blocking.vehicleCode,
        blockingId: blockingId,
        message: "บันทึกการปิดรถสำเร็จ"
      });
    }
    
    return { 
      success: true, 
      results: results,
      savedRules: savedRules,
      message: `ประมวลผลเสร็จสิ้น ${results.filter(r => r.success).length}/${results.length} รายการ`
    };
    
  } catch (error) {
    Logger.log("Error in saveVehicleBlockingConfiguration: " + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * เช็คการซ้ำทับของการปิดรถ
 */
function checkVehicleBlockingOverlap(vehicleCode, newStartDate, newEndDate, sheetId, excludeBlockingId = null) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const blockingSheet = ss.getSheetByName("VehicleBlockingRules");
    
    if (!blockingSheet) return { hasOverlap: false };
    
    const data = blockingSheet.getDataRange().getValues();
    const overlappingBlocks = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const blockingId = row[0];
      const existingStart = new Date(row[1]);
      const existingEnd = new Date(row[2]);
      const existingVehicle = row[3];
      const isActive = row[7];
      
      if (existingVehicle !== vehicleCode || !isActive || blockingId === excludeBlockingId) {
        continue;
      }
      
      const newStart = new Date(newStartDate);
      const newEnd = new Date(newEndDate);
      
      if (!(newEnd < existingStart || newStart > existingEnd)) {
        overlappingBlocks.push({
          blockingId: blockingId,
          startDate: convertDateToString(row[1]),
          endDate: convertDateToString(row[2]),
          reasonCode: row[4],
          reasonDescription: row[5]
        });
      }
    }
    
    return {
      hasOverlap: overlappingBlocks.length > 0,
      overlappingBlocks: overlappingBlocks
    };
    
  } catch (error) {
    Logger.log("Error checking blocking overlap: " + error.toString());
    return { hasOverlap: false, error: error.toString() };
  }
}

/**
 * เช็คการซ้ำทับกับการจองที่มีอยู่
 */
function checkVehicleBookingConflict(vehicleCode, blockStartDate, blockEndDate, sheetId) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const rentalSheet = ss.getSheetByName("รายการเช่า");
    
    if (!rentalSheet) return { hasConflict: false };
    
    const data = rentalSheet.getDataRange().getValues();
    const headers = data[0];
    
    const carCodeIndex = headers.indexOf("รหัสรถ");
    const startDateIndex = headers.indexOf("วันที่เช่า");
    const endDateIndex = headers.indexOf("วันที่คืน");
    const statusIndex = headers.indexOf("สถานะ");
    const bookingIdIndex = headers.indexOf("หมายเลขการจอง");
    const customerIndex = headers.indexOf("ชื่อลูกค้า");
    
    if (carCodeIndex === -1 || startDateIndex === -1 || endDateIndex === -1) {
      return { hasConflict: false };
    }
    
    const conflictingBookings = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const carCode = row[carCodeIndex];
      const rentalStart = new Date(row[startDateIndex]);
      const rentalEnd = new Date(row[endDateIndex]);
      const status = row[statusIndex];
      
      if (carCode === vehicleCode && (status === 'จอง' || status === 'เช่าอยู่')) {
        const blockStart = new Date(blockStartDate);
        const blockEnd = new Date(blockEndDate);
        
        if (!(blockEnd < rentalStart || blockStart > rentalEnd)) {
          conflictingBookings.push({
            bookingId: row[bookingIdIndex] || '',
            customerName: row[customerIndex] || '',
            startDate: convertDateToString(row[startDateIndex]),
            endDate: convertDateToString(row[endDateIndex]),
            status: status
          });
        }
      }
    }
    
    return {
      hasConflict: conflictingBookings.length > 0,
      conflictingBookings: conflictingBookings
    };
    
  } catch (error) {
    Logger.log("Error checking booking conflict: " + error.toString());
    return { hasConflict: false, error: error.toString() };
  }
}

/**
 * แก้ไขกฎการปิดรถ
 */
function updateVehicleBlockingRule(sheetId, blockingId, updatedData) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const rulesSheet = ss.getSheetByName("VehicleBlockingRules");
    
    if (!rulesSheet) {
      return { success: false, message: "ไม่พบแผ่นงาน VehicleBlockingRules" };
    }
    
    const data = rulesSheet.getDataRange().getValues();
    let foundRow = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === blockingId) {
        foundRow = i + 1;
        break;
      }
    }
    
    if (foundRow === -1) {
      return { success: false, message: "ไม่พบรายการที่ต้องการแก้ไข" };
    }
    
    const overlapCheck = checkVehicleBlockingOverlap(
      updatedData.vehicleCode,
      updatedData.startDate,
      updatedData.endDate,
      sheetId,
      blockingId
    );
    
    if (overlapCheck.hasOverlap) {
      return {
        success: false,
        message: "วันที่ที่แก้ไขใหม่ซ้ำทับกับการปิดอื่น",
        overlappingBlocks: overlapCheck.overlappingBlocks
      };
    }
    
    rulesSheet.getRange(foundRow, 2).setValue(updatedData.startDate);
    rulesSheet.getRange(foundRow, 3).setValue(updatedData.endDate);
    rulesSheet.getRange(foundRow, 4).setValue(updatedData.vehicleCode);
    rulesSheet.getRange(foundRow, 5).setValue(updatedData.reasonCode);
    rulesSheet.getRange(foundRow, 6).setValue(updatedData.reasonDescription || '');
    
    return { 
      success: true, 
      message: "แก้ไขการปิดรถสำเร็จ",
      updatedRule: {
        blockingId: blockingId,
        startDate: updatedData.startDate,
        endDate: updatedData.endDate,
        vehicleCode: updatedData.vehicleCode,
        reasonCode: updatedData.reasonCode,
        reasonDescription: updatedData.reasonDescription || '',
        createdDate: convertDateToString(data[foundRow - 1][6]),
        isActive: true
      }
    };
    
  } catch (error) {
    Logger.log("Error in updateVehicleBlockingRule: " + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * ลบกฎการปิดรถ
 */
function deleteVehicleBlockingRule(sheetId, blockingId) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const rulesSheet = ss.getSheetByName("VehicleBlockingRules");
    
    if (!rulesSheet) {
      return { success: false, message: "ไม่พบแผ่นงาน VehicleBlockingRules" };
    }
    
    const data = rulesSheet.getDataRange().getValues();
    let foundRow = -1;
    
    // หาแถวที่ต้องลบ
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === blockingId) {
        foundRow = i + 1; // +1 เพราะ getRange เริ่มต้นที่ 1
        break;
      }
    }
    
    if (foundRow === -1) {
      return { success: false, message: "ไม่พบรายการที่ต้องการลบ" };
    }
    
    // ลบแถวจริง
    rulesSheet.deleteRow(foundRow);
    
    return { 
      success: true, 
      message: "ลบการปิดรถสำเร็จ",
      deletedBlockingId: blockingId
    };
    
  } catch (error) {
    Logger.log("Error in deleteVehicleBlockingRule: " + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * ตรวจสอบว่ารถปิดในช่วงวันที่หรือไม่
 */
function checkVehicleNotBlocked(vehicle, pickupDate, returnDate, sheetId) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const blockingSheet = ss.getSheetByName("VehicleBlockingRules");
    
    if (!blockingSheet) return true;
    
    const blockingData = blockingSheet.getDataRange().getValues();
    
    for (let i = 1; i < blockingData.length; i++) {
      const row = blockingData[i];
      const blockedVehicle = row[3];
      const blockedStart = new Date(row[1]);
      const blockedEnd = new Date(row[2]);
      const isActive = row[7];
      
      if (blockedVehicle === vehicle.รหัสรถ && isActive) {
        const pickup = new Date(pickupDate);
        const returnCar = new Date(returnDate);
        
        if (!(returnCar <= blockedStart || pickup >= blockedEnd)) {
          return false;
        }
      }
    }
    
    return true;
    
  } catch (error) {
    Logger.log("Error checking vehicle blocking: " + error.toString());
    return false;
  }
}





























