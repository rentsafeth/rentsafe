function createSupabaseTables(storeSID) {
  const SUPABASE_URL = 'https://bettfkdjgdzfwhjzrdoa.supabase.co';
  const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJldHRma2RqZ2R6ZndoanpyZG9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODkzODMyNiwiZXhwIjoyMDY0NTE0MzI2fQ.DISf0On7eOhF_oRj1TmanOF8NYGYbLpplJn7G2H_r_g'; // แนะนำให้เก็บไว้นอกสคริปต์จริง

  const rentalsTable = `rentals_${storeSID}`;
  const deliveriesTable = `deliveries_${storeSID}`;

  const sql = `
    CREATE TABLE IF NOT EXISTS ${rentalsTable} AS
    SELECT * FROM rentals_template WHERE FALSE;

    CREATE TABLE IF NOT EXISTS ${deliveriesTable} AS
    SELECT * FROM deliveries_template WHERE FALSE;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_booking_${storeSID}'
      ) THEN
        ALTER TABLE ${rentalsTable}
        ADD CONSTRAINT unique_booking_${storeSID} UNIQUE (booking_number);
      END IF;
    END
    $$;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_booking_delivery_${storeSID}'
      ) THEN
        ALTER TABLE ${deliveriesTable}
        ADD CONSTRAINT unique_booking_delivery_${storeSID}
        UNIQUE (booking_number, delivery_date);
      END IF;
    END
    $$;
  `;

  const rpcUrl = `${SUPABASE_URL}/rest/v1/rpc/execute_sql`;

  const response = UrlFetchApp.fetch(rpcUrl, {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": "Bearer " + SERVICE_ROLE_KEY,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify({ statement: sql }),
    muteHttpExceptions: true
  });

  const responseText = response.getContentText();
  let success = false;
  try {
    const result = JSON.parse(responseText);
    if (result === "OK" || (Array.isArray(result) && result[0] === "OK")) {
      success = true;
    }
  } catch (_) {}

  if (!success) {
    return {
      success: false,
      message: "ไม่สามารถสร้างตารางหรือ constraint ได้",
      response: responseText
    };
  }

  return {
    success: true,
    message: "✅ สร้างตารางและ constraint สำเร็จแล้ว",
    createdTables: [rentalsTable, deliveriesTable]
  };
}



function uploadRentalSheetToSupabase(sheetID, storeSID) {
  const SUPABASE_URL = 'https://bettfkdjgdzfwhjzrdoa.supabase.co';
  const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJldHRma2RqZ2R6ZndoanpyZG9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODkzODMyNiwiZXhwIjoyMDY0NTE0MzI2fQ.DISf0On7eOhF_oRj1TmanOF8NYGYbLpplJn7G2H_r_g';

  const tableName = `rentals_${storeSID}`;
  const ss = SpreadsheetApp.openById(sheetID);
  const sheet = ss.getSheetByName("รายการเช่า");

  if (!sheet) return { success: false, message: "ไม่พบชีต 'รายการเช่า'" };

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: false, message: "ไม่มีข้อมูลให้อัปโหลด" };

  const headers = data[0];
  const rows = data.slice(1).filter(row => row.some(cell => cell !== ""));

  const headersMap = {
    "ช่องทางการจอง": "channel",
    "หมายเลขการจอง": "booking_number",
    "ชื่อลูกค้า": "customer_name",
    "เบอร์โทรศัพท์": "phone_number",
    "รถ": "car_model",
    "ทะเบียนรถ": "license_plate",
    "วันที่เช่า": "rent_date",
    "วันที่คืน": "return_date",
    "เวลารับรถ": "pickup_time",
    "เวลาคืนรถ": "return_time",
    "ราคา": "price",
    "สถานะ": "status",
    "หมายเหตุ": "remarks",
    "ลิงก์สัญญาเช่า": "contract_url",
    "สถานที่รับรถ": "pickup_location",
    "สถานที่คืนรถ": "return_location",
    "ค่าเช่ารวมทั้งหมด": "total_price",
    "ค่ามัดจำคิวรถ": "queue_deposit",
    "เงินประกันความเสียหาย": "damage_deposit",
    "ค่าบริการเพิ่มเติม": "extra_charges",
    "รวมยอดชำระวันรับรถ": "payment_total",
    "เลขบัตรประชาชน": "id_card_number",
    "หมายเลขใบขับขี่": "driver_license_number",
    "ที่อยู่ลูกค้า": "customer_address",
    "ผู้ทำรายการ": "operator",
    "ลิงก์ปฏิทิน": "calendar_link",
    "IDกิจกรรมปฏิทิน": "activity_id",
    "IDปฏิทิน": "calendar_id"
  };

  const numericFields = [
    "price", "total_price", "queue_deposit",
    "damage_deposit", "extra_charges", "payment_total"
  ];

  const seen = new Set();
  let skipped = 0;
  let duplicates = [];

  const jsonRows = rows.map(row => {
    const obj = {};
    let valid = true;

    headers.forEach((header, i) => {
      const key = headersMap[header];
      if (key) {
        let value = row[i];

        // แปลงค่าว่างเป็น null สำหรับฟิลด์ numeric
        if (numericFields.includes(key) && (value === "" || value === undefined)) {
          value = null;
        }

        // ตรวจสอบฟอร์แมตวันที่
        if (["rent_date", "return_date"].includes(key) && !(value instanceof Date)) {
          valid = false;
        }

        obj[key] = value;
      }
    });

    // ป้องกันซ้ำใน Sheet
    if (seen.has(obj.booking_number)) {
      duplicates.push(obj.booking_number);
      valid = false;
    }
    seen.add(obj.booking_number);

    if (!valid) {
      skipped++;
      return null;
    }

    return obj;
  }).filter(r => r);

  const url = `${SUPABASE_URL}/rest/v1/${tableName}`;
  const options = {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": "Bearer " + SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
      // ⬇️ สำคัญมาก: สั่งให้ Supabase ทำ upsert (merge duplicates)
      "Prefer": "resolution=merge-duplicates"
    },
    payload: JSON.stringify(jsonRows),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  const text = response.getContentText();

  Logger.log("🔍 Response Text: " + text);

  if (code >= 200 && code < 300) {
    return { success: true, inserted: jsonRows.length, skipped, duplicates };
  } else {
    return { success: false, message: text };
  }
}






