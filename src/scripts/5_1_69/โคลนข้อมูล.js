// Global variables for spreadsheet IDs
const SOURCE_SPREADSHEET_ID = '13OL8jceGtbvqq7vZT3hOaExcrSoRIecWzQ9s5O-1YQ4';
const TARGET_SPREADSHEET_ID = '1azMsslsuoV-Y6p5kZjtqWxpqapj8sq3-APHVAmfpnqQ';


// Global variables for sheet names
const SOURCE_BOOKING_SHEET_NAME = 'booking';
const TARGET_RENTAL_SHEET_NAME = 'รายการเช่า';
const CAR_LIST_SHEET_NAME = 'รายชื่อรถ';
const SCHEDULE_SHEET_NAME = 'ตารางรับส่งรถ';

// function copyDataBetweenSheets() {
//   // เปิดชีตต้นทางและปลายทาง
//   const sourceSpreadsheet = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
//   const targetSpreadsheet = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  
//   // เลือกแผ่นงานที่ต้องการ
//   const sourceSheet = sourceSpreadsheet.getSheetByName(SOURCE_BOOKING_SHEET_NAME);
//   const targetSheet = targetSpreadsheet.getSheetByName(TARGET_RENTAL_SHEET_NAME);
  
//   if (!sourceSheet || !targetSheet) {
//     Logger.log('ไม่พบแผ่นงานที่ระบุ');
//     return;
//   }
  
//   Logger.log('เริ่มต้นการคัดลอกข้อมูล');
  
//   // ดึงข้อมูลทั้งหมดจากแผ่นงานต้นทาง
//   const sourceData = sourceSheet.getDataRange().getValues();
  
//   // เตรียมอาร์เรย์สำหรับเก็บข้อมูลที่จะนำไปใส่ในชีตปลายทาง
//   const targetData = [];
//   const targetFormats = {
//     dateCols: [],        // คอลัมที่เป็นวันที่
//     timeCols: [],        // คอลัมที่เป็นเวลา
//     numberCols: [],      // คอลัมที่เป็นตัวเลข
//     textCols: []         // คอลัมที่เป็นข้อความ
//   };
  
//   // เริ่มจากแถวที่ 2 (ข้ามส่วนหัว)
//   for (let i = 1; i < sourceData.length; i++) {
//     const row = sourceData[i];
    
//     // ตรวจสอบว่ามีข้อมูลในแถวหรือไม่
//     if (row[0] === '') continue;
    
//     // สร้างแถวข้อมูลใหม่สำหรับชีตปลายทาง (เริ่มต้นด้วยค่าว่างทั้งหมด)
//     const newRow = Array(28).fill('');  // เพิ่มขนาดอาร์เรย์เป็น 28 (A-AB)
    
//     // คัดลอกข้อมูลตามที่กำหนด
//     newRow[13] = row[0];   // A -> N (คอลัม 14)
//     // เพิ่มการคัดลอกจาก B -> Z
//     newRow[25] = row[1];   // B -> Z (คอลัม 26)
//     newRow[4] = row[2];    // C -> E (คอลัม 5)
//     newRow[0] = row[3];    // D -> A (คอลัม 1)
//     newRow[1] = row[4];    // E -> B (คอลัม 2)
//     newRow[24] = row[5];   // F -> Y (คอลัม 25)
    
//     // แปลงวันที่จากรูปแบบ dd/mm/yyyy เป็น yyyy-mm-dd
//     if (row[7] && row[7] !== '') {
//       const dateValue = row[7];
//       if (dateValue instanceof Date) {
//         newRow[6] = dateValue;  // H -> G (คอลัม 7)
//       } else if (typeof dateValue === 'string') {
//         const dateParts = dateValue.split('/');
//         if (dateParts.length === 3) {
//           newRow[6] = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
//         }
//       }
//     }
    
//     // คัดลอกเวลาจาก I -> I
//     newRow[8] = row[8];    // I -> I (คอลัม 9)
    
//     newRow[14] = row[9];   // J -> O (คอลัม 15)
    
//     // แปลงวันที่ K -> H
//     if (row[10] && row[10] !== '') {
//       const dateValue = row[10];
//       if (dateValue instanceof Date) {
//         newRow[7] = dateValue;  // K -> H (คอลัม 8)
//       } else if (typeof dateValue === 'string') {
//         const dateParts = dateValue.split('/');
//         if (dateParts.length === 3) {
//           newRow[7] = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
//         }
//       }
//     }
    
//     // คัดลอกเวลาจาก L -> J
//     newRow[9] = row[11];    // L -> J (คอลัม 10)
    
//     newRow[15] = row[12];   // M -> P (คอลัม 16)
//     newRow[10] = row[13];   // N -> K (คอลัม 11)
//     newRow[16] = row[14];   // O -> Q (คอลัม 17)
//     newRow[18] = row[15];   // P -> S (คอลัม 19)
//     newRow[19] = row[17];   // R -> T (คอลัม 20)
//     newRow[17] = row[19];   // T -> R (คอลัม 18)
    
//     // รวมชื่อและนามสกุล V+W -> C
//     const firstName = row[21] || '';
//     const lastName = row[22] || '';
//     const fullName = firstName + (lastName ? ' ' + lastName : '');
//     newRow[2] = fullName;   // V+W -> C (คอลัม 3)
    
//     newRow[21] = row[24];   // Y -> V (คอลัม 22)
//     newRow[22] = row[25];   // Z -> W (คอลัม 23)
//     newRow[3] = row[27];    // AB -> D (คอลัม 4)
//     newRow[23] = row[28];   // AC -> X (คอลัม 24)
    
//     // เพิ่มการคัดลอกจาก AF -> AA และ AG -> AB
//     newRow[26] = row[31];   // AF -> AA (คอลัม 27)
//     newRow[27] = row[32];   // AG -> AB (คอลัม 28)
    
//     // คำนวณผลรวมในคอลัม U: Q+S-R
//     const valueQ = row[14] ? parseFloat(row[14]) : 0;  // O -> Q (คอลัม 17)
//     const valueS = row[15] ? parseFloat(row[15]) : 0;  // P -> S (คอลัม 19)
//     const valueR = row[19] ? parseFloat(row[19]) : 0;  // T -> R (คอลัม 18)
//     newRow[20] = valueQ + valueS - valueR;  // -> U (คอลัม 21)
    
//     // เพิ่มแถวข้อมูลใหม่ลงในอาร์เรย์
//     targetData.push(newRow);
    
//     // เก็บข้อมูลคอลัมที่ต้องการกำหนดรูปแบบ
//     targetFormats.dateCols.push({row: targetData.length, cols: [7, 8]});  // G, H
//     targetFormats.timeCols.push({row: targetData.length, cols: [9, 10]});  // I, J
//     targetFormats.numberCols.push({row: targetData.length, cols: [11, 17, 18, 19, 20, 21]});  // K, Q, R, S, T, U
//     targetFormats.textCols.push({row: targetData.length, cols: [1, 2, 3, 4, 5, 6, 25, 26, 27]});  // D, E, F, Z, AA, AB
    
//     Logger.log('เตรียมข้อมูลแถวที่ ' + (i + 1) + ' จากชีตต้นทาง');
//   }
  
//   // ถ้ามีข้อมูลที่จะคัดลอก
//   if (targetData.length > 0) {
//     // หาแถวว่างถัดไปในชีตปลายทาง
//     const targetLastRow = targetSheet.getLastRow() + 1;
    
//     // เพิ่มข้อมูลทั้งหมดในครั้งเดียว
//     targetSheet.getRange(targetLastRow, 1, targetData.length, 28).setValues(targetData);
    
//     Logger.log('คัดลอกข้อมูลทั้งหมด ' + targetData.length + ' แถว ไปยังชีตปลายทาง');
    
//     // ตั้งค่ารูปแบบหลังจากเพิ่มข้อมูล
//     for (let i = 0; i < targetData.length; i++) {
//       const currentRow = targetLastRow + i;
      
//       // ตั้งค่ารูปแบบวันที่
//       targetFormats.dateCols[i].cols.forEach(col => {
//         targetSheet.getRange(currentRow, col).setNumberFormat('yyyy-mm-dd');
//       });
      
//       // ตั้งค่ารูปแบบเวลา (แสดงเฉพาะเวลา ไม่แสดงวันที่)
//       targetFormats.timeCols[i].cols.forEach(col => {
//         targetSheet.getRange(currentRow, col).setNumberFormat('HH:mm:ss');
//       });
      
//       // ตั้งค่ารูปแบบตัวเลข
//       targetFormats.numberCols[i].cols.forEach(col => {
//         targetSheet.getRange(currentRow, col).setNumberFormat('#,##0.00');
//       });
      
//       // ตั้งค่ารูปแบบข้อความ
//       targetFormats.textCols[i].cols.forEach(col => {
//         targetSheet.getRange(currentRow, col).setNumberFormat('@');
//       });
      
//       Logger.log('ตั้งค่ารูปแบบแถวที่ ' + currentRow);
//     }
//   }
  
//   Logger.log('เสร็จสิ้นการคัดลอกและตั้งค่าข้อมูลทั้งหมด');
// }


// ฟังก์ชันสำหรับแยก URL จาก HYPERLINK formula
function extractUrlFromHyperlink(cellValue) {
  if (!cellValue) return '';
  
  // แปลงเป็น string ถ้าไม่ใช่
  const stringValue = cellValue.toString();
  
  // ตรวจสอบว่าเป็น HYPERLINK formula หรือไม่
  if (stringValue.startsWith('=HYPERLINK(')) {
    // ใช้ regex เพื่อดึง URL จากภายใน HYPERLINK
    const urlMatch = stringValue.match(/=HYPERLINK\("([^"]+)"/);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }
  }
  
  // ถ้าไม่ใช่ HYPERLINK หรือแยก URL ไม่ได้ ให้คืนค่าเดิม
  return stringValue;
}

