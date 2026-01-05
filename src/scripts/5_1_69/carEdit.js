// =============================================================================
// ฟังก์ชัน Migration สำหรับอัปเกรดข้อมูลรถเดิม
// สำหรับแผ่นงานที่มีข้อมูลอยู่แล้วแต่ไม่มีรหัสรถและประเภทรถ
// =============================================================================

/**
 * ฟังก์ชันหลักสำหรับ Migration ข้อมูลรถเดิม
 * @param {string} sheetID - ID ของ Google Sheet
 * @param {Object} options - ตัวเลือกสำหรับการ Migration
 * @returns {Object} ผลลัพธ์การ Migration
 */
function migrateCarData(sheetID, options = {}) {
  try {
    Logger.log("=== เริ่มต้น Migration ข้อมูลรถ ===");
    
    const defaultOptions = {
      defaultCarCategory: "รถของร้าน",      // ประเภทรถเริ่มต้น
      carCodePrefix: "CAR",                  // Prefix รหัสรถ
      createBackup: true,                    // สร้าง backup ก่อน migrate
      forceUpdate: false                     // บังคับอัปเดตแม้จะมีข้อมูลแล้ว
    };
    
    const config = { ...defaultOptions, ...options };
    
    const ss = SpreadsheetApp.openById(sheetID);
    let carsSheet = ss.getSheetByName(CARS_SHEET);
    
    // สร้างแผ่นงานรถถ้าไม่มี
    if (!carsSheet) {
      Logger.log("ไม่พบแผ่นงานรถ กำลังสร้างใหม่...");
      return createNewCarSheet(sheetID, config);
    }
    
    // สร้าง backup ถ้าต้องการ
    if (config.createBackup) {
      createBackupSheet(ss, carsSheet);
    }
    
    // ตรวจสอบและเพิ่มคอลัมน์ที่จำเป็น
    const migrationResult = addMissingColumns(carsSheet, config);
    
    // สร้างรหัสรถให้กับข้อมูลเดิม
    const codeGenerationResult = generateCodesForExistingCars(carsSheet, config);
    
    // ตั้งค่าประเภทรถเริ่มต้น
    const categoryResult = setDefaultCarCategories(carsSheet, config);
    
    // ตั้งค่าประเภทรถเริ่มต้นในระบบ
    const systemCategoryResult = setupDefaultCarCategories(sheetID);
    
    Logger.log("=== Migration เสร็จสิ้น ===");
    
    return {
      success: true,
      message: "Migration ข้อมูลรถเสร็จสิ้น",
      details: {
        columnsAdded: migrationResult.columnsAdded,
        carsUpdated: codeGenerationResult.carsUpdated,
        categoriesSet: categoryResult.categoriesSet,
        systemCategoriesCreated: systemCategoryResult.success,
        backupCreated: config.createBackup
      }
    };
    
  } catch (error) {
    Logger.log("Error in migrateCarData: " + error.toString());
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการ Migration: " + error.message,
      error: error.toString()
    };
  }
}

/**
 * สร้างแผ่นงานรถใหม่พร้อมหัวข้อที่ครบถ้วน
 */
function createNewCarSheet(sheetID, config) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const carsSheet = ss.insertSheet(CARS_SHEET);
    
    // สร้างหัวข้อครบถ้วน
    const headers = [
      "รหัสรถ",
      "ประเภทรถ", 
      "ยี่ห้อ",
      "รุ่น", 
      "ทะเบียน",
      "พื้นที่การใช้งาน",
      "สี",
      "ค่าประกันความเสียหาย", 
      "ประเภท",
      "ราคาเช่าต่อวัน",
      "สถานะ",
      "ชนิดเชื้อเพลิง",
      "รูปแบบค่าคอมมิชชั่น"
    ];
    
    carsSheet.appendRow(headers);
    
    // ตั้งค่า format สำหรับหัวข้อ
    const headerRange = carsSheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#f0f9ff");
    headerRange.setBorder(true, true, true, true, true, true);
    
    Logger.log("สร้างแผ่นงานรถใหม่สำเร็จ");
    
    return {
      success: true,
      message: "สร้างแผ่นงานรถใหม่สำเร็จ",
      details: {
        columnsAdded: headers.length,
        carsUpdated: 0,
        categoriesSet: 0,
        systemCategoriesCreated: true,
        backupCreated: false
      }
    };
    
  } catch (error) {
    Logger.log("Error in createNewCarSheet: " + error.toString());
    throw error;
  }
}

/**
 * สร้าง backup ของแผ่นงานเดิม
 */
