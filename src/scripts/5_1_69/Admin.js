// Google Apps Script Code with Default UI

// Global variables
const REGISTRATION_SHEET_ID = '1JEbD4MOM1jgm6cA9D4AlW8z8x4yUZo1rfys6u4a_hvc';
const LICENSE_SHEET_ID = '1JEbD4MOM1jgm6cA9D4AlW8z8x4yUZo1rfys6u4a_hvc';
const TEMPLATE_SHEET_ID = '1zlx6rkJg2K4N3lNb6TPkGYdp5iORrN3ENkqkgeo3HBI';
const PARENT_FOLDER_ID = '1ZXSrlhd_Q4DLuExMsp44sVuwjL7pu1Zd';



function getRegistrations() {
  try {
    const sheet = SpreadsheetApp.openById(REGISTRATION_SHEET_ID).getSheetByName('ลงทะเบียน');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const registrations = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) {
        registrations.push({
          date: row[0],
          email: row[1],
          password: row[2],
          phone: row[3],
          storeName: row[4],
          package: row[5],
          status: row[6],
          slip: row[7]
        });
      }
    }

    Logger.log("ส่งข้อมูล registrations จำนวน: " + registrations.length);
    return JSON.stringify(registrations);  // << แปลงเป็น String JSON ก่อน
  } catch (error) {
    Logger.log("เกิดข้อผิดพลาดในการดึงข้อมูลการลงทะเบียน: " + error.toString());
    throw new Error("ไม่สามารถดึงข้อมูลการลงทะเบียนได้: " + error.toString());
  }
}



function getLicenses() {
  try {
    const sheet = SpreadsheetApp.openById(LICENSE_SHEET_ID).getSheetByName('licenseV_3');
    Logger.log("เปิดชีทใบอนุญาตสำเร็จ");

    const data = sheet.getDataRange().getValues();
    Logger.log("จำนวนแถวข้อมูลทั้งหมด: " + data.length);

    const headers = data[0];
    Logger.log("หัวข้อ: " + headers.join(", "));

    // เพิ่มส่วนนี้: แสดงข้อมูลทุกแถวอย่างละเอียด
    Logger.log("=== ข้อมูลแต่ละแถวในชีท ===");
    for (let i = 1; i < data.length; i++) {
      Logger.log(`แถวที่ ${i}:`);
      Logger.log(`  sheetID: ${data[i][0]}`);
      Logger.log(`  storeID: ${data[i][1]}`);
      Logger.log(`  expireDate: ${data[i][2]}`);
      Logger.log(`  package: ${data[i][3]}`);
      Logger.log(`  storeName: ${data[i][4]}`); // เพิ่มบรรทัดนี้
    }

    const licenses = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) { // Check if sheetID exists (not an empty row)
        licenses.push({
          sheetID: row[0],
          storeID: row[1],
          expireDate: row[2],
          package: row[3],
          storeName: row[4] || 'ไม่ระบุชื่อร้าน' // เพิ่มบรรทัดนี้ พร้อมค่า default
        });
      }
    }

    Logger.log("จำนวนข้อมูลใบอนุญาตที่พบ: " + licenses.length);
    Logger.log("ข้อมูลใบอนุญาตที่จะส่งกลับไปยัง client:");
    Logger.log(JSON.stringify(licenses));

    // แปลงเป็น String JSON ก่อนส่งกลับ
    return JSON.stringify(licenses);
  } catch (error) {
    Logger.log("เกิดข้อผิดพลาดในการดึงข้อมูลใบอนุญาต: " + error.toString());
    throw new Error("ไม่สามารถดึงข้อมูลใบอนุญาตได้: " + error.toString());
  }
}