function copyDataBetweenSheets() {
  // เปิดชีตต้นทางและปลายทาง
  const sourceSpreadsheet = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
  const targetSpreadsheet = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  
  // เลือกแผ่นงานที่ต้องการ
  const sourceSheet = sourceSpreadsheet.getSheetByName(SOURCE_BOOKING_SHEET_NAME);
  const targetSheet = targetSpreadsheet.getSheetByName(TARGET_RENTAL_SHEET_NAME);
  
  if (!sourceSheet || !targetSheet) {
    Logger.log('ไม่พบแผ่นงานที่ระบุ');
    return;
  }
  
  Logger.log('เริ่มต้นการคัดลอกข้อมูล');
  
  // ดึงข้อมูลทั้งหมดจากแผ่นงานต้นทาง
  const sourceData = sourceSheet.getDataRange().getValues();
  // ดึงข้อมูล formula สำหรับตรวจสอบ HYPERLINK
  const sourceFormulas = sourceSheet.getDataRange().getFormulas();
  
  // เตรียมอาร์เรย์สำหรับเก็บข้อมูลที่จะนำไปใส่ในชีตปลายทาง
  const targetData = [];
  const targetFormats = {
    dateCols: [],        // คอลัมที่เป็นวันที่
    timeCols: [],        // คอลัมที่เป็นเวลา
    numberCols: [],      // คอลัมที่เป็นตัวเลข
    textCols: []         // คอลัมที่เป็นข้อความ
  };
  
  // เริ่มจากแถวที่ 2 (ข้ามส่วนหัว)
  for (let i = 1; i < sourceData.length; i++) {
    const row = sourceData[i];
    const formulaRow = sourceFormulas[i];
    
    // ตรวจสอบว่ามีข้อมูลในแถวหรือไม่
    if (row[0] === '') continue;
    
    // สร้างแถวข้อมูลใหม่สำหรับชีตปลายทาง (เริ่มต้นด้วยค่าว่างทั้งหมด)
    const newRow = Array(28).fill('');  // เพิ่มขนาดอาร์เรย์เป็น 28 (A-AB)
    
    // จัดการคอลัม A (index 0) - ตรวจสอบ HYPERLINK ก่อน
    let columnAValue = row[0];
    if (formulaRow[0] && formulaRow[0].startsWith('=HYPERLINK(')) {
      columnAValue = extractUrlFromHyperlink(formulaRow[0]);
      Logger.log('พบ HYPERLINK ในคอลัม A: ' + columnAValue);
    }
    newRow[13] = columnAValue;   // A -> N (คอลัม 14)
    
    // จัดการคอลัม B (index 1) - ตรวจสอบ HYPERLINK ก่อน
    let columnBValue = row[1];
    if (formulaRow[1] && formulaRow[1].startsWith('=HYPERLINK(')) {
      columnBValue = extractUrlFromHyperlink(formulaRow[1]);
      Logger.log('พบ HYPERLINK ในคอลัม B: ' + columnBValue);
    }
    newRow[25] = columnBValue;   // B -> Z (คอลัม 26)
    
    // คัดลอกข้อมูลอื่นๆ ตามเดิม
    newRow[4] = row[2];    // C -> E (คอลัม 5)
    newRow[0] = row[3];    // D -> A (คอลัม 1)
    newRow[1] = row[4];    // E -> B (คอลัม 2)
    newRow[24] = row[5];   // F -> Y (คอลัม 25)
    
    // แปลงวันที่จากรูปแบบ dd/mm/yyyy เป็น yyyy-mm-dd
    if (row[7] && row[7] !== '') {
      const dateValue = row[7];
      if (dateValue instanceof Date) {
        newRow[6] = dateValue;  // H -> G (คอลัม 7)
      } else if (typeof dateValue === 'string') {
        const dateParts = dateValue.split('/');
        if (dateParts.length === 3) {
          newRow[6] = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
        }
      }
    }
    
    // คัดลอกเวลาจาก I -> I
    newRow[8] = row[8];    // I -> I (คอลัม 9)
    
    newRow[14] = row[9];   // J -> O (คอลัม 15)
    
    // แปลงวันที่ K -> H
    if (row[10] && row[10] !== '') {
      const dateValue = row[10];
      if (dateValue instanceof Date) {
        newRow[7] = dateValue;  // K -> H (คอลัม 8)
      } else if (typeof dateValue === 'string') {
        const dateParts = dateValue.split('/');
        if (dateParts.length === 3) {
          newRow[7] = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
        }
      }
    }
    
    // คัดลอกเวลาจาก L -> J
    newRow[9] = row[11];    // L -> J (คอลัม 10)
    
    newRow[15] = row[12];   // M -> P (คอลัม 16)
    newRow[10] = row[13];   // N -> K (คอลัม 11)
    newRow[16] = row[14];   // O -> Q (คอลัม 17)
    newRow[18] = row[15];   // P -> S (คอลัม 19)
    newRow[19] = row[17];   // R -> T (คอลัม 20)
    newRow[17] = row[19];   // T -> R (คอลัม 18)
    
    // รวมชื่อและนามสกุล V+W -> C
    const firstName = row[21] || '';
    const lastName = row[22] || '';
    const fullName = firstName + (lastName ? ' ' + lastName : '');
    newRow[2] = fullName;   // V+W -> C (คอลัม 3)
    
    newRow[21] = row[24];   // Y -> V (คอลัม 22)
    newRow[22] = row[25];   // Z -> W (คอลัม 23)
    newRow[3] = row[27];    // AB -> D (คอลัม 4)
    newRow[23] = row[28];   // AC -> X (คอลัม 24)
    
    // เพิ่มการคัดลอกจาก AF -> AA และ AG -> AB
    newRow[26] = row[31];   // AF -> AA (คอลัม 27)
    newRow[27] = row[32];   // AG -> AB (คอลัม 28)
    
    // คำนวณผลรวมในคอลัม U: Q+S-R
    const valueQ = row[14] ? parseFloat(row[14]) : 0;  // O -> Q (คอลัม 17)
    const valueS = row[15] ? parseFloat(row[15]) : 0;  // P -> S (คอลัม 19)
    const valueR = row[19] ? parseFloat(row[19]) : 0;  // T -> R (คอลัม 18)
    newRow[20] = valueQ + valueS - valueR;  // -> U (คอลัม 21)
    
    // เพิ่มแถวข้อมูลใหม่ลงในอาร์เรย์
    targetData.push(newRow);
    
    // เก็บข้อมูลคอลัมที่ต้องการกำหนดรูปแบบ
    targetFormats.dateCols.push({row: targetData.length, cols: [7, 8]});  // G, H
    targetFormats.timeCols.push({row: targetData.length, cols: [9, 10]});  // I, J
    targetFormats.numberCols.push({row: targetData.length, cols: [11, 17, 18, 19, 20, 21]});  // K, Q, R, S, T, U
    targetFormats.textCols.push({row: targetData.length, cols: [1, 2, 3, 4, 5, 6, 25, 26, 27]});  // D, E, F, Z, AA, AB
    
    Logger.log('เตรียมข้อมูลแถวที่ ' + (i + 1) + ' จากชีตต้นทาง');
  }
  
  // ถ้ามีข้อมูลที่จะคัดลอก
  if (targetData.length > 0) {
    // หาแถวว่างถัดไปในชีตปลายทาง
    const targetLastRow = targetSheet.getLastRow() + 1;
    
    // เพิ่มข้อมูลทั้งหมดในครั้งเดียว
    targetSheet.getRange(targetLastRow, 1, targetData.length, 28).setValues(targetData);
    
    Logger.log('คัดลอกข้อมูลทั้งหมด ' + targetData.length + ' แถว ไปยังชีตปลายทาง');
    
    // ตั้งค่ารูปแบบหลังจากเพิ่มข้อมูล
    for (let i = 0; i < targetData.length; i++) {
      const currentRow = targetLastRow + i;
      
      // ตั้งค่ารูปแบบวันที่
      targetFormats.dateCols[i].cols.forEach(col => {
        targetSheet.getRange(currentRow, col).setNumberFormat('yyyy-mm-dd');
      });
      
      // ตั้งค่ารูปแบบเวลา (แสดงเฉพาะเวลา ไม่แสดงวันที่)
      targetFormats.timeCols[i].cols.forEach(col => {
        targetSheet.getRange(currentRow, col).setNumberFormat('HH:mm:ss');
      });
      
      // ตั้งค่ารูปแบบตัวเลข
      targetFormats.numberCols[i].cols.forEach(col => {
        targetSheet.getRange(currentRow, col).setNumberFormat('#,##0.00');
      });
      
      // ตั้งค่ารูปแบบข้อความ
      targetFormats.textCols[i].cols.forEach(col => {
        targetSheet.getRange(currentRow, col).setNumberFormat('@');
      });
      
      Logger.log('ตั้งค่ารูปแบบแถวที่ ' + currentRow);
    }
  }
  
  Logger.log('เสร็จสิ้นการคัดลอกและตั้งค่าข้อมูลทั้งหมด');
}