function createBackupSheet(ss, originalSheet) {
  try {
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HH-mm-ss");
    const backupName = `${originalSheet.getName()}_backup_${timestamp}`;
    
    // คัดลอกแผ่นงาน
    const backupSheet = originalSheet.copyTo(ss);
    backupSheet.setName(backupName);
    
    // เพิ่มหมายเหตุใน backup
    backupSheet.insertRowBefore(1);
    backupSheet.getRange(1, 1).setValue(`BACKUP สร้างเมื่อ: ${new Date()}`);
    backupSheet.getRange(1, 1).setBackground("#ffeb3b");
    backupSheet.getRange(1, 1).setFontWeight("bold");
    
    Logger.log(`สร้าง backup: ${backupName}`);
    
  } catch (error) {
    Logger.log("Warning - ไม่สามารถสร้าง backup ได้: " + error.toString());
  }
}

/**
 * ตรวจสอบและเพิ่มคอลัมน์ที่จำเป็น
 */
function addMissingColumns(carsSheet, config) {
  try {
    const lastRow = carsSheet.getLastRow();
    const lastCol = carsSheet.getLastColumn();
    
    if (lastRow === 0) {
      // แผ่นงานว่าง
      return createNewCarSheet(carsSheet.getParent().getId(), config);
    }
    
    // อ่านหัวข้อปัจจุบัน
    const currentHeaders = carsSheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const columnsAdded = [];
    
    // คอลัมน์ที่จำเป็น (ตามลำดับที่ต้องการ)
    const requiredColumns = [
      { name: "รหัสรถ", position: 1 },
      { name: "ประเภทรถ", position: 2 },
      { name: "ยี่ห้อ", position: -1 }, // -1 = ไม่บังคับตำแหน่ง
      { name: "รุ่น", position: -1 },
      { name: "ทะเบียน", position: -1 },
      { name: "พื้นที่การใช้งาน", position: -1 },
      { name: "สี", position: -1 },
      { name: "ค่าประกันความเสียหาย", position: -1 },
      { name: "ประเภท", position: -1 },
      { name: "ราคาเช่าต่อวัน", position: -1 },
      { name: "สถานะ", position: -1 },
      { name: "ชนิดเชื้อเพลิง", position: -1 },
      { name: "รูปแบบค่าคอมมิชชั่น", position: -1 }
    ];
    
    // เพิ่มคอลัมน์ที่หายไป
    for (const column of requiredColumns) {
      if (!currentHeaders.includes(column.name)) {
        if (column.position > 0 && column.position <= currentHeaders.length + 1) {
          // เพิ่มในตำแหน่งที่กำหนด
          carsSheet.insertColumnBefore(column.position);
          carsSheet.getRange(1, column.position).setValue(column.name);
          currentHeaders.splice(column.position - 1, 0, column.name);
        } else {
          // เพิ่มท้ายสุด
          carsSheet.insertColumnAfter(carsSheet.getLastColumn());
          carsSheet.getRange(1, carsSheet.getLastColumn()).setValue(column.name);
          currentHeaders.push(column.name);
        }
        
        columnsAdded.push(column.name);
        Logger.log(`เพิ่มคอลัมน์: ${column.name}`);
      }
    }
    
    // ตั้งค่า format สำหรับหัวข้อ
    if (columnsAdded.length > 0) {
      const headerRange = carsSheet.getRange(1, 1, 1, carsSheet.getLastColumn());
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#f0f9ff");
    }
    
    return {
      success: true,
      columnsAdded: columnsAdded
    };
    
  } catch (error) {
    Logger.log("Error in addMissingColumns: " + error.toString());
    throw error;
  }
}

/**
 * สร้างรหัสรถให้กับรถเดิมที่ไม่มีรหัส
 */
