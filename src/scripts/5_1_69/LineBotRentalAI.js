// =============================================================================
// LINE Bot - AI-Powered Rental Creation System
// =============================================================================
// ระบบสร้างรายการเช่าผ่าน LINE Bot ด้วย AI (Google Gemini)
// - รับคำสั่งจากผู้ใช้ "สร้างรายการเช่า"
// - ใช้ AI ถอดรายละเอียดจากข้อความอิสระ
// - สร้างรายการเช่าอัตโนมัติผ่าน addNewRental
// =============================================================================

// =============================================================================
// ⚙️ Configuration
// =============================================================================

/**
 * Gemini API Configuration
 * คู่มือการขอ API Key: https://ai.google.dev/gemini-api/docs/api-key
 */
const GEMINI_API_KEY = "AIzaSyCLR8kj8FKkEdGCoElCH-FwYLpDJEYrDg8"; // << ⚠️ ใส่ API Key ที่นี่
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
// ... (lines 20-220 omitted for brevity)



/**
 * State Constants
 */
const RENTAL_STATE = {
  IDLE: 'IDLE',
  WAITING_FOR_DETAILS: 'WAITING_FOR_DETAILS',
  WAITING_FOR_CONFIRMATION: 'WAITING_FOR_CONFIRMATION',
  CREATING: 'CREATING'
};

/**
 * Timeout Configuration (นาที)
 */
const CONVERSATION_TIMEOUT_MINUTES = 30;

/**
 * Cache Key Prefix
 */
const CACHE_PREFIX_RENTAL_STATE = 'rental_state_';

// =============================================================================
// 📦 State Management Functions
// =============================================================================

/**
 * ดึง State ของผู้ใช้จาก CacheService
 * @param {string} userId - LINE User ID
 * @returns {Object|null} State object หรือ null ถ้าไม่มี
 */
function getUserRentalState(userId) {
  try {
    const cache = CacheService.getScriptCache();
    const cacheKey = CACHE_PREFIX_RENTAL_STATE + userId;
    const stateJson = cache.get(cacheKey);

    if (!stateJson) return null;

    const state = JSON.parse(stateJson);

    // ตรวจสอบ timeout
    if (checkStateTimeout(state)) {
      clearUserRentalState(userId);
      return null;
    }

    return state;
  } catch (error) {
    Logger.log('getUserRentalState Error: ' + error.toString());
    return null;
  }
}

/**
 * บันทึก State ของผู้ใช้ลง CacheService
 * @param {string} userId - LINE User ID
 * @param {Object} state - State object
 */
function setUserRentalState(userId, state) {
  try {
    const cache = CacheService.getScriptCache();
    const cacheKey = CACHE_PREFIX_RENTAL_STATE + userId;

    // เพิ่ม timestamp
    state.timestamp = Date.now();

    // Cache timeout: 30 นาที (1800 วินาที)
    const expirationInSeconds = CONVERSATION_TIMEOUT_MINUTES * 60;
    cache.put(cacheKey, JSON.stringify(state), expirationInSeconds);

    Logger.log('Set rental state for user: ' + userId + ', state: ' + state.state);
  } catch (error) {
    Logger.log('setUserRentalState Error: ' + error.toString());
  }
}

/**
 * ลบ State ของผู้ใช้
 * @param {string} userId - LINE User ID
 */
function clearUserRentalState(userId) {
  try {
    const cache = CacheService.getScriptCache();
    const cacheKey = CACHE_PREFIX_RENTAL_STATE + userId;
    cache.remove(cacheKey);

    Logger.log('Cleared rental state for user: ' + userId);
  } catch (error) {
    Logger.log('clearUserRentalState Error: ' + error.toString());
  }
}

/**
 * ตรวจสอบว่า State หมดเวลาหรือไม่
 * @param {Object} state - State object
 * @returns {boolean} true ถ้าหมดเวลา
 */
function checkStateTimeout(state) {
  if (!state || !state.timestamp) return true;

  const now = Date.now();
  const elapsed = now - state.timestamp;
  const timeoutMs = CONVERSATION_TIMEOUT_MINUTES * 60 * 1000;

  return elapsed > timeoutMs;
}

// =============================================================================
// 🚦 Creation Flag Management (ป้องกันการสร้างรายการซ้อน)
// =============================================================================

/**
 * เช็คว่าร้านกำลังสร้างรายการเช่าอยู่หรือไม่
 * @param {string} shopId - Sheet ID
 * @returns {Object} { isCreating: boolean, source: string, timestamp: number }
 */
function checkRentalCreationFlag(shopId) {
  try {
    const cache = CacheService.getScriptCache();
    const flagKey = `rental_creating_${shopId}`;
    const flagData = cache.get(flagKey);

    if (!flagData) {
      return { isCreating: false, source: null, timestamp: null };
    }

    const flag = JSON.parse(flagData);

    // เช็คว่า flag หมดอายุหรือไม่ (เกิน 2 นาที = operation ล้มเหลว)
    const now = Date.now();
    const elapsed = now - flag.timestamp;
    const timeoutMs = 2 * 60 * 1000; // 2 นาที

    if (elapsed > timeoutMs) {
      // Flag หมดอายุ - ลบทิ้ง
      cache.remove(flagKey);
      return { isCreating: false, source: null, timestamp: null };
    }

    return {
      isCreating: true,
      source: flag.source,
      timestamp: flag.timestamp
    };
  } catch (error) {
    Logger.log('checkRentalCreationFlag Error: ' + error.toString());
    return { isCreating: false, source: null, timestamp: null };
  }
}

/**
 * ตั้งค่า flag ว่ากำลังสร้างรายการเช่า
 * @param {string} shopId - Sheet ID
 * @param {string} source - แหล่งที่มา ('web', 'linebot', 'webchat')
 * @returns {boolean} true ถ้าตั้งค่าสำเร็จ, false ถ้ามี flag อยู่แล้ว
 */
function setRentalCreationFlag(shopId, source) {
  try {
    const cache = CacheService.getScriptCache();
    const flagKey = `rental_creating_${shopId}`;

    // เช็คก่อนว่ามี flag อยู่แล้วหรือไม่
    const existingFlag = checkRentalCreationFlag(shopId);
    if (existingFlag.isCreating) {
      Logger.log(`Rental creation flag already exists for shop ${shopId} (source: ${existingFlag.source})`);
      return false;
    }

    // ตั้ง flag ใหม่
    const flagData = {
      source: source,
      timestamp: Date.now()
    };

    // Cache timeout: 2 นาที (120 วินาที) - auto cleanup
    cache.put(flagKey, JSON.stringify(flagData), 120);

    Logger.log(`Set rental creation flag for shop ${shopId} (source: ${source})`);
    return true;
  } catch (error) {
    Logger.log('setRentalCreationFlag Error: ' + error.toString());
    return false;
  }
}

/**
 * ลบ flag การสร้างรายการเช่า
 * @param {string} shopId - Sheet ID
 */
function clearRentalCreationFlag(shopId) {
  try {
    const cache = CacheService.getScriptCache();
    const flagKey = `rental_creating_${shopId}`;
    cache.remove(flagKey);

    Logger.log(`Cleared rental creation flag for shop ${shopId}`);
  } catch (error) {
    Logger.log('clearRentalCreationFlag Error: ' + error.toString());
  }
}

/**
 * บันทึก Log ลง Sheet สำหรับ Debug
 * @param {string} shopId - Sheet ID
 * @param {string} type - ประเภท Log (ERROR, INFO, WARNING)
 * @param {string} message - ข้อความหลัก
 * @param {Object|string} details - รายละเอียดเพิ่มเติม
 */
function logToSheet(shopId, type, message, details) {
  try {
    const ss = SpreadsheetApp.openById(shopId);
    let logSheet = ss.getSheetByName('SystemLog');

    // สร้าง Sheet ถ้ายังไม่มี
    if (!logSheet) {
      logSheet = ss.insertSheet('SystemLog');
      logSheet.appendRow(['Timestamp', 'Type', 'Message', 'Details']);
      logSheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#f3f4f6');
    }

    // เตรียมข้อมูล
    const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

    // จัดรูปแบบ details ให้อ่านง่าย
    let detailsStr = '';
    if (typeof details === 'object' && details !== null) {
      try {
        detailsStr = JSON.stringify(details, null, 2);
      } catch (e) {
        detailsStr = String(details);
      }
    } else {
      detailsStr = String(details || '');
    }

    // ตัดความยาวถ้ายาวเกินไป (Google Sheets มีขีดจำกัด 50,000 ตัวอักษรต่อ cell)
    if (detailsStr.length > 40000) {
      detailsStr = detailsStr.substring(0, 40000) + '\n...(ข้อมูลถูกตัดเนื่องจากยาวเกินไป)';
    }

    // เพิ่ม Log
    logSheet.appendRow([timestamp, type, message, detailsStr]);

    // จัดสี background ตาม type
    const lastRow = logSheet.getLastRow();
    const typeCell = logSheet.getRange(lastRow, 2);

    if (type === 'ERROR') {
      typeCell.setBackground('#fee2e2'); // แดงอ่อน
      typeCell.setFontColor('#991b1b'); // แดงเข้ม
    } else if (type === 'WARNING') {
      typeCell.setBackground('#fef3c7'); // เหลืองอ่อน
      typeCell.setFontColor('#92400e'); // น้ำตาลเข้ม
    } else if (type === 'INFO') {
      typeCell.setBackground('#dbeafe'); // ฟ้าอ่อน
      typeCell.setFontColor('#1e40af'); // ฟ้าเข้ม
    }

    Logger.log(`[${type}] ${message}`);
  } catch (error) {
    Logger.log('logToSheet Error: ' + error.toString());
  }
}

// =============================================================================
// 🤖 AI Integration - Google Gemini
// =============================================================================

/**
 * แปลงวันที่จากข้อความเป็นรูปแบบ yyyy-MM-dd (ไม่ใช้ AI)
 * @param {string} userMessage - ข้อความจากผู้ใช้ (เช่น "7", "7/10", "7 ตุลาคม", "วันนี้", "พรุ่งนี้")
 * @param {string} shopId - Sheet ID สำหรับ logging (optional)
 * @returns {Object} { success: boolean, date: string (yyyy-MM-dd), displayText: string }
 */