// ฟังก์ชันสร้างฐานข้อมูลใหม่ (เวอร์ชันที่เพิ่ม Google Calendar)
function createNewDatabase(email, storeName, packageType) {
  Logger.log(`เริ่มการสร้างฐานข้อมูลใหม่สำหรับ email: ${email}, ชื่อร้าน: ${storeName}, แพ็คเกจ: ${packageType}`);
  
  try {
    // ดึงข้อมูลการลงทะเบียนเพื่อหารหัสผ่าน
    Logger.log(`กำลังดึงข้อมูลการลงทะเบียนของ ${email}`);
    const registrationSheet = SpreadsheetApp.openById(LICENSE_SHEET_ID).getSheetByName('ลงทะเบียน');
    const registrationData = registrationSheet.getDataRange().getValues();
    
    // ค้นหาข้อมูลของ email ที่ต้องการอนุมัติ
    let userPassword = null;
    let registrationRowIndex = -1;
    
    for (let i = 1; i < registrationData.length; i++) {
      if (registrationData[i][1] === email) { // คอลัมน์ "อีเมล" (index 1)
        userPassword = registrationData[i][2]; // คอลัมน์ "รหัสผ่าน" (index 2)
        registrationRowIndex = i;
        Logger.log(`พบข้อมูลการลงทะเบียนของ ${email} ที่แถวที่ ${i+1}, รหัสผ่าน: ${userPassword}`);
        break;
      }
    }
    
    // ตรวจสอบว่าพบข้อมูลการลงทะเบียนหรือไม่
    if (!userPassword || registrationRowIndex === -1) {
      Logger.log(`ไม่พบข้อมูลการลงทะเบียนของ ${email}`);
      throw new Error('ไม่พบข้อมูลการลงทะเบียนของอีเมลนี้');
    }
    
    // ตรวจสอบว่า email มีในระบบ Login แล้วหรือไม่ (เพื่อป้องกันการซ้ำ)
    Logger.log(`กำลังตรวจสอบว่า email: ${email} มีในระบบ Login แล้วหรือไม่`);
    const loginSheet = SpreadsheetApp.openById(LICENSE_SHEET_ID).getSheetByName('Login');
    const loginData = loginSheet.getDataRange().getValues();
    
    for (let i = 1; i < loginData.length; i++) {
      if (loginData[i][0] === email) {
        Logger.log(`พบ email: ${email} ในระบบ Login แล้ว ไม่สามารถสร้างฐานข้อมูลใหม่ได้`);
        throw new Error('อีเมลนี้มีในระบบแล้ว');
      }
    }
    
    // สร้าง StoreID แบบ random
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const storeID = 'SID' + randomNum;
    Logger.log(`สร้าง StoreID ใหม่: ${storeID}`);
    
    // สร้างโฟลเดอร์หลัก
    Logger.log(`กำลังสร้างโฟลเดอร์หลักสำหรับ ${storeName}`);
    const parentFolder = DriveApp.getFolderById(PARENT_FOLDER_ID);
    const newFolder = parentFolder.createFolder('ระบบจัดการรถเช่าKPCRM_V3_' + storeName);
    Logger.log(`สร้างโฟลเดอร์หลักเรียบร้อย ID: ${newFolder.getId()}`);
    
    // สร้างโฟลเดอร์สัญญาเช่า
    Logger.log(`กำลังสร้างโฟลเดอร์สัญญาเช่า`);
    const contractsFolder = newFolder.createFolder('โฟลเดอร์สัญญาเช่า');
    Logger.log(`สร้างโฟลเดอร์สัญญาเช่าเรียบร้อย ID: ${contractsFolder.getId()}`);
    
    // ===== เพิ่มส่วนนี้: สร้าง Google Calendar =====
    Logger.log(`กำลังสร้าง Google Calendar สำหรับ ${storeName}`);
    let calendarId = null;
    
    try {
      // สร้างปฏิทินใหม่ (ใช้แบบง่าย ไม่ใช้ options)
      const calendar = CalendarApp.createCalendar(storeName);
      
      calendarId = calendar.getId();
      Logger.log(`สร้าง Google Calendar เรียบร้อย ID: ${calendarId}`);
      
      // ตั้งค่าปฏิทิน
      calendar.setDescription(`ปฏิทินสำหรับจัดการการจองและคืนรถเช่าของ ${storeName}`);
      calendar.setTimeZone('Asia/Bangkok');
      Logger.log(`ตั้งค่าปฏิทินเรียบร้อย`);
      
      // แชร์ปฏิทินให้กับผู้ใช้
      Logger.log(`กำลังแชร์ปฏิทินให้กับ ${email}`);
      calendar.addEditor(email);
      Logger.log(`แชร์ปฏิทินเรียบร้อย - ${email} สามารถแก้ไขปฏิทินได้`);
      
      // เพิ่มสีให้ปฏิทิน (สีน้ำเงิน)
      calendar.setColor(CalendarApp.Color.BLUE);
      Logger.log(`กำหนดสีปฏิทินเรียบร้อย`);
      
      // ตั้งค่าให้เปิดเผยต่อสาธารณะ (Public)
      Logger.log(`กำลังตั้งค่าปฏิทินให้เปิดเผยต่อสาธารณะ`);
      try {
        // ใช้ Advanced Calendar Service เพื่อทำให้ปฏิทินเป็น Public
        Calendar.Acl.insert({
          role: 'reader',  // สิทธิ์ในการดู
          scope: {
            type: 'default'  // เปิดเผยต่อสาธารณะ
          }
        }, calendarId);
        Logger.log(`ตั้งค่าปฏิทินให้เปิดเผยต่อสาธารณะเรียบร้อย`);
      } catch (publicError) {
        Logger.log(`เกิดข้อผิดพลาดในการตั้งค่าเปิดเผยต่อสาธารณะ: ${publicError.toString()}`);
        Logger.log(`หมายเหตุ: ต้องเปิดใช้งาน Advanced Calendar Service ใน Apps Script`);
      }
      
    } catch (calendarError) {
      Logger.log(`เกิดข้อผิดพลาดในการสร้างปฏิทิน: ${calendarError.toString()}`);
      // ไม่ throw error เพื่อให้กระบวนการดำเนินต่อไป แต่จะบันทึก error
    }
    // ===== จบส่วนที่เพิ่ม =====
    
    // คัดลอกไฟล์เทมเพลต
    Logger.log(`กำลังคัดลอกไฟล์เทมเพลตสำหรับ ${storeName}`);
    const templateFile = DriveApp.getFileById(TEMPLATE_SHEET_ID);
    const newFile = templateFile.makeCopy('ระบบจัดการรถเช่าKPCRM_V3_' + storeName, newFolder);
    Logger.log(`คัดลอกไฟล์เทมเพลตเรียบร้อย ID: ${newFile.getId()}`);
    
    // กำหนดสิทธิ์โฟลเดอร์
    Logger.log(`กำลังกำหนดสิทธิ์ให้ ${email} เป็นผู้แก้ไขโฟลเดอร์`);
    try {
      newFolder.addEditor(email);
      Logger.log(`กำหนดสิทธิ์เรียบร้อย`);
    } catch (permissionError) {
      Logger.log(`เกิดข้อผิดพลาดในการกำหนดสิทธิ์: ${permissionError.toString()}`);
      // ไม่ throw error เพื่อให้กระบวนการดำเนินต่อไป
    }
    
    // อัปเดตการตั้งค่าในชีทใหม่
    Logger.log(`กำลังอัปเดตการตั้งค่าในชีทใหม่`);
    const newSheet = SpreadsheetApp.openById(newFile.getId());
    const settingsSheet = newSheet.getSheetByName('ตั้งค่าระบบ');
    
    if (settingsSheet) {
      Logger.log(`กำลังอัปเดตค่า IDโฟลเดอร์หลัก, IDโฟลเดอร์สัญญาเช่า, ชื่อบริษัท, storeSID และ IDปฏิทิน`);
      updateSetting(settingsSheet, 'IDโฟลเดอร์หลัก', newFolder.getId());
      updateSetting(settingsSheet, 'IDโฟลเดอร์สัญญาเช่า', contractsFolder.getId());
      updateSetting(settingsSheet, 'ชื่อบริษัท', storeName);
      updateSetting(settingsSheet, 'storeSID', storeID);
      
      // ===== เพิ่มการบันทึก Calendar ID =====
      if (calendarId) {
        updateSetting(settingsSheet, 'IDปฏิทิน', calendarId);
        Logger.log(`บันทึก IDปฏิทิน เรียบร้อย: ${calendarId}`);
      }
      // ===== จบส่วนที่เพิ่ม =====
      
      Logger.log(`อัปเดตการตั้งค่าเรียบร้อย`);
    } else {
      Logger.log(`ไม่พบชีท 'ตั้งค่าระบบ' ในไฟล์เทมเพลต`);
    }
    
    // คำนวณวันหมดอายุ
    Logger.log(`กำลังคำนวณวันหมดอายุสำหรับแพ็คเกจ: ${packageType}`);
    const today = new Date();
    let expiryDate = new Date();
    
    switch (packageType) {
      case 'monthly':
        expiryDate.setDate(today.getDate() + 32);
        Logger.log(`แพ็คเกจรายเดือน วันหมดอายุ +32 วัน`);
        break;
      case 'yearly':
        expiryDate.setDate(today.getDate() + 366);
        Logger.log(`แพ็คเกจรายปี วันหมดอายุ +366 วัน`);
        break;
      case 'lifetime':
        expiryDate.setDate(today.getDate() + 9999);
        Logger.log(`แพ็คเกจตลอดชีพ วันหมดอายุ +9999 วัน`);
        break;
      default:
        expiryDate.setDate(today.getDate() + 32);
        Logger.log(`แพ็คเกจไม่ระบุ ใช้ค่าเริ่มต้น +32 วัน`);
    }
    
    const formattedExpiryDate = Utilities.formatDate(expiryDate, 'GMT+7', 'yyyy-MM-dd');
    Logger.log(`วันหมดอายุ: ${formattedExpiryDate}`);
    
    // เพิ่มข้อมูลใบอนุญาตใหม่ลงในชีท licenseV_3
    Logger.log(`กำลังเพิ่มข้อมูลใบอนุญาตใหม่ลงในชีท licenseV_3`);
    const licenseSheet = SpreadsheetApp.openById(LICENSE_SHEET_ID).getSheetByName('licenseV_3');
    licenseSheet.appendRow([
      newFile.getId(),        // Sheet ID
      storeID,               // Store ID  
      formattedExpiryDate,   // วันหมดอายุ
      packageType,           // แพ็คเกจ
      storeName              // ชื่อร้าน
    ]);
    Logger.log(`เพิ่มข้อมูลใบอนุญาตเรียบร้อย`);
    
    // เพิ่มผู้ใช้เข้าสู่ระบบโดยใช้ LicenseLib
    Logger.log(`กำลังเพิ่มข้อมูลเข้าสู่ระบบโดยใช้ LicenseLib.createOrUpdateUser`);
    
    const username = email;           // ใช้ email เป็น username
    const password = userPassword;    // ใช้รหัสผ่านจากชีทลงทะเบียน
    const displayName = storeName;    // ใช้ชื่อร้านเป็นชื่อที่แสดง
    const role = 'admin';            // ตั้งค่าเป็น admin เสมอ
    
    Logger.log(`พารามิเตอร์สำหรับ createOrUpdateUser:`);
    Logger.log(`  username: ${username}`);
    Logger.log(`  password: ${password}`);
    Logger.log(`  sheetID: ${newFile.getId()}`);
    Logger.log(`  storeSID: ${storeID}`);
    Logger.log(`  role: ${role}`);
    Logger.log(`  displayName: ${displayName}`);
    
    try {
      const userResult = LicenseLib.createOrUpdateUser(
        username,
        password,
        newFile.getId(),
        storeID,
        role,
        displayName
      );
      
      Logger.log(`ผลลัพธ์จาก LicenseLib.createOrUpdateUser:`);
      Logger.log(JSON.stringify(userResult, null, 2));
      
      if (userResult.success) {
        Logger.log(`เพิ่มผู้ใช้เข้าสู่ระบบ Login สำเร็จ`);
      } else {
        Logger.log(`เกิดข้อผิดพลาดจาก LicenseLib: ${userResult.message}`);
        throw new Error(`ไม่สามารถเพิ่มผู้ใช้: ${userResult.message}`);
      }
    } catch (userError) {
      Logger.log(`เกิดข้อผิดพลาดในการเรียก LicenseLib: ${userError.toString()}`);
      throw new Error(`ไม่สามารถเพิ่มผู้ใช้: ${userError.toString()}`);
    }
    
    // อัปเดตสถานะการลงทะเบียน
    Logger.log(`กำลังอัปเดตสถานะการลงทะเบียน`);
    registrationSheet.getRange(registrationRowIndex + 1, 7).setValue('เปิดใช้งานแล้ว');
    Logger.log(`อัปเดตสถานะเรียบร้อย`);
    
    Logger.log(`การสร้างฐานข้อมูลเสร็จสมบูรณ์สำหรับ ${storeName}`);
    
    // ===== ส่งข้อมูล Calendar ID กลับไปด้วย =====
    return {
      status: 'success',
      message: 'สร้างฐานข้อมูลสำเร็จ',
      data: {
        email: email,
        storeName: storeName,
        storeID: storeID,
        sheetID: newFile.getId(),
        folderID: newFolder.getId(),
        calendarID: calendarId,  // เพิ่ม Calendar ID ในผลลัพธ์
        expireDate: formattedExpiryDate,
        packageType: packageType
      }
    };
    // ===== จบส่วนที่เพิ่ม =====
    
  } catch (error) {
    Logger.log(`เกิดข้อผิดพลาดในการสร้างฐานข้อมูล: ${error.toString()}`);
    throw new Error(error.toString());
  }
}


