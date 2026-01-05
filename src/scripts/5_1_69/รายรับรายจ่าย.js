/**
 * ค้นหารายการในชีต "รายรับรายจ่าย" ตามประเภทและคำค้นหา
 * @param {string} sheetID - ไอดีของ Google Sheet
 * @param {string} searchType - ประเภทการค้นหา ('booking_number' หรือ 'car_name')
 * @param {string} query - คำค้นหา
 * @returns {object} ผลลัพธ์การค้นหา (แก้ไขให้สามารถส่งข้อมูลกลับไปที่ Client ได้)
 */
function searchFinancialRecords(sheetID, searchType, query) {
  try {
    Logger.log(`🟨 เริ่มค้นหา financial records`); // 
    Logger.log(`📌 sheetID: ${sheetID}`); // 
    Logger.log(`📌 searchType: ${searchType}`); // 
    Logger.log(`📌 query: ${query}`); // 

    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName("รายรับรายจ่าย"); // 
    if (!sheet || sheet.getLastRow() < 2) {
      return { success: true, data: [] }; // 
    }

    const data = sheet.getDataRange().getValues(); // 
    const headers = data[0]; // 
    const searchColIndex = searchType === 'booking_number' 
      ? headers.indexOf('หมายเลขการจอง')  // 
      : headers.indexOf('รถที่เกี่ยวข้อง'); // 

    if (searchColIndex === -1) {
      return { success: true, data: [] }; // 
    }

    const results = [];

    for (let i = data.length - 1; i > 0; i--) {
      const valueToCheck = String(data[i][searchColIndex]); // 
      if (valueToCheck.includes(query)) { // 
        const record = {};
        headers.forEach((header, index) => {
          // --- จุดที่แก้ไข ---
          const cellValue = data[i][index];
          // ตรวจสอบว่าข้อมูลเป็น Date Object หรือไม่
          if (cellValue instanceof Date) {
            // ถ้าใช่, แปลงเป็น String รูปแบบ ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
            record[header] = cellValue.toISOString();
          } else {
            // ถ้าไม่ใช่, ใช้ค่าเดิม
            record[header] = cellValue;
          }
        });
        record.id = i + 1; // 
        results.push(record); // 
      }
    }

    Logger.log(`✅ พบทั้งหมด ${results.length} รายการที่ตรงกับ \"${query}\"`); // 
    return { success: true, data: results.reverse() }; // 

  } catch (e) {
    Logger.log(`❌ Error in searchFinancialRecords: ${e.message}`); // 
    return { success: false, message: e.message }; // 
  }
}

/**
 * เพิ่มรายการรายรับ/รายจ่ายด้วยตนเอง
 * @param {string} sheetID - ไอดีของ Google Sheet
 * @param {object} recordData - ข้อมูลรายการที่จะเพิ่ม
 * @returns {object} ผลลัพธ์การทำงาน
 */
function addManualFinancialRecord(sheetID, recordData) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName("รายรับรายจ่าย");

    const inputDate = recordData.วันที่ ? new Date(recordData.วันที่) : new Date();

    const newRow = [
      inputDate, // ใช้วันที่ที่ผู้ใช้เลือก
      recordData.ประเภท,
      recordData.รายการ,
      parseFloat(recordData.จำนวนเงิน) || 0,
      recordData.หมายเลขการจอง || '-',
      recordData.รถที่เกี่ยวข้อง || '-',
      recordData.หมายเหตุ || 'บันทึกด้วยตนเอง'
    ];

    sheet.appendRow(newRow);
    return { success: true, message: 'เพิ่มรายการสำเร็จ' };
  } catch (e) {
    Logger.log(`Error in addManualFinancialRecord: ${e.message}`);
    return { success: false, message: e.message };
  }
}


/**
 * แก้ไขข้อมูลในแถวที่ระบุของชีต "รายรับรายจ่าย"
 * @param {string} sheetID - ไอดีของ Google Sheet
 * @param {number} recordId - ID (Row Index) ของรายการที่ต้องการแก้ไข
 * @param {object} newData - ข้อมูลใหม่
 * @returns {object} ผลลัพธ์การทำงาน
 */