function extractDateFromMessage(userMessage, shopId) {
  try {
    Logger.log(`[extractDateFromMessage] กำลังประมวลผล: ${userMessage}`);

    if (shopId) {
      logToSheet(shopId, 'INFO', 'ตารางรับส่งรถ - เริ่มแปลงวันที่', {
        input: userMessage
      });
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    const timeZone = Session.getScriptTimeZone();

    // Thai month names mapping
    const thaiMonthsMap = {
      'มกราคม': 0, 'ม.ค.': 0, 'มค': 0, 'ม.ค': 0,
      'กุมภาพันธ์': 1, 'ก.พ.': 1, 'กพ': 1, 'ก.พ': 1,
      'มีนาคม': 2, 'มี.ค.': 2, 'มีค': 2, 'มี.ค': 2,
      'เมษายน': 3, 'เม.ย.': 3, 'เมย': 3, 'เม.ย': 3,
      'พฤษภาคม': 4, 'พ.ค.': 4, 'พค': 4, 'พ.ค': 4,
      'มิถุนายน': 5, 'มิ.ย.': 5, 'มิย': 5, 'มิ.ย': 5,
      'กรกฎาคม': 6, 'ก.ค.': 6, 'กค': 6, 'ก.ค': 6,
      'สิงหาคม': 7, 'ส.ค.': 7, 'สค': 7, 'ส.ค': 7,
      'กันยายน': 8, 'ก.ย.': 8, 'กย': 8, 'ก.ย': 8,
      'ตุลาคม': 9, 'ต.ค.': 9, 'ตค': 9, 'ต.ค': 9,
      'พฤศจิกายน': 10, 'พ.ย.': 10, 'พย': 10, 'พ.ย': 10,
      'ธันวาคม': 11, 'ธ.ค.': 11, 'ธค': 11, 'ธ.ค': 11
    };

    const thaiMonthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                           'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

    const msg = userMessage.trim().toLowerCase();

    // 1. Check for today/tomorrow keywords
    if (msg === 'วันนี้' || msg === 'today') {
      const dateStr = Utilities.formatDate(today, timeZone, 'yyyy-MM-dd');

      if (shopId) {
        logToSheet(shopId, 'INFO', 'ตารางรับส่งรถ - แปลงวันที่สำเร็จ (คีย์เวิร์ด)', {
          input: userMessage,
          result: dateStr,
          display: 'วันนี้'
        });
      }

      return {
        success: true,
        date: dateStr,
        displayText: 'วันนี้'
      };
    }

    if (msg === 'พรุ่งนี้' || msg === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = Utilities.formatDate(tomorrow, timeZone, 'yyyy-MM-dd');

      if (shopId) {
        logToSheet(shopId, 'INFO', 'ตารางรับส่งรถ - แปลงวันที่สำเร็จ (คีย์เวิร์ด)', {
          input: userMessage,
          result: dateStr,
          display: 'พรุ่งนี้'
        });
      }

      return {
        success: true,
        date: dateStr,
        displayText: 'พรุ่งนี้'
      };
    }

    // 2. Try pattern: "dd/mm/yyyy" or "dd/mm"
    const slashPattern = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/;
    const slashMatch = userMessage.match(slashPattern);

    if (slashMatch) {
      let day = parseInt(slashMatch[1], 10);
      let month = parseInt(slashMatch[2], 10) - 1; // 0-based
      let year = slashMatch[3] ? parseInt(slashMatch[3], 10) : currentYear;

      // Convert BE to CE if needed
      if (year > 2500) {
        year = year - 543;
      } else if (year < 100) {
        year = 2000 + year; // 68 -> 2068
      }

      const targetDate = new Date(year, month, day);
      const dateStr = Utilities.formatDate(targetDate, timeZone, 'yyyy-MM-dd');
      const displayText = `${day} ${thaiMonthNames[month]} ${year + 543}`;

      Logger.log(`[extractDateFromMessage] Pattern dd/mm: ${dateStr} (${displayText})`);

      if (shopId) {
        logToSheet(shopId, 'INFO', 'ตารางรับส่งรถ - แปลงวันที่สำเร็จ (รูปแบบ dd/mm)', {
          input: userMessage,
          pattern: 'dd/mm/yyyy',
          result: dateStr,
          display: displayText
        });
      }

      return {
        success: true,
        date: dateStr,
        displayText: displayText
      };
    }

    // 3. Try pattern: "dd monthName" or "dd monthName yyyy"
    // Example: "7 ตุลาคม", "17ธันวา", "7 ต.ค. 2568"
    const thaiPattern = /^(\d{1,2})\s*([ก-๙a-z\.]+)(?:\s+(\d{2,4}))?$/i;
    const thaiMatch = userMessage.match(thaiPattern);

    if (thaiMatch) {
      const day = parseInt(thaiMatch[1], 10);
      const monthStr = thaiMatch[2].toLowerCase();
      let year = thaiMatch[3] ? parseInt(thaiMatch[3], 10) : currentYear;

      // Convert BE to CE if needed
      if (year > 2500) {
        year = year - 543;
      } else if (year < 100) {
        year = 2000 + year;
      }

      // Find month
      let month = null;
      for (let key in thaiMonthsMap) {
        if (monthStr.includes(key.toLowerCase()) || key.toLowerCase().includes(monthStr)) {
          month = thaiMonthsMap[key];
          break;
        }
      }

      if (month !== null) {
        const targetDate = new Date(year, month, day);
        const dateStr = Utilities.formatDate(targetDate, timeZone, 'yyyy-MM-dd');
        const displayText = `${day} ${thaiMonthNames[month]} ${year + 543}`;

        Logger.log(`[extractDateFromMessage] Pattern Thai month: ${dateStr} (${displayText})`);

        if (shopId) {
          logToSheet(shopId, 'INFO', 'ตารางรับส่งรถ - แปลงวันที่สำเร็จ (รูปแบบไทย)', {
            input: userMessage,
            pattern: 'dd monthName',
            monthStr: monthStr,
            result: dateStr,
            display: displayText
          });
        }

        return {
          success: true,
          date: dateStr,
          displayText: displayText
        };
      }
    }

    // 4. Try pattern: single number (day only)
    const dayOnlyPattern = /^(\d{1,2})$/;
    const dayMatch = userMessage.match(dayOnlyPattern);

    if (dayMatch) {
      const day = parseInt(dayMatch[1], 10);
      if (day >= 1 && day <= 31) {
        const targetDate = new Date(currentYear, currentMonth, day);
        const dateStr = Utilities.formatDate(targetDate, timeZone, 'yyyy-MM-dd');
        const displayText = `${day} ${thaiMonthNames[currentMonth]} ${currentYear + 543}`;

        Logger.log(`[extractDateFromMessage] Pattern day only: ${dateStr} (${displayText})`);

        if (shopId) {
          logToSheet(shopId, 'INFO', 'ตารางรับส่งรถ - แปลงวันที่สำเร็จ (เลขวันเดียว)', {
            input: userMessage,
            pattern: 'day only',
            result: dateStr,
            display: displayText
          });
        }

        return {
          success: true,
          date: dateStr,
          displayText: displayText
        };
      }
    }

    // Failed to parse
    Logger.log(`[extractDateFromMessage] ไม่สามารถแปลงได้: ${userMessage}`);

    if (shopId) {
      logToSheet(shopId, 'WARNING', 'ตารางรับส่งรถ - ไม่สามารถแปลงวันที่ได้', {
        input: userMessage,
        reason: 'ไม่ตรงกับรูปแบบที่รองรับ'
      });
    }

    return {
      success: false,
      message: 'ไม่สามารถแปลงวันที่ได้ กรุณาลองรูปแบบ: 7, 7/10, 7 ตุลาคม, 7/10/2568, วันนี้, พรุ่งนี้'
    };

  } catch (e) {
    Logger.log(`[extractDateFromMessage] Error: ${e.message}\n${e.stack}`);

    if (shopId) {
      logToSheet(shopId, 'ERROR', 'ตารางรับส่งรถ - เกิดข้อผิดพลาดในการแปลงวันที่', {
        input: userMessage,
        error: e.message,
        stack: e.stack
      });
    }

    return {
      success: false,
      message: 'เกิดข้อผิดพลาด: ' + e.message
    };
  }
}

/**
 * แยกข้อมูลช่วงเวลาเช่ารถจากข้อความ (รองรับวันเดียวหรือหลายวัน)
 * @param {string} userMessage - ข้อความจากผู้ใช้ เช่น "วันนี้", "23/11", "23/11 ถึง 25/11"
 * @param {string} shopId - Sheet ID สำหรับ logging (optional)
 * @returns {Object} { success: boolean, startDate, endDate, displayText }
 */
function extractSearchPeriod(userMessage, shopId) {
  try {
    Logger.log(`[extractSearchPeriod] กำลังประมวลผล: ${userMessage}`);

    if (shopId) {
      logToSheet(shopId, 'INFO', 'ค้นหารถว่าง - เริ่มแยกช่วงเวลา', {
        input: userMessage
      });
    }

    const today = new Date();
    const timeZone = Session.getScriptTimeZone();

    const msg = userMessage.trim().toLowerCase();

    // Pattern 1: วันนี้
    if (msg === 'วันนี้' || msg === 'today') {
      const dateStr = Utilities.formatDate(today, timeZone, 'yyyy-MM-dd');
      const result = {
        success: true,
        startDate: dateStr,
        endDate: dateStr,
        displayText: 'วันนี้',
        isSingleDay: true
      };

      if (shopId) {
        logToSheet(shopId, 'INFO', 'ค้นหารถว่าง - แยกช่วงเวลาสำเร็จ (วันนี้)', result);
      }
      return result;
    }

    // Pattern 2: พรุ่งนี้
    if (msg === 'พรุ่งนี้' || msg === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = Utilities.formatDate(tomorrow, timeZone, 'yyyy-MM-dd');
      const result = {
        success: true,
        startDate: dateStr,
        endDate: dateStr,
        displayText: 'พรุ่งนี้',
        isSingleDay: true
      };

      if (shopId) {
        logToSheet(shopId, 'INFO', 'ค้นหารถว่าง - แยกช่วงเวลาสำเร็จ (พรุ่งนี้)', result);
      }
      return result;
    }

    // Pattern 3: "dd/mm" หรือ "dd monthName" (วันเดียว)
    // เช่น "23/11", "23 พฤศจิกายน"
    const singleDayResult = extractDateFromMessage(userMessage, shopId);

    if (singleDayResult.success && !userMessage.match(/ถึง|until|to|-/)) {
      // ถ้าไม่มีคำว่า "ถึง" แสดงว่าเป็นวันเดียว
      const result = {
        success: true,
        startDate: singleDayResult.date,
        endDate: singleDayResult.date,
        displayText: singleDayResult.displayText,
        isSingleDay: true
      };

      if (shopId) {
        logToSheet(shopId, 'INFO', 'ค้นหารถว่าง - แยกช่วงเวลาสำเร็จ (วันเดียว)', result);
      }
      return result;
    }

    // Pattern 4: "วันที่1 ถึง วันที่2" (ช่วงวัน)
    // เช่น "23/11 ถึง 25/11", "วันนี้ ถึง 25 พฤศจิกายน"
    const rangePattern = /(.*?)\s*(ถึง|until|to|-)\s*(.*)/i;
    const rangeMatch = userMessage.match(rangePattern);

    if (rangeMatch) {
      const startPart = rangeMatch[1].trim();
      const endPart = rangeMatch[3].trim();

      const startResult = extractDateFromMessage(startPart, null);
      const endResult = extractDateFromMessage(endPart, null);

      if (startResult.success && endResult.success) {
        const result = {
          success: true,
          startDate: startResult.date,
          endDate: endResult.date,
          displayText: `${startResult.displayText} - ${endResult.displayText}`,
          isSingleDay: false
        };

        if (shopId) {
          logToSheet(shopId, 'INFO', 'ค้นหารถว่าง - แยกช่วงเวลาสำเร็จ (ช่วงวัน)', result);
        }
        return result;
      }
    }

    // Failed to parse
    if (shopId) {
      logToSheet(shopId, 'WARNING', 'ค้นหารถว่าง - ไม่สามารถแยกช่วงเวลาได้', {
        input: userMessage
      });
    }

    return {
      success: false,
      message: 'ไม่สามารถแปลงวันที่ได้ กรุณาลองรูปแบบ:\n- วันเดียว: วันนี้, พรุ่งนี้, 23/11\n- หลายวัน: 23/11 ถึง 25/11'
    };

  } catch (e) {
    Logger.log(`[extractSearchPeriod] Error: ${e.message}\n${e.stack}`);

    if (shopId) {
      logToSheet(shopId, 'ERROR', 'ค้นหารถว่าง - เกิดข้อผิดพลาดในการแยกช่วงเวลา', {
        input: userMessage,
        error: e.message,
        stack: e.stack
      });
    }

    return {
      success: false,
      message: 'เกิดข้อผิดพลาด: ' + e.message
    };
  }
}

/**
 * ส่งข้อความไปให้ Gemini AI ถอดรายละเอียดการเช่า
 * @param {string} userMessage - ข้อความจากผู้ใช้
 * @param {string} shopId - Sheet ID ของร้าน
 * @returns {Object} ข้อมูลที่ถอดได้
 */
function extractRentalDataWithAI(userMessage, shopId) {
  try {
    // ดึงรายชื่อรถจาก Sheet เพื่อให้ AI match ได้แม่นยำ
    const carsList = getCarNamesForAI(shopId);

    const prompt = `Extract rental data from: "${userMessage}"

Available cars:
${carsList}

CRITICAL - Car matching:
1. Find the license plate in user's message (e.g., "จจ2171", "ZS จจ2171", "MG ZS จจ2171")
2. Search for this plate number in the car list above
3. Return the COMPLETE car name EXACTLY as it appears in the list
4. Examples:
   - User: "MG ZS จจ2171" → List has "ZS จจ2171 (MG)" → Return: "ZS จจ2171 (MG)"
   - User: "Honda City" → List has "Honda City" → Return: "Honda City"
   - User: "HS Phev" → List has "HS Phev (MG)" → Return: "HS Phev (MG)"
5. If no match found by plate OR name, return null

CRITICAL - Pickup/Return Location Rules:
1. Text with "รับ" = pickup location (pickupLocation)
2. Text with "ส่ง" or "คืน" = return location (returnLocation)
3. Patterns indicating SAME location for both:
   - "รับ-ส่ง" or "รับ/ส่ง" → same location for pickup AND return
   - "รับคืน" or "รับ/คืน" → same location for pickup AND return
4. Examples:
   - "รับสนามบิน คืนโรงแรม" → pickupLocation: "สนามบิน", returnLocation: "โรงแรม"
   - "รับ/คืน สนามบิน" → pickupLocation: "สนามบิน", returnLocation: "สนามบิน"
   - "รับ-ส่ง เชียงใหม่" → pickupLocation: "เชียงใหม่", returnLocation: "เชียงใหม่"

CRITICAL - Notes Field Rules:
1. ONLY extract text that is explicitly marked as notes/remarks/comments
2. DO NOT include payment information (มัดจำ, ค่าเช่า, ชำระเพิ่ม)
3. DO NOT include pickup/return info (รับรถ, คืนรถ, วันรับรถ, วันคืนรถ)
4. DO NOT include customer booking details
5. Examples of VALID notes:
   - "ลูกค้าขอรถสีแดง"
   - "หมายเหตุ: ต้องการเบาะเด็ก"
   - "สถานที่รับจะแจ้งอีกครั้ง"
6. Examples of INVALID notes (should be null):
   - "วันรับรถลูกค้าชำระเพิ่ม" → null
   - "มัดจำ 500 ค่าเช่า 1500" → queueDeposit: 500, totalAmount: 1500
   - "รับสนามบิน คืนโรงแรม" → null
   - "ประกัน 3000" → securityDeposit: 3000
   - "เงินประกัน 5000 บาท" → securityDeposit: 5000
   - "มัดจำคิว 1000" → queueDeposit: 1000

Extract:
{
  "customerName": "name or null",
  "phone": "10 digits or null",
  "idCard": "13 digits or null",
  "address": "full customer address or null",
  "carName": "EXACT car name from list or null",
  "startDate": "DD/MM/YYYY or null",
  "startTime": "HH:MM (default 09:00) or null",
  "endDate": "DD/MM/YYYY or null",
  "endTime": "HH:MM (default 18:00) or null",
  "dailyRate": number or null,
  "totalAmount": "total rental amount or null",
  "queueDeposit": "amount for 'มัดจำ' or 'มัดจำคิว' or null",
  "securityDeposit": "amount for 'ประกัน', 'เงินประกัน', 'ค่าประกัน', 'เงินประกันความเสียหาย' or null",
  "discount": "amount for 'ส่วนลด' or 'ลด' or null",
  "additionalServiceFee": "amount for 'ค่าบริการเพิ่มเติม' or 'บริการเพิ่ม' or null",
  "pickupDayPayment": "amount for 'วันรับรถชำระเพิ่ม', 'วันรับรถจ่ายเพิ่ม', 'ค่าใช้จ่ายวันรับรถ' or null",
  "pickupLocation": "location or null",
  "returnLocation": "location or null",
  "notes": "explicit notes/remarks ONLY or null",
  "confidence": 0.0-1.0,
  "missingFields": []
}

Return ONLY JSON.`;

    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 9216, // เพิ่มจาก 1024 เป็น 2048
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(
      GEMINI_API_URL + '?key=' + GEMINI_API_KEY,
      options
    );

    const result = JSON.parse(response.getContentText());

    // Log AI response
    logToSheet(shopId, 'INFO', 'AI Response รับข้อมูล', {
      userMessage: userMessage,
      responseCode: response.getResponseCode(),
      candidatesCount: result.candidates ? result.candidates.length : 0
    });

    if (result.candidates && result.candidates.length > 0) {
      const candidate = result.candidates[0];
      if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
        // ตรวจสอบ MAX_TOKENS
        if (candidate.finishReason === 'MAX_TOKENS') {
          logToSheet(shopId, 'ERROR', 'AI ตอบกลับเกิน Token Limit', {
            finishReason: candidate.finishReason,
            message: 'AI พยายามตอบกลับยาวเกินไป กรุณาลองส่งข้อความที่สั้นลงหรือแบ่งเป็นหลายส่วน'
          });
          throw new Error('AI ตอบกลับเกิน Token Limit กรุณาลองส่งข้อความที่สั้นลง');
        }

        // ตรวจสอบ Safety Ratings
        if (candidate.finishReason === 'SAFETY') {
          logToSheet(shopId, 'ERROR', 'AI บล็อกเนื้อหา (Safety Filter)', {
            finishReason: candidate.finishReason,
            safetyRatings: candidate.safetyRatings
          });
          throw new Error('เนื้อหาถูกบล็อกเนื่องจากนโยบายความปลอดภัย (Safety Filter)');
        }

        logToSheet(shopId, 'ERROR', 'AI ไม่ส่งข้อมูลกลับมา', candidate);
        throw new Error('AI ไม่ส่งข้อมูลกลับมา (Empty Content)');
      }
      const aiResponse = candidate.content.parts[0].text;

      // Log raw AI response
      logToSheet(shopId, 'INFO', 'AI Raw Response', {
        rawText: aiResponse.substring(0, 500) + (aiResponse.length > 500 ? '...' : '')
      });

      // ลบ markdown code block ถ้ามี
      const cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const extractedData = JSON.parse(cleanResponse);

      // Log extracted data
      logToSheet(shopId, 'INFO', 'AI Extracted Data (Parsed)', extractedData);

      Logger.log('AI Extracted Data: ' + JSON.stringify(extractedData));

      return extractedData;
    } else {
      Logger.log('Gemini API Error Result: ' + JSON.stringify(result));
      logToSheet(shopId, 'ERROR', 'Gemini API No Candidates', result);
      throw new Error('No response from Gemini API (Candidates empty). Result: ' + JSON.stringify(result));
    }

  } catch (error) {
    Logger.log('extractRentalDataWithAI Error: ' + error.toString());
    logToSheet(shopId, 'ERROR', 'extractRentalDataWithAI Exception', {
      error: error.toString(),
      message: error.message,
      stack: error.stack
    });
    return {
      error: true,
      message: 'ไม่สามารถประมวลผลข้อมูลได้ (Error: ' + error.toString() + ') กรุณาลองใหม่อีกครั้ง หรือตรวจสอบรูปแบบข้อความ',
      details: error.toString()
    };
  }
}