// ฟังก์ชันช่วยเหลือสำหรับการอัปเดตการตั้งค่า
function updateSetting(settingsSheet, settingName, settingValue) {
  const data = settingsSheet.getDataRange().getValues();
  
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === settingName) {
      settingsSheet.getRange(i + 1, 2).setValue(settingValue);
      Logger.log(`อัปเดต ${settingName} = ${settingValue}`);
      return true;
    }
  }
  
  Logger.log(`ไม่พบการตั้งค่า ${settingName} ในชีท`);
  return false;
}


// ===== ฟังก์ชันเพิ่มเติมสำหรับจัดการปฏิทิน =====

/**
 * ฟังก์ชันสำหรับเพิ่มกิจกรรมในปฏิทิน
 * @param {string} calendarId - ID ของปฏิทิน
 * @param {string} title - หัวข้อกิจกรรม
 * @param {Date} startDate - วันที่เริ่มต้น
 * @param {Date} endDate - วันที่สิ้นสุด
 * @param {string} description - รายละเอียด
 */
function addCalendarEvent(calendarId, title, startDate, endDate, description) {
  try {
    const calendar = CalendarApp.getCalendarById(calendarId);
    
    if (calendar) {
      const event = calendar.createEvent(title, startDate, endDate, {
        description: description,
        location: 'Thailand'
      });
      
      Logger.log(`เพิ่มกิจกรรม "${title}" ในปฏิทินเรียบร้อย`);
      return event.getId();
    } else {
      Logger.log(`ไม่พบปฏิทิน ID: ${calendarId}`);
      return null;
    }
  } catch (error) {
    Logger.log(`เกิดข้อผิดพลาดในการเพิ่มกิจกรรม: ${error.toString()}`);
    return null;
  }
}