function generateCodesForExistingCars(carsSheet, config) {
  try {
    const lastRow = carsSheet.getLastRow();
    if (lastRow <= 1) {
      return { success: true, carsUpdated: 0 };
    }
    
    // หาตำแหน่งคอลัมน์
    const headers = carsSheet.getRange(1, 1, 1, carsSheet.getLastColumn()).getValues()[0];
    const carCodeColIndex = headers.indexOf("รหัสรถ");
    const licenseColIndex = headers.indexOf("ทะเบียน");
    
    if (carCodeColIndex === -1) {
      throw new Error("ไม่พบคอลัมน์ 'รหัสรถ'");
    }
    
    // อ่านข้อมูลรถทั้งหมด
    const dataRange = carsSheet.getRange(2, 1, lastRow - 1, carsSheet.getLastColumn());
    const carData = dataRange.getValues();
    
    let carsUpdated = 0;
    let nextCarNumber = 1;
    
    // หาเลขรหัสรถที่ใหญ่ที่สุดที่มีอยู่
    for (let i = 0; i < carData.length; i++) {
      const existingCode = carData[i][carCodeColIndex];
      if (existingCode && typeof existingCode === 'string') {
        const match = existingCode.match(new RegExp(`^${config.carCodePrefix}(\\d+)$`));
        if (match) {
          const number = parseInt(match[1], 10);
          if (number >= nextCarNumber) {
            nextCarNumber = number + 1;
          }
        }
      }
    }
    
    // สร้างรหัสรถให้กับรถที่ไม่มีรหัส
    for (let i = 0; i < carData.length; i++) {
      const currentCarCode = carData[i][carCodeColIndex];
      const licensePlate = carData[i][licenseColIndex];
      
      // ตรวจสอบว่าต้องสร้างรหัสรถใหม่หรือไม่
      const needsNewCode = config.forceUpdate || 
                          !currentCarCode || 
                          currentCarCode === '' || 
                          currentCarCode === null;
      
      if (needsNewCode && licensePlate) {
        const newCarCode = `${config.carCodePrefix}${nextCarNumber.toString().padStart(3, '0')}`;
        carsSheet.getRange(i + 2, carCodeColIndex + 1).setValue(newCarCode);
        
        Logger.log(`สร้างรหัสรถ: ${newCarCode} สำหรับทะเบียน: ${licensePlate}`);
        
        nextCarNumber++;
        carsUpdated++;
      }
    }
    
    // ตั้งค่า format สำหรับคอลัมน์รหัสรถ
    if (carsUpdated > 0) {
      const codeRange = carsSheet.getRange(2, carCodeColIndex + 1, lastRow - 1, 1);
      codeRange.setNumberFormat('@STRING@');
      codeRange.setHorizontalAlignment('center');
    }
    
    return {
      success: true,
      carsUpdated: carsUpdated
    };
    
  } catch (error) {
    Logger.log("Error in generateCodesForExistingCars: " + error.toString());
    throw error;
  }
}

/**
 * ตั้งค่าประเภทรถเริ่มต้นให้กับรถเดิม
 */
function setDefaultCarCategories(carsSheet, config) {
  try {
    const lastRow = carsSheet.getLastRow();
    if (lastRow <= 1) {
      return { success: true, categoriesSet: 0 };
    }
    
    // หาตำแหน่งคอลัมน์
    const headers = carsSheet.getRange(1, 1, 1, carsSheet.getLastColumn()).getValues()[0];
    const categoryColIndex = headers.indexOf("ประเภทรถ");
    
    if (categoryColIndex === -1) {
      throw new Error("ไม่พบคอลัมน์ 'ประเภทรถ'");
    }
    
    // อ่านข้อมูลคอลัมน์ประเภทรถ
    const categoryData = carsSheet.getRange(2, categoryColIndex + 1, lastRow - 1, 1).getValues();
    
    let categoriesSet = 0;
    
    // ตั้งค่าประเภทรถเริ่มต้นให้กับรถที่ไม่มีประเภท
    for (let i = 0; i < categoryData.length; i++) {
      const currentCategory = categoryData[i][0];
      
      const needsCategory = config.forceUpdate || 
                           !currentCategory || 
                           currentCategory === '' || 
                           currentCategory === null;
      
      if (needsCategory) {
        carsSheet.getRange(i + 2, categoryColIndex + 1).setValue(config.defaultCarCategory);
        categoriesSet++;
      }
    }
    
    Logger.log(`ตั้งค่าประเภทรถเริ่มต้น: ${categoriesSet} คัน`);
    
    return {
      success: true,
      categoriesSet: categoriesSet
    };
    
  } catch (error) {
    Logger.log("Error in setDefaultCarCategories: " + error.toString());
    throw error;
  }
}

/**
 * ตั้งค่าประเภทรถเริ่มต้นในระบบ
 */
function setupDefaultCarCategories(sheetID) {
  try {
    const defaultCategories = ["รถของร้าน", "รถ Partner", "รถหุ้นส่วน"];
    
    // ตรวจสอบว่ามีการตั้งค่าแล้วหรือไม่
    const loadResult = loadCarCategories(sheetID);
    
    if (loadResult.success && loadResult.data && loadResult.data.length > 0) {
      Logger.log("ประเภทรถในระบบมีอยู่แล้ว");
      return { success: true, created: false };
    }
    
    // สร้างประเภทรถเริ่มต้น
    const saveResult = saveCarCategories(sheetID, defaultCategories);
    
    if (saveResult.success) {
      Logger.log("สร้างประเภทรถเริ่มต้นในระบบ");
      return { success: true, created: true };
    } else {
      return saveResult;
    }
    
  } catch (error) {
    Logger.log("Error in setupDefaultCarCategories: " + error.toString());
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการตั้งค่าประเภทรถเริ่มต้น: " + error.message
    };
  }
}