/**
 * ดึงรายชื่อรถจาก Sheet เพื่อส่งให้ AI
 * @param {string} shopId - Sheet ID
 * @returns {string} รายชื่อรถในรูปแบบ text
 */
function getCarNamesForAI(shopId) {
  try {
    const ss = SpreadsheetApp.openById(shopId);
    const sheet = ss.getSheetByName(CARS_SHEET);

    if (!sheet) return "ไม่พบข้อมูลรถ";

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return "ไม่มีรถในระบบ";

    const headers = data[0];
    const nameIndex = headers.indexOf('ชื่อรถ');
    const plateIndex = headers.indexOf('ป้ายทะเบียน');

    let carsList = [];
    let count = 1;
    for (let i = 1; i < data.length; i++) {
      const carName = data[i][nameIndex];
      const plate = data[i][plateIndex];

      if (plate) {
        // มีป้ายทะเบียน - เน้นป้ายก่อน
        carsList.push(`${count}. ${plate} (${carName || 'N/A'})`);
        count++;
      } else if (carName) {
        // ไม่มีป้าย - ใช้ชื่อรถ
        carsList.push(`${count}. ${carName}`);
        count++;
      }
    }

    return carsList.join('\n');
  } catch (error) {
    Logger.log('getCarNamesForAI Error: ' + error.toString());
    return "ไม่สามารถดึงข้อมูลรถได้";
  }
}

/**
 * ดึงข้อมูลรถจาก Sheet รถ
 * @param {string} carName - ชื่อรถหรือทะเบียนที่ต้องการหา
 * @param {string} shopId - Sheet ID ของร้าน
 * @returns {Object|null} ข้อมูลรถ หรือ null ถ้าไม่พบ
 */
function getCarDetailsFromSheet(carName, shopId) {
  try {
    Logger.log(`🔍 getCarDetailsFromSheet - กำลังค้นหา: ${carName} ใน Sheet: ${shopId}`);

    const ss = SpreadsheetApp.openById(shopId);
    const sheet = ss.getSheetByName(CARS_SHEET);

    if (!sheet) {
      Logger.log('❌ ไม่พบ Sheet รถ');
      return null;
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      Logger.log('❌ ไม่มีข้อมูลรถในระบบ');
      return null;
    }

    const headers = data[0];
    const nameIndex = headers.indexOf('รุ่น');
    const plateIndex = headers.indexOf('ทะเบียน');
    const priceIndex = headers.indexOf('ราคาเช่าต่อวัน');
    const depositIndex = headers.indexOf('ค่าประกันความเสียหาย');
    const queueDepositIndex = headers.indexOf('ค่ามัดจำคิวรถ');
    const statusIndex = headers.indexOf('สถานะ');
    const brandIndex = headers.indexOf('ยี่ห้อ');

    Logger.log(`📊 Column indices - รุ่น:${nameIndex}, ทะเบียน:${plateIndex}, ราคา:${priceIndex}, มัดจำ:${depositIndex}, มัดจำคิว:${queueDepositIndex}, สถานะ:${statusIndex}`);

    // ค้นหารถจากชื่อหรือทะเบียน
    const searchTerm = carName.toLowerCase().trim();

    // ดึงตัวเลขจาก searchTerm สำหรับจับคู่ทะเบียน (มีความแม่นยำสูง)
    const searchNumbers = searchTerm.match(/\d{3,4}/g) || [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const model = row[nameIndex] ? String(row[nameIndex]).toLowerCase() : '';
      const plate = row[plateIndex] ? String(row[plateIndex]).toLowerCase() : '';
      const brand = row[brandIndex] ? String(row[brandIndex]).toLowerCase() : '';

      // 🔍 ลำดับความสำคัญในการจับคู่:

      // 1. เช็คตัวเลขทะเบียนก่อน (แม่นยำที่สุด)
      if (searchNumbers.length > 0 && plate) {
        const plateNumbers = plate.match(/\d{3,4}/g) || [];
        const hasMatchingNumber = searchNumbers.some(sNum =>
          plateNumbers.some(pNum => pNum === sNum)
        );

        if (hasMatchingNumber) {
          // เจอตัวเลขทะเบียนตรงกัน - แม่นยำสูง
          Logger.log(`🎯 จับคู่ด้วยตัวเลขทะเบียน: ${plate}`);
          const carDetails = {
            carName: row[nameIndex] || '',
            brand: row[brandIndex] || '',
            plate: row[plateIndex] || '',
            dailyRate: parseFloat(row[priceIndex]) || 0,
            deposit: parseFloat(row[depositIndex]) || 0,
            queueDeposit: parseFloat(row[queueDepositIndex]) || 0,
            status: row[statusIndex] || '',
            fullName: `${row[brandIndex] || ''} ${row[nameIndex] || ''} (${row[plateIndex] || ''})`.trim()
          };
          Logger.log(`✅ พบรถ: ${JSON.stringify(carDetails)}`);
          return carDetails;
        }
      }

      // 2. เช็คทะเบียนแบบเต็ม
      if (plate && searchTerm.includes(plate)) {
        Logger.log(`🎯 จับคู่ด้วยทะเบียนเต็ม: ${plate}`);

        const carDetails = {
          carName: row[nameIndex] || '',
          brand: row[brandIndex] || '',
          plate: row[plateIndex] || '',
          dailyRate: parseFloat(row[priceIndex]) || 0,
          deposit: parseFloat(row[depositIndex]) || 0,
          queueDeposit: parseFloat(row[queueDepositIndex]) || 0,
          status: row[statusIndex] || '',
          fullName: `${row[brandIndex] || ''} ${row[nameIndex] || ''} (${row[plateIndex] || ''})`.trim()
        };

        Logger.log(`✅ พบรถ: ${JSON.stringify(carDetails)}`);
        return carDetails;
      }
    }

    // 3. ถ้าไม่เจอจากทะเบียน ลองค้นจากชื่อรถ (fallback)
    Logger.log(`⚠️ ไม่พบจากทะเบียน ลองค้นจากชื่อรถ...`);
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const model = row[nameIndex] ? String(row[nameIndex]).toLowerCase() : '';
      const brand = row[brandIndex] ? String(row[brandIndex]).toLowerCase() : '';
      const fullName = `${brand} ${model}`.toLowerCase().trim();

      // เช็คชื่อเต็มก่อน
      if (fullName && searchTerm.includes(fullName)) {
        Logger.log(`🎯 จับคู่ด้วยชื่อเต็ม: ${fullName}`);

        const carDetails = {
          carName: row[nameIndex] || '',
          brand: row[brandIndex] || '',
          plate: row[plateIndex] || '',
          dailyRate: parseFloat(row[priceIndex]) || 0,
          deposit: parseFloat(row[depositIndex]) || 0,
          queueDeposit: parseFloat(row[queueDepositIndex]) || 0,
          status: row[statusIndex] || '',
          fullName: `${row[brandIndex] || ''} ${row[nameIndex] || ''} (${row[plateIndex] || ''})`.trim()
        };

        Logger.log(`✅ พบรถ: ${JSON.stringify(carDetails)}`);
        return carDetails;
      }
    }

    Logger.log(`⚠️ ไม่พบรถที่ตรงกับ: ${carName}`);
    return null;

  } catch (error) {
    Logger.log(`❌ getCarDetailsFromSheet Error: ${error.toString()}`);
    return null;
  }
}

/**
 * ดึงค่า config จากชีต "ตั้งค่าระบบ"
 * @param {string} configKey - ชื่อ key ที่ต้องการดึง
 * @param {string} shopId - Sheet ID
 * @returns {string|null} - ค่า config หรือ null ถ้าไม่พบ
 */
function getSystemConfigValue(configKey, shopId) {
  try {
    const ss = SpreadsheetApp.openById(shopId);
    const configSheet = ss.getSheetByName("ตั้งค่าระบบ");

    if (!configSheet) {
      Logger.log(`❌ ไม่พบชีต "ตั้งค่าระบบ"`);
      return null;
    }

    const configData = configSheet.getDataRange().getValues();

    // หาค่า config จาก key
    for (let i = 0; i < configData.length; i++) {
      const key = configData[i][0];
      const value = configData[i][1];

      if (key === configKey) {
        Logger.log(`✅ พบ config: ${configKey} = ${value}`);
        return value;
      }
    }

    Logger.log(`⚠️ ไม่พบ config key: ${configKey}`);
    return null;

  } catch (error) {
    Logger.log(`❌ getSystemConfigValue Error: ${error.toString()}`);
    return null;
  }
}

/**
 * ตรวจสอบความครบถ้วนของข้อมูลการเช่า
 * @param {Object} data - ข้อมูลจาก AI
 * @returns {Object} { isComplete: boolean, missingFields: [] }
 */
function validateRentalData(data) {
  const requiredFields = {
    'customerName': 'ชื่อผู้เช่า',
    'phone': 'เบอร์โทร',
    'carName': 'รถที่เช่า',
    'startDate': 'วันที่รับรถ',
    'startTime': 'เวลารับรถ',
    'endDate': 'วันที่คืนรถ',
    'endTime': 'เวลาคืนรถ',
    'dailyRate': 'ราคาต่อวัน',
    'totalAmount': 'ราคารวม'
  };

  let missingFields = [];

  for (let field in requiredFields) {
    if (!data[field] || data[field] === null || data[field] === '') {
      missingFields.push(requiredFields[field]);
    }
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields: missingFields
  };
}

// =============================================================================
// 🔍 Validation Helper Functions
// =============================================================================

/**
 * ตรวจสอบรูปแบบเบอร์โทรศัพท์
 * @param {string} phone - เบอร์โทรศัพท์
 * @returns {Object} { isValid: boolean, message: string }
 */
function validatePhoneNumber(phone) {
  if (!phone) {
    return { isValid: false, message: 'ไม่พบเบอร์โทรศัพท์' };
  }

  // ลบช่องว่างและขีด
  const cleanPhone = String(phone).replace(/[\s-]/g, '');

  // ตรวจสอบว่าเป็นตัวเลข 10 หลัก และขึ้นต้นด้วย 0
  const phoneRegex = /^0\d{9}$/;

  if (!phoneRegex.test(cleanPhone)) {
    return {
      isValid: false,
      message: 'เบอร์โทรศัพท์ไม่ถูกต้อง ต้องเป็น 10 หลักและขึ้นต้นด้วย 0'
    };
  }

  return { isValid: true, message: '' };
}

/**
 * ตรวจสอบรูปแบบเลขบัตรประชาชน
 * @param {string} idCard - เลขบัตรประชาชน
 * @returns {Object} { isValid: boolean, message: string }
 */
function validateIdCard(idCard) {
  if (!idCard) {
    return { isValid: true, message: '' }; // ไม่บังคับ
  }

  // ลบช่องว่างและขีด
  const cleanIdCard = String(idCard).replace(/[\s-]/g, '');

  // ตรวจสอบว่าเป็นตัวเลข 13 หลัก
  if (!/^\d{13}$/.test(cleanIdCard)) {
    return {
      isValid: false,
      message: 'เลขบัตรประชาชนไม่ถูกต้อง ต้องเป็น 13 หลัก'
    };
  }

  return { isValid: true, message: '' };
}

/**
 * ตรวจสอบรูปแบบวันที่ DD/MM/YYYY
 * @param {string} dateStr - วันที่
 * @returns {Object} { isValid: boolean, message: string, date: Date }
 */