/**
 * ฟังก์ชันสำหรับลบปฏิทิน (ใช้เมื่อลบร้าน)
 * @param {string} calendarId - ID ของปฏิทินที่ต้องการลบ
 */
function deleteCalendar(calendarId) {
  try {
    const calendar = CalendarApp.getCalendarById(calendarId);
    
    if (calendar) {
      calendar.deleteCalendar();
      Logger.log(`ลบปฏิทิน ID: ${calendarId} เรียบร้อย`);
      return true;
    } else {
      Logger.log(`ไม่พบปฏิทิน ID: ${calendarId}`);
      return false;
    }
  } catch (error) {
    Logger.log(`เกิดข้อผิดพลาดในการลบปฏิทิน: ${error.toString()}`);
    return false;
  }
}


/**
 * ฟังก์ชันสำหรับแชร์ปฏิทินให้กับผู้ใช้เพิ่มเติม
 * @param {string} calendarId - ID ของปฏิทิน
 * @param {string} email - อีเมลของผู้ใช้ที่ต้องการแชร์
 * @param {string} role - บทบาท ('owner', 'editor', 'reader')
 */
function shareCalendar(calendarId, email, role = 'editor') {
  try {
    const calendar = CalendarApp.getCalendarById(calendarId);
    
    if (!calendar) {
      Logger.log(`ไม่พบปฏิทิน ID: ${calendarId}`);
      return false;
    }
    
    switch (role) {
      case 'owner':
        // หมายเหตุ: CalendarApp ไม่สามารถเปลี่ยนเจ้าของได้โดยตรง
        // ต้องใช้ Advanced Calendar Service
        Logger.log(`การเปลี่ยนเจ้าของต้องใช้ Advanced Calendar Service`);
        return false;
        
      case 'editor':
        calendar.addEditor(email);
        Logger.log(`แชร์ปฏิทินให้ ${email} เป็นผู้แก้ไขเรียบร้อย`);
        return true;
        
      case 'reader':
        calendar.addViewer(email);
        Logger.log(`แชร์ปฏิทินให้ ${email} เป็นผู้ดูเรียบร้อย`);
        return true;
        
      default:
        Logger.log(`บทบาทไม่ถูกต้อง: ${role}`);
        return false;
    }
  } catch (error) {
    Logger.log(`เกิดข้อผิดพลาดในการแชร์ปฏิทิน: ${error.toString()}`);
    return false;
  }
}