// =============================================================================
// ฟังก์ชันเสริม
// =============================================================================

/**
 * ตรวจสอบสถานะของแผ่นงานรถ
 */
function checkCarSheetStatus(sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const carsSheet = ss.getSheetByName(CARS_SHEET);
    
    if (!carsSheet) {
      return {
        exists: false,
        needsMigration: true,
        message: "ไม่พบแผ่นงานรถ จำเป็นต้องสร้างใหม่"
      };
    }
    
    const lastRow = carsSheet.getLastRow();
    const lastCol = carsSheet.getLastColumn();
    
    if (lastRow === 0) {
      return {
        exists: true,
        needsMigration: true,
        message: "แผ่นงานรถว่าง จำเป็นต้องสร้างหัวข้อ"
      };
    }
    
    // ตรวจสอบหัวข้อที่จำเป็น
    const headers = carsSheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const missingColumns = [];
    
    const requiredColumns = ["รหัสรถ", "ประเภทรถ", "ยี่ห้อ", "รุ่น", "ทะเบียน"];
    
    for (const column of requiredColumns) {
      if (!headers.includes(column)) {
        missingColumns.push(column);
      }
    }
    
    // ตรวจสอบรถที่ไม่มีรหัส
    let carsWithoutCode = 0;
    if (headers.includes("รหัสรถ") && headers.includes("ทะเบียน")) {
      const carCodeColIndex = headers.indexOf("รหัสรถ");
      const licenseColIndex = headers.indexOf("ทะเบียน");
      
      if (lastRow > 1) {
        const dataRange = carsSheet.getRange(2, 1, lastRow - 1, lastCol);
        const carData = dataRange.getValues();
        
        for (let i = 0; i < carData.length; i++) {
          const carCode = carData[i][carCodeColIndex];
          const license = carData[i][licenseColIndex];
          
          if (license && (!carCode || carCode === '')) {
            carsWithoutCode++;
          }
        }
      }
    }
    
    return {
      exists: true,
      needsMigration: missingColumns.length > 0 || carsWithoutCode > 0,
      missingColumns: missingColumns,
      carsWithoutCode: carsWithoutCode,
      totalCars: Math.max(0, lastRow - 1),
      message: `พบแผ่นงานรถ: ${Math.max(0, lastRow - 1)} คัน, คอลัมน์ขาดหาย: ${missingColumns.length}, รถไม่มีรหัส: ${carsWithoutCode}`
    };
    
  } catch (error) {
    Logger.log("Error in checkCarSheetStatus: " + error.toString());
    return {
      exists: false,
      needsMigration: true,
      error: error.toString(),
      message: "เกิดข้อผิดพลาดในการตรวจสอบแผ่นงานรถ"
    };
  }
}

/**
 * ฟังก์ชันทดสอบการ Migration
 */
function testMigration() {
  const sheetID = "1_0GA0ufpL8Wo3NzHondwsMd-_FMI5Tsd-88w_9e62Hw"; // แทนที่ด้วย Sheet ID จริง
  
  if (sheetID === "YOUR_SPREADSHEET_ID_HERE") {
    Logger.log("กรุณาแทนที่ YOUR_SPREADSHEET_ID_HERE ด้วย Sheet ID จริงของคุณ");
    return;
  }
  
  Logger.log("=== ทดสอบระบบ Migration ===");
  
  // 1. ตรวจสอบสถานะปัจจุบัน
  Logger.log("1. ตรวจสอบสถานะแผ่นงานรถ:");
  const status = checkCarSheetStatus(sheetID);
  Logger.log(JSON.stringify(status, null, 2));
  
  // 2. ทดสอบ Migration (ใช้โหมดปลอดภัย)
  if (status.needsMigration) {
    Logger.log("2. เริ่มการ Migration:");
    const migrationResult = migrateCarData(sheetID, {
      defaultCarCategory: "รถของร้าน",
      createBackup: true,
      forceUpdate: false
    });
    Logger.log(JSON.stringify(migrationResult, null, 2));
  } else {
    Logger.log("2. ไม่จำเป็นต้อง Migration");
  }
  
  // 3. ตรวจสอบสถานะหลัง Migration
  Logger.log("3. ตรวจสอบสถานะหลัง Migration:");
  const finalStatus = checkCarSheetStatus(sheetID);
  Logger.log(JSON.stringify(finalStatus, null, 2));
  
  Logger.log("=== จบการทดสอบ ===");
}