function validateDateFormat(dateStr) {
  if (!dateStr) {
    return { isValid: false, message: 'ไม่พบวันที่', date: null };
  }

  // ตรวจสอบรูปแบบ DD/MM/YYYY
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = String(dateStr).match(dateRegex);

  if (!match) {
    return {
      isValid: false,
      message: 'รูปแบบวันที่ไม่ถูกต้อง ต้องเป็น DD/MM/YYYY',
      date: null
    };
  }

  const day = parseInt(match[1]);
  const month = parseInt(match[2]);
  const year = parseInt(match[3]);

  // ตรวจสอบความถูกต้องของวันที่
  if (month < 1 || month > 12) {
    return { isValid: false, message: 'เดือนไม่ถูกต้อง (1-12)', date: null };
  }

  if (day < 1 || day > 31) {
    return { isValid: false, message: 'วันไม่ถูกต้อง (1-31)', date: null };
  }

  // สร้าง Date object (month - 1 เพราะ JavaScript นับเดือนจาก 0)
  const date = new Date(year, month - 1, day);

  // ตรวจสอบว่า Date object ถูกต้อง
  if (isNaN(date.getTime())) {
    return { isValid: false, message: 'วันที่ไม่ถูกต้อง', date: null };
  }

  return { isValid: true, message: '', date: date };
}

/**
 * แปลงวันที่ DD/MM/YYYY เป็น Date object
 * @param {string} dateStr - วันที่
 * @returns {Date|null} Date object หรือ null
 */
function parseThaiDate(dateStr) {
  const validation = validateDateFormat(dateStr);
  return validation.isValid ? validation.date : null;
}

/**
 * ตรวจสอบรูปแบบเวลา HH:MM
 * @param {string} timeStr - เวลา
 * @returns {Object} { isValid: boolean, message: string }
 */
function validateTimeFormat(timeStr) {
  if (!timeStr) {
    return { isValid: false, message: 'ไม่พบเวลา' };
  }

  // ตรวจสอบรูปแบบ HH:MM
  const timeRegex = /^([0-1]?\d|2[0-3]):([0-5]\d)$/;
  const match = String(timeStr).match(timeRegex);

  if (!match) {
    return {
      isValid: false,
      message: 'รูปแบบเวลาไม่ถูกต้อง ต้องเป็น HH:MM (เช่น 09:00, 14:30)'
    };
  }

  return { isValid: true, message: '' };
}

/**
 * ตรวจสอบความถูกต้องและความสมเหตุสมผลของข้อมูลการเช่าอย่างละเอียด
 * @param {Object} data - ข้อมูลจาก AI
 * @returns {Object} { isValid: boolean, errors: [], warnings: [] }
 */
function validateRentalDataStrict(data) {
  const errors = [];
  const warnings = [];

  // 1. ตรวจสอบเบอร์โทรศัพท์
  if (data.phone) {
    const phoneValidation = validatePhoneNumber(data.phone);
    if (!phoneValidation.isValid) {
      errors.push(phoneValidation.message);
    }
  }

  // 2. ตรวจสอบเลขบัตรประชาชน (ถ้ามี)
  if (data.idCard) {
    const idCardValidation = validateIdCard(data.idCard);
    if (!idCardValidation.isValid) {
      warnings.push(idCardValidation.message);
    }
  }

  // 3. ตรวจสอบรูปแบบวันที่
  const startDateValidation = validateDateFormat(data.startDate);
  if (!startDateValidation.isValid) {
    errors.push('วันรับรถ: ' + startDateValidation.message);
  }

  const endDateValidation = validateDateFormat(data.endDate);
  if (!endDateValidation.isValid) {
    errors.push('วันคืนรถ: ' + endDateValidation.message);
  }

  // 4. ตรวจสอบว่าวันคืนต้องไม่ก่อนวันรับ
  if (startDateValidation.isValid && endDateValidation.isValid) {
    if (endDateValidation.date < startDateValidation.date) {
      errors.push('วันคืนรถต้องไม่ก่อนวันรับรถ');
    }
  }

  // 5. ตรวจสอบรูปแบบเวลา
  const startTimeValidation = validateTimeFormat(data.startTime);
  if (!startTimeValidation.isValid) {
    errors.push('เวลารับรถ: ' + startTimeValidation.message);
  }

  const endTimeValidation = validateTimeFormat(data.endTime);
  if (!endTimeValidation.isValid) {
    errors.push('เวลาคืนรถ: ' + endTimeValidation.message);
  }

  // 6. ตรวจสอบราคา
  if (data.dailyRate) {
    const dailyRate = Number(data.dailyRate);
    if (isNaN(dailyRate) || dailyRate <= 0) {
      errors.push('ราคาต่อวันต้องเป็นตัวเลขบวก');
    }
  }

  if (data.totalAmount) {
    const totalAmount = Number(data.totalAmount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      errors.push('ราคารวมต้องเป็นตัวเลขบวก');
    }
  }

  // 7. ตรวจสอบมัดจำ (ถ้ามี)
  if (data.deposit) {
    const deposit = Number(data.deposit);
    if (isNaN(deposit) || deposit < 0) {
      warnings.push('จำนวนเงินมัดจำไม่ถูกต้อง');
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: warnings
  };
}

/**
 * ค้นหาชื่อรถจาก message ของผู้ใช้
 * @param {string} message - ข้อความจากผู้ใช้
 * @param {string} shopId - Sheet ID
 * @returns {string|null} ชื่อรถที่เจอ หรือ null
 */
function findCarFromMessage(message, shopId) {
  try {
    logToSheet(shopId, 'INFO', 'findCarFromMessage - เริ่มค้นหา', {
      originalMessage: message
    });

    const ss = SpreadsheetApp.openById(shopId);
    const sheet = ss.getSheetByName(CARS_SHEET);

    if (!sheet) {
      logToSheet(shopId, 'WARNING', 'findCarFromMessage - ไม่พบชีต CARS_SHEET', {});
      return null;
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      logToSheet(shopId, 'WARNING', 'findCarFromMessage - ไม่มีข้อมูลรถ', {});
      return null;
    }

    const headers = data[0];

    // ค้นหาคอลัมน์ที่จำเป็น
    const brandIndex = headers.indexOf('ยี่ห้อ');
    let nameIndex = headers.indexOf('ชื่อรถ');
    if (nameIndex === -1) nameIndex = headers.indexOf('รุ่น');
    if (nameIndex === -1) nameIndex = headers.indexOf('ยี่ห้อ');

    // ค้นหาคอลัมน์ทะเบียน (รองรับหลายชื่อ)
    let plateIndex = headers.indexOf('ป้ายทะเบียน');
    if (plateIndex === -1) plateIndex = headers.indexOf('ทะเบียน');
    if (plateIndex === -1) plateIndex = headers.indexOf('หมายเลขทะเบียน');

    logToSheet(shopId, 'INFO', 'findCarFromMessage - พบคอลัมน์', {
      nameIndex: nameIndex,
      plateIndex: plateIndex,
      nameHeader: nameIndex >= 0 ? headers[nameIndex] : 'ไม่พบ',
      plateHeader: plateIndex >= 0 ? headers[plateIndex] : 'ไม่พบ',
      allHeaders: headers
    });

    // ถ้าไม่พบคอลัมน์ที่จำเป็น
    if (nameIndex === -1 && plateIndex === -1) {
      logToSheet(shopId, 'ERROR', 'findCarFromMessage - ไม่พบคอลัมน์ที่จำเป็น', {
        availableHeaders: headers
      });
      return null;
    }

    // ทำ message ให้เป็นตัวพิมพ์เล็กและลบช่องว่างเพื่อเปรียบเทียบ
    const messageLower = message.toLowerCase().replace(/\s+/g, '');
    const messageNormal = message.toLowerCase();

    // ดึงตัวเลขทั้งหมดจาก message (สำหรับจับคู่ป้ายทะเบียน)
    const messageNumbers = message.match(/\d{3,4}/g) || [];

    logToSheet(shopId, 'INFO', 'findCarFromMessage - ตัวเลขที่เจอใน message', {
      numbers: messageNumbers
    });

    // ฟังก์ชัน helper สำหรับสร้างชื่อเต็มของรถ
    const getFullCarName = (row) => {
      const brand = brandIndex >= 0 ? row[brandIndex] : '';
      const model = nameIndex >= 0 ? row[nameIndex] : '';
      const plate = plateIndex >= 0 ? row[plateIndex] : '';

      // สร้างชื่อเต็ม: "ยี่ห้อ รุ่น (ทะเบียน)"
      let fullName = '';
      if (brand && brand !== model) {
        fullName = brand;
      }
      if (model) {
        fullName += (fullName ? ' ' : '') + model;
      }
      if (plate) {
        fullName += ` (${plate})`;
      }

      return fullName || model || brand;
    };

    // วนหารถทุกคัน
    for (let i = 1; i < data.length; i++) {
      const carName = data[i][nameIndex];
      const plate = data[i][plateIndex];

      if (!carName) continue;

      const fullCarName = getFullCarName(data[i]);

      // 🔍 วิธีที่ 1: ตรวจสอบตัวเลขในป้ายทะเบียน (สำคัญที่สุด)
      if (plate && messageNumbers.length > 0) {
        const plateNumbers = plate.match(/\d{3,4}/g) || [];

        for (const msgNum of messageNumbers) {
          for (const plateNum of plateNumbers) {
            if (msgNum === plateNum) {
              logToSheet(shopId, 'INFO', 'findCarFromMessage - เจอจากตัวเลข!', {
                matchedNumber: msgNum,
                carName: carName,
                fullCarName: fullCarName,
                plate: plate
              });
              return fullCarName;
            }
          }
        }
      }

      // 🔍 วิธีที่ 2: ตรวจสอบป้ายทะเบียนแบบเต็ม
      if (plate) {
        const plateLower = plate.toLowerCase().replace(/\s+/g, '');

        if (messageLower.includes(plateLower)) {
          logToSheet(shopId, 'INFO', 'findCarFromMessage - เจอจากป้ายทะเบียนเต็ม', {
            carName: carName,
            fullCarName: fullCarName,
            plate: plate
          });
          return fullCarName;
        }
      }

      // 🔍 วิธีที่ 3: ตรวจสอบชื่อรถ
      const carNameLower = carName.toLowerCase().replace(/\s+/g, '');
      if (carNameLower.length > 3 && messageLower.includes(carNameLower)) {
        logToSheet(shopId, 'INFO', 'findCarFromMessage - เจอจากชื่อรถเต็ม', {
          carName: carName,
          fullCarName: fullCarName
        });
        return fullCarName;
      }

      // 🔍 วิธีที่ 4: ตรวจสอบแบบแยกคำ (เช่น "MG" + "ZS")
      const carNameWords = carName.split(' ').filter(w => w.length > 1);
      if (carNameWords.length >= 2) {
        let matchCount = 0;
        for (const word of carNameWords) {
          if (messageNormal.includes(word.toLowerCase())) {
            matchCount++;
          }
        }
        if (matchCount >= 2) {
          logToSheet(shopId, 'INFO', 'findCarFromMessage - เจอจากหลายคำ', {
            carName: carName,
            fullCarName: fullCarName,
            matchedWords: matchCount
          });
          return fullCarName;
        }
      }
    }

    logToSheet(shopId, 'WARNING', 'findCarFromMessage - ไม่เจอรถที่ตรงกัน', {
      totalCars: data.length - 1
    });

    return null;
  } catch (error) {
    logToSheet(shopId, 'ERROR', 'findCarFromMessage - เกิดข้อผิดพลาด', {
      error: error.toString()
    });
    return null;
  }
}

/**
 * ตรวจสอบว่ารถว่างหรือไม่ และมีการจองทับซ้อนหรือไม่
 * @param {string} carName - ชื่อรถ
 * @param {string} startDate - วันรับรถ (DD/MM/YYYY)
 * @param {string} startTime - เวลารับรถ (HH:MM)
 * @param {string} endDate - วันคืนรถ (DD/MM/YYYY)
 * @param {string} endTime - เวลาคืนรถ (HH:MM)
 * @param {string} shopId - Sheet ID
 * @returns {Object} { available: boolean, conflicts: [], message: string }
 */
function checkCarAvailabilityForAI(carName, startDate, startTime, endDate, endTime, shopId) {
  try {
    // แปลงวันที่จาก DD/MM/YYYY เป็น YYYY-MM-DD
    const startDateParts = startDate.split('/');
    const endDateParts = endDate.split('/');

    const formattedStartDate = `${startDateParts[2]}-${startDateParts[1].padStart(2, '0')}-${startDateParts[0].padStart(2, '0')}`;
    const formattedEndDate = `${endDateParts[2]}-${endDateParts[1].padStart(2, '0')}-${endDateParts[0].padStart(2, '0')}`;

    // สร้าง DateTime strings
    const pickupDateTime = `${formattedStartDate}T${startTime}:00`;
    const returnDateTime = `${formattedEndDate}T${endTime}:00`;

    // เรียกใช้ฟังก์ชันตรวจสอบที่มีอยู่แล้ว
    const result = checkCarBookingAvailability(
      carName,
      pickupDateTime,
      returnDateTime,
      formattedStartDate,
      formattedEndDate,
      shopId,
      null, // editingBookingNumber
      null  // prepTimeMinutes - ใช้ค่า default
    );

    if (result.available) {
      return {
        available: true,
        conflicts: [],
        message: 'รถว่างในช่วงเวลานี้'
      };
    } else {
      const conflictMessage = result.conflict ?
        `มีการจองทับซ้อน - หมายเลขการจอง: ${result.conflict.bookingNumber}, ลูกค้า: ${result.conflict.customer}` :
        'รถไม่ว่างในช่วงเวลานี้';

      return {
        available: false,
        conflicts: result.conflict ? [result.conflict] : [],
        message: conflictMessage
      };
    }

  } catch (error) {
    Logger.log('checkCarAvailabilityForAI Error: ' + error.toString());
    return {
      available: true, // ถ้า error ให้ผ่านไปก่อน (fail-safe)
      conflicts: [],
      message: 'ไม่สามารถตรวจสอบความว่างของรถได้',
      error: error.toString()
    };
  }
}

// =============================================================================
// 💬 LINE Flex Message Templates
// =============================================================================

/**
 * สร้าง Flex Message สำหรับยืนยันข้อมูลการเช่า
 * @param {Object} data - ข้อมูลการเช่า
 * @returns {Object} Flex Message object
 */
function createRentalConfirmationFlexMessage(data) {
  return {
    type: "flex",
    altText: "ยืนยันข้อมูลการเช่า",
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "ยืนยันข้อมูลการเช่า",
            weight: "bold",
            size: "xl",
            color: "#FFFFFF"
          }
        ],
        backgroundColor: "#FF6B35",
        paddingAll: "20px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "baseline",
            contents: [
              {
                type: "text",
                text: "ลูกค้า:",
                flex: 2,
                size: "sm",
                color: "#666666"
              },
              {
                type: "text",
                text: data.customerName || "-",
                flex: 5,
                size: "sm",
                color: "#111111",
                wrap: true
              }
            ],
            margin: "md"
          },
          {
            type: "box",
            layout: "baseline",
            contents: [
              {
                type: "text",
                text: "เบอร์โทร:",
                flex: 2,
                size: "sm",
                color: "#666666"
              },
              {
                type: "text",
                text: data.phone || "-",
                flex: 5,
                size: "sm",
                color: "#111111"
              }
            ],
            margin: "md"
          },
          {
            type: "box",
            layout: "baseline",
            contents: [
              {
                type: "text",
                text: "บัตรปชช:",
                flex: 2,
                size: "sm",
                color: "#666666"
              },
              {
                type: "text",
                text: data.idCard || "-",
                flex: 5,
                size: "sm",
                color: "#111111"
              }
            ],
            margin: "md"
          },
          {
            type: "separator",
            margin: "lg"
          },
          {
            type: "box",
            layout: "baseline",
            contents: [
              {
                type: "text",
                text: "รถ:",
                flex: 2,
                size: "sm",
                color: "#666666"
              },
              {
                type: "text",
                text: data.carName || "-",
                flex: 5,
                size: "sm",
                color: "#111111",
                weight: "bold",
                wrap: true
              }
            ],
            margin: "lg"
          },
          {
            type: "box",
            layout: "baseline",
            contents: [
              {
                type: "text",
                text: "รับรถ:",
                flex: 2,
                size: "sm",
                color: "#666666"
              },
              {
                type: "text",
                text: (data.startDate || "-") + " " + (data.startTime || ""),
                flex: 5,
                size: "sm",
                color: "#111111",
                wrap: true
              }
            ],
            margin: "md"
          },
          {
            type: "box",
            layout: "baseline",
            contents: [
              {
                type: "text",
                text: "คืนรถ:",
                flex: 2,
                size: "sm",
                color: "#666666"
              },
              {
                type: "text",
                text: (data.endDate || "-") + " " + (data.endTime || ""),
                flex: 5,
                size: "sm",
                color: "#111111",
                wrap: true
              }
            ],
            margin: "md"
          },
          {
            type: "separator",
            margin: "lg"
          },
          {
            type: "box",
            layout: "baseline",
            contents: [
              {
                type: "text",
                text: "ราคา/วัน:",
                flex: 2,
                size: "sm",
                color: "#666666"
              },
              {
                type: "text",
                text: data.dailyRate ? data.dailyRate.toLocaleString() + " ฿" : "-",
                flex: 5,
                size: "sm",
                color: "#111111"
              }
            ],
            margin: "lg"
          },
          {
            type: "box",
            layout: "baseline",
            contents: [
              {
                type: "text",
                text: "ราคารวม:",
                flex: 2,
                size: "sm",
                color: "#666666"
              },
              {
                type: "text",
                text: data.totalAmount ? data.totalAmount.toLocaleString() + " ฿" : "-",
                flex: 5,
                size: "sm",
                color: "#111111",
                weight: "bold"
              }
            ],
            margin: "md"
          },
          {
            type: "box",
            layout: "baseline",
            contents: [
              {
                type: "text",
                text: "มัดจำ:",
                flex: 2,
                size: "sm",
                color: "#666666"
              },
              {
                type: "text",
                text: data.deposit ? data.deposit.toLocaleString() + " ฿" : "-",
                flex: 5,
                size: "sm",
                color: "#111111"
              }
            ],
            margin: "md"
          },
          data.notes ? {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "หมายเหตุ:",
                size: "sm",
                color: "#666666",
                margin: "lg"
              },
              {
                type: "text",
                text: data.notes,
                size: "sm",
                color: "#111111",
                wrap: true,
                margin: "sm"
              }
            ]
          } : { type: "box", layout: "vertical", contents: [] }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "📄 เลือกการสร้างสัญญาเช่า",
            size: "sm",
            weight: "bold",
            color: "#666666",
            margin: "none"
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "button",
                style: "primary",
                color: "#17C964",
                action: {
                  type: "postback",
                  label: "ไทย + สัญญา",
                  data: "action=confirm_rental&contract=thai"
                },
                flex: 1
              },
              {
                type: "button",
                style: "primary",
                color: "#0072F5",
                action: {
                  type: "postback",
                  label: "อังกฤษ + สัญญา",
                  data: "action=confirm_rental&contract=english"
                },
                flex: 1,
                margin: "sm"
              }
            ],
            margin: "sm"
          },
          {
            type: "button",
            style: "secondary",
            action: {
              type: "postback",
              label: "✓ ไม่ต้องสัญญา",
              data: "action=confirm_rental&contract=none"
            },
            margin: "sm"
          },
          {
            type: "separator",
            margin: "md"
          },
          {
            type: "button",
            style: "secondary",
            action: {
              type: "postback",
              label: "✗ ยกเลิก",
              data: "action=cancel_rental"
            },
            margin: "sm"
          }
        ]
      }
    }
  };
}