// ===== จบฟังก์ชันเพิ่มเติม =====





// Update setting in settings sheet
function updateSetting(sheet, key, value) {
  Logger.log(`กำลังอัปเดตการตั้งค่า ${key} เป็น ${value}`);
  const data = sheet.getDataRange().getValues();
  let settingFound = false;
  
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      Logger.log(`อัปเดตการตั้งค่า ${key} เรียบร้อยที่แถวที่ ${i+1}`);
      settingFound = true;
      break;
    }
  }
  
  if (!settingFound) {
    Logger.log(`ไม่พบการตั้งค่า ${key} ในชีทตั้งค่าระบบ`);
  }
}




// Extend license
function extendLicense(storeID, packageType) {
  Logger.log(`เริ่มการต่ออายุใบอนุญาตสำหรับ StoreID: ${storeID}, แพ็คเกจ: ${packageType}`);
  
  try {
    Logger.log(`กำลังเปิดชีท licenseV_3 เพื่อค้นหาข้อมูลใบอนุญาต`);
    const licenseSheet = SpreadsheetApp.openById(LICENSE_SHEET_ID).getSheetByName('licenseV_3');
    const data = licenseSheet.getDataRange().getValues();
    
    // เพิ่มส่วนนี้: แสดงข้อมูลก่อนการอัปเดต
    Logger.log("=== ข้อมูลก่อนการอัปเดต ===");
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === storeID) {
        Logger.log(`พบข้อมูลที่แถวที่ ${i+1}:`);
        Logger.log(`  sheetID: ${data[i][0]}`);
        Logger.log(`  storeID: ${data[i][1]}`);
        Logger.log(`  expireDate: ${data[i][2]}`);
        Logger.log(`  package: ${data[i][3]}`);
      }
    }
    
    // Calculate new expiration date - ส่วนที่แก้ไข
    Logger.log(`กำลังคำนวณวันหมดอายุใหม่สำหรับแพ็คเกจ: ${packageType}`);
    const today = new Date();
    let expiryDate = new Date();

    // ค้นหาวันหมดอายุเดิม
    let oldExpiryDate = null;
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === storeID) {
        oldExpiryDate = new Date(data[i][2]);
        break;
      }
    }

    // ใช้วันหมดอายุเดิมเป็นจุดเริ่มต้นถ้ายังไม่หมดอายุ
    if (oldExpiryDate && oldExpiryDate > today) {
      expiryDate = oldExpiryDate;
      Logger.log(`ใช้วันหมดอายุเดิม ${Utilities.formatDate(oldExpiryDate, 'GMT+7', 'yyyy-MM-dd')} เป็นจุดเริ่มต้น`);
    } else {
      expiryDate = today;
      Logger.log(`ใช้วันที่ปัจจุบัน ${Utilities.formatDate(today, 'GMT+7', 'yyyy-MM-dd')} เป็นจุดเริ่มต้น`);
    }

    if (packageType === 'monthly') {
      expiryDate.setDate(expiryDate.getDate() + 32);
      Logger.log(`แพ็คเกจรายเดือน วันหมดอายุใหม่ +32 วัน`);
    } else if (packageType === 'yearly') {
      expiryDate.setDate(expiryDate.getDate() + 366);
      Logger.log(`แพ็คเกจรายปี วันหมดอายุใหม่ +366 วัน`);
    } else if (packageType === 'lifetime') {
      expiryDate.setDate(expiryDate.getDate() + 9999);
      Logger.log(`แพ็คเกจตลอดชีพ วันหมดอายุใหม่ +9999 วัน`);
    }
    
    const formattedExpiryDate = Utilities.formatDate(expiryDate, 'GMT+7', 'yyyy-MM-dd');
    Logger.log(`วันหมดอายุใหม่: ${formattedExpiryDate}`);
    
    // Update license
    Logger.log(`กำลังค้นหา StoreID: ${storeID} ในชีทใบอนุญาต`);
    let licenseFound = false;
    let updatedRow = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === storeID) {
        Logger.log(`พบ StoreID: ${storeID} ที่แถวที่ ${i+1}`);
        Logger.log(`กำลังอัปเดตวันหมดอายุเป็น ${formattedExpiryDate} และแพ็คเกจเป็น ${packageType}`);
        
        // ตรวจสอบค่าก่อนอัปเดต
        Logger.log(`ค่าก่อนอัปเดต - แถวที่ ${i+1}, คอลัมน์ที่ 3: ${licenseSheet.getRange(i+1, 3).getValue()}`);
        Logger.log(`ค่าก่อนอัปเดต - แถวที่ ${i+1}, คอลัมน์ที่ 4: ${licenseSheet.getRange(i+1, 4).getValue()}`);
        
        // ทำการอัปเดต
        licenseSheet.getRange(i + 1, 3).setValue(formattedExpiryDate);
        licenseSheet.getRange(i + 1, 4).setValue(packageType);
        
        // ตรวจสอบค่าหลังอัปเดต
        Logger.log(`ค่าหลังอัปเดต - แถวที่ ${i+1}, คอลัมน์ที่ 3: ${licenseSheet.getRange(i+1, 3).getValue()}`);
        Logger.log(`ค่าหลังอัปเดต - แถวที่ ${i+1}, คอลัมน์ที่ 4: ${licenseSheet.getRange(i+1, 4).getValue()}`);
        
        licenseFound = true;
        updatedRow = i + 1;
        Logger.log(`อัปเดตใบอนุญาตเรียบร้อย`);
        break;
      }
    }
    
    if (!licenseFound) {
      Logger.log(`ไม่พบข้อมูลใบอนุญาตสำหรับ StoreID: ${storeID}`);
      throw new Error(`ไม่พบ StoreID: ${storeID} ในระบบ`);
    }
    
    // ตรวจสอบข้อมูลในชีตหลังการอัปเดต
    Logger.log("=== ตรวจสอบข้อมูลในชีตหลังการอัปเดต ===");
    const updatedData = licenseSheet.getDataRange().getValues();
    for (let i = 1; i < updatedData.length; i++) {
      if (updatedData[i][1] === storeID) {
        Logger.log(`ข้อมูลหลังการอัปเดตที่แถวที่ ${i+1}:`);
        Logger.log(`  sheetID: ${updatedData[i][0]}`);
        Logger.log(`  storeID: ${updatedData[i][1]}`);
        Logger.log(`  expireDate: ${updatedData[i][2]}`);
        Logger.log(`  package: ${updatedData[i][3]}`);
      }
    }
    
    // ตรวจสอบเซลล์โดยตรงอีกครั้ง
    if (updatedRow > 0) {
      Logger.log(`ตรวจสอบค่าในเซลล์โดยตรงหลังการอัปเดตเสร็จสิ้น:`);
      Logger.log(`ค่าในเซลล์ C${updatedRow}: ${licenseSheet.getRange(updatedRow, 3).getValue()}`);
      Logger.log(`ค่าในเซลล์ D${updatedRow}: ${licenseSheet.getRange(updatedRow, 4).getValue()}`);
      
      // ทดลองบังคับให้ชีตอัปเดต
      SpreadsheetApp.flush();
      Logger.log("ได้เรียกใช้ SpreadsheetApp.flush() เพื่อบังคับให้ชีตอัปเดต");
      
      // ตรวจสอบอีกครั้งหลังจาก flush
      Logger.log(`ค่าในเซลล์หลัง flush - C${updatedRow}: ${licenseSheet.getRange(updatedRow, 3).getValue()}`);
      Logger.log(`ค่าในเซลล์หลัง flush - D${updatedRow}: ${licenseSheet.getRange(updatedRow, 4).getValue()}`);
    }
    
    Logger.log(`การต่ออายุใบอนุญาตสำเร็จ StoreID: ${storeID}, แพ็คเกจ: ${packageType}, วันหมดอายุ: ${formattedExpiryDate}`);
    
    return {
      status: 'success',
      message: 'ต่ออายุใบอนุญาตเรียบร้อยแล้ว',
      data: {
        storeID: storeID,
        expireDate: formattedExpiryDate,
        package: packageType
      }
    };
  } catch (error) {
    Logger.log(`เกิดข้อผิดพลาดในการต่ออายุใบอนุญาต: ${error.toString()}`);
    throw new Error(error.toString());
  }
}