function copyCarList() {
  // เปิดสเปรดชีต
  const sourceSpreadsheet = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
  const targetSpreadsheet = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  
  // เลือกแผ่นงานชื่อ "รายชื่อรถ"
  const sourceSheet = sourceSpreadsheet.getSheetByName(CAR_LIST_SHEET_NAME);
  const targetSheet = targetSpreadsheet.getSheetByName(CAR_LIST_SHEET_NAME);
  if (!sourceSheet || !targetSheet) {
    Logger.log('ไม่พบแผ่นงานชื่อ "' + CAR_LIST_SHEET_NAME + '"');
    return;
  }
  
  // ดึงข้อมูลทั้งหมดจากต้นทาง (รวมหัว)
  const sourceData = sourceSheet.getDataRange().getValues();
  const targetData = [];
  
  // เริ่มจากแถวที่ 2 เพื่อข้ามส่วนหัว
  for (let i = 1; i < sourceData.length; i++) {
    const row = sourceData[i];
    // ข้ามถ้าไม่มีค่าในคอลัมน์หลัก (เช่น คอลัมน์ D)
    if (!row[3]) continue;
    
    // สร้างแถวเปล่าให้ยาวพอ (คอลัมน์ A–K = 11 คอลัมน์)
    const newRow = Array(11).fill('');
    
    // แม็ปค่าตามที่ระบุ (zero‑index)
    newRow[10] = row[3];   // D -> K (index 3 -> 10)
    newRow[7]  = row[5];   // F -> H (index 5 -> 7)
    newRow[0]  = row[8];   // I -> A (index 8 -> 0)
    newRow[1]  = row[9];   // J -> B (index 9 -> 1)
    newRow[5]  = row[10];  // K -> F (index 10 -> 5)
    
    targetData.push(newRow);
  }
  
  if (targetData.length > 0) {
    // หาแถวว่างถัดไปในชีตปลายทาง
    const startRow = targetSheet.getLastRow() + 1;
    // วางข้อมูล (rows × 11 columns)
    targetSheet.getRange(startRow, 1, targetData.length, 11)
               .setValues(targetData);
    Logger.log('คัดลอกรายชื่อรถ ' + targetData.length + ' แถวสำเร็จ');
  } else {
    Logger.log('ไม่พบข้อมูลที่จะคัดลอก');
  }
}










function copyDataToScheduleTable() {
  // เปิดชีต
  const spreadsheet = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  
  // เลือกแผ่นงานต้นทางและปลายทาง
  const sourceSheet = spreadsheet.getSheetByName(TARGET_RENTAL_SHEET_NAME);
  const targetSheet = spreadsheet.getSheetByName(SCHEDULE_SHEET_NAME);
  
  if (!sourceSheet || !targetSheet) {
    Logger.log('ไม่พบแผ่นงานที่ระบุ');
    return;
  }
  
  Logger.log('เริ่มต้นการคัดลอกข้อมูลไปยังตารางรับส่งรถ');
  
  // ดึงข้อมูลทั้งหมดจากแผ่นงานต้นทาง
  const sourceData = sourceSheet.getDataRange().getValues();
  
  // เตรียมอาร์เรย์สำหรับเก็บข้อมูลที่จะนำไปใส่ในชีตปลายทาง
  const targetData = [];
  
  // เริ่มจากแถวที่ 2 (ข้ามส่วนหัว)
  for (let i = 1; i < sourceData.length; i++) {
    const row = sourceData[i];
    
    // ตรวจสอบว่ามีข้อมูลในแถวหรือไม่
    if (row[1] === '') continue; // ข้ามแถวที่ไม่มีข้อมูลในคอลัม B
    
    // ===== สร้างข้อมูลแถวแรก (รับรถ) =====
    const pickupRow = [
      row[1],            // A <- B (ข้อมูลจากคอลัม B)
      row[6],            // B <- G (ข้อมูลจากคอลัม G)
      row[8],            // C <- I (ข้อมูลจากคอลัม I)
      row[2],            // D <- C (ข้อมูลจากคอลัม C)
      row[4],            // E <- E (ข้อมูลจากคอลัม E)
      'รับรถ',           // F (เพิ่มคำว่า "รับรถ")
      row[12]            // G <- M (ข้อมูลจากคอลัม M)
    ];
    
    // ===== สร้างข้อมูลแถวที่สอง (ส่งคืนรถ) =====
    const returnRow = [
      row[1],            // A <- B (ข้อมูลจากคอลัม B)
      row[7],            // B <- H (ข้อมูลจากคอลัม H)
      row[9],            // C <- J (ข้อมูลจากคอลัม J)
      row[2],            // D <- C (ข้อมูลจากคอลัม C)
      row[4],            // E <- E (ข้อมูลจากคอลัม E)
      'ส่งคืนรถ',         // F (เพิ่มคำว่า "ส่งคืนรถ")
      row[12]            // G <- M (ข้อมูลจากคอลัม M)
    ];
    
    // เพิ่มทั้งสองแถวลงในข้อมูลเป้าหมาย
    targetData.push(pickupRow);
    targetData.push(returnRow);
    
    Logger.log('เตรียมข้อมูลรับส่งรถจากแถวที่ ' + (i + 1) + ' ของแผ่นงานต้นทาง');
  }
  
  // ถ้ามีข้อมูลที่จะคัดลอก
  if (targetData.length > 0) {
    // ล้างข้อมูลเดิมในแผ่นงานปลายทาง (ถ้ามี) ยกเว้นแถวหัวตาราง
    const lastRow = targetSheet.getLastRow();
    if (lastRow > 1) {
      targetSheet.getRange(2, 1, lastRow - 1, 7).clearContent();
    }
    
    // เพิ่มข้อมูลทั้งหมดในครั้งเดียว
    targetSheet.getRange(2, 1, targetData.length, 7).setValues(targetData);
    
    Logger.log('คัดลอกข้อมูลทั้งหมด ' + targetData.length + ' แถว ไปยังแผ่นงานตารางรับส่งรถ');
    
    // ตั้งค่ารูปแบบหลังจากเพิ่มข้อมูล
    for (let i = 0; i < targetData.length; i++) {
      const currentRow = i + 2; // เริ่มจากแถวที่ 2
      
      // ตั้งค่ารูปแบบวันที่สำหรับคอลัม B
      targetSheet.getRange(currentRow, 2).setNumberFormat('yyyy-mm-dd');
      
      // ตั้งค่ารูปแบบเวลาสำหรับคอลัม C
      targetSheet.getRange(currentRow, 3).setNumberFormat('HH:mm:ss');
    }
    
    Logger.log('เสร็จสิ้นการตั้งค่ารูปแบบข้อมูลทั้งหมด');
  } else {
    Logger.log('ไม่พบข้อมูลที่จะคัดลอก');
  }
  
  Logger.log('เสร็จสิ้นการคัดลอกและตั้งค่าข้อมูลทั้งหมด');
}