/**
 * สร้าง Flex Message สำหรับแสดงสรุปหลังสร้างรายการเช่าสำเร็จ
 * @param {Object} rentalData - ข้อมูลการเช่า
 * @param {string} rentalId - รหัสการจอง
 * @returns {Object} Flex Message object
 */
function createRentalSummaryFlexMessage(rentalData, rentalId) {
  return {
    type: "flex",
    altText: "สร้างรายการเช่าสำเร็จ",
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "✅ สร้างรายการสำเร็จ",
            weight: "bold",
            size: "xl",
            color: "#FFFFFF"
          }
        ],
        backgroundColor: "#17C964",
        paddingAll: "20px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "รหัสการจอง",
            size: "sm",
            color: "#666666"
          },
          {
            type: "text",
            text: rentalId,
            size: "xl",
            weight: "bold",
            color: "#FF6B35",
            margin: "sm"
          },
          {
            type: "separator",
            margin: "lg"
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "ลูกค้า: " + (rentalData.customerName || "-"),
                size: "sm",
                color: "#111111",
                margin: "md"
              },
              {
                type: "text",
                text: "รถ: " + (rentalData.carName || "-"),
                size: "sm",
                color: "#111111",
                weight: "bold",
                margin: "sm"
              },
              {
                type: "text",
                text: "ระยะเวลา: " + (rentalData.startDate || "-") + " ถึง " + (rentalData.endDate || "-"),
                size: "sm",
                color: "#111111",
                margin: "sm",
                wrap: true
              }
            ]
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "สามารถตรวจสอบรายละเอียดเพิ่มเติมได้ในระบบ",
            size: "xs",
            color: "#999999",
            wrap: true,
            align: "center"
          }
        ]
      }
    }
  };
}

// =============================================================================
// 🎯 Main Rental Creation Flow Handler
// =============================================================================

/**
 * จัดการคำสั่งและ flow การสร้างรายการเช่า
 * @param {string} userId - LINE User ID
 * @param {string} message - ข้อความจากผู้ใช้
 * @param {Object} userInfo - ข้อมูลผู้ใช้จาก getLineBotUser()
 * @param {string} replyToken - LINE Reply Token
 * @returns {boolean} true ถ้าจัดการสำเร็จ
 */