function uploadDeliverySheetToSupabase(sheetID, storeSID) {
  const SUPABASE_URL = 'https://bettfkdjgdzfwhjzrdoa.supabase.co';
  const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJldHRma2RqZ2R6ZndoanpyZG9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODkzODMyNiwiZXhwIjoyMDY0NTE0MzI2fQ.DISf0On7eOhF_oRj1TmanOF8NYGYbLpplJn7G2H_r_g';

  const tableName = `deliveries_${storeSID}`;
  const ss = SpreadsheetApp.openById(sheetID);
  const sheet = ss.getSheetByName("ตารางรับส่งรถ");

  if (!sheet) return { success: false, message: "ไม่พบชีต 'ตารางรับส่งรถ'" };

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: false, message: "ไม่มีข้อมูลให้อัปโหลด" };

  const headers = data[0];
  const rows = data.slice(1).filter(row => row.some(cell => cell !== ""));

  const headersMap = {
    "หมายเลขการจอง": "booking_number",
    "วันที่": "delivery_date",
    "เวลา": "delivery_time",
    "ชื่อลูกค้า": "customer_name",
    "รถ": "car_model",
    "ประเภท": "delivery_type",
    "หมายเหตุ": "notes"
  };

  const seen = new Set();
  let skipped = 0;
  let duplicates = [];

  const jsonRows = rows.map(row => {
    const obj = {};
    let valid = true;

    headers.forEach((header, i) => {
      const key = headersMap[header];
      if (key) {
        let value = row[i];
        if (key === "delivery_date" && !(value instanceof Date)) {
          valid = false;
        }
        obj[key] = value;
      }
    });

    const uid = `${obj.booking_number}-${obj.delivery_date}`;
    if (seen.has(uid)) {
      duplicates.push(obj.booking_number);
      valid = false;
    }
    seen.add(uid);

    if (!valid) {
      skipped++;
      return null;
    }

    return obj;
  }).filter(r => r);

  const url = `${SUPABASE_URL}/rest/v1/${tableName}`;
  const options = {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": "Bearer " + SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates"
    },
    payload: JSON.stringify(jsonRows),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  const text = response.getContentText();

  Logger.log("🔍 Response Text: " + text); 

  if (code >= 200 && code < 300) {
    return { success: true, inserted: jsonRows.length, skipped, duplicates };
  } else {
    return { success: false, message: text };
  }
}



function onCreateTablesManual() {
  const storeSID = "SID5684"; // 🔧 ปรับเป็นรหัสร้านที่ต้องการ
  const result = createSupabaseTables(storeSID);

  if (result.success) {
   Logger.log("✅ สร้างสำเร็จ: " + result.createdTables.join(", "));
Logger.log("📦 หมายเหตุ: ข้ามการแสดง allMatchedTables เพราะไม่สามารถดึงจาก Supabase ได้ผ่าน REST API");

  } else {
    Logger.log("❌ ล้มเหลว: " + result.message);
    Logger.log("รายละเอียด: " + JSON.stringify(result.response));
  }
}