function updateFinancialRecord(sheetID, recordId, newData) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName("รายรับรายจ่าย");

    const updateDate = newData.วันที่ ? new Date(newData.วันที่) : new Date();

    sheet.getRange(recordId, 1).setValue(updateDate); // วันที่
    sheet.getRange(recordId, 2).setValue(newData.ประเภท); // ประเภท
    sheet.getRange(recordId, 4).setValue(parseFloat(newData.จำนวนเงิน) || 0); // จำนวนเงิน

    return { success: true, message: 'อัปเดตข้อมูลสำเร็จ' };
  } catch (e) {
    Logger.log(`Error in updateFinancialRecord: ${e.message}`);
    return { success: false, message: e.message };
  }
}


/**
 * ลบรายการในชีต "รายรับรายจ่าย"
 * @param {string} sheetID - ไอดีของ Google Sheet
 * @param {number} recordId - ID (Row Index) ของรายการที่ต้องการลบ
 * @returns {object} ผลลัพธ์การทำงาน
 */
function deleteFinancialRecord(sheetID, recordId) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName("รายรับรายจ่าย");
    sheet.deleteRow(recordId);
    return { success: true, message: 'ลบรายการสำเร็จ' };
  } catch (e) {
    Logger.log(`Error in deleteFinancialRecord: ${e.message}`);
    return { success: false, message: e.message };
  }
}


//================================================================
// ส่วนที่ 2: ปรับปรุงฟังก์ชัน getFinancialData เพื่อรองรับกราฟ
//================================================================

/**
 * ดึงและประมวลผลข้อมูลทางการเงินสำหรับเดือนและปีที่ระบุ
 * (ปรับปรุง V.3) จัดหมวดหมู่รายจ่ายตามกฎที่ผู้ใช้กำหนดใน "ตั้งค่าระบบ"
 * @param {string} sheetID - ID ของ Google Sheet
 * @param {number} year - ปีที่ต้องการ (เช่น 2025)
 * @param {number} month - เดือนที่ต้องการ (1-12)
 * @returns {object} ออบเจ็กต์ข้อมูลทางการเงินที่ประมวลผลแล้ว
 */