// แก้ไขฟังก์ชัน verifyLogin ให้รองรับ username ใหม่
function verifyLogin(username, password) {
  Logger.log(`พยายามเข้าสู่ระบบด้วย username: ${username}`);
  
  // ตรวจสอบข้อมูลการเข้าสู่ระบบสำหรับแอดมิน
  if (username === 'kpcrm' && password === 'Kp23021401') {
    Logger.log('เข้าสู่ระบบแอดมินสำเร็จ');
    return { success: true, message: 'เข้าสู่ระบบแอดมินสำเร็จ' };
  }
  
  // ตรวจสอบข้อมูลการเข้าสู่ระบบเดิม (สำหรับความเข้ากันได้)
  if (username === 'admin' && password === 'kp23021401') {
    Logger.log('เข้าสู่ระบบแอดมินสำเร็จ (เดิม)');
    return { success: true, message: 'เข้าสู่ระบบแอดมินสำเร็จ' };
  }
  
  Logger.log('เข้าสู่ระบบไม่สำเร็จ - ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  return { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
}

// Test function
function testConnection() {
  return {
    status: 'success',
    message: 'การเชื่อมต่อสำเร็จ',
    timestamp: new Date().toString()
  };
}








// ฟังก์ชันทดสอบการเพิ่มผู้ใช้ใหม่โดยตรง
function createNewUser() {
  // กำหนดค่าทดสอบโดยตรง
  const username = "4@gmail.com";
  const password = "4";
  const sheetID = "1oCoYYpgaA3KF72CEfBCCGWN3n7Qt-qd52vdvgNOP6cY";
  const storeSID = "SID2305";
  const role = "admin";
  const displayName = "4";
  
  Logger.log("กำลังทดสอบการเพิ่มผู้ใช้ใหม่โดยตรง:");
  Logger.log(`ข้อมูล: ${username}, ${password}, ${sheetID}, ${storeSID}, ${role}, ${displayName}`);
  
  // เรียกใช้ LicenseLib.createOrUpdateUser โดยตรง
  const result = LicenseLib.createOrUpdateUser(
    username,
    password,
    sheetID,
    storeSID,
    role,
    displayName
  );
  
  // แสดงผลลัพธ์
  Logger.log("ผลลัพธ์การทดสอบ:");
  Logger.log(JSON.stringify(result, null, 2));
  
  return result;
}