function uploadAllStoreData(sheetID, storeSID) {
  Logger.log(`📤 เริ่มอัปโหลดข้อมูลร้าน ${storeSID}...`);

  const rentalResult = uploadRentalSheetToSupabase(sheetID, storeSID);
  if (rentalResult.success) {
    Logger.log(`✅ รายการเช่า: อัปโหลดแล้ว ${rentalResult.inserted} แถว`);
  } else {
   Logger.log(`❌ รายการเช่า: ${JSON.stringify(rentalResult)}`);

  }

  const deliveryResult = uploadDeliverySheetToSupabase(sheetID, storeSID);
  if (deliveryResult.success) {
    Logger.log(`✅ ตารางรับส่งรถ: อัปโหลดแล้ว ${deliveryResult.inserted} แถว`);
  } else {
   Logger.log(`❌ ตารางรับส่งรถ: ${JSON.stringify(deliveryResult)}`);

  }

  Logger.log("✅ การอัปโหลดเสร็จสมบูรณ์");
}


function onUploadBoth() {
  const sheetID = '1RjRI5kY4QKxVIU4iZWi65rIc_H7JDpwBrZLnTrznYuQ';    // ✅ Spreadsheet ID ของร้าน
  const storeSID = 'sid5684';      // ✅ รหัสร้าน

  uploadAllStoreData(sheetID, storeSID);
}



function onCreateSupabaseCarTableManual() {
  const storeSID = "sid5684"; // 🔧 ปรับเป็นรหัสร้านที่ต้องการ
  const result = createSupabaseCarTable(storeSID);

  if (result.success) {
   Logger.log("✅ สร้างสำเร็จ: " + result.createdTables.join(", "));
Logger.log("📦 หมายเหตุ: ข้ามการแสดง allMatchedTables เพราะไม่สามารถดึงจาก Supabase ได้ผ่าน REST API");

  } else {
    Logger.log("❌ ล้มเหลว: " + result.message);
    Logger.log("รายละเอียด: " + JSON.stringify(result.response));
  }
}




function createSupabaseCarTable(storeSID) {
  const carsTable = `cars_${storeSID}`;
  const sql = `
    CREATE TABLE IF NOT EXISTS ${carsTable} AS
    SELECT * FROM cars_template WHERE FALSE;
  `;
  const rpcUrl = `${SUPABASE_URL}/rest/v1/rpc/execute_sql`;

  const response = UrlFetchApp.fetch(rpcUrl, {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": "Bearer " + SERVICE_ROLE_KEY,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify({ statement: sql }),
    muteHttpExceptions: true
  });

  const responseText = response.getContentText();
  let success = false;
  try {
    const result = JSON.parse(responseText);
    if (result === "OK" || (Array.isArray(result) && result[0] === "OK")) {
      success = true;
    }
  } catch (_) {}

  if (!success) {
    return { success: false, message: "❌ ไม่สามารถสร้าง cars table ได้", response: responseText };
  }
  return { success: true, message: "✅ สร้าง cars table สำเร็จ" };
}


function onUploadCarTable() {
  const sheetID = '1RjRI5kY4QKxVIU4iZWi65rIc_H7JDpwBrZLnTrznYuQ';    // ✅ Spreadsheet ID ของร้าน
  const storeSID = 'sid5684';      // ✅ รหัสร้าน

  uploadCarsSheetToSupabase(sheetID, storeSID);
}

function uploadCarsSheetToSupabase(sheetID, storeSID) {
  const tableName = `cars_${storeSID}`;
  const ss = SpreadsheetApp.openById(sheetID);
  const sheet = ss.getSheetByName("รายชื่อรถ");
  if (!sheet) return { success: false, message: "ไม่พบชีท 'รายชื่อรถ'" };

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: false, message: "ไม่มีข้อมูลให้อัปโหลด" };

  const headers = data[0];
  const rows = data.slice(1).filter(row => row.some(cell => cell !== ""));

  // Map header ภาษาไทย → key ที่ตรงกับ Supabase table
  const headersMap = {
    "ยี่ห้อ": "ยี่ห้อ",
    "รุ่น": "รุ่น",
    "ทะเบียน": "ทะเบียน",
    "พื้นที่การใช้งาน": "พื้นที่การใช้งาน",
    "สี": "สี",
    "ค่าประกันความเสียหาย": "ค่าประกันความเสียหาย",
    "ประเภท": "ประเภท",
    "ราคาเช่าต่อวัน": "ราคาเช่าต่อวัน",
    "สถานะ": "สถานะ",
    "ชนิดเชื้อเพลิง": "ชนิดเชื้อเพลิง",
    "สีปฏิทิน": "สีปฏิทิน"
  };

  const numericFields = ["ค่าประกันความเสียหาย", "ราคาเช่าต่อวัน"];

  const jsonRows = rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      const key = headersMap[header];
      if (key) {
        let value = row[i];
        if (numericFields.includes(key) && (value === "" || value === undefined)) value = null;
        obj[key] = value;
      }
    });
    return obj;
  });

  const url = `${SUPABASE_URL}/rest/v1/${tableName}`;
  const options = {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": "Bearer " + SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates"
    },
    payload: JSON.stringify(jsonRows),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  const text = response.getContentText();

  Logger.log("🔍 Response Text: " + text);

  if (code >= 200 && code < 300) {
    return { success: true, inserted: jsonRows.length };
  } else {
    return { success: false, message: text };
  }
}








