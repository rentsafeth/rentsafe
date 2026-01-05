

// ฟังก์ชันสำหรับแปลงชื่อร้านใน URL เป็นชื่อที่แสดงผล
function getShopDisplayName(shopNameKey) {
    const displayNames = {
        'booking': 'KP Carrent',
        'kpcarrent': 'KP Carrent',
        'abccarrent': 'ABC Carrent'
    };
    return displayNames[shopNameKey.toLowerCase()] || shopNameKey;
}


/**
 * =================================================================
 * ส่วนที่ 2: เพิ่มค่าคงที่สำหรับ Sheet ใหม่
 * =================================================================
 */



/**
 * =================================================================
 * ส่วนที่ 3: ฟังก์ชันใหม่สำหรับจัดการการจองออนไลน์
 * =================================================================
 */

// ดึงข้อมูลเริ่มต้นสำหรับหน้าจองออนไลน์
function getOnlineBookingInitialData(params) {
  try {
    const settings = getOnlineBookingSettings(params.sheetId);
    if (!settings.enabled) {
      return { shopClosed: true };
    }
    return {
      shopClosed: false,
      pickupLocations: settings.pickupLocations ? settings.pickupLocations.split(',').map(s => s.trim()) : [],
      returnLocations: settings.returnLocations ? settings.returnLocations.split(',').map(s => s.trim()) : [],
    };
  } catch (e) {
    Logger.log("Error in getOnlineBookingInitialData: " + e.message);
    return { shopClosed: true, error: e.message };
  }
}

// ค้นหารถที่ว่างสำหรับลูกค้า
function findAvailableCarsForCustomer(params) {
  try {
    const settings = getOnlineBookingSettings(params.sheetId);
    
    // ใช้ฟังก์ชัน findAvailableCars เดิม แต่ใช้ค่า prepTime จากการตั้งค่าออนไลน์
    const result = findAvailableCars(
      params.pickupDate,
      params.pickupTime,
      params.returnDate,
      params.returnTime,
      parseInt(settings.prepTime || '60'), // ใช้ค่า prepTime จาก settings
      params.sheetId
    );

    // กรองรถเฉพาะคันที่เปิดให้จองออนไลน์และมีราคา
    const onlineCars = result.availableCars.filter(car => {
      const carSetting = settings.carSettings ? settings.carSettings[car.id] : null;
      return carSetting && carSetting.enabled && carSetting.dailyRate > 0;
    }).map(car => {
      const carSetting = settings.carSettings[car.id];
      return {
        id: car.id,
        name: `${car.ยี่ห้อ} ${car.รุ่น}`,
        photoUrl: carSetting.photoUrl || null,
        dailyRate: carSetting.dailyRate,
        deposit: carSetting.deposit,
        insurance: carSetting.insurance,
      };
    });

    return { availableCars: onlineCars };
  } catch(e) {
      Logger.log("Error in findAvailableCarsForCustomer: " + e.message);
      return { availableCars: [], error: e.message };
  }
}

// บันทึกการจองออนไลน์
function saveOnlineBooking(params) {
  try {
    const { bookingData, sheetId } = params;
    const ss = SpreadsheetApp.openById(sheetId);
    let sheet = ss.getSheetByName(ONLINE_BOOKING_SHEET);

    if (!sheet) {
      sheet = ss.insertSheet(ONLINE_BOOKING_SHEET);
      sheet.appendRow([
        "วันที่จอง", "หมายเลขการจอง", "สถานะ", "ชื่อลูกค้า", "เบอร์โทรศัพท์", "รถ",
        "รับรถ", "คืนรถ", "สถานที่รับ", "สถานที่คืน", "ยอดรวม", "ค่ามัดจำ", "ค่าประกัน"
      ]);
    }

    const bookingNumber = generateOnlineBookingNumber(sheetId);
    const newRow = [
      new Date(),
      bookingNumber,
      "รอยืนยัน",
      bookingData.name,
      bookingData.phone,
      bookingData.carName,
      bookingData.pickupDateTime,
      bookingData.returnDateTime,
      bookingData.pickupLocation,
      bookingData.returnLocation,
      bookingData.total,
      bookingData.deposit,
      bookingData.insurance
    ];

    sheet.appendRow(newRow);

    // TODO: เพิ่มการส่ง Email หรือ Line Notify แจ้งเตือนร้านค้า
    
    return { success: true, bookingNumber: bookingNumber };

  } catch (e) {
    Logger.log("Error in saveOnlineBooking: " + e.message);
    return { success: false, message: e.message };
  }
}

// สร้างหมายเลขการจองออนไลน์ (BKXXXXX)
function generateOnlineBookingNumber(sheetId) {
  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheetByName(ONLINE_BOOKING_SHEET);
  let lastNumber = 0;
  
  if (sheet && sheet.getLastRow() > 1) {
    const bookingNumbers = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();
    bookingNumbers.forEach(row => {
      if(row[0] && typeof row[0] === 'string'){
        const numPart = row[0].replace('BK', '');
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > lastNumber) {
          lastNumber = num;
        }
      }
    });
  }
  
  const newNumber = lastNumber + 1;
  return 'BK' + String(newNumber).padStart(5, '0');
}


// บันทึกการตั้งค่าการจองออนไลน์
function saveOnlineBookingSettings(settings, sheetId) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    let sheet = ss.getSheetByName(ONLINE_BOOKING_SETTINGS_SHEET);
    if (!sheet) {
      sheet = ss.insertSheet(ONLINE_BOOKING_SETTINGS_SHEET);
    }
    sheet.clear();
    sheet.getRange(1, 1).setValue(JSON.stringify(settings));
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ดึงข้อมูลการตั้งค่าการจองออนไลน์
function getOnlineBookingSettings(sheetId) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheetByName(ONLINE_BOOKING_SETTINGS_SHEET);
    if (!sheet) return {};
    const data = sheet.getRange(1, 1).getValue();
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

// อัพโหลดรูปภาพรถ
function uploadCarPhoto(base64Data, fileName, carId, sheetId) {
    try {
        const config = getOnlineBookingSettings(sheetId);
        let folderId = config.imageFolderId;

        if (!folderId) {
            // สร้างโฟลเดอร์ถ้ายังไม่มี
            const newFolder = DriveApp.createFolder("Car_Images_" + sheetId);
            folderId = newFolder.getId();
            // บันทึก folderId กลับไปที่ settings
            config.imageFolderId = folderId;
            saveOnlineBookingSettings(config, sheetId);
        }

        const folder = DriveApp.getFolderById(folderId);
        const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), MimeType.PNG, `car_${carId}_${fileName}`);
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        return { success: true, fileUrl: file.getUrl() };
    } catch (e) {
        return { success: false, message: e.message };
    }
}