function handleRentalCreationFlow(userId, message, userInfo, replyToken) {
  try {
    // ใช้ Lock เพื่อป้องกัน race condition
    const lock = LockService.getScriptLock();

    try {
      lock.waitLock(5000); // รอ 5 วินาที

      // ดึง current state
      let state = getUserRentalState(userId);

      // === ตรวจจับคำสั่ง "ยกเลิก" หรือ "เริ่มใหม่" ===
      const cancelKeywords = ['ยกเลิก', 'cancel', 'เริ่มใหม่', 'reset'];
      if (cancelKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
        clearUserRentalState(userId);
        replyLineMessage(replyToken, [{
          type: 'text',
          text: 'ยกเลิกการสร้างรายการเช่าเรียบร้อยแล้ว\n\nพิมพ์ "สร้างรายการเช่า" เพื่อเริ่มใหม่'
        }]);
        return true;
      }

      // === เริ่มต้นการสร้างรายการใหม่ ===
      const startKeywords = ['สร้างรายการเช่า', 'เช่ารถ', 'จองรถ', 'rental', 'book'];
      if (startKeywords.some(keyword => message.toLowerCase().includes(keyword))) {

        // เช็คว่ามีรายการค้างอยู่หรือไม่
        if (state && state.state !== RENTAL_STATE.IDLE) {
          replyLineMessage(replyToken, [{
            type: 'text',
            text: '❗ คุณมีรายการที่กำลังดำเนินการอยู่\n\nกรุณาทำรายการปัจจุบันให้เสร็จก่อน หรือพิมพ์ "ยกเลิก" เพื่อเริ่มใหม่'
          }]);
          return true;
        }

        // สร้าง state ใหม่
        state = {
          state: RENTAL_STATE.WAITING_FOR_DETAILS,
          shopId: userInfo.sheetID,
          storeName: userInfo.storeName,
          timestamp: Date.now()
        };
        setUserRentalState(userId, state);

        replyLineMessage(replyToken, [{
          type: 'text',
          text: '📝 กรุณาส่งรายละเอียดการเช่ารถ\n\nตัวอย่าง:\n"คุณสมชาย 081-234-5678\nเช่า Toyota Vios\nรับรถ 15 ม.ค. 68 เวลา 9:00\nคืนรถ 20 ม.ค. 68 เวลา 18:00\nราคา 800/วัน (5 วัน = 4000 บาท)\nมัดจำ 3000"\n\n⚠️ ข้อมูลที่ต้องมี:\n- รถที่เช่า\n- วันเวลารับรถ/คืนรถ\n- ราคาต่อวัน และราคารวม\n- ชื่อผู้เช่า\n\n💡 ส่งข้อมูลได้อิสระ ระบบจะถอดข้อมูลให้อัตโนมัติ\n\nพิมพ์ "ยกเลิก" เพื่อยกเลิก'
        }]);
        return true;
      }

      // === รอรับรายละเอียด ===
      if (state && state.state === RENTAL_STATE.WAITING_FOR_DETAILS) {

        // ส่งข้อความให้ผู้ใช้รอ
        replyLineMessage(replyToken, [{
          type: 'text',
          text: '⏳ กำลังประมวลผลข้อมูล...\nกรุณารอสักครู่'
        }]);

        // ส่งไปให้ AI ถอดข้อมูล
        const extractedData = extractRentalDataWithAI(message, state.shopId);

        if (extractedData.error) {
          pushLineMessage(userId, [{
            type: 'text',
            text: '❌ ' + extractedData.message + '\n\nกรุณาส่งรายละเอียดใหม่อีกครั้ง หรือพิมพ์ "ยกเลิก" เพื่อยกเลิก'
          }]);
          return true;
        }

        // 💰 ดึงข้อมูลรถจาก Sheet (ราคา, มัดจำ, ค่าประกัน, สถานะ)
        if (extractedData.carName) {
          const carDetails = getCarDetailsFromSheet(extractedData.carName, state.shopId);

          if (carDetails) {
            // 🚨 เช็คสถานะรถก่อน
            if (carDetails.status !== 'พร้อมให้เช่า') {
              logToSheet(state.shopId, 'WARNING', 'LINE Bot - รถไม่พร้อมให้เช่า', {
                carName: extractedData.carName,
                status: carDetails.status
              });

              pushLineMessage(userId, [{
                type: 'text',
                text: `⚠️ ขออภัย รถ "${carDetails.fullName}" ไม่พร้อมให้เช่าในขณะนี้\n\nสถานะรถ: ${carDetails.status || 'ไม่ระบุ'}\n\nกรุณาเลือกรถคันอื่น หรือพิมพ์ "ยกเลิก" เพื่อยกเลิกการจอง`
              }]);
              return true;
            }

            // เติมข้อมูลที่ยังไม่มี
            if (!extractedData.dailyRate || extractedData.dailyRate === null) {
              extractedData.dailyRate = carDetails.dailyRate;
            }
            if (!extractedData.deposit || extractedData.deposit === null) {
              extractedData.deposit = carDetails.deposit;
            }

            // เพิ่ม queueDeposit พร้อม fallback
            if (!extractedData.queueDeposit || extractedData.queueDeposit === null) {
              // ใช้ค่าจากรถก่อน ถ้าไม่มี (หรือเป็น 0) ให้ใช้ค่าเริ่มต้นจากชีตตั้งค่า
              if (carDetails.queueDeposit && carDetails.queueDeposit > 0) {
                extractedData.queueDeposit = carDetails.queueDeposit;
              } else {
                // ดึงค่าเริ่มต้นจากชีตตั้งค่าระบบ
                const defaultQueueDeposit = getSystemConfigValue('ค่ามัดจำคิวรถเริ่มต้น', state.shopId);
                extractedData.queueDeposit = defaultQueueDeposit ? parseFloat(defaultQueueDeposit) : 0;

                logToSheet(state.shopId, 'INFO', 'LINE Bot - ใช้ค่ามัดจำคิวรถเริ่มต้น', {
                  carName: extractedData.carName,
                  defaultQueueDeposit: extractedData.queueDeposit
                });
              }
            }

            // ใช้ชื่อเต็มของรถจาก Sheet
            extractedData.carName = carDetails.fullName;

            logToSheet(state.shopId, 'INFO', 'LINE Bot - เติมข้อมูลรถจาก Sheet', {
              carName: extractedData.carName,
              dailyRate: extractedData.dailyRate,
              deposit: extractedData.deposit,
              queueDeposit: extractedData.queueDeposit,
              status: carDetails.status
            });
          } else {
            // ไม่พบรถในระบบ
            logToSheet(state.shopId, 'WARNING', 'LINE Bot - ไม่พบข้อมูลรถใน Sheet', {
              carName: extractedData.carName
            });

            pushLineMessage(userId, [{
              type: 'text',
              text: `⚠️ ไม่พบข้อมูลรถ "${extractedData.carName}" ในระบบ\n\nกรุณาตรวจสอบชื่อรถหรือทะเบียนรถอีกครั้ง หรือพิมพ์ "ยกเลิก" เพื่อยกเลิกการจอง`
            }]);
            return true;
          }
        }

        // ตรวจสอบความครบถ้วน
        const validation = validateRentalData(extractedData);

        if (!validation.isComplete) {
          logToSheet(state.shopId, 'WARNING', 'ข้อมูลไม่ครบถ้วน', {
            missingFields: validation.missingFields,
            extractedData: extractedData
          });
          pushLineMessage(userId, [{
            type: 'text',
            text: '⚠️ ข้อมูลยังไม่ครบถ้วน\n\nข้อมูลที่ขาด:\n- ' + validation.missingFields.join('\n- ') + '\n\nกรุณาส่งข้อมูลที่ครบถ้วนมากขึ้น'
          }]);
          return true;
        }

        // ตรวจสอบความถูกต้อง (Strict Validation)
        const strictValidation = validateRentalDataStrict(extractedData);

        if (!strictValidation.isValid) {
          logToSheet(state.shopId, 'WARNING', 'ข้อมูลไม่ผ่าน Strict Validation', {
            errors: strictValidation.errors,
            warnings: strictValidation.warnings,
            extractedData: extractedData
          });

          let errorMessage = '❌ ข้อมูลไม่ถูกต้อง:\n\n';
          errorMessage += strictValidation.errors.map(err => '• ' + err).join('\n');

          if (strictValidation.warnings.length > 0) {
            errorMessage += '\n\n⚠️ คำเตือน:\n';
            errorMessage += strictValidation.warnings.map(warn => '• ' + warn).join('\n');
          }

          errorMessage += '\n\nกรุณาแก้ไขและส่งข้อมูลใหม่อีกครั้ง หรือพิมพ์ "ยกเลิก" เพื่อยกเลิก';

          pushLineMessage(userId, [{
            type: 'text',
            text: errorMessage
          }]);
          return true;
        }

        // ตรวจสอบว่ารถว่างหรือไม่ (Availability Check)
        const availabilityCheck = checkCarAvailabilityForAI(
          extractedData.carName,
          extractedData.startDate,
          extractedData.startTime,
          extractedData.endDate,
          extractedData.endTime,
          state.shopId
        );

        logToSheet(state.shopId, 'INFO', 'ตรวจสอบความว่างของรถ', {
          carName: extractedData.carName,
          period: `${extractedData.startDate} ${extractedData.startTime} - ${extractedData.endDate} ${extractedData.endTime}`,
          available: availabilityCheck.available,
          conflicts: availabilityCheck.conflicts
        });

        // ถ้ารถไม่ว่าง แสดง warning แต่ยังให้ดำเนินการต่อได้
        if (!availabilityCheck.available && availabilityCheck.conflicts.length > 0) {
          const conflict = availabilityCheck.conflicts[0];

          logToSheet(state.shopId, 'WARNING', 'พบการจองทับซ้อน', conflict);

          let warningMessage = '⚠️ พบข้อมูลต้องตรวจสอบ:\n\n';
          warningMessage += `รถ ${extractedData.carName} มีการจองทับซ้อน:\n`;
          warningMessage += `• หมายเลขการจอง: ${conflict.bookingNumber || 'N/A'}\n`;
          warningMessage += `• ลูกค้า: ${conflict.customer || 'N/A'}\n`;
          warningMessage += `• ช่วงเวลา: ${conflict.pickupDate} ${conflict.pickupTime} - ${conflict.returnDate} ${conflict.returnTime}\n\n`;
          warningMessage += 'กรุณาตรวจสอบและยืนยันว่าต้องการสร้างรายการนี้หรือไม่';

          pushLineMessage(userId, [{
            type: 'text',
            text: warningMessage
          }]);

          // เก็บ warning ไว้ใน state
          extractedData._availabilityWarning = availabilityCheck.message;
        }

        // บันทึกข้อมูลลง state
        state.rentalData = extractedData;
        state.state = RENTAL_STATE.WAITING_FOR_CONFIRMATION;
        setUserRentalState(userId, state);

        // Log ข้อมูลที่จะส่งไปยืนยัน
        logToSheet(state.shopId, 'INFO', 'ส่งข้อมูลให้ผู้ใช้ยืนยัน', {
          rentalData: extractedData,
          hasAvailabilityWarning: !!extractedData._availabilityWarning
        });

        // ส่ง Flex Message ให้ยืนยัน
        pushLineMessage(userId, [
          createRentalConfirmationFlexMessage(extractedData)
        ]);

        return true;
      }

      // === รอยืนยัน (จัดการผ่าน postback) ===
      if (state && state.state === RENTAL_STATE.WAITING_FOR_CONFIRMATION) {
        replyLineMessage(replyToken, [{
          type: 'text',
          text: '⏳ กรุณากดปุ่มยืนยันด้านบน\n\nหรือพิมพ์ "ยกเลิก" เพื่อยกเลิก'
        }]);
        return true;
      }

      // === กำลังสร้าง ===
      if (state && state.state === RENTAL_STATE.CREATING) {
        replyLineMessage(replyToken, [{
          type: 'text',
          text: '⏳ กำลังสร้างรายการอยู่...\nกรุณารอสักครู่'
        }]);
        return true;
      }

      return false; // ไม่ใช่คำสั่งที่เกี่ยวข้อง

    } finally {
      lock.releaseLock();
    }

  } catch (error) {
    Logger.log('handleRentalCreationFlow Error: ' + error.toString());
    replyLineMessage(replyToken, [{
      type: 'text',
      text: '❌ เกิดข้อผิดพลาด: ' + error.toString() + '\n\nกรุณาลองใหม่อีกครั้ง'
    }]);
    return false;
  }
}

/**
 * จัดการ Postback Event (กดปุ่มยืนยัน/ยกเลิก)
 * @param {string} userId - LINE User ID
 * @param {string} postbackData - Postback data
 * @param {Object} userInfo - ข้อมูลผู้ใช้
 * @param {string} replyToken - LINE Reply Token
 * @returns {boolean} true ถ้าจัดการสำเร็จ
 */
function handleRentalPostback(userId, postbackData, userInfo, replyToken) {
  try {
    const lock = LockService.getScriptLock();

    try {
      lock.waitLock(5000);

      const state = getUserRentalState(userId);

      if (!state || state.state !== RENTAL_STATE.WAITING_FOR_CONFIRMATION) {
        replyLineMessage(replyToken, [{
          type: 'text',
          text: '❌ รายการนี้หมดเวลาแล้ว\n\nกรุณาเริ่มใหม่โดยพิมพ์ "สร้างรายการเช่า"'
        }]);
        return true;
      }

      // === ยกเลิก ===
      if (postbackData === 'action=cancel_rental') {
        clearUserRentalState(userId);
        replyLineMessage(replyToken, [{
          type: 'text',
          text: '✅ ยกเลิกการสร้างรายการเรียบร้อยแล้ว\n\nพิมพ์ "สร้างรายการเช่า" เพื่อเริ่มใหม่'
        }]);
        return true;
      }

      // === ยืนยันสร้าง ===
      if (postbackData.includes('action=confirm_rental')) {

        // แยก contract option
        const contractMatch = postbackData.match(/contract=(thai|english|none)/);
        const contractOption = contractMatch ? contractMatch[1] : 'none';

        // เปลี่ยน state เป็น CREATING
        state.state = RENTAL_STATE.CREATING;
        state.contractOption = contractOption;
        setUserRentalState(userId, state);

        const contractText = contractOption === 'thai' ? 'สัญญาภาษาไทย' :
          contractOption === 'english' ? 'สัญญาภาษาอังกฤษ' :
            'ไม่สร้างสัญญา';

        replyLineMessage(replyToken, [{
          type: 'text',
          text: '⏳ กำลังสร้างรายการเช่า...\n(' + contractText + ')\nกรุณารอสักครู่'
        }]);

        // เรียก addNewRental()
        const rentalId = createRentalFromAIData(state.rentalData, state.shopId, contractOption);

        if (rentalId) {
          // สำเร็จ - ส่ง summary
          pushLineMessage(userId, [
            createRentalSummaryFlexMessage(state.rentalData, rentalId)
          ]);

          // ล้าง state
          clearUserRentalState(userId);
        } else {
          // ล้มเหลว
          pushLineMessage(userId, [{
            type: 'text',
            text: '❌ ไม่สามารถสร้างรายการได้\n\nกรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง'
          }]);

          // ย้อนกลับไป WAITING_FOR_CONFIRMATION
          state.state = RENTAL_STATE.WAITING_FOR_CONFIRMATION;
          setUserRentalState(userId, state);
        }

        return true;
      }

      return false;

    } finally {
      lock.releaseLock();
    }

  } catch (error) {
    Logger.log('handleRentalPostback Error: ' + error.toString());
    replyLineMessage(replyToken, [{
      type: 'text',
      text: '❌ เกิดข้อผิดพลาด: ' + error.toString()
    }]);
    return false;
  }
}

/**
 * สร้างรายการเช่าจากข้อมูล AI โดยเรียก addNewRental()
 * @param {Object} aiData - ข้อมูลจาก AI
 * @param {string} shopId - Sheet ID
 * @param {string} contractOption - 'thai', 'english', or 'none'
 * @returns {string|null} Rental ID หรือ null ถ้าล้มเหลว
 */