// ฟังก์ชันสำหรับแก้ไขข้อมูลในแผ่นงาน "รายการเช่า"
function changeVehicleInfo() {
  const spreadsheet = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(TARGET_RENTAL_SHEET_NAME);
  
  if (!sheet) {
    Logger.log('ไม่พบแผ่นงาน "รายการเช่า"');
    return;
  }
  
  // สร้างแผ่นงานสำรองก่อนแก้ไข (ถ้ายังไม่มี)
  const backupSheetName = 'รายการเช่า_สำรอง_' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMdd_HHmmss');
  sheet.copyTo(spreadsheet).setName(backupSheetName);
  Logger.log('สร้างแผ่นงานสำรอง: ' + backupSheetName);
  
  // ดึงข้อมูลทั้งหมด
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log('ไม่มีข้อมูลในแผ่นงาน');
    return;
  }
  
  const dataRange = sheet.getRange(2, 5, lastRow - 1, 2); // คอลัมน์ E และ F เริ่มจากแถวที่ 2
  const data = dataRange.getValues();
  
  let updateCount = 0;
  let errorCount = 0;
  const updatedData = [];
  
  // ประมวลผลข้อมูลทีละแถว
  for (let i = 0; i < data.length; i++) {
    const rowNumber = i + 2; // แถวจริงในชีต
    const columnE = data[i][0]; // คอลัมน์ E
    const columnF = data[i][1]; // คอลัมน์ F
    
    // ข้ามแถวที่ว่าง
    if (!columnE || columnE.toString().trim() === '') {
      updatedData.push([columnE, columnF]);
      continue;
    }
    
    try {
      const originalText = columnE.toString().trim();
      const result = formatVehicleInfo(originalText);
      
      if (result.success) {
        updatedData.push([result.formattedText, result.licensePlate]);
        updateCount++;
        Logger.log(`แถว ${rowNumber}: "${originalText}" -> "${result.formattedText}" | "${result.licensePlate}"`);
      } else {
        // ถ้าไม่สามารถแปลงได้ ให้เก็บข้อมูลเดิม
        updatedData.push([columnE, columnF]);
        Logger.log(`แถว ${rowNumber}: ไม่สามารถแปลงได้ - ${result.error}`);
        errorCount++;
      }
    } catch (error) {
      updatedData.push([columnE, columnF]);
      Logger.log(`แถว ${rowNumber}: เกิดข้อผิดพลาด - ${error.message}`);
      errorCount++;
    }
  }
  
  // อัพเดทข้อมูลในชีต
  if (updateCount > 0) {
    dataRange.setValues(updatedData);
    Logger.log(`อัพเดทข้อมูลเสร็จสิ้น: ${updateCount} แถว, ข้อผิดพลาด: ${errorCount} แถว`);
    
    // แสดงผลสรุป
    SpreadsheetApp.getUi().alert(
      'การอัพเดทเสร็จสิ้น',
      `อัพเดทข้อมูลสำเร็จ: ${updateCount} แถว\n` +
      `ข้อผิดพลาด: ${errorCount} แถว\n` +
      `สร้างแผ่นงานสำรอง: ${backupSheetName}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } else {
    Logger.log('ไม่มีข้อมูลที่ต้องอัพเดท');
    SpreadsheetApp.getUi().alert('ไม่มีข้อมูลที่ต้องอัพเดท');
  }
}




// ฟังก์ชันสำหรับแปลงรูปแบบข้อมูลรถ (ปรับปรุงแล้ว)
function formatVehicleInfo(originalText) {
  try {
    // รูปแบบ regex สำหรับจับป้ายทะเบียนไทย (รองรับหลากหลายรูปแบบ)
    
    // Pattern 1: รูปแบบเดิม - ป้ายทะเบียนแบบเก่า มีเว้นวรรค (จจ-9431 เชียงใหม่)
    const pattern1 = /^(.+?)\s+([ก-๙]{1,3}[-][0-9]{1,4})\s+(.+)$/;
    
    // Pattern 2: รูปแบบเดิม - ป้ายทะเบียนแบบเก่า ไม่มีเว้นวรรค (จท-7047เชียงใหม่)
    const pattern2 = /^(.+?)\s+([ก-๙]{1,3}[-][0-9]{1,4})([ก-๙].*)$/;
    
    // Pattern 3: รูปแบบเดิม - ป้ายทะเบียนแบบใหม่ไม่มีขีด มีเว้นวรรค (1กก1234 เชียงใหม่)  
    const pattern3 = /^(.+?)\s+([0-9][ก-๙]{2}[0-9]{1,4})\s+(.+)$/;
    
    // Pattern 4: รูปแบบเดิม - ป้ายทะเบียนแบบใหม่ไม่มีขีด ไม่มีเว้นวรรค (1กก1234เชียงใหม่)
    const pattern4 = /^(.+?)\s+([0-9][ก-๙]{2}[0-9]{1,4})([ก-๙].*)$/;
    
    // Pattern 5: รูปแบบเดิม - ป้ายทะเบียนแบบใหม่มีขีด มีเว้นวรรค (3วท-1492 กทม)
    const pattern5 = /^(.+?)\s+([0-9][ก-๙]{2}[-][0-9]{1,4})\s+(.+)$/;
    
    // Pattern 6: รูปแบบเดิม - ป้ายทะเบียนแบบใหม่มีขีด ไม่มีเว้นวรรค (3วท-1492กทม)
    const pattern6 = /^(.+?)\s+([0-9][ก-๙]{2}[-][0-9]{1,4})([ก-๙].*)$/;
    
    // *** Patterns ใหม่สำหรับกรณีพิเศษ ***
    
    // Pattern 7: ป้ายทะเบียนที่มีขีดเชื่อมกับจังหวัด (จต-9430-เชียงใหม่)
    const pattern7 = /^(.+?)\s+([ก-๙]{1,3}[-][0-9]{1,4})[-](.+)$/;
    
    // Pattern 8: ป้ายทะเบียนแบบใหม่ที่มีขีดเชื่อมกับจังหวัด (3ขร-7683-กรุงเทพ)
    const pattern8 = /^(.+?)\s+([0-9][ก-๙]{2}[-][0-9]{1,4})[-](.+)$/;
    
    // Pattern 9: ป้ายทะเบียนแบบเก่าที่มีช่องว่างระหว่างตัวอักษรกับตัวเลข (จต 8393 เชียงใหม่)
    const pattern9 = /^(.+?)\s+([ก-๙]{1,3})\s+([0-9]{1,4})\s+(.+)$/;
    
    // Pattern 10: ป้ายทะเบียนแบบใหม่ที่มีช่องว่างระหว่างตัวอักษรกับตัวเลข (บธ 4994 อุดร)
    const pattern10 = /^(.+?)\s+([ก-๙]{2})\s+([0-9]{1,4})\s+(.+)$/;
    
    // Pattern 11: ป้ายทะเบียนที่ไม่มีจังหวัด - แบบใหม่ (3ขร7683)
    const pattern11 = /^(.+?)\s+([0-9][ก-๙]{2}[0-9]{1,4})$/;
    
    // Pattern 12: ป้ายทะเบียนที่ไม่มีจังหวัด - แบบเก่า (จต-1234)
    const pattern12 = /^(.+?)\s+([ก-๙]{1,3}[-][0-9]{1,4})$/;
    
    // Pattern 13: ป้ายทะเบียนที่ไม่มีจังหวัด แต่มีช่องว่าง (จต 1234)
    const pattern13 = /^(.+?)\s+([ก-๙]{1,3})\s+([0-9]{1,4})$/;
    
    // *** Patterns ใหม่สำหรับกรณีพิเศษเพิ่มเติม ***
    
    // Pattern 14: ป้ายทะเบียนแบบเก่าไม่มีขีด + จังหวัด + คำต่อท้าย (จข6817 ชม. ร่วม)
    const pattern14 = /^(.+?)\s+([ก-๙]{1,3}[0-9]{1,4})\s+(.+?)\s+(ร่วม|รถร่วม|ป้ายแดง|ป้ายขาว)$/;
    
    // Pattern 15: ป้ายทะเบียนแบบเก่าไม่มีขีด + จังหวัด (จข6817 ชม.)
    const pattern15 = /^(.+?)\s+([ก-๙]{1,3}[0-9]{1,4})\s+(.+)$/;
    
    // Pattern 16: ป้ายทะเบียนแค่ตัวเลข + จังหวัด + คำต่อท้าย (632 ชม. ร่วม)
    const pattern16 = /^(.+?)\s+([0-9]{1,4})\s+(.+?)\s+(ร่วม|รถร่วม|ป้ายแดง|ป้ายขาว)$/;
    
    // Pattern 17: ป้ายทะเบียนแค่ตัวเลข + จังหวัด (632 ชม.)
    const pattern17 = /^(.+?)\s+([0-9]{1,4})\s+(.+)$/;
    
    // Pattern 18: ป้ายทะเบียนแค่ตัวเลข + คำต่อท้าย (1630 ร่วม)
    const pattern18 = /^(.+?)\s+([0-9]{1,4})\s+(ร่วม|รถร่วม|ป้ายแดง|ป้ายขาว)$/;
    
    // Pattern 19: ป้ายทะเบียนแค่ตัวเลข ไม่มีจังหวัด (1630)
    const pattern19 = /^(.+?)\s+([0-9]{1,4})$/;
    
    // Pattern 20: ป้ายทะเบียนแบบใหม่มีช่องว่าง + จังหวัด + คำต่อท้าย (3ขฬ 1208 กทม ร่วม)
    const pattern20 = /^(.+?)\s+([0-9][ก-๙]{2})\s+([0-9]{1,4})\s+(.+?)\s+(ร่วม|รถร่วม|ป้ายแดง|ป้ายขาว)$/;
    
    // Pattern 21: ป้ายทะเบียนแบบใหม่มีช่องว่าง + จังหวัด (3ขฬ 1208 กทม)
    const pattern21 = /^(.+?)\s+([0-9][ก-๙]{2})\s+([0-9]{1,4})\s+(.+)$/;
    
    // ฟังก์ชันช่วยสำหรับขยายชื่อจังหวัดจากตัวย่อ
    function expandProvince(province) {
      const provinceMap = {
        'ชม.': 'เชียงใหม่',
        'ชม': 'เชียงใหม่',
        'กทม.': 'กรุงเทพมหานคร',
        'กทม': 'กรุงเทพมหานคร',
        'นครราชสีมา': 'นครราชสีมา',
        'ขอนแก่น': 'ขอนแก่น',
        'อุดร': 'อุดรธานี',
        'หาดใหญ่': 'สงขลา',
        'ภูเก็ต': 'ภูเก็ต',
        'ระยอง': 'ระยอง',
        'ชลบุรี': 'ชลบุรี',
        'กรุงเทพ': 'กรุงเทพมหานคร'
      };
      return provinceMap[province] || province;
    }
    
    let match;
    let vehicleInfo, licensePlate, province, extraInfo = '';
    
    // ลองแต่ละ pattern ตามลำดับ (เรียงตามความเฉพาะเจาะจงจากมากไปน้อย)
    if ((match = originalText.match(pattern14))) {
      // Pattern 14: จข6817 ชม. ร่วม
      vehicleInfo = match[1].trim();
      licensePlate = match[2].trim();
      province = expandProvince(match[3].trim());
      extraInfo = match[4].trim();
    } else if ((match = originalText.match(pattern16))) {
      // Pattern 16: 632 ชม. ร่วม
      vehicleInfo = match[1].trim();
      licensePlate = match[2].trim();
      province = expandProvince(match[3].trim());
      extraInfo = match[4].trim();
    } else if ((match = originalText.match(pattern18))) {
      // Pattern 18: 1630 ร่วม
      vehicleInfo = match[1].trim();
      licensePlate = match[2].trim();
      province = '';
      extraInfo = match[3].trim();
    } else if ((match = originalText.match(pattern20))) {
      // Pattern 20: 3ขฬ 1208 กทม ร่วม
      vehicleInfo = match[1].trim();
      licensePlate = match[2].trim() + '-' + match[3].trim(); // รวมเป็น 3ขฬ-1208
      province = expandProvince(match[4].trim());
      extraInfo = match[5].trim();
    } else if ((match = originalText.match(pattern21))) {
      // Pattern 21: 3ขฬ 1208 กทม
      vehicleInfo = match[1].trim();
      licensePlate = match[2].trim() + '-' + match[3].trim(); // รวมเป็น 3ขฬ-1208
      province = expandProvince(match[4].trim());
    } else if ((match = originalText.match(pattern15))) {
      // Pattern 15: จข6817 ชม.
      vehicleInfo = match[1].trim();
      licensePlate = match[2].trim();
      province = expandProvince(match[3].trim());
    } else if ((match = originalText.match(pattern17))) {
      // Pattern 17: 632 ชม.
      vehicleInfo = match[1].trim();
      licensePlate = match[2].trim();
      province = expandProvince(match[3].trim());
    } else if ((match = originalText.match(pattern19))) {
      // Pattern 19: 1630 (แค่ตัวเลข ไม่มีจังหวัด)
      vehicleInfo = match[1].trim();
      licensePlate = match[2].trim();
      province = '';
    } else if ((match = originalText.match(pattern7))) {
      // Pattern 7: จต-9430-เชียงใหม่
      vehicleInfo = match[1].trim();
      licensePlate = match[2].trim();
      province = expandProvince(match[3].trim());
    } else if ((match = originalText.match(pattern8))) {
      // Pattern 8: 3ขร-7683-กรุงเทพ
      vehicleInfo = match[1].trim();
      licensePlate = match[2].trim();
      province = expandProvince(match[3].trim());
    } else if ((match = originalText.match(pattern9))) {
      // Pattern 9: จต 8393 เชียงใหม่
      vehicleInfo = match[1].trim();
      licensePlate = match[2].trim() + '-' + match[3].trim(); // รวมเป็น จต-8393
      province = expandProvince(match[4].trim());
    } else if ((match = originalText.match(pattern10))) {
      // Pattern 10: บธ 4994 อุดร (ป้ายแบบใหม่ 2 ตัวอักษร)
      vehicleInfo = match[1].trim();
      licensePlate = match[2].trim() + '-' + match[3].trim(); // รวมเป็น บธ-4994
      province = expandProvince(match[4].trim());
    } else if ((match = originalText.match(pattern11))) {
      // Pattern 11: 3ขร7683 (ไม่มีจังหวัด)
      vehicleInfo = match[1].trim();
      licensePlate = match[2].trim();
      province = '';
    } else if ((match = originalText.match(pattern12))) {
      // Pattern 12: จต-1234 (ไม่มีจังหวัด)
      vehicleInfo = match[1].trim();
      licensePlate = match[2].trim();
      province = '';
    } else if ((match = originalText.match(pattern13))) {
      // Pattern 13: จต 1234 (ไม่มีจังหวัด แต่มีช่องว่าง)
      vehicleInfo = match[1].trim();
      licensePlate = match[2].trim() + '-' + match[3].trim();
      province = '';
    } else if ((match = originalText.match(pattern1))) {
      // Pattern เดิม 1
      vehicleInfo = match[1].trim();
      licensePlate = match[2].trim();
      province = expandProvince(match[3].trim());
    } else if ((match = originalText.match(pattern2))) {
      // Pattern เดิม 2
      vehicleInfo = match[1].trim();
      licensePlate = match[2].trim();
      province = expandProvince(match[3].trim());
    } else if ((match = originalText.match(pattern3))) {
      // Pattern เดิม 3
      vehicleInfo = match[1].trim();
      licensePlate = match[2].trim();
      province = expandProvince(match[3].trim());
    } else if ((match = originalText.match(pattern4))) {
      // Pattern เดิม 4
      vehicleInfo = match[1].trim();
      licensePlate = match[2].trim();
      province = expandProvince(match[3].trim());
    } else if ((match = originalText.match(pattern5))) {
      // Pattern เดิม 5
      vehicleInfo = match[1].trim();
      licensePlate = match[2].trim();
      province = expandProvince(match[3].trim());
    } else if ((match = originalText.match(pattern6))) {
      // Pattern เดิม 6
      vehicleInfo = match[1].trim();
      licensePlate = match[2].trim();
      province = expandProvince(match[3].trim());
    } else {
      // ลองรูปแบบอื่นที่อาจเป็นไปได้
      const alreadyFormatted = /^(.+?)\s*\((.+)\)$/.test(originalText);
      if (alreadyFormatted) {
        return {
          success: false,
          error: 'ข้อมูลถูกจัดรูปแบบแล้ว'
        };
      }
      
      return {
        success: false,
        error: 'ไม่พบรูปแบบป้ายทะเบียนที่รองรับ'
      };
    }
    
    // สร้างผลลัพธ์
    const fullLicensePlate = province ? `${licensePlate} ${province}` : licensePlate;
    const licenseWithExtra = extraInfo ? `${fullLicensePlate} ${extraInfo}` : fullLicensePlate;
    const formattedText = `${vehicleInfo} (${licenseWithExtra})`;
    
    return {
      success: true,
      formattedText: formattedText,
      licensePlate: licenseWithExtra,
      originalParts: {
        vehicle: vehicleInfo,
        license: licensePlate,
        province: province,
        extraInfo: extraInfo
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: `เกิดข้อผิดพลาด: ${error.message}`
    };
  }
}

// ฟังก์ชันสำหรับทดสอบการแปลงข้อมูล (เพิ่มกรณีทดสอบใหม่)
function testFormatVehicleInfo() {
  const testCases = [
    // กรณีทดสอบเดิม
    "Honda city 1.0 turbo จจ-9431 เชียงใหม่",
    "Toyota Veloz 1.5 จน-1427 เชียงใหม่", 
    "Honda city 1.0 turbo วจ-7027 เชียงใหม่",
    "Toyota Yaris Ativ 1.2 ท-0015 เชียงใหม่",
    "Honda HRV จห-2586 เชียงใหม่",
    "Mazda Cx8 2.5 3วท-1492 กทม",
    "Isuzu D-Max 1กก1234 เชียงใหม่",
    "Ford Ranger 2ขข-5678 กรุงเทพมหานคร",
    "Mitsubishi Triton 7คค9999 นครราชสีมา",
    "Nissan Navara ฮฮ-1111 ภูเก็ต",
    
    // กรณีทดสอบใหม่ที่มีปัญหา
    "Mazda CX-30 จต-9430-เชียงใหม่",
    "Fortuner 3ขร7683",
    "Cross 2ขร957",
    "Fortuner จต 8393",
    "Yaris จข6817 ชม.",
    "Vevo บธ 4994 อุดร",
    
    // กรณีทดสอบใหม่ล่าสุด
    "Yaris จข6817 ชม.",
    "Fortuner 632 ชม.",
    "City 3ขฬ 1208 กทม ร่วม",
    "Fortuner 9565 ชม. ร่วม",
    "Yaris 9296 รถร่วม",
    "Cross 5682 ชม.",
    "City 5047 รถร่วม",
    "Jazz 1630",
    "Yaris 9691 ป้ายแดง",
    
    // กรณีทดสอบเพิ่มเติม
    "Toyota Camry 2.5 5กก-1234-กรุงเทพ",
    "BMW X3 จข 1234",
    "Mercedes Benz E-Class 7หห9876 กทม.",
    "Suzuki Swift กข-5555",
    "Honda Civic 1ขข1234"
  ];
  
  Logger.log('=== การทดสอบฟังก์ชันแปลงข้อมูล (ปรับปรุงใหม่) ===');
  
  testCases.forEach((testCase, index) => {
    const result = formatVehicleInfo(testCase);
    Logger.log(`Test ${index + 1}: "${testCase}"`);
    if (result.success) {
      Logger.log(`  ✓ ผลลัพธ์: "${result.formattedText}"`);
      Logger.log(`  ✓ ป้ายทะเบียน: "${result.licensePlate}"`);
      Logger.log(`  ✓ รายละเอียด: รถ="${result.originalParts.vehicle}" | ป้าย="${result.originalParts.license}" | จังหวัด="${result.originalParts.province}"`);
    } else {
      Logger.log(`  ✗ ข้อผิดพลาด: ${result.error}`);
    }
    Logger.log('');
  });
}






// ฟังก์ชันสำหรับคัดกรองชื่อรถที่ไม่ซ้ำกันจากคอลัมน์ E
function getUniqueVehicleNames() {
  const spreadsheet = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(TARGET_RENTAL_SHEET_NAME);
  
  if (!sheet) {
    Logger.log('ไม่พบแผ่นงาน "รายการเช่า"');
    return;
  }
  
  // ดึงข้อมูลทั้งหมดจากคอลัมน์ E
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log('ไม่มีข้อมูลในแผ่นงาน');
    return;
  }
  
  const dataRange = sheet.getRange(2, 5, lastRow - 1, 1); // คอลัมน์ E เริ่มจากแถวที่ 2
  const data = dataRange.getValues();
  
  const uniqueVehicles = new Set(); // ใช้ Set เพื่อเก็บข้อมูลที่ไม่ซ้ำกัน
  const vehicleDetails = []; // เก็บรายละเอียดของรถแต่ละคัน
  let processedCount = 0;
  let errorCount = 0;
  
  Logger.log('=== เริ่มต้นการคัดกรองชื่อรถ ===');
  
  // ประมวลผลข้อมูลทีละแถว
  for (let i = 0; i < data.length; i++) {
    const rowNumber = i + 2; // แถวจริงในชีต
    const cellValue = data[i][0]; // คอลัมน์ E
    
    // ข้ามแถวที่ว่าง
    if (!cellValue || cellValue.toString().trim() === '') {
      continue;
    }
    
    try {
      const originalText = cellValue.toString().trim();
      const result = formatVehicleInfo(originalText);
      
      if (result.success) {
        const vehicleName = result.originalParts.vehicle.trim();
        
        // เพิ่มชื่อรถใน Set (จะไม่ซ้ำกันโดยอัตโนมัติ)
        if (!uniqueVehicles.has(vehicleName)) {
          uniqueVehicles.add(vehicleName);
          vehicleDetails.push({
            name: vehicleName,
            example: originalText,
            formatted: result.formattedText,
            row: rowNumber
          });
        }
        processedCount++;
      } else {
        // กรณีที่ไม่สามารถแปลงได้ ให้ใช้ข้อมูลดิบ
        const vehicleName = originalText;
        if (!uniqueVehicles.has(vehicleName)) {
          uniqueVehicles.add(vehicleName);
          vehicleDetails.push({
            name: vehicleName,
            example: originalText,
            formatted: 'ไม่สามารถแปลงได้',
            row: rowNumber
          });
        }
        errorCount++;
      }
    } catch (error) {
      Logger.log(`แถว ${rowNumber}: เกิดข้อผิดพลาด - ${error.message}`);
      errorCount++;
    }
  }
  
  // เรียงลำดับชื่อรถตามตัวอักษร
  vehicleDetails.sort((a, b) => a.name.localeCompare(b.name, 'th'));
  
  // แสดงผลลัพธ์
  Logger.log('\n=== รายการชื่อรถที่ไม่ซ้ำกัน ===');
  Logger.log(`จำนวนชื่อรถทั้งหมด: ${uniqueVehicles.size} รายการ`);
  Logger.log(`ข้อมูลที่ประมวลผล: ${processedCount} แถว`);
  Logger.log(`ข้อผิดพลาด: ${errorCount} แถว`);
  Logger.log('\n--- รายละเอียด ---');
  
  vehicleDetails.forEach((vehicle, index) => {
    Logger.log(`${index + 1}. ${vehicle.name}`);
    Logger.log(`   ตัวอย่าง: "${vehicle.example}" (แถว ${vehicle.row})`);
    if (vehicle.formatted !== 'ไม่สามารถแปลงได้') {
      Logger.log(`   หลังแปลง: "${vehicle.formatted}"`);
    }
    Logger.log('');
  });
  
  
  return vehicleDetails;
}




// ฟังก์ชันหลักสำหรับมาตรฐานข้อมูลรถและบันทึกลงแผ่นงานใหม่
function standardizeAndSaveVehicles() {
  const spreadsheet = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  const sourceSheet = spreadsheet.getSheetByName(TARGET_RENTAL_SHEET_NAME);
  
  if (!sourceSheet) {
    Logger.log('ไม่พบแผ่นงาน "รายการเช่า"');
    return;
  }
  
  // สร้างหรือล้างแผ่นงาน "รายชื่อรถ"
  let vehicleSheet = spreadsheet.getSheetByName('รายชื่อรถ');
  if (vehicleSheet) {
    vehicleSheet.clear();
  } else {
    vehicleSheet = spreadsheet.insertSheet('รายชื่อรถ');
  }
  
  // ตั้งหัวตาราง
  const headers = ['ยี่ห้อ', 'รุ่น', 'ทะเบียน', '', '', '', '', '', 'ประเภท'];
  vehicleSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // จัดรูปแบบหัวตาราง
  const headerRange = vehicleSheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  
  // ดึงข้อมูลจากแผ่นงานต้นฉบับ (คอลัมน์ E และ F)
  const lastRow = sourceSheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log('ไม่มีข้อมูลในแผ่นงาน');
    return;
  }
  
  const dataRange = sourceSheet.getRange(2, 5, lastRow - 1, 2); // คอลัมน์ E และ F
  const data = dataRange.getValues();
  
  const uniqueVehicles = new Set(); // เก็บข้อมูลที่ไม่ซ้ำกัน
  const vehicleRecords = []; // เก็บรายละเอียดรถสำหรับแผ่นงาน "รายชื่อรถ"
  const updatedData = []; // เก็บข้อมูลที่จะอัปเดตกลับไปคอลัมน์ E และ F
  
  let processedCount = 0;
  let errorCount = 0;
  
  Logger.log('=== เริ่มต้นการประมวลผลข้อมูลรถ ===');
  
  // ประมวลผลข้อมูลทีละแถว
  for (let i = 0; i < data.length; i++) {
    const rowNumber = i + 2;
    const originalColumnE = data[i][0]; // ข้อมูลเดิมในคอลัมน์ E
    const originalColumnF = data[i][1]; // ข้อมูลเดิมในคอลัมน์ F
    
    if (!originalColumnE || originalColumnE.toString().trim() === '') {
      updatedData.push([originalColumnE, originalColumnF]);
      continue;
    }
    
    try {
      const originalText = originalColumnE.toString().trim();
      
      // เช็คคำ "ร่วม/รถร่วม" จากข้อมูลดิบ
      const hasPartnerKeyword = /ร่วม|รถร่วม/.test(originalText);
      const vehicleType = hasPartnerKeyword ? 'รถร่วม' : 'รถของร้าน';
      
      const standardizedResult = standardizeVehicleInfo(originalText, hasPartnerKeyword);
      
      if (standardizedResult.success) {
        // สำหรับอัปเดตคอลัมน์ E และ F
        const formattedVehicle = `${standardizedResult.brand} ${standardizedResult.model} (${standardizedResult.cleanLicensePlate})`;
        updatedData.push([formattedVehicle, standardizedResult.cleanLicensePlate]);
        
        // สำหรับแผ่นงาน "รายชื่อรถ" (ไม่ซ้ำกัน)
        const uniqueKey = `${standardizedResult.brand}_${standardizedResult.model}_${standardizedResult.cleanLicensePlate}`;
        
        if (!uniqueVehicles.has(uniqueKey)) {
          uniqueVehicles.add(uniqueKey);
          vehicleRecords.push({
            brand: standardizedResult.brand,
            model: standardizedResult.model,
            licensePlate: standardizedResult.cleanLicensePlate,
            type: vehicleType,
            originalText: originalText,
            row: rowNumber
          });
        }
        
        processedCount++;
        Logger.log(`แถว ${rowNumber}: "${originalText}" -> "${formattedVehicle}" | ประเภท: ${vehicleType}`);
      } else {
        // ถ้าไม่สามารถประมวลผลได้ ให้เก็บข้อมูลเดิม
        updatedData.push([originalColumnE, originalColumnF]);
        Logger.log(`แถว ${rowNumber}: ไม่สามารถประมวลผลได้ - ${originalText}`);
        errorCount++;
      }
    } catch (error) {
      updatedData.push([originalColumnE, originalColumnF]);
      Logger.log(`แถว ${rowNumber}: เกิดข้อผิดพลาด - ${error.message}`);
      errorCount++;
    }
  }
  
  // อัปเดตข้อมูลในคอลัมน์ E และ F ของแผ่นงาน "รายการเช่า"
  if (updatedData.length > 0) {
    dataRange.setValues(updatedData);
    Logger.log(`อัปเดตคอลัมน์ E และ F เสร็จสิ้น: ${updatedData.length} แถว`);
  }
  
  // เรียงลำดับข้อมูลตามยี่ห้อ แล้วตามรุ่น
  vehicleRecords.sort((a, b) => {
    if (a.brand !== b.brand) {
      return a.brand.localeCompare(b.brand, 'th');
    }
    return a.model.localeCompare(b.model, 'th');
  });
  
  // เตรียมข้อมูลสำหรับบันทึกในแผ่นงาน "รายชื่อรถ"
  const outputData = vehicleRecords.map(record => [
    record.brand,           // A: ยี่ห้อ
    record.model,           // B: รุ่น
    record.licensePlate,    // C: ทะเบียน
    '',                     // D: ว่าง
    '',                     // E: ว่าง
    '',                     // F: ว่าง
    '',                     // G: ว่าง
    '',                     // H: ว่าง
    record.type             // I: ประเภท
  ]);
  
  // บันทึกข้อมูลลงแผ่นงาน "รายชื่อรถ"
  if (outputData.length > 0) {
    const dataRange = vehicleSheet.getRange(2, 1, outputData.length, 9);
    dataRange.setValues(outputData);
    
    // จัดรูปแบบข้อมูล
    dataRange.setBorder(true, true, true, true, true, true);
    
    // จัดสีสำหรับประเภทรถ
    for (let i = 0; i < outputData.length; i++) {
      const typeCell = vehicleSheet.getRange(i + 2, 9); // คอลัมน์ I
      if (outputData[i][8] === 'รถร่วม') {
        typeCell.setBackground('#fff3cd'); // สีเหลืองอ่อน
      } else {
        typeCell.setBackground('#d1ecf1'); // สีฟ้าอ่อน
      }
    }
  }
  
  // ปรับขนาดคอลัมน์อัตโนมัติ
  vehicleSheet.autoResizeColumns(1, 9);
  
  // แสดงผลสรุป
  Logger.log('\n=== สรุปผลการประมวลผล ===');
  Logger.log(`จำนวนรถที่ไม่ซ้ำกัน: ${vehicleRecords.length} คัน`);
  Logger.log(`ข้อมูลที่ประมวลผลสำเร็จ: ${processedCount} แถว`);
  Logger.log(`ข้อผิดพลาด: ${errorCount} แถว`);
  
  // นับประเภทรถ
  const shopVehicles = vehicleRecords.filter(v => v.type === 'รถของร้าน').length;
  const partnerVehicles = vehicleRecords.filter(v => v.type === 'รถร่วม').length;
  
  Logger.log(`รถของร้าน: ${shopVehicles} คัน`);
  Logger.log(`รถร่วม: ${partnerVehicles} คัน`);
  
  // แสดงตัวอย่างข้อมูล
  Logger.log('\n--- ตัวอย่างข้อมูล 10 รายการแรก ---');
  vehicleRecords.slice(0, 10).forEach((record, index) => {
    Logger.log(`${index + 1}. ${record.brand} ${record.model} (${record.licensePlate}) - ${record.type}`);
  });
  
  // แจ้งผลสำเร็จ
  SpreadsheetApp.getUi().alert(
    'การประมวลผลเสร็จสิ้น',
    `อัปเดตข้อมูลเรียบร้อยแล้ว!\n\n` +
    `แผ่นงาน "รายการเช่า":\n` +
    `- อัปเดตคอลัมน์ E และ F: ${updatedData.length} แถว\n\n` +
    `แผ่นงาน "รายชื่อรถ":\n` +
    `- จำนวนรถทั้งหมด: ${vehicleRecords.length} คัน\n` +
    `- รถของร้าน: ${shopVehicles} คัน\n` +
    `- รถร่วม: ${partnerVehicles} คัน`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
  
  Logger.log('=== เสร็จสิ้นการประมวลผล ===');
}

// ฟังก์ชันสำหรับมาตรฐานข้อมูลรถ
function standardizeVehicleInfo(originalText, isPartnerVehicle = false) {
  try {
    // ล้างข้อมูลที่ผิดพลาด
    let cleanText = cleanVehicleText(originalText);
    
    // ตรวจสอบว่าข้อมูลมีวงเล็บอยู่แล้วหรือไม่
    const alreadyFormatted = /^(.+?)\s*\((.+)\)$/.test(cleanText);
    
    let vehicleInfo, licensePlate, province = '', extraInfo = '';
    
    if (alreadyFormatted) {
      // ข้อมูลมีวงเล็บอยู่แล้ว เช่น "Honda City (จจ-7603 เชียงใหม่)"
      const match = cleanText.match(/^(.+?)\s*\((.+)\)$/);
      vehicleInfo = match[1].trim();
      const licenseInfo = match[2].trim();
      
      // แยกข้อมูลในวงเล็บ
      const parsedLicense = parseLicenseInfo(licenseInfo);
      licensePlate = parsedLicense.license;
      province = parsedLicense.province;
      extraInfo = parsedLicense.extraInfo;
      
    } else {
      // ข้อมูลดิบ ใช้ฟังก์ชันเดิม
      const parseResult = formatVehicleInfo(cleanText);
      
      if (!parseResult.success) {
        return { success: false, error: 'ไม่สามารถแยกข้อมูลได้' };
      }
      
      vehicleInfo = parseResult.originalParts.vehicle.trim();
      licensePlate = parseResult.originalParts.license.trim();
      province = parseResult.originalParts.province || '';
      extraInfo = parseResult.originalParts.extraInfo || '';
    }
    
    // สร้างป้ายทะเบียนเต็ม โดยตัดคำ "ร่วม/รถร่วม" ออก
    const cleanedExtraInfo = extraInfo.replace(/\s*(ร่วม|รถร่วม)\s*/g, '').trim();
    const cleanLicensePlate = [licensePlate, province, cleanedExtraInfo]
      .filter(part => part && part.length > 0)
      .join(' ')
      .trim();
    
    // เพิ่มยี่ห้อรถ
    const brandResult = addVehicleBrand(vehicleInfo);
    
    return {
      success: true,
      brand: brandResult.brand,
      model: brandResult.model,
      cleanLicensePlate: cleanLicensePlate,
      vehicleType: isPartnerVehicle ? 'รถร่วม' : 'รถของร้าน',
      originalText: originalText
    };
    
  } catch (error) {
    return {
      success: false,
      error: `เกิดข้อผิดพลาด: ${error.message}`
    };
  }
}

// ฟังก์ชันสำหรับแยกข้อมูลในวงเล็บ
function parseLicenseInfo(licenseInfo) {
  let license = '', province = '', extraInfo = '';
  
  // แยกคำ ร่วม/รถร่วม/ป้ายแดง ก่อน
  const extraPattern = /(ร่วม|รถร่วม|ป้ายแดง|ป้ายขาว)$/;
  const extraMatch = licenseInfo.match(extraPattern);
  if (extraMatch) {
    extraInfo = extraMatch[1];
    licenseInfo = licenseInfo.replace(extraPattern, '').trim();
  }
  
  // แยกป้ายทะเบียนและจังหวัด
  // Pattern 1: จจ-7603 เชียงใหม่
  let match = licenseInfo.match(/^([ก-๙]{1,3}[-][0-9]{1,4})\s+(.+)$/);
  if (match) {
    license = match[1];
    province = match[2];
    return { license, province, extraInfo };
  }
  
  // Pattern 2: จข6817 เชียงใหม่ (ไม่มีขีด)
  match = licenseInfo.match(/^([ก-๙]{1,3}[0-9]{1,4})\s+(.+)$/);
  if (match) {
    license = match[1];
    province = match[2];
    return { license, province, extraInfo };
  }
  
  // Pattern 3: 632 เชียงใหม่ (แค่ตัวเลข)
  match = licenseInfo.match(/^([0-9]{1,4})\s+(.+)$/);
  if (match) {
    license = match[1];
    province = match[2];
    return { license, province, extraInfo };
  }
  
  // Pattern 4: 2ขพ6906 กรุงเทพมหานคร (ป้ายใหม่)
  match = licenseInfo.match(/^([0-9][ก-๙]{2}[0-9]{1,4})\s+(.+)$/);
  if (match) {
    license = match[1];
    province = match[2];
    return { license, province, extraInfo };
  }
  
  // Pattern 5: 3ขข-4138 กทม (ป้ายใหม่มีขีด)
  match = licenseInfo.match(/^([0-9][ก-๙]{2}[-][0-9]{1,4})\s+(.+)$/);
  if (match) {
    license = match[1];
    province = match[2];
    return { license, province, extraInfo };
  }
  
  // Pattern 6: จต-9430-เชียงใหม่ (มีขีดคั่น)
  match = licenseInfo.match(/^([ก-๙]{1,3}[-][0-9]{1,4})[-](.+)$/);
  if (match) {
    license = match[1];
    province = match[2];
    return { license, province, extraInfo };
  }
  
  // Pattern 7: ไม่มีจังหวัด เช่น 1630, 2ขร957
  if (/^[ก-๙0-9]{1,8}[-]?[0-9]*$/.test(licenseInfo)) {
    license = licenseInfo;
    return { license, province, extraInfo };
  }
  
  // ถ้าไม่ตรงแพทเทิร์นไหน ให้ใช้ทั้งหมดเป็น license
  license = licenseInfo;
  return { license, province, extraInfo };
}

// ฟังก์ชันสำหรับล้างข้อมูลที่ผิดพลาด
function cleanVehicleText(text) {
  return text
    .replace(/[็ํ๋]/g, '') // ลบไมเอก ไมยงคติ ไมโท
    .replace(/\s+/g, ' ') // แทนที่ช่องว่างหลายตัวด้วยช่องว่างเดียว
    .trim();
}

// ฟังก์ชันสำหรับเพิ่มยี่ห้อรถ
function addVehicleBrand(vehicleInfo) {
  const lowerInfo = vehicleInfo.toLowerCase();
  
  // แมปยี่ห้อรถ
  const brandMapping = {
    // Honda
    'city': { brand: 'Honda', model: 'City' },
    'civic': { brand: 'Honda', model: 'Civic' },
    'jazz': { brand: 'Honda', model: 'Jazz' },
    'hrv': { brand: 'Honda', model: 'HR-V' },
    'honda hrv': { brand: 'Honda', model: 'HR-V' },
    'cr-v': { brand: 'Honda', model: 'CR-V' },
    
    // Toyota
    'yaris': { brand: 'Toyota', model: 'Yaris' },
    'altis': { brand: 'Toyota', model: 'Altis' },
    'cross': { brand: 'Toyota', model: 'Cross' },
    'fortuner': { brand: 'Toyota', model: 'Fortuner' },
    'veloz': { brand: 'Toyota', model: 'Veloz' },
    'vios': { brand: 'Toyota', model: 'Vios' },
    
    // Nissan
    'almera': { brand: 'Nissan', model: 'Almera' },
    'kicks': { brand: 'Nissan', model: 'Kicks' },
    
    // Mazda (ถ้ามียี่ห้ออยู่แล้วให้ใช้ต่อ)
    'mazda2': { brand: 'Mazda', model: 'Mazda2' },
    'mazda2 sky active': { brand: 'Mazda', model: 'Mazda2 Sky Active' },
    'mazda cx-30': { brand: 'Mazda', model: 'CX-30' },
    
    // Chery
    'vevo': { brand: 'Chery', model: 'Vevo' },
    
    // Mitsubishi
    'pajero': { brand: 'Mitsubishi', model: 'Pajero' },
    
    // Ford
    'ford กะบะ': { brand: 'Ford', model: 'กะบะ' }
  };
  
  // ลองหาแมปที่ตรงกัน
  for (const [key, value] of Object.entries(brandMapping)) {
    if (lowerInfo.includes(key)) {
      return value;
    }
  }
  
  // ถ้ามียี่ห้ออยู่แล้ว ให้แยกออก
  const brandPatterns = [
    { pattern: /^(Honda|Toyota|Nissan|Mazda|Ford|Mitsubishi|Chery)\s+(.+)$/i, 
      handler: (match) => ({ brand: match[1], model: match[2] }) },
    { pattern: /^(.+)\s+(Honda|Toyota|Nissan|Mazda|Ford|Mitsubishi|Chery)$/i, 
      handler: (match) => ({ brand: match[2], model: match[1] }) }
  ];
  
  for (const { pattern, handler } of brandPatterns) {
    const match = vehicleInfo.match(pattern);
    if (match) {
      return handler(match);
    }
  }
  
  // ถ้าไม่พบ ให้ใช้ข้อมูลเดิม
  if (lowerInfo.includes('mazda')) {
    return { brand: 'Mazda', model: vehicleInfo.replace(/mazda\s*/i, '').trim() };
  }
  
  if (lowerInfo.includes('toyota')) {
    return { brand: 'Toyota', model: vehicleInfo.replace(/toyota\s*/i, '').trim() };
  }
  
  // กรณีที่ไม่สามารถระบุได้
  return { brand: 'อื่นๆ', model: vehicleInfo };
}

// ฟังก์ชันทดสอบการมาตรฐานข้อมูล
function testStandardizeVehicleInfo() {
  const testCases = [
    { text: "Honda City (จจ-7603 เชียงใหม่)", hasPartner: false },
    { text: "Yaris (จข6817 เชียงใหม่)", hasPartner: false },
    { text: "Fortuner (632 เชียงใหม่)", hasPartner: false },
    { text: "Cross (5682 เชียงใหม่)", hasPartner: false },
    { text: "City (5047 รถร่วม)", hasPartner: true },
    { text: "Mazda CX-30 (จต-9430 เชียงใหม่)", hasPartner: false },
    { text: "Yaris (9296 รถร่วม)", hasPartner: true },
    { text: "Jazz (1630)", hasPartner: false },
    { text: "Honda HRV", hasPartner: false },
    { text: "Almera (จธ-8434 เชียงใหม่)", hasPartner: false },
    { text: "Vios (จท-6122 ชม. ร่วม)", hasPartner: true },
    { text: "Yaris (5 (ขฉ-7378 รถร่วม))", hasPartner: true }
  ];
  
  Logger.log('=== การทดสอบการมาตรฐานข้อมูลรถ (ปรับปรุงใหม่) ===');
  
  testCases.forEach((testCase, index) => {
    const result = standardizeVehicleInfo(testCase.text, testCase.hasPartner);
    Logger.log(`Test ${index + 1}: "${testCase.text}" (ร่วม: ${testCase.hasPartner})`);
    if (result.success) {
      Logger.log(`  ✓ ยี่ห้อ: ${result.brand}`);
      Logger.log(`  ✓ รุ่น: ${result.model}`);
      Logger.log(`  ✓ ทะเบียนสะอาด: ${result.cleanLicensePlate}`);
      Logger.log(`  ✓ ประเภท: ${result.vehicleType}`);
    } else {
      Logger.log(`  ✗ ข้อผิดพลาด: ${result.error}`);
    }
    Logger.log('');
  });
}





// ฟังก์ชันพิเศษสำหรับแก้ไข "็H1" เป็น "Hyundai H1"
function fixH1Vehicles() {
  const spreadsheet = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(TARGET_RENTAL_SHEET_NAME);
  
  if (!sheet) {
    Logger.log('ไม่พบแผ่นงาน "รายการเช่า"');
    return;
  }
  
  // ดึงข้อมูลทั้งหมดจากคอลัมน์ E
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log('ไม่มีข้อมูลในแผ่นงาน');
    return;
  }
  
  const dataRange = sheet.getRange(2, 5, lastRow - 1, 1); // คอลัมน์ E เริ่มจากแถวที่ 2
  const data = dataRange.getValues();
  
  let updateCount = 0;
  const foundRows = [];
  const updatedData = [];
  
  Logger.log('=== เริ่มต้นการค้นหาและแก้ไข "็H1" ===');
  
  // ประมวลผลข้อมูลทีละแถว
  for (let i = 0; i < data.length; i++) {
    const rowNumber = i + 2; // แถวจริงในชีต
    const cellValue = data[i][0]; // คอลัมน์ E
    
    if (!cellValue) {
      updatedData.push([cellValue]);
      continue;
    }
    
    const originalText = cellValue.toString();
    
    // ตรวจสอบว่ามี "็H1" หรือไม่
    if (originalText.includes('็H1')) {
      // แทนที่ "็H1" ด้วย "Hyundai H1"
      const newText = originalText.replace(/็H1/g, 'Hyundai H1');
      
      updatedData.push([newText]);
      foundRows.push({
        row: rowNumber,
        original: originalText,
        updated: newText
      });
      
      updateCount++;
      Logger.log(`แถว ${rowNumber}: "${originalText}" → "${newText}"`);
    } else {
      updatedData.push([originalText]);
    }
  }
  
  // อัปเดทข้อมูลในชีต
  if (updateCount > 0) {
    dataRange.setValues(updatedData);
    
    Logger.log(`\n=== สรุปการแก้ไข ===`);
    Logger.log(`พบและแก้ไข: ${updateCount} แถว`);
    Logger.log(`\n--- รายละเอียดการแก้ไข ---`);
    
    foundRows.forEach((item, index) => {
      Logger.log(`${index + 1}. แถว ${item.row}:`);
      Logger.log(`   ก่อน: "${item.original}"`);
      Logger.log(`   หลัง: "${item.updated}"`);
      Logger.log('');
    });
    
    // แสดงผลสรุปใน UI
    SpreadsheetApp.getUi().alert(
      'การแก้ไขเสร็จสิ้น',
      `แก้ไข "็H1" เป็น "Hyundai H1" เรียบร้อยแล้ว!\n\n` +
      `จำนวนแถวที่แก้ไข: ${updateCount} แถว\n\n` +
      `รายละเอียดการแก้ไข:\n` +
      foundRows.map((item, index) => 
        `${index + 1}. แถว ${item.row}: "${item.original}" → "${item.updated}"`
      ).join('\n'),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
  } else {
    Logger.log('ไม่พบข้อมูล "็H1" ในแผ่นงาน');
    SpreadsheetApp.getUi().alert(
      'ไม่พบข้อมูล',
      'ไม่พบข้อความ "็H1" ในคอลัมน์ E ของแผ่นงาน "รายการเช่า"',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
  
  Logger.log('=== เสร็จสิ้นการแก้ไข ===');
}

// ฟังก์ชันสำหรับค้นหาข้อความที่ต้องการแก้ไข (ไม่แก้ไข แค่ค้นหา)
function searchH1Vehicles() {
  const spreadsheet = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(TARGET_RENTAL_SHEET_NAME);
  
  if (!sheet) {
    Logger.log('ไม่พบแผ่นงาน "รายการเช่า"');
    return;
  }
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log('ไม่มีข้อมูลในแผ่นงาน');
    return;
  }
  
  const dataRange = sheet.getRange(2, 5, lastRow - 1, 1); // คอลัมน์ E
  const data = dataRange.getValues();
  
  const foundItems = [];
  
  Logger.log('=== การค้นหา "็H1" ในคอลัมน์ E ===');
  
  for (let i = 0; i < data.length; i++) {
    const rowNumber = i + 2;
    const cellValue = data[i][0];
    
    if (cellValue && cellValue.toString().includes('็H1')) {
      foundItems.push({
        row: rowNumber,
        text: cellValue.toString()
      });
      Logger.log(`พบแถว ${rowNumber}: "${cellValue}"`);
    }
  }
  
  if (foundItems.length > 0) {
    Logger.log(`\n=== สรุป ===`);
    Logger.log(`พบข้อมูล "็H1" ทั้งหมด: ${foundItems.length} แถว`);
    
    // แสดงผลใน UI
    SpreadsheetApp.getUi().alert(
      'ผลการค้นหา',
      `พบข้อมูล "็H1" ทั้งหมด: ${foundItems.length} แถว\n\n` +
      foundItems.map((item, index) => 
        `${index + 1}. แถว ${item.row}: "${item.text}"`
      ).join('\n') +
      '\n\nหากต้องการแก้ไข ให้รันฟังก์ชัน fixH1Vehicles()',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } else {
    Logger.log('ไม่พบข้อมูล "็H1" ในแผ่นงาน');
    SpreadsheetApp.getUi().alert(
      'ไม่พบข้อมูล',
      'ไม่พบข้อความ "็H1" ในคอลัมน์ E ของแผ่นงาน "รายการเช่า"',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
  
  return foundItems;
}

// ฟังก์ชันทั่วไปสำหรับแก้ไขข้อความใดๆ ในคอลัมน์ E
function replaceTextInColumnE(searchText, replaceText) {
  const spreadsheet = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(TARGET_RENTAL_SHEET_NAME);
  
  if (!sheet) {
    Logger.log('ไม่พบแผ่นงาน "รายการเช่า"');
    return;
  }
  
  if (!searchText || !replaceText) {
    Logger.log('กรุณาระบุข้อความที่ต้องการค้นหาและข้อความที่ต้องการแทนที่');
    return;
  }
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log('ไม่มีข้อมูลในแผ่นงาน');
    return;
  }
  
  const dataRange = sheet.getRange(2, 5, lastRow - 1, 1); // คอลัมน์ E
  const data = dataRange.getValues();
  
  let updateCount = 0;
  const foundRows = [];
  const updatedData = [];
  
  Logger.log(`=== เริ่มต้นการแทนที่ "${searchText}" ด้วย "${replaceText}" ===`);
  
  for (let i = 0; i < data.length; i++) {
    const rowNumber = i + 2;
    const cellValue = data[i][0];
    
    if (!cellValue) {
      updatedData.push([cellValue]);
      continue;
    }
    
    const originalText = cellValue.toString();
    
    if (originalText.includes(searchText)) {
      const newText = originalText.replace(new RegExp(escapeRegExp(searchText), 'g'), replaceText);
      
      updatedData.push([newText]);
      foundRows.push({
        row: rowNumber,
        original: originalText,
        updated: newText
      });
      
      updateCount++;
      Logger.log(`แถว ${rowNumber}: "${originalText}" → "${newText}"`);
    } else {
      updatedData.push([originalText]);
    }
  }
  
  if (updateCount > 0) {
    dataRange.setValues(updatedData);
    
    Logger.log(`\n=== สรุปการแก้ไข ===`);
    Logger.log(`พบและแก้ไข: ${updateCount} แถว`);
    
    SpreadsheetApp.getUi().alert(
      'การแก้ไขเสร็จสิ้น',
      `แทนที่ "${searchText}" ด้วย "${replaceText}" เรียบร้อยแล้ว!\n\n` +
      `จำนวนแถวที่แก้ไข: ${updateCount} แถว`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } else {
    Logger.log(`ไม่พบข้อมูล "${searchText}" ในแผ่นงาน`);
    SpreadsheetApp.getUi().alert(
      'ไม่พบข้อมูล',
      `ไม่พบข้อความ "${searchText}" ในคอลัมน์ E ของแผ่นงาน "รายการเช่า"`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
  
  Logger.log('=== เสร็จสิ้นการแก้ไข ===');
}

// ฟังก์ชันช่วยสำหรับ escape ตัวอักษรพิเศษใน RegExp
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ตัวอย่างการใช้งานฟังก์ชันทั่วไป
function exampleUsageReplaceText() {
  // แทนที่ "็H1" ด้วย "Hyundai H1"

replaceTextInColumnE('็็Honda HRV', 'Honda HR-V');

  
  // หรือแทนที่ข้อความอื่นๆ เช่น
  // replaceTextInColumnE('็็Honda HRV', 'Honda HR-V');
  // replaceTextInColumnE('ํYaris', 'Toyota Yaris');
  // replaceTextInColumnE('๋Jazz', 'Honda Jazz');
}