function getFinancialData(sheetID, year, month) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const financialSheet = ss.getSheetByName("รายรับรายจ่าย");
    const settingsSheet = ss.getSheetByName("ตั้งค่าระบบ");

    const emptyResult = { 
      success: true, 
      data: { revenues: [], expenses: [], expenseByCategory: {}, profitByCar: {} } 
    };

    if (!financialSheet || financialSheet.getLastRow() < 2) {
      return emptyResult;
    }
    
    // --- 1. อ่านกฎการจัดหมวดหมู่จากชีต "ตั้งค่าระบบ" ---
    let categoryMapping = {};
    if (settingsSheet) {
      const settingsData = settingsSheet.getDataRange().getValues();
      for (const row of settingsData) {
        if (row[0] === "การจับคู่หมวดหมู่รายจ่าย" && row[1]) {
          try {
            categoryMapping = JSON.parse(row[1]);
          } catch (e) {
            Logger.log("ไม่สามารถแปลง JSON ของการจับคู่หมวดหมู่ได้: " + e.message);
          }
          break;
        }
      }
    }
    // ----------------------------------------------------

    const targetYear = parseInt(year, 10);
    const targetMonth = parseInt(month, 10) - 1; 

    const values = financialSheet.getDataRange().getValues();
    const headers = values[0];
    
    const dateCol = headers.indexOf("วันที่");
    const typeCol = headers.indexOf("ประเภท");
    const itemCol = headers.indexOf("รายการ");
    const amountCol = headers.indexOf("จำนวนเงิน");
    const carCol = headers.indexOf("รถที่เกี่ยวข้อง");

    const revenues = [];
    const expenses = [];
    const expenseByCategory = {};
    const profitByCar = {};

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const dateValue = row[dateCol];

      if (dateValue instanceof Date && !isNaN(dateValue.getTime()) &&
          dateValue.getFullYear() === targetYear && dateValue.getMonth() === targetMonth) {
        
        const amountValue = parseFloat(row[amountCol]) || 0;
        const typeValue = row[typeCol];
        const itemValue = row[itemCol] || 'ไม่ระบุรายการ';
        const carName = (carCol !== -1 && row[carCol]) ? row[carCol] : 'ไม่ระบุรถ';

        if (!profitByCar[carName]) {
          profitByCar[carName] = { revenue: 0, expense: 0 };
        }

        if (typeValue === 'รายรับ') {
          revenues.push({ date: dateValue.toISOString(), item: itemValue, amount: amountValue });
          profitByCar[carName].revenue += amountValue;

        } else if (typeValue === 'รายจ่าย') {
          expenses.push({ date: dateValue.toISOString(), item: itemValue, amount: amountValue });
          profitByCar[carName].expense += amountValue;
          
          // ========================================================
          // === ตรรกะการจัดหมวดหมู่รายจ่าย (ปรับปรุงตาม Mapping) ===
          // ========================================================
          
          let category = itemValue.trim(); // 1. ค่าเริ่มต้นคือชื่อรายการนั้นๆ
          let foundMatch = false;

          // 2. วนลูปตามกฎที่ผู้ใช้ตั้งค่าไว้
          for (const mainCategory in categoryMapping) {
            const keywords = categoryMapping[mainCategory];
            if (Array.isArray(keywords)) {
              for (const keyword of keywords) {
                // 3. ตรวจสอบว่าชื่อรายการ "มี" คำสำคัญหรือไม่
                if (itemValue.toLowerCase().includes(keyword.toLowerCase())) {
                  category = mainCategory; // 4. ถ้าเจอ ให้ใช้ชื่อหมวดหมู่หลัก
                  foundMatch = true;
                  break;
                }
              }
            }
            if (foundMatch) break;
          }
          // ถ้าไม่ตรงกับกฎใดๆ category จะยังคงเป็นชื่อรายการเดิม

          expenseByCategory[category] = (expenseByCategory[category] || 0) + amountValue;
          // ========================================================
        }
      }
    }

    return {
      success: true,
      data: {
        revenues,
        expenses,
        expenseByCategory,
        profitByCar
      }
    };
  } catch (e) {
    Logger.log(`Error in getFinancialData: ${e.message} | Stack: ${e.stack}`);
    return { success: false, message: e.message };
  }
}




// ฟังก์ชันสำหรับดึงข้อมูลพยากรณ์การจอง 7 วันข้างหน้า
function getBookingForecastData(sheetID) {
  try {
    const sheet = SpreadsheetApp.openById(sheetID).getSheetByName('รายการเช่า');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const colIndex = {
      car: headers.indexOf('รถ'),
      startDate: headers.indexOf('วันที่เช่า'),
      endDate: headers.indexOf('วันที่คืน')
    };
    
    // ตรวจสอบว่าพบคอลัมน์ที่ต้องการหรือไม่
    if (Object.values(colIndex).some(index => index === -1)) {
      throw new Error('ไม่พบคอลัมน์ที่จำเป็นในชีท "รายการเช่า"');
    }

    const forecast = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);

      const rentedCars = new Set(); // ใช้ Set เพื่อไม่นับรถคันเดียวกันซ้ำในวันเดียว

      for (let j = 1; j < data.length; j++) {
        const row = data[j];
        const startDate = new Date(row[colIndex.startDate]);
        const endDate = new Date(row[colIndex.endDate]);
        
        // กำหนดเวลาให้เป็น 00:00:00 เพื่อเปรียบเทียบเฉพาะวัน
        startDate.setHours(0,0,0,0);
        endDate.setHours(0,0,0,0);

        if (targetDate >= startDate && targetDate <= endDate) {
          rentedCars.add(row[colIndex.car]);
        }
      }
      
      // จัดรูปแบบวันที่เป็น "วัน/เดือน" เช่น "16/มิ.ย."
      const formattedDate = targetDate.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short'
      });
      
      forecast.push({ date: formattedDate, count: rentedCars.size });
    }

    return forecast;
  } catch (e) {
    Logger.log('Error in getBookingForecastData: ' + e.toString());
    return []; // คืนค่า array ว่างในกรณีเกิดข้อผิดพลาด
  }
}