function createRentalFromAIData(aiData, shopId, contractOption) {
  try {
    // 🚦 เช็คว่ากำลังสร้างรายการอยู่หรือไม่
    const creationFlag = checkRentalCreationFlag(shopId);
    if (creationFlag.isCreating) {
      const sourceText = creationFlag.source === 'web' ? 'หน้าเว็บ' :
                         creationFlag.source === 'linebot' ? 'LINE Bot' :
                         creationFlag.source === 'webchat' ? 'Chatbot หน้าเว็บ' : 'ระบบอื่น';

      logToSheet(shopId, 'WARNING', 'พยายามสร้างรายการซ้อน', {
        existingSource: creationFlag.source,
        newAttemptSource: 'linebot/webchat',
        timestamp: creationFlag.timestamp
      });

      return {
        success: false,
        message: `⏳ กำลังสร้างรายการเช่าอยู่จาก${sourceText}\n\nกรุณารอสักครู่แล้วลองใหม่อีกครั้ง`
      };
    }

    // ตั้งค่า flag (ระบุ source ตามที่เรียกใช้)
    const source = 'ai'; // ใช้งานได้ทั้ง LINE Bot และ Web Chatbot
    if (!setRentalCreationFlag(shopId, source)) {
      return {
        success: false,
        message: '⏳ กำลังสร้างรายการเช่าอยู่\n\nกรุณารอสักครู่แล้วลองใหม่อีกครั้ง'
      };
    }

    // แปลง language ให้เป็นรหัสภาษาสั้น (th/en) สำหรับ log
    const normalizedLanguage = (aiData.language === 'ไทย' || aiData.language === 'th') ? 'th' :
                               (aiData.language === 'อังกฤษ' || aiData.language === 'en' || aiData.language === 'English') ? 'en' :
                               aiData.language;

    // Log ข้อมูล input
    logToSheet(shopId, 'INFO', 'เริ่มสร้างรายการเช่าจาก AI Data', {
      aiData: {...aiData, language: normalizedLanguage},
      contractOption: contractOption,
      source: source
    });

    // 🔢 สร้างหมายเลขการจองอัตโนมัติ
    const bookingNumber = generateBookingNumber(shopId);

    logToSheet(shopId, 'INFO', 'AI - สร้างหมายเลขการจอง', {
      bookingNumber: bookingNumber
    });

    // 📅 แปลงวันที่ให้เป็นรูปแบบ DD/MM/YYYY
    const convertDateFormat = (dateStr) => {
      if (!dateStr) return '';

      // ถ้าเป็นรูปแบบ DD/MM/YY (เช่น 12/11/68)
      const shortYearMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
      if (shortYearMatch) {
        const day = shortYearMatch[1].padStart(2, '0');
        const month = shortYearMatch[2].padStart(2, '0');
        const year = '25' + shortYearMatch[3]; // 68 -> 2568
        return `${day}/${month}/${year}`;
      }

      // ถ้าเป็นรูปแบบ DD/MM/YYYY อยู่แล้ว
      const fullYearMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (fullYearMatch) {
        const day = fullYearMatch[1].padStart(2, '0');
        const month = fullYearMatch[2].padStart(2, '0');
        const year = fullYearMatch[3];
        return `${day}/${month}/${year}`;
      }

      // ถ้าเป็นรูปแบบ YYYY-MM-DD
      const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (isoMatch) {
        return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
      }

      return dateStr; // คืนค่าเดิมถ้าไม่ตรงรูปแบบใดเลย
    };

    const formattedStartDate = convertDateFormat(aiData.startDate);
    const formattedEndDate = convertDateFormat(aiData.endDate);

    // 📅 แปลง DD/MM/YYYY เป็น YYYY-MM-DD สำหรับตารางรับส่งรถ
    const convertToISODate = (ddmmyyyy) => {
      if (!ddmmyyyy) return '';
      const match = ddmmyyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (match) {
        const day = match[1];
        const month = match[2];
        let year = parseInt(match[3], 10);

        // ถ้าปีเป็น พ.ศ. (มากกว่า 2500) ให้แปลงเป็น ค.ศ.
        if (year > 2500) {
          year = year - 543;
        }

        return `${year}-${month}-${day}`; // YYYY-MM-DD (ค.ศ.)
      }
      return ddmmyyyy;
    };

    const scheduleStartDate = convertToISODate(formattedStartDate);
    const scheduleEndDate = convertToISODate(formattedEndDate);

    logToSheet(shopId, 'INFO', 'AI - แปลงวันที่', {
      originalStartDate: aiData.startDate,
      formattedStartDate: formattedStartDate,
      scheduleStartDate: scheduleStartDate,
      originalEndDate: aiData.endDate,
      formattedEndDate: formattedEndDate,
      scheduleEndDate: scheduleEndDate
    });

    // หมายเหตุ: การคำนวณ totalPayOnPickup จะทำหลังจากดึงค่า securityDeposit แล้ว

    // 🚗 ดึงทะเบียนรถออกจากชื่อรถ (ถ้ามี format: "Car Name (License Plate)")
    const extractLicensePlate = (carName) => {
      if (!carName) return '';
      const match = carName.match(/\(([^)]+)\)$/); // หาข้อความในวงเล็บท้ายสุด
      return match ? match[1].trim() : '';
    };

    const licensePlate = extractLicensePlate(aiData.carName);

    logToSheet(shopId, 'INFO', 'AI - ดึงทะเบียนรถ', {
      carName: aiData.carName,
      licensePlate: licensePlate
    });

    // 🔍 ดึงค่า securityDeposit จากชีต "รายชื่อรถ" ถ้าผู้ใช้ไม่ได้ระบุ
    let finalSecurityDeposit = aiData.securityDeposit || 0;

    if (!finalSecurityDeposit || finalSecurityDeposit === 0) {
      try {
        const ss = SpreadsheetApp.openById(shopId);
        const carSheet = ss.getSheetByName('รายชื่อรถ');

        if (carSheet) {
          const carData = carSheet.getDataRange().getValues();
          const headers = carData[0];

          // หาคอลัมน์ที่ต้องการ
          const modelIndex = headers.indexOf('รุ่น');
          const plateIndex = headers.indexOf('ทะเบียน');
          const depositIndex = headers.indexOf('ค่าประกันความเสียหาย');

          if (modelIndex !== -1 && depositIndex !== -1) {
            // แยกข้อมูลรถ
            const plateMatch = aiData.carName.match(/(.*?)\s*\(([^\)]+)\)$/);
            let mainCarName = aiData.carName;
            let plate = '';

            if (plateMatch) {
              mainCarName = plateMatch[1].trim();
              plate = plateMatch[2];
            }

            const brandModelMatch = mainCarName.match(/^([^\s]+)\s+(.+)$/);
            let model = mainCarName;
            if (brandModelMatch) {
              model = brandModelMatch[2];
            }

            // ค้นหารถในชีต
            for (let i = 1; i < carData.length; i++) {
              const rowModel = carData[i][modelIndex];
              const rowPlate = plateIndex !== -1 ? carData[i][plateIndex] : '';

              if (rowModel === model && (!plate || rowPlate === plate)) {
                const depositValue = carData[i][depositIndex];
                if (depositValue && !isNaN(parseFloat(depositValue))) {
                  finalSecurityDeposit = parseFloat(depositValue);
                  logToSheet(shopId, 'INFO', 'AI - ดึงค่าประกันจากชีตรายชื่อรถ', {
                    carName: aiData.carName,
                    securityDeposit: finalSecurityDeposit
                  });
                  break;
                }
              }
            }
          }
        }

        // ถ้ายังไม่เจอ ให้ดึง fallback จากชีตตั้งค่า
        if (!finalSecurityDeposit || finalSecurityDeposit === 0) {
          const configSheet = ss.getSheetByName('ตั้งค่าระบบ');
          if (configSheet) {
            const configData = configSheet.getDataRange().getValues();
            for (let i = 0; i < configData.length; i++) {
              if (configData[i][0] === 'ค่าประกันความเสียหายเริ่มต้น') {
                const fallbackValue = configData[i][1];
                if (fallbackValue && !isNaN(parseFloat(fallbackValue))) {
                  finalSecurityDeposit = parseFloat(fallbackValue);
                  logToSheet(shopId, 'INFO', 'AI - ใช้ค่าประกัน fallback จากตั้งค่า', {
                    securityDeposit: finalSecurityDeposit
                  });
                  break;
                }
              }
            }
          }
        }
      } catch (e) {
        logToSheet(shopId, 'ERROR', 'AI - ไม่สามารถดึงค่าประกันได้', {
          error: e.toString()
        });
      }
    }

    // 💰 คำนวณรวมยอดชำระวันรับรถ (หลังจากดึงค่า securityDeposit แล้ว)
    // สูตร: ค่าเช่ารวมทั้งหมด - ส่วนลด - ค่ามัดจำคิวรถ + เงินประกันความเสียหาย + ค่าบริการเพิ่มเติม
    const totalRent = aiData.totalAmount || 0;
    const queueDepositAmount = aiData.queueDeposit || 0;
    const discount = aiData.discount || 0;
    const additionalServiceFee = aiData.additionalServiceFee || 0;

    // ถ้าผู้ใช้ระบุ "วันรับรถชำระเพิ่ม" มา ให้ใช้ค่านั้นเลย
    let totalPayOnPickup;
    if (aiData.pickupDayPayment && aiData.pickupDayPayment > 0) {
      totalPayOnPickup = aiData.pickupDayPayment;
      logToSheet(shopId, 'INFO', 'AI - ใช้ค่า pickupDayPayment ที่ผู้ใช้ระบุ', {
        pickupDayPayment: aiData.pickupDayPayment
      });
    } else {
      totalPayOnPickup = totalRent - discount - queueDepositAmount + finalSecurityDeposit + additionalServiceFee;
    }

    logToSheet(shopId, 'INFO', 'AI - คำนวณยอดชำระ', {
      totalRent: totalRent,
      queueDepositAmount: queueDepositAmount,
      discount: discount,
      securityDeposit: finalSecurityDeposit,
      additionalServiceFee: additionalServiceFee,
      totalPayOnPickup: totalPayOnPickup,
      formula: `${totalRent} - ${discount} - ${queueDepositAmount} + ${finalSecurityDeposit} + ${additionalServiceFee} = ${totalPayOnPickup}`
    });

    // เตรียมข้อมูลในรูปแบบที่ addNewRental() ต้องการ (ใช้ชื่อคอลัมน์ภาษาไทยตรงกับชีต)
    const rentalData = {
      // หมายเลขการจอง (auto-generated)
      หมายเลขการจอง: bookingNumber,

      // ข้อมูลพื้นฐาน
      รถ: aiData.carName,
      ทะเบียนรถ: licensePlate,
      ชื่อลูกค้า: aiData.customerName,
      เบอร์โทรศัพท์: aiData.phone,
      เลขบัตรประชาชน: aiData.idCard || '',
      ทะเบียนรถลูกค้า: '',
      วันที่เช่า: formattedStartDate, // DD/MM/YYYY
      วันที่คืน: formattedEndDate, // DD/MM/YYYY
      เวลารับรถ: aiData.startTime || '09:00', // HH:MM
      เวลาคืนรถ: aiData.endTime || '09:00', // HH:MM
      สถานที่รับรถ: aiData.pickupLocation || '',
      สถานที่คืนรถ: aiData.returnLocation || '',

      // ราคาและค่าบริการ
      ราคา: aiData.dailyRate,
      เงินประกันความเสียหาย: finalSecurityDeposit,
      ค่ามัดจำคิวรถ: aiData.queueDeposit || 0,
      ตัวเลือกประกันภัย: 'ไม่มี',
      ราคาประกันภัย: 0,
      ตัวเลือกเบาะนั่งเด็ก: 'ไม่มี',
      ราคาเบาะนั่งเด็ก: 0,
      บริการเพิ่มเติม: additionalServiceFee > 0 ? 'ค่าบริการเพิ่มเติม' : '',
      ราคาบริการเพิ่มเติม: additionalServiceFee,
      ส่วนลด: discount,
      ค่าเช่ารวมทั้งหมด: totalRent,
      รวมยอดชำระวันรับรถ: totalPayOnPickup,

      // การชำระเงิน
      วิธีการชำระเงิน: 'เงินสด',

      // สถานะ
      สถานะ: 'จอง',

      // ภาษี
      additionalServiceIncludeVAT: false,
      additionalServiceIncludeWHT: false,
      carSeatIncludeVAT: false,
      carSeatIncludeWHT: false,
      insuranceIncludeVAT: false,
      insuranceIncludeWHT: false,
      whtPercentage: 3,

      // หมายเหตุ
      หมายเหตุ: (aiData.notes || '') + '\n(สร้างผ่าน AI Chatbot)',

      // สัญญาเช่า
      สร้างสัญญาเช่า: contractOption !== 'none',
      ภาษาสัญญาเช่า: contractOption === 'english' ? 'อังกฤษ' : 'ไทย',
      ลิงก์สัญญาเช่า: '',

      // ข้อมูลเพิ่มเติม
      ที่อยู่ลูกค้า: aiData.address || '',

      // ไฟล์เอกสาร (ไม่มี - สำหรับ compatibility)
      idCardFile: null,
      drivingLicenseFile: null,
      doc1File: null,
      doc2File: null,
      doc3File: null,
      idCardPreviewUrl: null,
      drivingLicensePreviewUrl: null,
      doc1PreviewUrl: null,
      doc2PreviewUrl: null,
      doc3PreviewUrl: null
    };

    // Log ข้อมูลที่แปลงแล้วก่อนเรียก addNewRental
    logToSheet(shopId, 'INFO', 'ข้อมูลที่จะส่งไปยัง addNewRental', {
      rentalData: rentalData,
      contractOption: contractOption
    });

    // เรียก addNewRental()
    const result = addNewRental(rentalData, shopId);

    if (result && result.success) {
      logToSheet(shopId, 'INFO', 'สร้างรายการเช่าสำเร็จ', {
        bookingNumber: bookingNumber,
        result: result
      });

      // 📝 สร้างสัญญาเช่า (ถ้าเลือกให้สร้าง)
      let contractUrl = null;
      if (contractOption !== 'none') {
        try {
          // แปลง contractOption เป็นภาษาที่ฟังก์ชันต้องการ (ใช้รหัสภาษาสั้น)
          const language = contractOption === 'thai' ? 'th' : 'en';

          logToSheet(shopId, 'INFO', 'AI - เริ่มสร้างสัญญาเช่า', {
            bookingNumber: bookingNumber,
            language: language,
            contractOption: contractOption
          });

          // เรียกฟังก์ชันด้วย 3 parameters ที่ถูกต้อง: (bookingNumber, language, sheetID)
          const contractResult = generateRentalContract(bookingNumber, language, shopId);

          if (contractResult && contractResult.success) {
            contractUrl = contractResult.pdfUrl;

            logToSheet(shopId, 'INFO', 'AI - สร้างสัญญาเช่าสำเร็จ', {
              bookingNumber: bookingNumber,
              contractUrl: contractUrl
            });
          } else {
            logToSheet(shopId, 'WARNING', 'AI - สร้างสัญญาเช่าไม่สำเร็จ', {
              bookingNumber: bookingNumber,
              error: contractResult?.message || 'Unknown error'
            });
          }
        } catch (contractError) {
          logToSheet(shopId, 'WARNING', 'AI - สร้างสัญญาเช่า Exception', {
            bookingNumber: bookingNumber,
            error: contractError.toString()
          });
        }
      }

      // 📅 เพิ่มรายการในตารางรับส่งรถ
      try {
        logToSheet(shopId, 'INFO', 'AI - เริ่มเพิ่มตารางรับส่งรถ', {
          bookingNumber: bookingNumber
        });

        // สร้างรายการรับรถ
        const pickupSchedule = {
          หมายเลขการจอง: bookingNumber,
          วันที่: scheduleStartDate, // YYYY-MM-DD format
          เวลา: aiData.startTime || '09:00',
          ชื่อลูกค้า: aiData.customerName,
          รถ: aiData.carName,
          ประเภท: 'รับรถ',
          หมายเหตุ: aiData.notes || '',
          ลิงก์สัญญาเช่า: contractUrl || ''
        };

        // สร้างรายการคืนรถ
        const returnSchedule = {
          หมายเลขการจอง: bookingNumber,
          วันที่: scheduleEndDate, // YYYY-MM-DD format
          เวลา: aiData.endTime || '09:00',
          ชื่อลูกค้า: aiData.customerName,
          รถ: aiData.carName,
          ประเภท: 'ส่งคืนรถ',
          หมายเหตุ: aiData.notes || '',
          ลิงก์สัญญาเช่า: contractUrl || ''
        };

        // เพิ่มทั้งสองรายการ
        const pickupResult = addScheduleItem(pickupSchedule, shopId);
        const returnResult = addScheduleItem(returnSchedule, shopId);

        logToSheet(shopId, 'INFO', 'AI - เพิ่มตารางรับส่งรถสำเร็จ', {
          bookingNumber: bookingNumber,
          pickup: pickupResult?.success || false,
          return: returnResult?.success || false
        });
      } catch (scheduleError) {
        logToSheet(shopId, 'ERROR', 'AI - เพิ่มตารางรับส่งรถ Exception', {
          bookingNumber: bookingNumber,
          error: scheduleError.toString()
        });
      }

      // 📅 สร้างกิจกรรมในปฏิทิน Google Calendar
      try {
        logToSheet(shopId, 'INFO', 'AI - เริ่มสร้างกิจกรรมปฏิทิน', {
          bookingNumber: bookingNumber
        });

        // เพิ่ม contractUrl ให้กับ rentalData ก่อนสร้างกิจกรรม
        rentalData.ลิงก์สัญญาเช่า = contractUrl || '';

        const calendarResult = createCalendarEventForRental(rentalData, shopId);

        if (calendarResult && calendarResult.success) {
          // บันทึกข้อมูลปฏิทินลงในชีต
          const updateResult = updateRentalCalendarInfo(
            bookingNumber,
            calendarResult.eventUrl,
            calendarResult.eventId,
            calendarResult.calendarId,
            shopId
          );

          logToSheet(shopId, 'INFO', 'AI - สร้างกิจกรรมปฏิทินสำเร็จ', {
            bookingNumber: bookingNumber,
            eventUrl: calendarResult.eventUrl,
            eventId: calendarResult.eventId,
            calendarId: calendarResult.calendarId,
            updateResult: updateResult?.success || false
          });
        } else {
          logToSheet(shopId, 'WARNING', 'AI - สร้างกิจกรรมปฏิทินไม่สำเร็จ', {
            bookingNumber: bookingNumber,
            error: calendarResult?.message || 'Unknown error'
          });
        }
      } catch (calendarError) {
        logToSheet(shopId, 'WARNING', 'AI - สร้างกิจกรรมปฏิทิน Exception', {
          bookingNumber: bookingNumber,
          error: calendarError.toString()
        });
      }

      // 🚦 ลบ flag เมื่อเสร็จสิ้นการสร้าง
      clearRentalCreationFlag(shopId);

      // 📋 สร้างข้อความสรุปสำหรับแชร์ (ใช้ฟังก์ชันเดียวกับระบบปกติ)
      let summaryText = '';
      try {
        // แปลงภาษาจาก "ไทย"/"อังกฤษ" เป็น "th"/"en"
        const summaryLanguage = rentalData.ภาษาสัญญาเช่า === 'อังกฤษ' ? 'en' : 'th';

        summaryText = generateSummary(rentalData, shopId, summaryLanguage);

        logToSheet(shopId, 'INFO', 'AI - สร้างข้อความสรุปสำเร็จ', {
          bookingNumber: bookingNumber,
          language: summaryLanguage,
          summaryLength: summaryText ? summaryText.length : 0
        });
      } catch (summaryError) {
        logToSheet(shopId, 'WARNING', 'AI - สร้างข้อความสรุปล้มเหลว', {
          bookingNumber: bookingNumber,
          error: summaryError.toString()
        });
        // ใช้ข้อความสรุปแบบง่ายถ้าเกิด error
        summaryText = `📋 รายการเช่า ${bookingNumber}\n\nรถ: ${rentalData.รถ}\nลูกค้า: ${rentalData.ชื่อลูกค้า}\n\nดูรายละเอียดเพิ่มเติมในระบบ`;
      }

      // Return ข้อมูลครบถ้วนสำหรับแสดงผลลัพธ์
      return {
        success: true,
        message: 'สร้างรายการเช่าสำเร็จ',
        bookingNumber: bookingNumber,
        contractUrl: contractUrl,
        rentalData: rentalData,
        summaryText: summaryText
      };
    }

    // 🚦 ลบ flag เมื่อสร้างไม่สำเร็จ
    clearRentalCreationFlag(shopId);

    // Log ข้อมูลเมื่อสร้างไม่สำเร็จ
    logToSheet(shopId, 'ERROR', 'addNewRental ล้มเหลว', {
      result: result,
      rentalData: rentalData,
      aiData: aiData
    });
    return { success: false, message: result?.message || 'ไม่สามารถสร้างรายการได้' };

  } catch (error) {
    // 🚦 ลบ flag เมื่อเกิด error
    clearRentalCreationFlag(shopId);

    Logger.log('createRentalFromAIData Error: ' + error.toString());
    logToSheet(shopId, 'ERROR', 'createRentalFromAIData Exception', {
      error: error.toString(),
      message: error.message,
      stack: error.stack,
      aiData: aiData
    });
    return null;
  }
}

