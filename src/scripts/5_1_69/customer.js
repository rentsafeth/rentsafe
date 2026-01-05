/**
 * (ฉบับสมบูรณ์) สร้างชีตและย้ายข้อมูลลูกค้าจาก "รายการเช่า"
 * โดยใช้ "เลขบัตรประชาชน" เป็น Primary Key ในการตรวจสอบข้อมูลซ้ำ
 */
function setupCustomerSheetAndMigrateData() {
  const ss = SpreadsheetApp.openById('1xqnov7ZANm4Xhoheq65Uv8bcwqzfpths26L9wUNSuo8');
  
  // --- ส่วนที่ 1: สร้างชีต "ข้อมูลลูกค้า" ถ้ายังไม่มี ---
  let customerSheet = ss.getSheetByName(CUSTOMERS_SHEET);
  if (!customerSheet) {
    customerSheet = ss.insertSheet(CUSTOMERS_SHEET);
    const headers = [
      "รหัสลูกค้า", "ชื่อ-นามสกุล", "เบอร์โทรศัพท์", "เลขบัตรประชาชน", 
      "หมายเลขใบขับขี่", "ที่อยู่", "ประวัติการเช่า (หมายเลขการจอง)", 
      "หมายเหตุ", "สถานะ", "วันที่สร้าง"
    ];
    customerSheet.appendRow(headers);
    customerSheet.getRange("A1:J1").setFontWeight("bold");
    Logger.log(`✅ สร้างชีต "${CUSTOMERS_SHEET}" เรียบร้อยแล้ว`);
  } else {
    Logger.log(`ℹ️ ชีต "${CUSTOMERS_SHEET}" มีอยู่แล้ว`);
  }

  // --- ส่วนที่ 2: ดึงข้อมูลลูกค้าจาก "รายการเช่า" ---
  const rentalSheet = ss.getSheetByName(RENTAL_SHEET);
  if (!rentalSheet || rentalSheet.getLastRow() < 2) {
    Logger.log("ไม่พบข้อมูลในชีต 'รายการเช่า' ที่จะย้ายได้");
    return;
  }

  const rentalData = rentalSheet.getDataRange().getValues();
  const rentalHeaders = rentalData.shift(); // เอาหัวข้อออกและเก็บไว้

  // หา index ของคอลัมน์ที่ต้องการ
  const nameIndex = rentalHeaders.indexOf("ชื่อลูกค้า");
  const phoneIndex = rentalHeaders.indexOf("เบอร์โทรศัพท์");
  const idCardIndex = rentalHeaders.indexOf("เลขบัตรประชาชน");
  const licenseIndex = rentalHeaders.indexOf("หมายเลขใบขับขี่");
  const addressIndex = rentalHeaders.indexOf("ที่อยู่ลูกค้า");
  const bookingNoIndex = rentalHeaders.indexOf("หมายเลขการจอง");

  if (nameIndex === -1 || phoneIndex === -1 || bookingNoIndex === -1) {
    Logger.log("ไม่พบคอลัมน์ที่จำเป็น (ชื่อลูกค้า, เบอร์โทรศัพท์, หมายเลขการจอง) ในชีต 'รายการเช่า'");
    return;
  }

  // --- ส่วนที่ 3: ประมวลผลและสร้างข้อมูลลูกค้าที่ไม่ซ้ำ (Logic แก้ไขแล้ว) ---
  const uniqueCustomers = new Map();
  
  // หา ID ลูกค้าล่าสุดที่มีอยู่แล้ว เพื่อสร้าง ID ต่อเนื่อง
  let lastCustomerId = 0;
  const lastRow = customerSheet.getLastRow();
  if (lastRow > 1) {
      const lastIdValue = customerSheet.getRange(lastRow, 1).getValue();
      lastCustomerId = parseInt(String(lastIdValue).replace('CUS', ''), 10) || 0;
  }
  
  rentalData.forEach(row => {
    const name = String(row[nameIndex] || '').trim();
    const phone = String(row[phoneIndex] || '').trim().replace(/'/g, "");
    const idCard = String(row[idCardIndex] || '').trim();
    const bookingNo = String(row[bookingNoIndex] || '').trim();
    
    if (idCard || (name && phone)) {
      // ⭐ Logic ใหม่: ใช้เลขบัตรประชาชนเป็น Key หลัก, ถ้าไม่มีถึงจะใช้ ชื่อ+เบอร์โทร
      const customerKey = idCard || `${name}|${phone}`;
      
      if (!uniqueCustomers.has(customerKey)) {
        lastCustomerId++;
        uniqueCustomers.set(customerKey, {
          id: `CUS${String(lastCustomerId).padStart(5, '0')}`,
          name: name,
          phone: phone,
          idCard: idCard,
          license: row[licenseIndex] || '',
          address: row[addressIndex] || '',
          rentalHistory: new Set([bookingNo]), // ใช้ Set เพื่อป้องกันการจองซ้ำ
          notes: '',
          status: 'ปกติ',
          createdDate: new Date()
        });
      } else {
        // ถ้าเจอ Key ซ้ำ ให้อัปเดตเฉพาะประวัติการเช่า
        uniqueCustomers.get(customerKey).rentalHistory.add(bookingNo);
      }
    }
  });

  // --- ส่วนที่ 4: บันทึกข้อมูลใหม่ลงชีต "ข้อมูลลูกค้า" ---
  const customerSheetData = customerSheet.getDataRange().getValues();
  // สร้าง Set ของ Key ที่มีอยู่แล้วในชีตลูกค้า เพื่อป้องกันการเพิ่มซ้ำ
  const existingCustomerKeys = new Set();
  customerSheetData.slice(1).forEach(row => {
      const idCardInSheet = String(row[3] || '').trim();
      const nameInSheet = String(row[1] || '').trim();
      const phoneInSheet = String(row[2] || '').replace(/'/g, "").trim();
      const key = idCardInSheet || `${nameInSheet}|${phoneInSheet}`;
      existingCustomerKeys.add(key);
  });

  const newCustomersData = [];
  uniqueCustomers.forEach((customer, key) => {
    if (!existingCustomerKeys.has(key)) {
       newCustomersData.push([
        customer.id,
        customer.name,
        "'" + customer.phone, // บังคับเป็น Text
        customer.idCard,
        customer.license,
        customer.address,
        Array.from(customer.rentalHistory).join(', '),
        customer.notes,
        customer.status,
        customer.createdDate
      ]);
    }
  });

  if (newCustomersData.length > 0) {
    customerSheet.getRange(customerSheet.getLastRow() + 1, 1, newCustomersData.length, 10).setValues(newCustomersData);
    customerSheet.getRange(2, 3, customerSheet.getLastRow() -1, 1).setNumberFormat('@'); // Format Phone as Text
    Logger.log(`✅ ย้ายข้อมูลลูกค้าใหม่ ${newCustomersData.length} รายการสำเร็จ`);
  } else {
    Logger.log("✅ ไม่พบข้อมูลลูกค้าใหม่ที่ต้องย้าย ข้อมูลลูกค้าเป็นปัจจุบันแล้ว");
  }
}