function copyRentalToFinance() {
  const ss = SpreadsheetApp.openById('1azMsslsuoV-Y6p5kZjtqWxpqapj8sq3-APHVAmfpnqQ');
  const rentalSheet = ss.getSheetByName('รายการเช่า');
  const financeSheet = ss.getSheetByName('รายรับรายจ่าย');

  const data = rentalSheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1); // ข้ามหัวตาราง

  const output = [];

  rows.forEach(row => {
    const rentDate = row[6]; // คอลัมน์ G - วันที่เช่า
    const bookingNo = row[1]; // คอลัมน์ B - หมายเลขการจอง
    const total = row[16]; // คอลัมน์ Q - ยอดรวม
    const carName = row[4]; // คอลัมน์ E - ชื่อรถ

    if (rentDate && bookingNo && total && carName) {
      const formattedDate = formatDatecopyRental(rentDate);
      output.push([
        formattedDate, // คอลัมน์ A
        'รายรับ', // คอลัมน์ B
        'ค่าเช่า #' + bookingNo, // คอลัมน์ C
        total, // คอลัมน์ D
        bookingNo, // คอลัมน์ E
        carName, // คอลัมน์ F
        'บันทึกอัตโนมัติจากระบบ' // คอลัมน์ G
      ]);
    }
  });

  if (output.length > 0) {
    financeSheet.getRange(financeSheet.getLastRow() + 1, 1, output.length, output[0].length).setValues(output);
  }
}

function formatDatecopyRental(dateObj) {
  if (Object.prototype.toString.call(dateObj) === '[object Date]' && !isNaN(dateObj)) {
    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return '';
}





/**
 * บันทึกการตั้งค่าหมวดหมู่รายจ่ายลงในชีต "ตั้งค่าระบบ"
 * @param {string} sheetID - ID ของ Google Sheet
 * @param {Array} categories - Array ของชื่อหมวดหมู่ที่ต้องการบันทึก
 * @returns {object} ผลลัพธ์การบันทึก
 */
function saveExpenseCategories(sheetID, categories) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const settingsSheet = ss.getSheetByName("ตั้งค่าระบบ");

    if (!settingsSheet) {
      return { success: false, message: "ไม่พบชีต 'ตั้งค่าระบบ'" };
    }

    // สร้างข้อมูล JSON สำหรับหมวดหมู่ ค่า Key และ Value จะเหมือนกัน
    const categoryMapping = {};
    categories.forEach(cat => {
      // ใช้ชื่อหมวดหมู่เป็น Key และสร้าง Value เป็น Array ที่มีแค่ชื่อตัวเอง
      // เพื่อให้ฟังก์ชัน getFinancialData เดิมยังทำงานได้
      categoryMapping[cat] = [cat]; 
    });

    const jsonData = JSON.stringify(categoryMapping);

    // ค้นหาแถวที่มี "การจับคู่หมวดหมู่รายจ่าย"
    const data = settingsSheet.getDataRange().getValues();
    let foundRow = -1;
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === "การจับคู่หมวดหมู่รายจ่าย") {
        foundRow = i + 1; // +1 เพราะ getRange เริ่มจาก 1
        break;
      }
    }

    if (foundRow > 0) {
      // อัปเดตข้อมูลที่มีอยู่
      settingsSheet.getRange(foundRow, 2).setValue(jsonData);
    } else {
      // เพิ่มข้อมูลใหม่ถ้ายังไม่มี
      settingsSheet.appendRow(["การจับคู่หมวดหมู่รายจ่าย", jsonData]);
    }
    
    return { success: true, message: "บันทึกหมวดหมู่รายจ่ายสำเร็จ" };
  } catch (e) {
    Logger.log("Error in saveExpenseCategories: " + e.toString());
    return { success: false, message: "เกิดข้อผิดพลาด: " + e.message };
  }
}