// =============================================================================
// 📤 LINE Messaging Helper Functions
// =============================================================================

/**
 * ส่ง Push Message ไปหา LINE User
 * @param {string} userId - LINE User ID
 * @param {Array} messages - Array of message objects
 */
function pushLineMessage(userId, messages) {
  try {
    const url = 'https://api.line.me/v2/bot/message/push';

    const payload = {
      to: userId,
      messages: messages
    };

    const options = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    Logger.log('Push Message Response: ' + response.getContentText());

  } catch (error) {
    Logger.log('pushLineMessage Error: ' + error.toString());
  }
}

/**
 * Reply Message ไปหา LINE User
 * @param {string} replyToken - LINE Reply Token
 * @param {Array} messages - Array of message objects
 */
function replyLineMessage(replyToken, messages) {
  try {
    const payload = {
      replyToken: replyToken,
      messages: messages
    };

    const options = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(LINE_MESSAGING_API_URL, options);
    Logger.log('Reply Message Response: ' + response.getContentText());

  } catch (error) {
    Logger.log('replyLineMessage Error: ' + error.toString());
  }
}

// =============================================================================
// 🌐 Web Chatbot Functions (สำหรับเรียกจาก Frontend)
// =============================================================================

/**
 * ถอดข้อมูลการเช่าด้วย AI สำหรับ Web Chatbot
 * @param {string} message - ข้อความจากผู้ใช้
 * @param {string} shopId - Sheet ID
 * @returns {Object} ข้อมูลที่ถอดได้ พร้อม validation
 */
function extractRentalDataWithAIForChat(message, shopId) {
  try {
    // Log input message
    logToSheet(shopId, 'INFO', 'Web Chatbot - รับข้อความจากผู้ใช้', {
      message: message
    });

    // เรียก AI extraction
    const extractedData = extractRentalDataWithAI(message, shopId);

    // ตรวจสอบว่ามี error หรือไม่
    if (extractedData.error) {
      return extractedData;
    }

    // 🔍 เพิ่ม: ถ้า AI ไม่เจอชื่อรถ ให้ลองหาจาก message
    if (!extractedData.carName || extractedData.carName === null) {
      const matchedCar = findCarFromMessage(message, shopId);
      if (matchedCar) {
        extractedData.carName = matchedCar;
        logToSheet(shopId, 'INFO', 'Web Chatbot - จับคู่รถสำเร็จหลัง AI', {
          originalMessage: message,
          matchedCar: matchedCar
        });
      }
    }

    // 💰 เพิ่ม: ดึงข้อมูลเงินประกัน/ค่ามัดจำจากชีตรถ (ถ้ายังไม่มี)
    if (extractedData.carName) {
      const carDetails = getCarDetailsFromSheet(extractedData.carName, shopId);
      if (carDetails) {
        // 🚨 เช็คสถานะรถก่อน
        if (carDetails.status !== 'พร้อมให้เช่า') {
          logToSheet(shopId, 'WARNING', 'Web Chatbot - รถไม่พร้อมให้เช่า', {
            carName: extractedData.carName,
            status: carDetails.status
          });

          extractedData.errors = extractedData.errors || [];
          extractedData.errors.push(`รถ "${carDetails.fullName}" ไม่พร้อมให้เช่า (สถานะ: ${carDetails.status || 'ไม่ระบุ'})`);
          extractedData.isValid = false;
        } else {
          // เติมเฉพาะค่าที่ยังไม่มี
          if (!extractedData.dailyRate || extractedData.dailyRate === null) {
            extractedData.dailyRate = carDetails.dailyRate;
          }
          if (!extractedData.deposit || extractedData.deposit === null) {
            extractedData.deposit = carDetails.deposit;
          }

          // เพิ่ม securityDeposit (ถ้ายังไม่มีใน extractedData)
          if (!extractedData.securityDeposit || extractedData.securityDeposit === null) {
            extractedData.securityDeposit = carDetails.securityDeposit;
          }

          // เพิ่ม queueDeposit พร้อม fallback
          if (!extractedData.queueDeposit || extractedData.queueDeposit === null) {
            // ใช้ค่าจากรถก่อน ถ้าไม่มี (หรือเป็น 0) ให้ใช้ค่าเริ่มต้นจากชีตตั้งค่า
            if (carDetails.queueDeposit && carDetails.queueDeposit > 0) {
              extractedData.queueDeposit = carDetails.queueDeposit;
            } else {
              // ดึงค่าเริ่มต้นจากชีตตั้งค่าระบบ
              const defaultQueueDeposit = getSystemConfigValue('ค่ามัดจำคิวรถเริ่มต้น', shopId);
              extractedData.queueDeposit = defaultQueueDeposit ? parseFloat(defaultQueueDeposit) : 0;

              logToSheet(shopId, 'INFO', 'Web Chatbot - ใช้ค่ามัดจำคิวรถเริ่มต้น', {
                carName: extractedData.carName,
                defaultQueueDeposit: extractedData.queueDeposit
              });
            }
          }

          // ใช้ชื่อเต็มของรถจาก Sheet
          extractedData.carName = carDetails.fullName;

          logToSheet(shopId, 'INFO', 'Web Chatbot - เติมข้อมูลรถจาก Sheet', {
            carName: extractedData.carName,
            dailyRate: extractedData.dailyRate,
            deposit: extractedData.deposit,
            securityDeposit: extractedData.securityDeposit,
            queueDeposit: extractedData.queueDeposit,
            status: carDetails.status
          });
        }
      } else {
        // ไม่พบรถในระบบ
        logToSheet(shopId, 'WARNING', 'Web Chatbot - ไม่พบข้อมูลรถใน Sheet', {
          carName: extractedData.carName
        });

        extractedData.errors = extractedData.errors || [];
        extractedData.errors.push(`ไม่พบข้อมูลรถ "${extractedData.carName}" ในระบบ`);
        extractedData.isValid = false;
      }
    }

    // Validate ข้อมูลพื้นฐาน
    const validation = validateRentalData(extractedData);

    // Validate แบบ strict
    const strictValidation = validateRentalDataStrict(extractedData);

    // ตรวจสอบความว่างของรถ
    let availabilityCheck = null;
    if (validation.isComplete && strictValidation.isValid) {
      availabilityCheck = checkCarAvailabilityForAI(
        extractedData.carName,
        extractedData.startDate,
        extractedData.startTime,
        extractedData.endDate,
        extractedData.endTime,
        shopId
      );

      logToSheet(shopId, 'INFO', 'Web Chatbot - ตรวจสอบความว่างของรถ', {
        carName: extractedData.carName,
        available: availabilityCheck.available,
        conflicts: availabilityCheck.conflicts
      });
    }

    // Log validation results
    logToSheet(shopId, 'INFO', 'Web Chatbot - ผลการ Validate', {
      isComplete: validation.isComplete,
      isValid: strictValidation.isValid,

      errors: strictValidation.errors,
      warnings: strictValidation.warnings,
      availability: availabilityCheck
    });

    // Return พร้อม validation results
    return {
      ...extractedData,
      isComplete: validation.isComplete,
      missingFields: validation.missingFields,
      isValid: strictValidation.isValid,
      errors: strictValidation.errors,
      warnings: strictValidation.warnings,
      availabilityCheck: availabilityCheck
    };

  } catch (error) {
    Logger.log('extractRentalDataWithAIForChat Error: ' + error.toString());
    logToSheet(shopId, 'ERROR', 'Web Chatbot - extractRentalDataWithAIForChat Exception', {
      error: error.toString(),
      message: error.message,
      stack: error.stack
    });
    return {
      error: true,
      message: 'เกิดข้อผิดพลาดในการประมวลผล',
      details: error.toString()
    };
  }
}

/**
 * สร้างรายการเช่าจาก Web Chatbot
 * @param {Object} aiData - ข้อมูลจาก AI
 * @param {string} contractOption - 'thai', 'english', or 'none'
 * @param {string} shopId - Sheet ID
 * @returns {Object} { success: boolean, rentalId: string, message: string }
 */
function createRentalFromChatbot(aiData, contractOption, shopId) {
  try {
    // Log input parameters
    logToSheet(shopId, 'INFO', 'Web Chatbot - เริ่มสร้างรายการเช่า', {
      aiData: aiData,
      contractOption: contractOption
    });

    // เรียก createRentalFromAIData
    const result = createRentalFromAIData(aiData, shopId, contractOption);

    if (result && result.success) {
      logToSheet(shopId, 'INFO', 'Web Chatbot - สร้างรายการเช่าสำเร็จ', {
        bookingNumber: result.bookingNumber,
        contractUrl: result.contractUrl,
        result: result
      });

      return {
        success: true,
        rentalId: result.bookingNumber, // For backward compatibility
        bookingNumber: result.bookingNumber,
        contractUrl: result.contractUrl,
        rentalData: result.rentalData,
        summaryText: result.summaryText,
        message: result.message || 'สร้างรายการเช่าสำเร็จ'
      };
    } else {
      logToSheet(shopId, 'ERROR', 'Web Chatbot - สร้างรายการเช่าล้มเหลว', {
        aiData: aiData,
        result: result
      });

      return {
        success: false,
        message: result?.message || 'ไม่สามารถสร้างรายการได้ กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง',
        errors: [result?.message || 'ไม่สามารถสร้างรายการได้ กรุณาตรวจสอบข้อมูล']
      };
    }

  } catch (error) {
    Logger.log('createRentalFromChatbot Error: ' + error.toString());
    logToSheet(shopId, 'ERROR', 'Web Chatbot - createRentalFromChatbot Exception', {
      error: error.toString(),
      message: error.message,
      stack: error.stack
    });

    return {
      success: false,
      message: 'เกิดข้อผิดพลาด: ' + error.message,
      errors: [error.message]
    };
  }
}

// =============================================================================
// 🧪 Testing Functions (สำหรับทดสอบเท่านั้น)
// =============================================================================

/**
 * ทดสอบการถอดข้อมูลด้วย AI
 */
function testAIExtraction() {
  const testMessage = `คุณสมชาย 081-234-5678
เช่า Toyota Vios
รับรถ 15 ม.ค. 68
คืนรถ 20 ม.ค. 68
ราคา 800/วัน
มัดจำ 3000`;

  const shopId = '1oCoYYpgaA3KF72CEfBCCGWN3n7Qt-qd52vdvgNOP6cY'; // ใส่ Shop ID จริง

  const result = extractRentalDataWithAI(testMessage, shopId);
  Logger.log('Test Result: ' + JSON.stringify(result, null, 2));
}
