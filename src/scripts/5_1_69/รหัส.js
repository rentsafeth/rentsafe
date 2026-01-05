function doGet(e) {
  const pathInfo = e.pathInfo || ""; // ป้องกันกรณี pathInfo เป็น null
  const pathParts = pathInfo.split('/').filter(p => p); // แยก path และลบส่วนที่ว่าง
  const pageParam = e.parameter.page; // ดึงค่า page จาก query parameter

  // Route สำหรับหน้าจองออนไลน์ /exec/booking/shopname หรือ /exec/booking หรือ ?page=booking
  if ((pathParts.length > 0 && pathParts[0].toLowerCase() === 'booking') || (pageParam && pageParam.toLowerCase() === 'booking')) {
    // ชื่อร้านคือส่วนที่ต่อจาก 'booking' หรือใช้ 'booking' เป็น default สำหรับร้านแรก
    const shopName = pathParts[1] || 'booking';

    // กำหนดค่า Sheet ID สำหรับแต่ละร้าน
    const shopsConfig = {
      'booking': '1oCoYYpgaA3KF72CEfBCCGWN3n7Qt-qd52vdvgNOP6cY', // ร้านที่ 1 (ของคุณ)
      'kpcarrent': 'YOUR_SECOND_SHOP_SHEET_ID', // << แก้ไข ID ของร้านที่ 2
      'abccarrent': 'YOUR_THIRD_SHOP_SHEET_ID'   // << แก้ไข ID ของร้านที่ 3
    };

    const sheetId = shopsConfig[shopName.toLowerCase()];

    if (sheetId) {
      const template = HtmlService.createTemplateFromFile('booking');
      template.sheetId = sheetId; // ส่ง sheetId ไปให้ HTML template
      template.shopName = getShopDisplayName(shopName); // ส่งชื่อร้านสำหรับแสดงผล
      const htmlOutput = template.evaluate()
        .setTitle('จองรถเช่า - ' + getShopDisplayName(shopName))
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // เพิ่มบรรทัดนี้
      return htmlOutput;
    } else {
      // กรณีไม่พบชื่อร้านที่กำหนด
      return HtmlService.createHtmlOutput('ไม่พบร้านค้าในระบบ: ' + shopName)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // เพิ่มบรรทัดนี้
    }
  }

  // Route สำหรับหน้า admin (เหมือนเดิม)
  if (pageParam === 'admin') {
    return HtmlService.createHtmlOutputFromFile('admin')
      .setTitle('ระบบจัดการรถเช่า KPCRM Admin Panel')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // เพิ่มบรรทัดนี้
  }

  // หน้าหลัก (index.html) เป็นหน้า default
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('ระบบจัดการเช่ารถ KPCRM V.3')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // เพิ่มบรรทัดนี้
}



// สร้างตัวแปรที่เก็บข้อมูลชื่อ Sheet ต่างๆ
const RENTAL_SHEET = "รายการเช่า";
const SCHEDULE_SHEET = "ตารางรับส่งรถ";
const CONFIG_SHEET = "ตั้งค่าระบบ";
const CARS_SHEET = "รายชื่อรถ";
const USERS_SHEET = "ผู้ใช้งาน"; // เพิ่มชีทเก็บข้อมูลผู้ใช้งาน
const CONTRACT_SHEET = "แปลสัญญาเช่า";
const MAINTENANCE_SHEET = "การแจ้งเตือน";
const CAR_STATUS_READY = "พร้อมให้เช่า";
const FINANCIAL_SHEET = "รายรับรายจ่าย";
const SUMMARY_TRANSLATION_SHEET = "แปลสรุปสัญญาเช่า";



const ONLINE_BOOKING_SETTINGS_SHEET = "ตั้งค่าจองออนไลน์";
const ONLINE_BOOKING_SHEET = "จองออนไลน์";
const CUSTOMERS_SHEET = "ข้อมูลลูกค้า";

const LINE_CHANNEL_ACCESS_TOKEN = "81P9kpQSDt9ngipO516fDtdkFNQ0hgx4Sk6uY3eAoTS82NLRMVZbzzRSHv5KM1SkTtGUw8pfTGVkP79txlVouij6wrvUnTx8bo5XKxhZQrqYwooojKL81HiorVpcgzxASNvJop2JIo30b4jHFdm1ZwdB04t89/1O/w1cDnyilFU=";
const LINE_MESSAGING_API_URL = "https://api.line.me/v2/bot/message/reply";

// LINE Bot - Configuration
const LINEBOT_USERS_SHEET = "LineBotUsers";
const LINELOG_SHEET = "Linelog";  // เพิ่มชื่อชีตสำหรับ log
const MASTER_LINELOG_SHEET = "MasterLinelog";  // ชีตสำหรับเก็บ log ทุก doPost ใน Master Sheet
const MAX_SECRET_ATTEMPTS = 3; // จำนวนครั้งที่กรอก Secret ID ผิดได้สูงสุด
const BLOCK_DURATION_MINUTES = 15; // ระยะเวลาที่ถูกบลอก (นาที)

// State สำหรับ LINE Bot Registration Flow
const STATE_WAIT_SECRET = 'wait_secret';
const STATE_WAIT_USERNAME = 'wait_username';




// =============================================================================
// ⭐ ระบบ Pre-warming Cache สำหรับ Multi-tenant
// =============================================================================

// --- ค่าคงที่สำหรับระบบ Pre-warm ---
// ID ของ Master Sheet ที่เก็บ License ร้านค้าทั้งหมด
const MASTER_SHEET_ID = "1JEbD4MOM1jgm6cA9D4AlW8z8x4yUZo1rfys6u4a_hvc";
// ชื่อชีตที่เก็บข้อมูล License
const TENANT_SHEET_NAME = "licenseV_3";



/**
 * ฟังก์ชันสำหรับสร้าง/อุ่น Cache ล่วงหน้าสำหรับทุก Tenant ที่ Active
 * (เวอร์ชันปรับปรุงใหม่: ใช้หลักการ Batching เพื่อความเร็วสูงสุด)
 */
function prewarmAllTenantCaches() {
  const startTime = new Date();
  Utilities.sleep(1500);

  const tenants = getActiveTenants_();
  const funcName = 'Cache Pre-warm (Batch Mode)';
  Logger.log(`[${funcName}] 🚀 Cache Warming เริ่มทำงานสำหรับ ${tenants.length} ร้านค้า`);

  if (tenants.length === 0) {
    Logger.log(`[${funcName}] ไม่พบร้านค้าที่ Active อยู่ จึงสิ้นสุดการทำงาน`);
    return;
  }

  // --- STEP 1: BATCH DATA FETCHING ---
  // ดึงข้อมูลทั้งหมดของทุก Tenant มาเก็บใน Memory ก่อน เพื่อลดการเรียก API
  const allTenantsData = {};
  Logger.log(`[${funcName}] 🔄 เริ่มดึงข้อมูลทั้งหมด (Batch Fetching)...`);

  try {
    tenants.forEach(sheetID => {
      // ดึงข้อมูลที่จำเป็นสำหรับทั้ง getSummaryData และ getScheduleForDate
      allTenantsData[sheetID] = {
        rentals: getSheetDataAsObjects_(sheetID, RENTAL_SHEET),
        cars: getSheetDataAsObjects_(sheetID, CARS_SHEET),
        scheduleItems: getSheetDataAsObjects_(sheetID, SCHEDULE_SHEET),
        maintenance: getSheetDataAsObjects_(sheetID, MAINTENANCE_SHEET)
      };
    });
    const fetchEndTime = new Date();
    Logger.log(`[${funcName}] ✅ ดึงข้อมูลทั้งหมดสำเร็จใน ${fetchEndTime.getTime() - startTime.getTime()} ms`);
  } catch (e) {
    Logger.log(`[${funcName}] ❌ เกิดข้อผิดพลาดร้ายแรงระหว่างดึงข้อมูล: ${e.message}`);
    return; // หยุดทำงานทันทีถ้าดึงข้อมูลพื้นฐานไม่ได้
  }

  // --- STEP 2: PROCESS DATA AND CREATE CACHE (IN-MEMORY) ---
  // นำข้อมูลใน Memory มาประมวลผลทีละ Tenant (ขั้นตอนนี้จะเร็วมาก)
  const scriptTimezone = Session.getScriptTimeZone();
  const todayString = Utilities.formatDate(new Date(), scriptTimezone, "yyyy-MM-dd");

  tenants.forEach(sheetID => {
    const tenantData = allTenantsData[sheetID];

    // 1. สร้างแคช Summary จากข้อมูลที่เตรียมไว้
    try {
      // **สำคัญ:** เราจะเรียกใช้ getSummaryData เวอร์ชันเดิมได้เลย
      // เพราะมันจะไปเจอ Cache Miss แล้วดึงข้อมูลจากชีตอีกครั้ง
      // ซึ่งในที่นี้เราต้องการให้มันทำงานแบบนั้น เพื่อให้ Logic การประมวลผลยังอยู่ที่เดิม
      // การปรับปรุงนี้เน้นที่การ "อุ่น" แคชให้เร็วขึ้น
      getSummaryData(sheetID);
      Logger.log(`[${funcName}] ✅ สร้างแคช Summary สำหรับ Sheet ID: ${sheetID} สำเร็จ`);
    } catch (e) {
      Logger.log(`[${funcName}] ❌ เกิดข้อผิดพลาดกับแคช Summary ของ Sheet ID: ${sheetID}: ${e.message}`);
    }

    // 2. สร้างแคช Schedule จากข้อมูลที่เตรียมไว้
    try {
      getScheduleForDate(todayString, sheetID);
      Logger.log(`[${funcName}] ✅ สร้างแคช Schedule (วันนี้) สำหรับ Sheet ID: ${sheetID} สำเร็จ`);
    } catch (e) {
      Logger.log(`[${funcName}] ❌ เกิดข้อผิดพลาดกับแคช Schedule (วันนี้) ของ Sheet ID: ${sheetID}: ${e.message}`);
    }
  });

  const overallEndTime = new Date();
  Logger.log(`[${funcName}] ✨ Cache Warming เสร็จสิ้นทั้งหมดใน ${overallEndTime.getTime() - startTime.getTime()} ms`);
}






/**
 * (แก้ไขล่าสุด) ฟังก์ชันสำหรับล้างแคช "ทั้งหมด" ของทุกร้านค้าที่ Active
 * - Customers Cache
 * - Summary Cache
 * - Schedule Cache
 * (นำส่วน prewarm ออก เพื่อป้องกันการสร้างแคชใหม่ด้วยข้อมูลเก่า)
 */
function clearAllCustomersCache() {
  const tenants = getActiveTenants_();

  tenants.forEach(sheetID => {
    // 1. ล้างแคชลูกค้า
    clearCustomersCacheForTenant(sheetID);

    // 2. ล้างแคช Summary และ Schedule
    clearSummaryCacheForTenant(sheetID);
  });

  // 3. แก้ไข Log เพื่อให้สื่อความหมายได้ถูกต้อง
  Logger.log(`[Cache] 🚀 ล้างแคชทั้งหมด (Customers, Summary, Schedule) ของทุก tenant แล้ว (${tenants.length} ร้าน)`);
}






/**
 * ฟังก์ชันช่วยสำหรับดึงรายชื่อ sheetID ของร้านค้าที่ Active อยู่ทั้งหมด
 * จากชีต licenseV_3 ของคุณ
 * @returns {string[]} Array ของ sheetID
 */
function getActiveTenants_() {
  try {
    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const sheet = ss.getSheetByName(TENANT_SHEET_NAME);

    if (!sheet) {
      Logger.log(`❌ ไม่พบชีตชื่อ '${TENANT_SHEET_NAME}' ในไฟล์ Master Sheet`);
      return [];
    }

    // อ่านข้อมูลทั้งหมดจากชีต (ยกเว้นแถวหัวข้อ)
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // หาตำแหน่งคอลัมน์ของ 'sheetID' และ 'status' แบบอัตโนมัติ (รองรับทั้งตัวเล็กและตัวใหญ่)
    let sheetIdIndex = headers.indexOf('sheetID');
    if (sheetIdIndex === -1) sheetIdIndex = headers.indexOf('SheetID');

    let statusIndex = headers.indexOf('status');
    if (statusIndex === -1) statusIndex = headers.indexOf('Status');

    // ตรวจสอบว่าพบคอลัมน์ที่ต้องการหรือไม่
    if (sheetIdIndex === -1 || statusIndex === -1) {
      Logger.log("❌ ไม่พบคอลัมน์ 'sheetID/SheetID' หรือ 'status/Status' ในชีต License");
      return [];
    }

    // กรองเอาร้านค้าที่ status เป็น 'active' เท่านั้น
    const activeTenants = data.filter(row => {
      const status = row[statusIndex];
      // ตรวจสอบว่า status เป็น 'active' (ไม่สนใจตัวพิมพ์เล็ก/ใหญ่)
      return String(status).toLowerCase() === 'active';
    }).map(row => row[sheetIdIndex]); // ดึงค่า sheet_id ออกมาเป็น Array

    Logger.log(`[getActiveTenants] พบร้านค้าที่ Active ทั้งหมด: ${activeTenants.length} ร้าน`);

    // กรองค่าว่างหรือ null ออกอีกครั้งเพื่อความปลอดภัย
    return activeTenants.filter(id => id);

  } catch (e) {
    Logger.log(`❌ ไม่สามารถดึงรายชื่อร้านค้าจาก Master Sheet ได้: ${e.message}`);
    return [];
  }
}






// =============================================================================
// 🤖 LINE Bot Webhook Handler
// =============================================================================

/**
 * รับ Webhook จาก LINE Messaging API
 */
function doPost(e) {
  try {
    const startTime = Date.now();

    // Parse JSON payload
    const contents = JSON.parse(e.postData.contents);
    const events = contents.events;

    if (!events || events.length === 0) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'No events' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ประมวลผลแต่ละ event
    events.forEach(event => {
      if (event.type === 'message' && event.message.type === 'text') {
        handleTextMessage(event, startTime);
      } else if (event.type === 'postback') {
        handlePostbackEvent(event, startTime);
      }
    });

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('doPost Error: ' + error.toString());
    logLinebotError('doPost', error.toString());
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ประมวลผลข้อความที่เป็น Text
 */
function handleTextMessage(event, startTime) {
  const lineUserId = event.source.userId;
  const replyToken = event.replyToken;
  const userMessage = event.message.text.trim();

  // เก็บ raw payload สำหรับ debug
  const rawPayload = JSON.stringify(event);

  try {
    // ดึง current state
    const currentState = getUserState(lineUserId);

    // ดึงข้อมูลผู้ใช้จาก Master Sheet
    const userData = getLineBotUser(lineUserId);

    // Log ทุก request ลงใน Master Sheet
    logMasterDoPost(lineUserId, userMessage, currentState, userData, 'handleTextMessage_start', 'processing', null, Date.now() - startTime, rawPayload);

    // ตรวจสอบ Rate Limiting
    if (isUserBlocked(lineUserId)) {
      const remainingTime = getBlockRemainingTime(lineUserId);
      replyFlexMessage(replyToken, createErrorFlex(
        'ถูกบลอกชั่วคราว',
        `กรุณารอ ${remainingTime} นาที ก่อนลองใหม่อีกครั้ง`
      ));
      logLinebotActivity(null, lineUserId, '', 'text', userMessage, 'blocked', 'rate_limit_blocked', null, Date.now() - startTime);
      logMasterDoPost(lineUserId, userMessage, currentState, userData, 'rate_limit_blocked', 'blocked', null, Date.now() - startTime, null);
      return;
    }

    // กรณียังไม่ได้ลงทะเบียน
    if (!userData) {
      logMasterDoPost(lineUserId, userMessage, currentState, null, 'unregistered_user', 'routing', null, Date.now() - startTime, null);
      handleUnregisteredUser(lineUserId, replyToken, userMessage, startTime, rawPayload);
      return;
    }

    // กรณีลงทะเบียนแล้ว
    logMasterDoPost(lineUserId, userMessage, currentState, userData, 'registered_user', 'routing', null, Date.now() - startTime, null);
    handleRegisteredUser(userData, replyToken, userMessage, startTime);

  } catch (error) {
    Logger.log('handleTextMessage Error: ' + error.toString());
    const currentState = getUserState(lineUserId);
    const userData = getLineBotUser(lineUserId);
    replyFlexMessage(replyToken, createSystemErrorFlex());
    logLinebotActivity(null, lineUserId, '', 'text', userMessage, 'error', 'handle_message_error', error.toString(), Date.now() - startTime);
    logMasterDoPost(lineUserId, userMessage, currentState, userData, 'handleTextMessage_error', 'error', error.toString(), Date.now() - startTime, null);
  }
}

/**
 * ประมวลผล Postback Event (กดปุ่มใน Flex Message)
 */
function handlePostbackEvent(event, startTime) {
  const lineUserId = event.source.userId;
  const replyToken = event.replyToken;
  const postbackData = event.postback.data;

  // เก็บ raw payload สำหรับ debug
  const rawPayload = JSON.stringify(event);

  try {
    // ดึงข้อมูลผู้ใช้จาก Master Sheet
    const userData = getLineBotUser(lineUserId);

    // Log ทุก request ลงใน Master Sheet
    logMasterDoPost(lineUserId, postbackData, null, userData, 'handlePostback_start', 'processing', null, Date.now() - startTime, rawPayload);

    // กรณียังไม่ได้ลงทะเบียน
    if (!userData) {
      replyTextMessage(replyToken, 'กรุณาลงทะเบียนก่อนใช้งาน');
      logMasterDoPost(lineUserId, postbackData, null, null, 'unregistered_user_postback', 'blocked', null, Date.now() - startTime, null);
      return;
    }

    // ⭐ Rental Creation Flow - จัดการ postback
    const rentalPostbackHandled = handleRentalPostback(lineUserId, postbackData, userData, replyToken);
    if (rentalPostbackHandled) {
      logLinebotActivity(userData.sheetID, lineUserId, userData.userName, 'postback', postbackData, 'rental_postback_handled', 'rental_creation', null, Date.now() - startTime);
      logMasterDoPost(lineUserId, postbackData, null, userData, 'rental_postback_handled', 'success', null, Date.now() - startTime, null);
      return;
    }

    // Postback อื่นๆ (ถ้ามี)
    replyTextMessage(replyToken, 'รับทราบแล้ว');
    logLinebotActivity(userData.sheetID, lineUserId, userData.userName, 'postback', postbackData, 'postback_acknowledged', 'other', null, Date.now() - startTime);

  } catch (error) {
    Logger.log('handlePostbackEvent Error: ' + error.toString());
    const userData = getLineBotUser(lineUserId);
    replyTextMessage(replyToken, '❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    logLinebotActivity(null, lineUserId, '', 'postback', postbackData, 'error', 'handle_postback_error', error.toString(), Date.now() - startTime);
    logMasterDoPost(lineUserId, postbackData, null, userData, 'handlePostback_error', 'error', error.toString(), Date.now() - startTime, null);
  }
}














// =============================================================================
// 🤖 LINE Bot - Master Sheet Operations
// =============================================================================

/**
 * ดึงข้อมูลผู้ใช้ LINE Bot จาก Master Sheet
 * @param {string} lineUserId - LINE User ID
 * @returns {Object|null} ข้อมูลผู้ใช้ หรือ null ถ้าไม่พบ
 */
function getLineBotUser(lineUserId) {
  try {
    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const sheet = ss.getSheetByName(LINEBOT_USERS_SHEET);

    if (!sheet) {
      Logger.log('ไม่พบชีต LineBotUsers');
      return null;
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return null; // มีแค่ header

    const headers = data[0];
    const lineUserIdIndex = headers.indexOf('LineUserID');
    const sheetIdIndex = headers.indexOf('SheetID');
    const storeNameIndex = headers.indexOf('StoreName');
    const statusIndex = headers.indexOf('Status');
    const userNameIndex = headers.indexOf('UserName');

    // ค้นหาผู้ใช้
    for (let i = 1; i < data.length; i++) {
      if (data[i][lineUserIdIndex] === lineUserId && data[i][statusIndex] === 'active') {
        return {
          lineUserId: data[i][lineUserIdIndex],
          sheetID: data[i][sheetIdIndex],
          storeName: data[i][storeNameIndex],
          status: data[i][statusIndex],
          userName: data[i][userNameIndex],
          rowIndex: i + 1
        };
      }
    }

    return null;
  } catch (error) {
    Logger.log('getLineBotUser Error: ' + error.toString());
    return null;
  }
}

/**
 * ตรวจสอบ Secret ID และดึง SheetID + StoreName
 * @param {string} secretID - Secret ID ที่ผู้ใช้กรอก
 * @returns {Object|null} {sheetID, storeName} หรือ null ถ้าไม่ถูกต้อง
 */
function verifySecretID(secretID) {
  try {
    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const sheet = ss.getSheetByName(TENANT_SHEET_NAME);

    if (!sheet) return null;

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return null;

    const headers = data[0];

    // ตรวจสอบชื่อคอลัมน์ (licenseV_3 ใช้: sheetID, ชื่อร้าน, status, LineBotSecretID)
    let sheetIdIndex = headers.indexOf('sheetID');
    if (sheetIdIndex === -1) sheetIdIndex = headers.indexOf('SheetID');

    // คอลัมน์ชื่อร้านเป็นภาษาไทย "ชื่อร้าน"
    let storeNameIndex = headers.indexOf('ชื่อร้าน');
    if (storeNameIndex === -1) storeNameIndex = headers.indexOf('storeName');
    if (storeNameIndex === -1) storeNameIndex = headers.indexOf('StoreName');

    let statusIndex = headers.indexOf('status');
    if (statusIndex === -1) statusIndex = headers.indexOf('Status');

    const secretIdIndex = headers.indexOf('LineBotSecretID');

    // ตรวจสอบว่าพบคอลัมน์ที่จำเป็นทั้งหมด
    if (secretIdIndex === -1) {
      Logger.log('ไม่พบคอลัมน์ LineBotSecretID ใน licenseV_3');
      return null;
    }
    if (sheetIdIndex === -1) {
      Logger.log('ไม่พบคอลัมน์ sheetID หรือ SheetID ใน licenseV_3');
      return null;
    }
    if (storeNameIndex === -1) {
      Logger.log('ไม่พบคอลัมน์ ชื่อร้าน, storeName หรือ StoreName ใน licenseV_3');
      Logger.log('คอลัมน์ที่มีในชีต: ' + JSON.stringify(headers));
      return null;
    }
    if (statusIndex === -1) {
      Logger.log('ไม่พบคอลัมน์ status หรือ Status ใน licenseV_3');
      return null;
    }

    // ค้นหา Secret ID
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][secretIdIndex]) === String(secretID) &&
        String(data[i][statusIndex]).toLowerCase() === 'active') {
        return {
          sheetID: data[i][sheetIdIndex],
          storeName: data[i][storeNameIndex],
          secretID: data[i][secretIdIndex]
        };
      }
    }

    return null;
  } catch (error) {
    Logger.log('verifySecretID Error: ' + error.toString());
    return null;
  }
}

/**
 * บันทึกผู้ใช้ใหม่ลงใน Master Sheet > LineBotUsers
 */
function registerLineBotUser(lineUserId, sheetID, storeName, secretID, userName) {
  try {
    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    let sheet = ss.getSheetByName(LINEBOT_USERS_SHEET);

    // ถ้ายังไม่มีชีต ให้สร้างใหม่
    if (!sheet) {
      sheet = ss.insertSheet(LINEBOT_USERS_SHEET);
      sheet.appendRow([
        'LineUserID', 'SheetID', 'StoreName', 'SecretID', 'Status', 'UserName', 'RegisteredDate', 'LastActive'
      ]);
    }

    const now = new Date();
    sheet.appendRow([
      lineUserId,
      sheetID,
      storeName,
      secretID,
      'active',
      userName,
      now,
      now
    ]);

    return { success: true };
  } catch (error) {
    Logger.log('registerLineBotUser Error: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * อัพเดท LastActive
 */
function updateLastActive(lineUserId) {
  try {
    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const sheet = ss.getSheetByName(LINEBOT_USERS_SHEET);

    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const lineUserIdIndex = headers.indexOf('LineUserID');
    const lastActiveIndex = headers.indexOf('LastActive');

    for (let i = 1; i < data.length; i++) {
      if (data[i][lineUserIdIndex] === lineUserId) {
        sheet.getRange(i + 1, lastActiveIndex + 1).setValue(new Date());
        break;
      }
    }
  } catch (error) {
    Logger.log('updateLastActive Error: ' + error.toString());
  }
}

/**
 * ลบผู้ใช้ออกจากระบบ (ลบแถวจริงๆ)
 * @param {string} lineUserId - LINE User ID ที่ต้องการลบ
 */
function deleteLineBotUser(lineUserId) {
  try {
    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const sheet = ss.getSheetByName(LINEBOT_USERS_SHEET);

    if (!sheet) return { success: false, message: 'ไม่พบชีต LineBotUsers' };

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const lineUserIdIndex = headers.indexOf('LineUserID');

    for (let i = 1; i < data.length; i++) {
      if (data[i][lineUserIdIndex] === lineUserId) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }

    return { success: false, message: 'ไม่พบผู้ใช้' };
  } catch (error) {
    Logger.log('deleteLineBotUser Error: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}



function getLineBotUsers(sheetID) {
  try {
    Logger.log('🔵 [getLineBotUsers] เริ่มดึงข้อมูลผู้ใช้ LINE Bot...');
    Logger.log('🔵 [getLineBotUsers] SheetID ที่ร้องขอ: ' + sheetID);

    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const sheet = ss.getSheetByName(LINEBOT_USERS_SHEET);

    if (!sheet) {
      Logger.log('❌ [getLineBotUsers] ไม่พบชีต LineBotUsers');
      return [];
    }

    const data = sheet.getDataRange().getValues();
    Logger.log('🔵 [getLineBotUsers] จำนวนแถวทั้งหมด (รวม header): ' + data.length);

    if (data.length <= 1) {
      Logger.log('⚠️ [getLineBotUsers] ไม่มีข้อมูลผู้ใช้ในชีต');
      return [];
    }

    const headers = data[0];
    Logger.log('🔵 [getLineBotUsers] Headers: ' + JSON.stringify(headers));

    const users = [];

    for (let i = 1; i < data.length; i++) {
      const user = {};
      headers.forEach((header, index) => {
        user[header] = data[i][index];
      });

      // ----- ⬇️ จุดที่แก้ไข (วิธีที่ 2) ⬇️ -----
      // แปลง Date Objects ให้เป็น ISO String
      // เพราะ google.script.run ส่ง Date Object ไม่ได้
      if (user.RegisteredDate) {
        if (typeof user.RegisteredDate.toISOString === 'function') {
          user.RegisteredDate = user.RegisteredDate.toISOString();
        } else if (typeof user.RegisteredDate === 'string' && user.RegisteredDate.includes('/')) {
          const regParts = user.RegisteredDate.split(/[/,s:]+/);
          if (regParts.length >= 3) {
            const regDay = parseInt(regParts[0], 10);
            const regMonth = parseInt(regParts[1], 10) - 1;
            const regYear = parseInt(regParts[2], 10);
            const regHour = regParts[3] ? parseInt(regParts[3], 10) : 0;
            const regMin = regParts[4] ? parseInt(regParts[4], 10) : 0;
            const regSec = regParts[5] ? parseInt(regParts[5], 10) : 0;
            const regDate = new Date(regYear, regMonth, regDay, regHour, regMin, regSec);
            if (!isNaN(regDate.getTime())) {
              user.RegisteredDate = regDate.toISOString();
            }
          }
        }
      }
      if (user.LastActive) {
        if (typeof user.LastActive.toISOString === 'function') {
          user.LastActive = user.LastActive.toISOString();
        } else if (typeof user.LastActive === 'string' && user.LastActive.includes('/')) {
          const lastParts = user.LastActive.split(/[/,s:]+/);
          if (lastParts.length >= 3) {
            const lastDay = parseInt(lastParts[0], 10);
            const lastMonth = parseInt(lastParts[1], 10) - 1;
            const lastYear = parseInt(lastParts[2], 10);
            const lastHour = lastParts[3] ? parseInt(lastParts[3], 10) : 0;
            const lastMin = lastParts[4] ? parseInt(lastParts[4], 10) : 0;
            const lastSec = lastParts[5] ? parseInt(lastParts[5], 10) : 0;
            const lastDate = new Date(lastYear, lastMonth, lastDay, lastHour, lastMin, lastSec);
            if (!isNaN(lastDate.getTime())) {
              user.LastActive = lastDate.toISOString();
            }
          }
        }
      }
      // ----- ⬆️ สิ้นสุดจุดที่แก้ไข ⬆️ -----


      Logger.log('🔵 [getLineBotUsers] แถวที่ ' + i + ' - User object (after conversion): ' + JSON.stringify(user));
      Logger.log('🔵 [getLineBotUsers] แถวที่ ' + i + ' - UserName: "' + user.UserName + '"');
      Logger.log('🔵 [getLineBotUsers] แถวที่ ' + i + ' - SheetID: "' + user.SheetID + '"');

      // ถ้าระบุ sheetID ให้กรองเฉพาะร้านนั้น
      if (!sheetID || String(user.SheetID).trim() === String(sheetID).trim()) {
        Logger.log('✅ [getLineBotUsers] เพิ่ม user แถวที่ ' + i + ' เข้า result');
        users.push(user);
      } else {
        Logger.log('⏭️ [getLineBotUsers] ข้าม user แถวที่ ' + i + ' (SheetID ไม่ตรง)');
      }
    }

    Logger.log('✅ [getLineBotUsers] ส่งคืนจำนวนผู้ใช้: ' + users.length + ' คน');
    Logger.log('✅ [getLineBotUsers] Result (to be sent): ' + JSON.stringify(users));

    return users; // <--- ตอนนี้ users Array ไม่มี Date Object แล้ว ส่งได้เลย
  } catch (error) {
    Logger.log('❌ [getLineBotUsers] Error: ' + error.toString());
    return [];
  }
}


/**
 * บันทึก Secret ID ไปที่ Master Sheet (licenseV_3)
 * @param {string} sheetID - Sheet ID ของร้าน
 * @param {string} secretID - Secret ID ที่ต้องการบันทึก (6 หลัก)
 * @returns {Object} {success: boolean, message: string}
 */
function updateLineBotSecretID(sheetID, secretID) {
  try {
    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const sheet = ss.getSheetByName(TENANT_SHEET_NAME);

    if (!sheet) {
      return { success: false, message: 'ไม่พบชีต licenseV_3 ใน Master Sheet' };
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: false, message: 'ไม่พบข้อมูลร้านใน Master Sheet' };
    }

    const headers = data[0];

    // รองรับทั้งตัวเล็กและตัวใหญ่
    let sheetIdIndex = headers.indexOf('sheetID');
    if (sheetIdIndex === -1) sheetIdIndex = headers.indexOf('SheetID');

    let secretIdIndex = headers.indexOf('LineBotSecretID');

    // ถ้ายังไม่มีคอลัมน์ LineBotSecretID ให้เพิ่ม
    if (secretIdIndex === -1) {
      secretIdIndex = headers.length;
      sheet.getRange(1, secretIdIndex + 1).setValue('LineBotSecretID');
    }

    if (sheetIdIndex === -1) {
      return { success: false, message: 'ไม่พบคอลัมน์ sheetID หรือ SheetID ใน licenseV_3' };
    }

    // ค้นหาแถวของร้านที่ต้องการอัปเดต
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][sheetIdIndex]) === String(sheetID)) {
        // อัปเดต Secret ID โดยเพิ่ม apostrophe (') ข้างหน้าเพื่อบังคับให้เป็น text format
        sheet.getRange(i + 1, secretIdIndex + 1).setValue("'" + secretID);
        return { success: true, message: 'บันทึก Secret ID สำเร็จ' };
      }
    }

    return { success: false, message: 'ไม่พบร้านนี้ใน Master Sheet' };

  } catch (error) {
    Logger.log('updateLineBotSecretID Error: ' + error.toString());
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + error.toString() };
  }
}

/**
 * ดึง Secret ID จาก Master Sheet (licenseV_3)
 * @param {string} sheetID - Sheet ID ของร้าน
 * @returns {Object} {success: boolean, secretID: string}
 */
function getLineBotSecretID(sheetID) {
  try {
    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const sheet = ss.getSheetByName(TENANT_SHEET_NAME);

    if (!sheet) {
      return { success: false, secretID: '' };
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: false, secretID: '' };
    }

    const headers = data[0];

    // รองรับทั้งตัวเล็กและตัวใหญ่
    let sheetIdIndex = headers.indexOf('sheetID');
    if (sheetIdIndex === -1) sheetIdIndex = headers.indexOf('SheetID');

    const secretIdIndex = headers.indexOf('LineBotSecretID');

    if (sheetIdIndex === -1 || secretIdIndex === -1) {
      return { success: false, secretID: '' };
    }

    // ค้นหาแถวของร้าน
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][sheetIdIndex]) === String(sheetID)) {
        let secretID = data[i][secretIdIndex] || '';
        secretID = String(secretID).trim();

        // ลบ apostrophe ถ้ามี (เกิดจากการบันทึกเป็น text format)
        if (secretID.startsWith("'")) {
          secretID = secretID.substring(1);
        }

        // ถ้าเป็นตัวเลขและมีความยาวน้อยกว่า 6 หลัก ให้ pad ด้วย 0 ข้างหน้า
        if (/^\d+$/.test(secretID) && secretID.length < 6) {
          secretID = secretID.padStart(6, '0');
        }

        return { success: true, secretID: secretID };
      }
    }

    return { success: false, secretID: '' };

  } catch (error) {
    Logger.log('getLineBotSecretID Error: ' + error.toString());
    return { success: false, secretID: '' };
  }
}

// =============================================================================
// 🤖 LINE Bot - Rate Limiting Functions
// =============================================================================

/**
 * ตรวจสอบว่าผู้ใช้ถูก Block หรือไม่
 */
function isUserBlocked(lineUserId) {
  const cache = CacheService.getScriptCache();
  const blockKey = `linebot_block_${lineUserId}`;
  const blocked = cache.get(blockKey);
  return blocked !== null;
}

/**
 * คำนวณเวลาที่เหลือของการ Block (นาที)
 */
function getBlockRemainingTime(lineUserId) {
  const cache = CacheService.getScriptCache();
  const blockKey = `linebot_block_${lineUserId}`;
  const blockData = cache.get(blockKey);

  if (!blockData) return 0;

  const blockInfo = JSON.parse(blockData);
  const remainingSeconds = Math.ceil((blockInfo.unblockTime - Date.now()) / 1000);
  return Math.ceil(remainingSeconds / 60);
}

/**
 * บันทึกความพยายามกรอก Secret ID ผิด
 */
function recordSecretAttempt(lineUserId) {
  const cache = CacheService.getScriptCache();
  const attemptKey = `linebot_attempt_${lineUserId}`;

  let attempts = cache.get(attemptKey);
  attempts = attempts ? parseInt(attempts) + 1 : 1;

  // เก็บไว้ 15 นาที
  cache.put(attemptKey, String(attempts), 900);

  // ถ้าเกิน MAX_SECRET_ATTEMPTS ให้ Block
  if (attempts >= MAX_SECRET_ATTEMPTS) {
    blockUser(lineUserId);
    return { blocked: true, attempts };
  }

  return { blocked: false, attempts };
}

/**
 * Block ผู้ใช้ชั่วคราว
 */
function blockUser(lineUserId) {
  const cache = CacheService.getScriptCache();
  const blockKey = `linebot_block_${lineUserId}`;
  const attemptKey = `linebot_attempt_${lineUserId}`;

  const blockUntil = Date.now() + (BLOCK_DURATION_MINUTES * 60 * 1000);

  cache.put(blockKey, JSON.stringify({ unblockTime: blockUntil }), BLOCK_DURATION_MINUTES * 60);
  cache.remove(attemptKey); // ล้าง attempts
}

/**
 * ล้างการ Block (สำหรับ Testing หรือ Manual Unblock)
 */
function unblockUser(lineUserId) {
  const cache = CacheService.getScriptCache();
  cache.remove(`linebot_block_${lineUserId}`);
  cache.remove(`linebot_attempt_${lineUserId}`);
}

// =============================================================================
// 🤖 LINE Bot - State Management
// =============================================================================

/**
 * บันทึกสถานะผู้ใช้
 */
function setUserState(lineUserId, state, data = {}) {
  const cache = CacheService.getScriptCache();
  const stateKey = `linebot_state_${lineUserId}`;

  const stateData = {
    state,
    data,
    timestamp: Date.now()
  };

  // เก็บไว้ 10 นาที
  cache.put(stateKey, JSON.stringify(stateData), 600);
}

/**
 * ดึงสถานะผู้ใช้
 */
function getUserState(lineUserId) {
  const cache = CacheService.getScriptCache();
  const stateKey = `linebot_state_${lineUserId}`;

  const stateData = cache.get(stateKey);
  if (!stateData) return null;

  return JSON.parse(stateData);
}

/**
 * ล้างสถานะผู้ใช้
 */
function clearUserState(lineUserId) {
  const cache = CacheService.getScriptCache();
  cache.remove(`linebot_state_${lineUserId}`);
}

// =============================================================================
// 🤖 LINE Bot - Message Handlers
// =============================================================================

/**
 * จัดการผู้ใช้ที่ยังไม่ได้ลงทะเบียน
 */
function handleUnregisteredUser(lineUserId, replyToken, userMessage, startTime, rawPayload) {
  const currentState = getUserState(lineUserId);

  // ถ้ายังไม่มี State = ครั้งแรกที่ทักมา
  if (!currentState) {
    // ตรวจสอบว่าข้อความเป็นรหัส 6 หลัก (ตัวเลข 6 ตัว) หรือไม่
    const is6DigitCode = /^\d{6}$/.test(userMessage);

    if (is6DigitCode) {
      // ถ้าเป็นรหัส 6 หลัก ให้ Set state และประมวลผลต่อ
      setUserState(lineUserId, STATE_WAIT_SECRET);
      logMasterDoPost(lineUserId, userMessage, { state: STATE_WAIT_SECRET }, null, 'first_time_6digit', 'set_state', null, Date.now() - startTime, null);
      // ไม่ return เพื่อให้ดำเนินการต่อ
    } else {
      // ถ้าไม่ใช่รหัส 6 หลัก ให้ส่ง Welcome Flex
      const sendSuccess = replyFlexMessage(replyToken, createWelcomeFlex());
      setUserState(lineUserId, STATE_WAIT_SECRET);
      logLinebotActivity(null, lineUserId, '', 'text', userMessage, 'welcome_sent', 'new_user', null, Date.now() - startTime);
      logMasterDoPost(lineUserId, userMessage, { state: STATE_WAIT_SECRET }, null, 'welcome_sent', `success:${sendSuccess}`, null, Date.now() - startTime, null);
      return;
    }
  }

  // รอกรอก Secret ID (รองรับทั้งกรณีที่มี state และไม่มี state แต่เป็นรหัส 6 หลัก)
  if (!currentState || currentState.state === STATE_WAIT_SECRET) {
    const secretID = userMessage;

    // ตรวจสอบ Secret ID
    const shopData = verifySecretID(secretID);
    logMasterDoPost(lineUserId, userMessage, currentState, null, 'verify_secret', shopData ? 'valid' : 'invalid', null, Date.now() - startTime, null);

    if (!shopData) {
      // Secret ID ผิด
      const attemptResult = recordSecretAttempt(lineUserId);

      if (attemptResult.blocked) {
        const sendSuccess = replyFlexMessage(replyToken, createErrorFlex(
          'ถูกบลอกชั่วคราว',
          `คุณกรอกรหัสผิดเกิน ${MAX_SECRET_ATTEMPTS} ครั้ง\nกรุณารอ ${BLOCK_DURATION_MINUTES} นาที`
        ));
        clearUserState(lineUserId);
        logMasterDoPost(lineUserId, userMessage, null, null, 'blocked_too_many_attempts', `success:${sendSuccess}`, null, Date.now() - startTime, null);
      } else {
        const remainingAttempts = MAX_SECRET_ATTEMPTS - attemptResult.attempts;
        const sendSuccess = replyFlexMessage(replyToken, createErrorFlex(
          'รหัสไม่ถูกต้อง',
          `กรุณาลองใหม่อีกครั้ง\n(เหลือ ${remainingAttempts} ครั้ง)`
        ));
        logMasterDoPost(lineUserId, userMessage, currentState, null, 'invalid_secret_retry', `success:${sendSuccess},remaining:${remainingAttempts}`, null, Date.now() - startTime, null);
        // ไม่เปลี่ยน state เพื่อให้ผู้ใช้ลองใหม่ได้
      }

      logLinebotActivity(null, lineUserId, '', 'text', userMessage, 'invalid_secret', `attempt_${attemptResult.attempts}`, null, Date.now() - startTime);
      return;
    }

    // Secret ID ถูกต้อง - ส่ง Confirm Shop และเปลี่ยน state
    const sendSuccess = replyFlexMessage(replyToken, createConfirmShopFlex(shopData.storeName, secretID));

    logMasterDoPost(lineUserId, userMessage, currentState, null, 'send_confirm_shop', `success:${sendSuccess},storeName:${shopData.storeName}`, null, Date.now() - startTime, null);

    if (sendSuccess) {
      // ส่งสำเร็จ ค่อยเปลี่ยน state
      setUserState(lineUserId, STATE_WAIT_USERNAME, {
        sheetID: shopData.sheetID,
        storeName: shopData.storeName,
        secretID: secretID
      });
      logLinebotActivity(null, lineUserId, '', 'text', userMessage, 'secret_verified', 'confirm_shop_sent', null, Date.now() - startTime);
    } else {
      // ส่งไม่สำเร็จ - แจ้งผู้ใช้ให้ลองใหม่
      Logger.log('ส่ง Confirm Shop Flex ไม่สำเร็จ - ส่งข้อความธรรมดาแทน');

      // ส่งข้อความธรรมดาแจ้งผู้ใช้ว่ารหัสถูกต้อง แต่ระบบมีปัญหา
      replyTextMessage(replyToken, `✅ รหัสถูกต้อง!\n\nร้าน: ${shopData.storeName}\n\n⚠️ เกิดข้อผิดพลาดในการส่งข้อความ\nกรุณาพิมพ์รหัส ${secretID} อีกครั้ง`);

      // ไม่เปลี่ยน state เพื่อให้ผู้ใช้พิมพ์รหัสใหม่
      logLinebotActivity(null, lineUserId, '', 'text', userMessage, 'secret_verified', 'confirm_shop_failed_sent_text', 'replyFlexMessage failed, sent text instead', Date.now() - startTime);
      logMasterDoPost(lineUserId, userMessage, currentState, null, 'send_confirm_shop_failed', 'sent_text_instead', 'Flex message failed', Date.now() - startTime, null);
    }
    return;
  }

  // รอกรอกชื่อผู้ใช้
  if (currentState.state === STATE_WAIT_USERNAME) {
    const userName = userMessage;

    logMasterDoPost(lineUserId, userMessage, currentState, null, 'register_username', `storeName:${currentState.data.storeName}`, null, Date.now() - startTime, null);

    // บันทึกผู้ใช้ใหม่
    const result = registerLineBotUser(
      lineUserId,
      currentState.data.sheetID,
      currentState.data.storeName,
      currentState.data.secretID,
      userName
    );

    if (result.success) {
      const sendSuccess = replyFlexMessage(replyToken, createRegistrationSuccessFlex(currentState.data.storeName, userName));
      clearUserState(lineUserId);
      logLinebotActivity(currentState.data.sheetID, lineUserId, userName, 'text', userMessage, 'registration_success', 'user_registered', null, Date.now() - startTime);
      logMasterDoPost(lineUserId, userMessage, null, { sheetID: currentState.data.sheetID, storeName: currentState.data.storeName, userName: userName }, 'registration_complete', `success:${sendSuccess}`, null, Date.now() - startTime, null);
    } else {
      const sendSuccess = replyFlexMessage(replyToken, createSystemErrorFlex());
      logLinebotActivity(null, lineUserId, '', 'text', userMessage, 'registration_error', 'save_failed', result.error, Date.now() - startTime);
      logMasterDoPost(lineUserId, userMessage, currentState, null, 'registration_failed', `success:${sendSuccess}`, result.error, Date.now() - startTime, null);
    }

    return;
  }
}

/**
 * จัดการผู้ใช้ที่ลงทะเบียนแล้ว
 */
function handleRegisteredUser(userData, replyToken, userMessage, startTime) {
  const lineUserId = userData.lineUserId;
  const sheetID = userData.sheetID;
  const userName = userData.userName;

  // อัพเดท LastActive
  updateLastActive(lineUserId);

  const msgLower = userMessage.toLowerCase().trim();

  // คำสั่ง: เช็คคิว
  if (msgLower === 'เช็คคิว') {
    replyFlexMessage(replyToken, createQueueHelpFlex());
    logLinebotActivity(sheetID, lineUserId, userName, 'text', userMessage, 'queue_help_sent', 'show_help', null, Date.now() - startTime);
    return;
  }

  // คำสั่ง: ตารางส่งรถ
  if (msgLower === 'ตารางส่งรถ' || msgLower === 'ตารางรับส่งรถ') {
    replyFlexMessage(replyToken, createScheduleHelpFlex());
    logLinebotActivity(sheetID, lineUserId, userName, 'text', userMessage, 'schedule_help_sent', 'show_help', null, Date.now() - startTime);
    return;
  }

  // คำสั่ง Q (ค้นหารถว่าง)
  if (msgLower.startsWith('q')) {
    handleQueueQuery(userData, replyToken, userMessage, startTime);
    return;
  }

  // คำสั่ง S (ตารางรับส่งรถ)
  if (msgLower.startsWith('s')) {
    handleScheduleQuery(userData, replyToken, userMessage, startTime);
    return;
  }

  // ⭐ Rental Creation Flow - ตรวจสอบและจัดการ
  const rentalFlowHandled = handleRentalCreationFlow(lineUserId, userMessage, userData, replyToken);
  if (rentalFlowHandled) {
    logLinebotActivity(sheetID, lineUserId, userName, 'text', userMessage, 'rental_flow_handled', 'rental_creation', null, Date.now() - startTime);
    return;
  }

  // คำสั่งไม่รู้จัก
  replyFlexMessage(replyToken, createMainMenuFlex());
  logLinebotActivity(sheetID, lineUserId, userName, 'text', userMessage, 'main_menu_sent', 'unknown_command', null, Date.now() - startTime);
}




// =============================================================================
// 🤖 LINE Bot - Flex Message Templates
// =============================================================================

/**
 * สร้าง Flex Message: Welcome สำหรับผู้ใช้ใหม่
 */
function createWelcomeFlex() {
  return {
    type: 'flex',
    altText: 'ยินดีต้อนรับสู่ระบบจองรถเช่า',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🚗 ยินดีต้อนรับ',
            weight: 'bold',
            size: 'xl',
            color: '#1DB446'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'คุณยังไม่ได้ลงทะเบียนในระบบ',
            size: 'md',
            color: '#555555',
            wrap: true,
            weight: 'bold'
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'text',
            text: 'วิธีการลงทะเบียน:',
            size: 'sm',
            color: '#1DB446',
            weight: 'bold',
            margin: 'lg'
          },
          {
            type: 'text',
            text: '1. รับรหัส Secret ID (6 หลัก)ของร้านท่าน\n2. พิมพ์รหัสส่งมาในแชทนี้',
            size: 'sm',
            color: '#555555',
            wrap: true,
            margin: 'sm'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '💬 พิมพ์รหัสในช่องแชทด้านล่าง',
                size: 'sm',
                color: '#FF6B35',
                align: 'center',
                weight: 'bold'
              },
              {
                type: 'text',
                text: 'ตัวอย่าง: 123456',
                size: 'xs',
                color: '#999999',
                align: 'center',
                margin: 'xs'
              }
            ],
            margin: 'lg',
            paddingAll: '12px',
            backgroundColor: '#FFF4E6',
            cornerRadius: 'md',
            borderWidth: '2px',
            borderColor: '#FF6B35'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'separator'
          },
          {
            type: 'text',
            text: 'Powered by KPCRM V.3',
            size: 'xxs',
            color: '#999999',
            align: 'center',
            margin: 'md'
          }
        ]
      }
    }
  };
}

/**
 * สร้าง Flex Message: ยืนยันชื่อร้าน
 */
function createConfirmShopFlex(storeName, secretID) {
  return {
    type: 'flex',
    altText: 'ยืนยันการลงทะเบียน',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '✅ รหัสถูกต้อง',
            weight: 'bold',
            size: 'xl',
            color: '#00B900'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'คุณต้องการลงทะเบียนกับร้าน:',
            size: 'sm',
            color: '#888888',
            wrap: true
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: storeName,
                size: 'lg',
                weight: 'bold',
                color: '#1DB446',
                align: 'center'
              }
            ],
            margin: 'md',
            paddingAll: '12px',
            backgroundColor: '#E8F5E9',
            cornerRadius: 'md'
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'text',
            text: 'กรุณากรอกชื่อของคุณ:',
            size: 'sm',
            color: '#888888',
            wrap: true,
            margin: 'lg'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'ตัวอย่าง: คุณสมชาย',
                size: 'xs',
                color: '#AAAAAA',
                align: 'center'
              }
            ],
            margin: 'md',
            paddingAll: '8px',
            backgroundColor: '#F0F0F0',
            cornerRadius: 'md'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'separator'
          },
          {
            type: 'text',
            text: 'Powered by KPCRM V.3',
            size: 'xxs',
            color: '#999999',
            align: 'center',
            margin: 'md'
          }
        ]
      }
    }
  };
}

/**
 * สร้าง Flex Message: ลงทะเบียนสำเร็จ
 */
function createRegistrationSuccessFlex(storeName, userName) {
  return {
    type: 'flex',
    altText: 'ลงทะเบียนสำเร็จ',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🎉 ลงทะเบียนสำเร็จ',
            weight: 'bold',
            size: 'xl',
            color: '#00B900'
          }
        ],
        backgroundColor: '#E8F5E9'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `ยินดีต้อนรับ ${userName}!`,
            size: 'lg',
            weight: 'bold',
            color: '#1DB446',
            wrap: true
          },
          {
            type: 'text',
            text: `ร้าน: ${storeName}`,
            size: 'sm',
            color: '#888888',
            wrap: true,
            margin: 'sm'
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'text',
            text: 'คุณสามารถใช้คำสั่งต่อไปนี้:',
            size: 'sm',
            color: '#555555',
            wrap: true,
            margin: 'lg',
            weight: 'bold'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '• พิมพ์ "เช็คคิว" เพื่อดูวิธีค้นหารถว่าง',
                size: 'xs',
                color: '#666666',
                wrap: true
              },
              {
                type: 'text',
                text: '• พิมพ์ "ตารางส่งรถ" เพื่อดูวิธีเช็คตาราง',
                size: 'xs',
                color: '#666666',
                wrap: true,
                margin: 'sm'
              }
            ],
            margin: 'md'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'separator'
          },
          {
            type: 'button',
            action: {
              type: 'message',
              label: 'เช็คคิวรถว่าง',
              text: 'เช็คคิว'
            },
            style: 'primary',
            color: '#00B900',
            margin: 'md'
          },
          {
            type: 'text',
            text: 'Powered by KPCRM V.3',
            size: 'xxs',
            color: '#999999',
            align: 'center',
            margin: 'md'
          }
        ]
      }
    }
  };
}

/**
 * สร้าง Flex Message: Main Menu
 */
function createMainMenuFlex() {
  return {
    type: 'flex',
    altText: 'เมนูหลัก',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📋 เมนูหลัก',
            weight: 'bold',
            size: 'xl',
            color: '#1DB446'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'เลือกคำสั่งที่ต้องการ:',
            size: 'sm',
            color: '#888888',
            wrap: true
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            action: {
              type: 'message',
              label: '🚗 เช็คคิวรถว่าง',
              text: 'เช็คคิว'
            },
            style: 'primary',
            color: '#00B900'
          },
          {
            type: 'button',
            action: {
              type: 'message',
              label: '📅 ตารางรับส่งรถ',
              text: 'ตารางส่งรถ'
            },
            style: 'primary',
            color: '#0084FF'
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'text',
            text: 'Powered by KPCRM V.3',
            size: 'xxs',
            color: '#999999',
            align: 'center',
            margin: 'md'
          }
        ]
      }
    }
  };
}

/**
 * สร้าง Flex Message: Queue Help
 */
function createQueueHelpFlex() {
  return {
    type: 'flex',
    altText: 'วิธีเช็คคิวรถว่าง',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🚗 เช็คคิวรถว่าง',
            weight: 'bold',
            size: 'xl',
            color: '#1DB446'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'วิธีใช้งาน:',
            size: 'md',
            color: '#555555',
            weight: 'bold'
          },
          {
            type: 'text',
            text: 'พิมพ์ Q ตามด้วย วัน หรือ วันที่/เดือน',
            size: 'sm',
            color: '#888888',
            wrap: true,
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'ตัวอย่าง:',
                size: 'xs',
                color: '#666666',
                weight: 'bold'
              },
              {
                type: 'text',
                text: 'Q15',
                size: 'sm',
                color: '#1DB446',
                margin: 'sm',
                weight: 'bold'
              },
              {
                type: 'text',
                text: '(วันที่ 15 เดือนปัจจุบัน)',
                size: 'xs',
                color: '#AAAAAA',
                margin: 'xs'
              },
              {
                type: 'text',
                text: 'Q27/10',
                size: 'sm',
                color: '#1DB446',
                margin: 'md',
                weight: 'bold'
              },
              {
                type: 'text',
                text: '(รับ-คืนวันเดียวกัน 27 ต.ค.)',
                size: 'xs',
                color: '#AAAAAA',
                margin: 'xs'
              },
              {
                type: 'text',
                text: 'Q27/10-1/11',
                size: 'sm',
                color: '#1DB446',
                margin: 'md',
                weight: 'bold'
              },
              {
                type: 'text',
                text: '(ค้นหารถว่าง 27 ต.ค. - 1 พ.ย.)',
                size: 'xs',
                color: '#AAAAAA',
                margin: 'xs'
              }
            ],
            margin: 'md',
            paddingAll: '12px',
            backgroundColor: '#F0F0F0',
            cornerRadius: 'md'
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'text',
            text: 'หมายเหตุ:',
            size: 'xs',
            color: '#666666',
            weight: 'bold',
            margin: 'lg'
          },
          {
            type: 'text',
            text: '• Q15 = วันที่ 15 เดือนนี้\n• Q27/10 = วันที่ 27 ต.ค.\n• Q27/10-1/11 = ช่วงวันที่\n• ข้ามปีได้ เช่น 25/12-5/1',
            size: 'xxs',
            color: '#888888',
            wrap: true,
            margin: 'sm'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'separator'
          },
          {
            type: 'text',
            text: 'Powered by KPCRM V.3',
            size: 'xxs',
            color: '#999999',
            align: 'center',
            margin: 'md'
          }
        ]
      }
    }
  };
}

/**
 * สร้าง Flex Message: Schedule Help
 */
function createScheduleHelpFlex() {
  return {
    type: 'flex',
    altText: 'วิธีเช็คตารางรับส่งรถ',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📅 ตารางรับส่งรถ',
            weight: 'bold',
            size: 'xl',
            color: '#0084FF'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'วิธีใช้งาน:',
            size: 'md',
            color: '#555555',
            weight: 'bold'
          },
          {
            type: 'text',
            text: 'พิมพ์ S ตามด้วย วัน หรือ วันที่/เดือน',
            size: 'sm',
            color: '#888888',
            wrap: true,
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'ตัวอย่าง:',
                size: 'xs',
                color: '#666666',
                weight: 'bold'
              },
              {
                type: 'text',
                text: 'S15',
                size: 'sm',
                color: '#0084FF',
                margin: 'sm',
                weight: 'bold'
              },
              {
                type: 'text',
                text: '(วันที่ 15 เดือนปัจจุบัน)',
                size: 'xs',
                color: '#AAAAAA',
                margin: 'xs'
              },
              {
                type: 'text',
                text: 'S27/10',
                size: 'sm',
                color: '#0084FF',
                margin: 'md',
                weight: 'bold'
              },
              {
                type: 'text',
                text: '(ดูตารางรับส่งรถ 27 ต.ค.)',
                size: 'xs',
                color: '#AAAAAA',
                margin: 'xs'
              }
            ],
            margin: 'md',
            paddingAll: '12px',
            backgroundColor: '#F0F0F0',
            cornerRadius: 'md'
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'text',
            text: 'หมายเหตุ:',
            size: 'xs',
            color: '#666666',
            weight: 'bold',
            margin: 'lg'
          },
          {
            type: 'text',
            text: '• S15 = วันที่ 15 เดือนนี้\n• S27/10 = วันที่ 27 ต.ค.\n• แสดงตารางรับและคืนรถในวันที่เลือก',
            size: 'xxs',
            color: '#888888',
            wrap: true,
            margin: 'sm'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'separator'
          },
          {
            type: 'text',
            text: 'Powered by KPCRM V.3',
            size: 'xxs',
            color: '#999999',
            align: 'center',
            margin: 'md'
          }
        ]
      }
    }
  };
}

/**
 * สร้าง Flex Message: Error
 */
function createErrorFlex(title, message) {
  return {
    type: 'flex',
    altText: title,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '⚠️ ' + title,
            weight: 'bold',
            size: 'xl',
            color: '#FF3B30'
          }
        ],
        backgroundColor: '#FFEBEE'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: message,
            size: 'sm',
            color: '#666666',
            wrap: true
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'separator'
          },
          {
            type: 'text',
            text: 'Powered by KPCRM V.3',
            size: 'xxs',
            color: '#999999',
            align: 'center',
            margin: 'md'
          }
        ]
      }
    }
  };
}

/**
 * สร้าง Flex Message: System Error
 */
function createSystemErrorFlex() {
  return createErrorFlex(
    'เกิดข้อผิดพลาด',
    'ระบบเกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้งหรือติดต่อเจ้าหน้าที่'
  );
}

// =============================================================================
// 🤖 LINE Bot - LINE API Helper Functions
// =============================================================================

/**
 * ส่ง Flex Message กลับไปหาผู้ใช้
 */
function replyFlexMessage(replyToken, flexMessage) {
  const url = LINE_MESSAGING_API_URL;

  const payload = {
    replyToken: replyToken,
    messages: [flexMessage]
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

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      Logger.log('LINE API Error: ' + response.getContentText());
    }

    return responseCode === 200;
  } catch (error) {
    Logger.log('replyFlexMessage Error: ' + error.toString());
    return false;
  }
}

/**
 * ส่งข้อความแบบ Text ธรรมดา (สำหรับ Debug)
 */
function replyTextMessage(replyToken, text) {
  const url = LINE_MESSAGING_API_URL;

  const payload = {
    replyToken: replyToken,
    messages: [{
      type: 'text',
      text: text
    }]
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

  try {
    const response = UrlFetchApp.fetch(url, options);
    return response.getResponseCode() === 200;
  } catch (error) {
    Logger.log('replyTextMessage Error: ' + error.toString());
    return false;
  }
}



// =============================================================================
// 🤖 LINE Bot - Logging Functions
// =============================================================================

/**
 * บันทึก Log กิจกรรมของ LINE Bot ลงในชีต Linelog ของแต่ละร้าน
 */
function logLinebotActivity(sheetID, lineUserId, userName, messageType, input, output, action, error, processTime) {
  try {
    // ถ้าไม่มี sheetID (ผู้ใช้ยังไม่ได้ลงทะเบียน) ให้ log ไว้ที่ Master Sheet
    const targetSheetID = sheetID || MASTER_SHEET_ID;
    const ss = SpreadsheetApp.openById(targetSheetID);
    let logSheet = ss.getSheetByName(LINELOG_SHEET);

    // ถ้ายังไม่มีชีต Linelog ให้สร้างใหม่
    if (!logSheet) {
      logSheet = ss.insertSheet(LINELOG_SHEET);
      logSheet.appendRow([
        'Timestamp',
        'LineUserID',
        'UserName',
        'MessageType',
        'Input',
        'Output',
        'Action',
        'Error',
        'ProcessTime(ms)',
        'SheetID'
      ]);

      // จัดรูปแบบ Header
      const headerRange = logSheet.getRange(1, 1, 1, 10);
      headerRange.setBackground('#1DB446');
      headerRange.setFontColor('#FFFFFF');
      headerRange.setFontWeight('bold');
    }

    // เตรียมข้อมูล
    const timestamp = new Date();
    const outputText = typeof output === 'object' ? JSON.stringify(output) : String(output || '');

    // Truncate ถ้ายาวเกินไป (เพื่อประสิทธิภาพ)
    const maxLength = 5000;
    const inputTruncated = String(input || '').substring(0, maxLength);
    const outputTruncated = outputText.substring(0, maxLength);

    // บันทึก Log
    logSheet.appendRow([
      timestamp,
      lineUserId || '',
      userName || '',
      messageType || '',
      inputTruncated,
      outputTruncated,
      action || '',
      error || '',
      processTime || 0,
      sheetID || ''
    ]);

  } catch (logError) {
    Logger.log('logLinebotActivity Error: ' + logError.toString());
    // ไม่ throw error เพื่อไม่ให้ล่ม Webhook
  }
}

/**
 * บันทึก Error แบบย่อ (สำหรับกรณี Critical)
 */
function logLinebotError(action, error) {
  try {
    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    let logSheet = ss.getSheetByName(LINELOG_SHEET);

    if (!logSheet) {
      logSheet = ss.insertSheet(LINELOG_SHEET);
      logSheet.appendRow([
        'Timestamp',
        'LineUserID',
        'UserName',
        'MessageType',
        'Input',
        'Output',
        'Action',
        'Error',
        'ProcessTime(ms)',
        'SheetID'
      ]);
    }

    logSheet.appendRow([
      new Date(),
      'SYSTEM',
      'SYSTEM',
      'error',
      '',
      '',
      action,
      String(error).substring(0, 1000),
      0,
      ''
    ]);

  } catch (logError) {
    Logger.log('logLinebotError Error: ' + logError.toString());
  }
}

/**
 * บันทึก Log ทุก doPost Request ลงใน Master Sheet > MasterLinelog
 * เพื่อใช้ debug และตรวจสอบปัญหา
 */
function logMasterDoPost(lineUserId, userMessage, currentState, userData, action, result, error, processTime, rawPayload) {
  try {
    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    let logSheet = ss.getSheetByName(MASTER_LINELOG_SHEET);

    // ถ้ายังไม่มีชีต MasterLinelog ให้สร้างใหม่
    if (!logSheet) {
      logSheet = ss.insertSheet(MASTER_LINELOG_SHEET);
      logSheet.appendRow([
        'Timestamp',
        'LineUserID',
        'UserMessage',
        'CurrentState',
        'IsRegistered',
        'SheetID',
        'StoreName',
        'UserName',
        'Action',
        'Result',
        'Error',
        'ProcessTime(ms)',
        'RawPayload'
      ]);

      // จัดรูปแบบ Header
      const headerRange = logSheet.getRange(1, 1, 1, 13);
      headerRange.setBackground('#FF6B6B');
      headerRange.setFontColor('#FFFFFF');
      headerRange.setFontWeight('bold');
    }

    // เตรียมข้อมูล
    const timestamp = new Date();
    const stateStr = currentState ? JSON.stringify(currentState) : '';
    const isRegistered = userData ? 'Yes' : 'No';
    const sheetID = userData ? userData.sheetID : '';
    const storeName = userData ? userData.storeName : (currentState && currentState.data ? currentState.data.storeName : '');
    const userName = userData ? userData.userName : '';
    const resultStr = typeof result === 'object' ? JSON.stringify(result) : String(result || '');

    // Truncate ถ้ายาวเกินไป
    const maxLength = 3000;
    const userMessageTruncated = String(userMessage || '').substring(0, maxLength);
    const stateTruncated = stateStr.substring(0, maxLength);
    const resultTruncated = resultStr.substring(0, maxLength);
    const errorTruncated = String(error || '').substring(0, maxLength);
    const rawPayloadTruncated = String(rawPayload || '').substring(0, maxLength);

    // บันทึก Log
    logSheet.appendRow([
      timestamp,
      lineUserId || '',
      userMessageTruncated,
      stateTruncated,
      isRegistered,
      sheetID,
      storeName,
      userName,
      action || '',
      resultTruncated,
      errorTruncated,
      processTime || 0,
      rawPayloadTruncated
    ]);

  } catch (logError) {
    Logger.log('logMasterDoPost Error: ' + logError.toString());
    // ไม่ throw error เพื่อไม่ให้ล่ม Webhook
  }
}

// =============================================================================
// 🤖 LINE Bot - Date Parser & Validator
// =============================================================================

/**
 * แปลง วันที่/เดือน จากข้อความ เช่น "27/10" เป็น Date object
 * @param {string} dateStr - วันที่/เดือน เช่น "27/10" หรือ "7/10"
 * @returns {Date|null} Date object หรือ null ถ้าผิดรูปแบบ
 */
function parseDateFromString(dateStr) {
  const regex = /^(\d{1,2})\/(\d{1,2})$/;
  const match = dateStr.trim().match(regex);

  if (!match) return null;

  const day = parseInt(match[1]);
  const month = parseInt(match[2]);
  const currentYear = new Date().getFullYear();

  // Validate
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  return new Date(currentYear, month - 1, day);
}

/**
 * ตรวจสอบช่วงวันที่ให้ถูกต้อง
 * @param {Date} startDate - วันที่เริ่มต้น
 * @param {Date} endDate - วันที่สิ้นสุด
 * @returns {Object} { valid, start, end, error }
 */
function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    return { valid: false, error: 'รูปแบบวันที่ไม่ถูกต้อง' };
  }

  const startMonth = startDate.getMonth();
  const endMonth = endDate.getMonth();
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();

  // กรณีข้ามปี (เดือน 12 → เดือน 1)
  if (startMonth === 11 && endMonth === 0) {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  // เดือนเดียวกัน: วันสิ้นสุด >= วันเริ่มต้น
  if (startMonth === endMonth && endDay < startDay) {
    return { valid: false, error: 'วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น' };
  }

  // เช็คว่าไม่เกินอนาคตมากเกินไป (เช่น 1 ปี)
  const diffTime = endDate - startDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 365) {
    return { valid: false, error: 'ช่วงวันที่ห่างกันมากเกินไป (ไม่เกิน 1 ปี)' };
  }

  if (diffDays < 0) {
    return { valid: false, error: 'วันที่สิ้นสุดต้องมาหลังวันที่เริ่มต้น' };
  }

  return { valid: true, start: startDate, end: endDate };
}

/**
 * แยกคำสั่ง Q เช่น "Q27/10-1/11", "Q27/10" (วันเดียว), "Q27", หรือ "Q1-5" => { start: Date, end: Date }
 */
function parseQueueCommand(command) {
  const trimmedCommand = command.trim();
  const now = new Date(); // ดึงวันที่ปัจจุบัน
  const currentMonth = now.getMonth(); // เดือนปัจจุบัน (0-11)
  const currentYear = now.getFullYear(); // ปีปัจจุบัน

  // รูปแบบที่ 1: Q27/10-1/11 (ช่วงวันที่ระบุเดือน)
  const rangeWithMonthRegex = /^[Qq](\d{1,2}\/\d{1,2})-(\d{1,2}\/\d{1,2})$/;
  const rangeWithMonthMatch = trimmedCommand.match(rangeWithMonthRegex);

  if (rangeWithMonthMatch) {
    const startDate = parseDateFromString(rangeWithMonthMatch[1]);
    const endDate = parseDateFromString(rangeWithMonthMatch[2]);
    return validateDateRange(startDate, endDate);
  }

  // === เพิ่มรูปแบบใหม่: Q1-5 หรือ Q01-05 (ช่วงวัน เดือนปัจจุบัน) ===
  const dayRangeRegex = /^[Qq](\d{1,2})-(\d{1,2})$/;
  const dayRangeMatch = trimmedCommand.match(dayRangeRegex);

  if (dayRangeMatch) {
    const startDay = parseInt(dayRangeMatch[1], 10);
    const endDay = parseInt(dayRangeMatch[2], 10);

    // ตรวจสอบความถูกต้องเบื้องต้น
    if (startDay < 1 || startDay > 31 || endDay < 1 || endDay > 31) {
      return { valid: false, error: 'รูปแบบวันที่ไม่ถูกต้อง (1-31)' };
    }
    if (endDay < startDay) {
      return { valid: false, error: 'วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น' };
    }

    // สร้าง Date object โดยใช้เดือนและปีปัจจุบัน
    try {
      const startDate = new Date(currentYear, currentMonth, startDay);
      const endDate = new Date(currentYear, currentMonth, endDay);
      // ตรวจสอบว่าสร้าง Date object ได้ถูกต้อง (เผื่อกรณีวันที่ผิด เช่น 31/2)
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date object created');
      }
      return { valid: true, start: startDate, end: endDate };
    } catch (e) {
      return { valid: false, error: 'เกิดข้อผิดพลาดในการสร้างวันที่: ' + e.message };
    }
  }
  // === สิ้นสุดการเพิ่มรูปแบบใหม่ ===


  // รูปแบบที่ 2 (เดิม): Q27/10 (วันเดียว - รับและคืนวันเดียวกัน ระบุเดือน)
  const singleDayWithMonthRegex = /^[Qq](\d{1,2}\/\d{1,2})$/;
  const singleDayWithMonthMatch = trimmedCommand.match(singleDayWithMonthRegex);

  if (singleDayWithMonthMatch) {
    const date = parseDateFromString(singleDayWithMonthMatch[1]);
    if (!date) {
      return { valid: false, error: 'รูปแบบวันที่ไม่ถูกต้อง' };
    }
    // ใช้วันเดียวกันทั้งวันรับและวันคืน
    return { valid: true, start: date, end: new Date(date.getTime()) };
  }

  // รูปแบบที่ 3 (เดิม): Q1-31 (วันเดียว เดือนปัจจุบัน)
  const dayOnlyRegex = /^[Qq](\d{1,2})$/;
  const dayOnlyMatch = trimmedCommand.match(dayOnlyRegex);

  if (dayOnlyMatch) {
    const day = parseInt(dayOnlyMatch[1], 10);
    if (day < 1 || day > 31) {
      return { valid: false, error: 'รูปแบบวันที่ไม่ถูกต้อง (1-31)' };
    }
    // สร้าง Date object โดยใช้เดือนและปีปัจจุบัน
    try {
      const date = new Date(currentYear, currentMonth, day);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date object created');
      }
      return { valid: true, start: date, end: new Date(date.getTime()) };
    } catch (e) {
      return { valid: false, error: 'เกิดข้อผิดพลาดในการสร้างวันที่: ' + e.message };
    }
  }

  // === อัปเดต Error Message ให้ครอบคลุมรูปแบบใหม่ ===
  return { valid: false, error: 'รูปแบบคำสั่งไม่ถูกต้อง\nใช้: Q27, Q27/10, Q27/10-1/11, Q1-5' };
}

/**
 * แยกคำสั่ง S เช่น "S27/10" => Date
 */
function parseScheduleCommand(command) {
  const trimmedCommand = command.trim();

  // รูปแบบที่ 1: S27/10 (ระบุเดือน)
  const withMonthRegex = /^[Ss](\d{1,2}\/\d{1,2})$/;
  const withMonthMatch = trimmedCommand.match(withMonthRegex);

  if (withMonthMatch) {
    const date = parseDateFromString(withMonthMatch[1]);
    if (!date) {
      return { valid: false, error: 'รูปแบบวันที่ไม่ถูกต้อง' };
    }
    return { valid: true, date };
  }

  // รูปแบบที่ 2: S1-31 (แค่วัน ใช้เดือนปัจจุบัน)
  const dayOnlyRegex = /^[Ss](\d{1,2})$/;
  const dayOnlyMatch = trimmedCommand.match(dayOnlyRegex);

  if (dayOnlyMatch) {
    const day = parseInt(dayOnlyMatch[1]);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const dateStr = day + '/' + currentMonth;
    const date = parseDateFromString(dateStr);
    if (!date) {
      return { valid: false, error: 'รูปแบบวันที่ไม่ถูกต้อง' };
    }
    return { valid: true, date };
  }

  return { valid: false, error: 'รูปแบบคำสั่งไม่ถูกต้อง\nใช้รูปแบบ: S27 (เดือนนี้) หรือ S27/10 (ระบุเดือน)' };
}

// =============================================================================
// 🤖 LINE Bot - Business Logic (ค้นหารถว่าง)
// =============================================================================

/**
 * ประมวลผลคำสั่ง Q (ค้นหารถว่าง)
 * รูปแบบ: Q27/10-1/11
 */

function handleQueueQuery(userData, replyToken, userMessage, startTime) {
  // === LOG เพิ่มเติม: เริ่มต้น ===
  const LOG_PREFIX = '[handleQueueQuery DEBUG] ';
  Logger.log(LOG_PREFIX + '🚀 เริ่มทำงาน...');
  Logger.log(LOG_PREFIX + '📥 User Message: ' + userMessage);
  // === สิ้นสุด LOG เพิ่มเติม ===

  const lineUserId = userData.lineUserId;
  const sheetID = userData.sheetID;
  const userName = userData.userName;

  // Parse คำสั่ง
  const parseResult = parseQueueCommand(userMessage);
  // === LOG เพิ่มเติม: ผลการ Parse ===
  Logger.log(LOG_PREFIX + '⚙️ Parse Result: ' + JSON.stringify(parseResult));
  // === สิ้นสุด LOG เพิ่มเติม ===

  if (!parseResult.valid) {
    replyFlexMessage(replyToken, createErrorFlex('รูปแบบคำสั่งผิด', parseResult.error));
    logLinebotActivity(sheetID, lineUserId, userName, 'text', userMessage, 'error', 'invalid_q_format', parseResult.error, Date.now() - startTime);
    return;
  }

  try {
    // เรียกใช้ฟังก์ชันที่มีอยู่แล้ว
    const pickupDate = Utilities.formatDate(parseResult.start, 'Asia/Bangkok', 'yyyy-MM-dd');
    const returnDate = Utilities.formatDate(parseResult.end, 'Asia/Bangkok', 'yyyy-MM-dd');
    const pickupTime = '08:00'; // สมมติค่าเริ่มต้น (อาจปรับตามต้องการ)
    const returnTime = '17:00'; // สมมติค่าเริ่มต้น
    const prepTimeMinutes = 30; // ดึงค่าจากการตั้งค่าระบบถ้าต้องการ

    // === LOG เพิ่มเติม: ก่อนเรียก findAvailabilitySummary ===
    Logger.log(LOG_PREFIX + '🔍 กำลังเรียก findAvailabilitySummary ด้วย:');
    Logger.log(LOG_PREFIX + '   - pickupDate: ' + pickupDate);
    Logger.log(LOG_PREFIX + '   - pickupTime: ' + pickupTime);
    Logger.log(LOG_PREFIX + '   - returnDate: ' + returnDate);
    Logger.log(LOG_PREFIX + '   - returnTime: ' + returnTime);
    Logger.log(LOG_PREFIX + '   - prepTimeMinutes: ' + prepTimeMinutes);
    Logger.log(LOG_PREFIX + '   - sheetID: ' + sheetID);
    // === สิ้นสุด LOG เพิ่มเติม ===

    // ดึงข้อมูลรถว่าง
    const result = findAvailabilitySummary(pickupDate, pickupTime, returnDate, returnTime, prepTimeMinutes, sheetID);

    // === LOG เพิ่มเติม: ผลลัพธ์จาก findAvailabilitySummary ===
    Logger.log(LOG_PREFIX + '📊 ผลลัพธ์ดิบจาก findAvailabilitySummary:');
    // ใช้ JSON.stringify(result, null, 2) เพื่อดูโครงสร้าง object ได้ง่ายขึ้น
    // ระวัง: ถ้า result ใหญ่มาก อาจทำให้ Log ยาวเกินไป
    try {
      Logger.log(LOG_PREFIX + JSON.stringify(result, null, 2));
    } catch (stringifyError) {
      Logger.log(LOG_PREFIX + '   (ไม่สามารถ Stringify ผลลัพธ์ได้ อาจมี Circular reference)');
      Logger.log(LOG_PREFIX + '   Success: ' + result.success);
      Logger.log(LOG_PREFIX + '   Message: ' + result.message);
      Logger.log(LOG_PREFIX + '   Free Cars Count: ' + (result.freeCars ? result.freeCars.length : 'N/A'));
      Logger.log(LOG_PREFIX + '   Short Booked Count: ' + (result.shortBookedCars ? result.shortBookedCars.length : 'N/A'));
    }
    // === สิ้นสุด LOG เพิ่มเติม ===


    if (!result || !result.success) {
      replyFlexMessage(replyToken, createSystemErrorFlex());
      // === LOG เพิ่มเติม: กรณี findAvailabilitySummary ล้มเหลว ===
      Logger.log(LOG_PREFIX + '❌ findAvailabilitySummary ล้มเหลว: ' + (result ? result.message : 'ผลลัพธ์เป็น null/undefined'));
      // === สิ้นสุด LOG เพิ่มเติม ===
      logLinebotActivity(sheetID, lineUserId, userName, 'text', userMessage, 'error', 'query_failed', 'findAvailabilitySummary failed', Date.now() - startTime);
      return;
    }

    // === LOG เพิ่มเติม: ก่อนเรียก createAvailableCarsFlexSimple ===
    Logger.log(LOG_PREFIX + '🎨 กำลังเรียก createAvailableCarsFlexSimple...');
    // === สิ้นสุด LOG เพิ่มเติม ===

    // สร้าง Flex Message แสดงผล
    const flexMessage = createAvailableCarsFlexSimple(result, pickupDate, returnDate);

    // === LOG เพิ่มเติม: Flex Message ที่สร้างเสร็จ ===
    Logger.log(LOG_PREFIX + '📤 Flex Message JSON ที่จะส่ง:');
    Logger.log(LOG_PREFIX + JSON.stringify(flexMessage, null, 2));
    // === สิ้นสุด LOG เพิ่มเติม ===

    replyFlexMessage(replyToken, flexMessage);

    logLinebotActivity(sheetID, lineUserId, userName, 'text', userMessage, flexMessage, 'query_success', null, Date.now() - startTime);

  } catch (error) {
    Logger.log(LOG_PREFIX + '💥 เกิดข้อผิดพลาดใน try block: ' + error.toString());
    Logger.log(LOG_PREFIX + '   Stack Trace: ' + error.stack); // << สำคัญมาก
    replyFlexMessage(replyToken, createSystemErrorFlex());
    logLinebotActivity(sheetID, lineUserId, userName, 'text', userMessage, 'error', 'query_exception', error.toString(), Date.now() - startTime);
  }
}

/**
 * คำนวณรถที่กำลังจะว่าง (คืนพอดีวันที่รับ)
 */
function findSoonAvailableCars(pickupDateTime, rentals, cars) {
  const pickupDate = new Date(pickupDateTime);
  pickupDate.setHours(0, 0, 0, 0); // เอาเฉพาะวันที่

  const soonAvailable = [];

  rentals.forEach(rental => {
    // เช็ครถที่คืนในวันที่เดียวกับวันรับ
    const returnDate = new Date(rental.วันที่คืน);
    returnDate.setHours(0, 0, 0, 0);

    if (returnDate.getTime() === pickupDate.getTime()) {
      // หารถในรายชื่อรถ
      const carInfo = cars.find(c =>
        c.ยี่ห้อ === rental.ยี่ห้อ &&
        c.รุ่น === rental.รุ่น &&
        c.ทะเบียน === rental.ทะเบียน
      );

      if (carInfo) {
        soonAvailable.push({
          car: carInfo,
          returnTime: rental.เวลาคืนรถ,
          bookingNumber: rental.หมายเลขการจอง
        });
      }
    }
  });

  return soonAvailable;
}





/**
 * สร้าง Flex Message แสดงรถว่าง (ปรับปรุงใหม่ V.3 - เพิ่ม Soon Available)
 */
function createAvailableCarsFlexSimple(result, pickupDate, returnDate) {
  const LOG_PREFIX_FLEX = '[createFlex DEBUG V.3] ';
  Logger.log(LOG_PREFIX_FLEX + '🎨 เริ่มสร้าง Flex Message...');

  if (!result || !result.totals) {
    Logger.log(LOG_PREFIX_FLEX + '❌ ข้อมูล Result ไม่สมบูรณ์ ไม่สามารถสร้าง Flex ได้');
    return createErrorFlex('ข้อมูลไม่สมบูรณ์', 'ไม่สามารถแสดงผลรถว่างได้');
  }

  const freeCars = result.freeCars || [];
  const shortBookedCars = result.shortBookedCars || [];
  const soonAvailableCars = result.soonAvailableCars || []; // <-- ดึงข้อมูลรถที่จะว่าง
  const freeCarsCount = result.totals.freeAllPeriod || 0;
  const shortBookedCount = result.totals.shortBookedCount || 0;
  const soonAvailableCount = result.totals.soonAvailableCount || 0; // <-- ดึงจำนวน

  const displayPickupDate = formatDateToDDMMYYYY(pickupDate);
  const displayReturnDate = formatDateToDDMMYYYY(returnDate);
  const dateHeaderText = displayPickupDate === displayReturnDate
    ? displayPickupDate
    : `${displayPickupDate} - ${displayReturnDate}`;

  let headerContents = [
    { type: 'text', text: '🚗 รายการถว่าง', weight: 'bold', size: 'lg', color: '#1DB446', margin: 'md' },
    { type: 'text', text: dateHeaderText, size: 'md', color: '#333333', wrap: true, margin: 'sm' }
  ];

  let bodyContents = [];

  // --- ส่วนรถว่างตลอด ---
  Logger.log(LOG_PREFIX_FLEX + '🟢 Processing Free Cars: ' + freeCarsCount);
  if (freeCarsCount > 0) {
    bodyContents.push({ type: 'separator', margin: 'lg' });
    bodyContents.push({ /* ... Header รถว่างตลอด เหมือนเดิม ... */
      type: 'box', layout: 'horizontal', margin: 'lg', spacing: 'sm', contents: [
        { type: 'text', text: '🟢', flex: 0 },
        { type: 'text', text: `ว่างตลอดช่วง (${freeCarsCount} คัน)`, size: 'md', weight: 'bold', color: '#00B900', wrap: true }
      ]
    });

    if (freeCarsCount > 10) {
      Logger.log(LOG_PREFIX_FLEX + '   สรุปตามรุ่น (> 10 คัน)');
      const groupedFreeCars = groupCarsByBrandModel_(freeCars);
      groupedFreeCars.forEach(group => {
        if (group && group.name) {
          bodyContents.push({ /* ... แสดงแบบสรุป เหมือนเดิม ... */
            type: 'box', layout: 'horizontal', margin: 'md', contents: [
              { type: 'text', text: '•', size: 'sm', color: '#aaaaaa', flex: 0, margin: 'sm', gravity: 'center' },
              { type: 'text', text: `${group.name}`, size: 'sm', color: '#555555', wrap: true, flex: 3 },
              { type: 'text', text: `(${group.count} คัน)`, size: 'sm', color: '#888888', wrap: false, flex: 1, align: 'end' }
            ]
          });
        } else { Logger.log(LOG_PREFIX_FLEX + '   ⚠️ ข้าม Grouped Free Car เนื่องจากข้อมูลไม่สมบูรณ์'); }
      });
    } else {
      Logger.log(LOG_PREFIX_FLEX + '   แสดงรายการ (<= 10 คัน)');
      freeCars.forEach((car, index) => {
        if (car && car.ยี่ห้อ && car.รุ่น && car.ทะเบียน) {
          bodyContents.push({ /* ... แสดงรายการ เหมือนเดิม ... */
            type: 'box', layout: 'horizontal', margin: 'md', contents: [
              { type: 'text', text: '•', size: 'sm', color: '#aaaaaa', flex: 0, margin: 'sm' },
              { type: 'text', text: `${car.ยี่ห้อ} ${car.รุ่น} (${car.ทะเบียน})`, size: 'sm', color: '#555555', wrap: true }
            ]
          });
        } else { Logger.log(LOG_PREFIX_FLEX + '   ⚠️ ข้าม Free Car index ' + index + ' ข้อมูลไม่สมบูรณ์'); }
      });
    }
  }

  // --- ส่วนรถที่กำลังจะว่าง ---
  Logger.log(LOG_PREFIX_FLEX + '🔵 Processing Soon Available Cars: ' + soonAvailableCount);
  if (soonAvailableCount > 0) {
    bodyContents.push({ type: 'separator', margin: 'xl' });
    bodyContents.push({
      type: 'box',
      layout: 'horizontal',
      margin: 'lg',
      spacing: 'sm',
      contents: [
        { type: 'text', text: '🔵', flex: 0 }, // ไอคอนสีน้ำเงิน
        {
          type: 'text',
          // แสดงวันที่รับรถด้วย เพราะรถคืนวันนี้
          text: `กำลังจะว่าง (${soonAvailableCount} คัน)`,
          size: 'md',
          weight: 'bold',
          color: '#007BFF', // สีน้ำเงิน
          wrap: true
        }
      ]
    });

    // แสดงรายการรถที่จะว่าง (จำกัด 10 รายการ)
    let soonDisplayedCount = 0;
    soonAvailableCars.forEach((car) => {
      if (soonDisplayedCount >= 10) return;
      // *** เพิ่มการตรวจสอบ car object ก่อนใช้งาน ***
      if (car && car.ยี่ห้อ && car.รุ่น && car.ทะเบียน && car.actualReturnTime) {
        bodyContents.push({
          type: 'box',
          layout: 'vertical', // แยกข้อมูลรถกับเวลาคืน
          margin: 'md',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: '•', size: 'sm', color: '#aaaaaa', flex: 0, margin: 'sm' },
                { type: 'text', text: `${car.ยี่ห้อ} ${car.รุ่น} (${car.ทะเบียน})`, size: 'sm', color: '#555555', wrap: true }
              ]
            },
            {
              type: 'text',
              text: `  คืนรถวันนี้ เวลา: ${car.actualReturnTime}`, // แสดงเวลาคืน
              size: 'xs',
              color: '#007BFF', // สีน้ำเงิน
              wrap: true,
              margin: 'xs'
            }
          ]
        });
        soonDisplayedCount++;
      } else {
        Logger.log(LOG_PREFIX_FLEX + '   ⚠️ ข้าม Soon Available Car เนื่องจากข้อมูลไม่สมบูรณ์: ' + JSON.stringify(car));
      }
    });
    if (soonAvailableCount > soonDisplayedCount) {
      bodyContents.push({ type: 'text', text: `  (...และอีก ${soonAvailableCount - soonDisplayedCount} คัน)`, size: 'xs', color: '#aaaaaa', margin: 'sm' });
    }
  }

  // --- ส่วนรถเช่าสั้น 1-2 วัน ---
  Logger.log(LOG_PREFIX_FLEX + '🟡 Processing Short Booked Cars: ' + shortBookedCount);
  if (shortBookedCount > 0) {
    bodyContents.push({ type: 'separator', margin: 'xl' });
    bodyContents.push({ /* ... Header รถเช่าสั้น เหมือนเดิม ... */
      type: 'box', layout: 'horizontal', margin: 'lg', spacing: 'sm', contents: [
        { type: 'text', text: '🟡', flex: 0 },
        { type: 'text', text: `รถเช่าสั้น 1-2 วัน (${shortBookedCount} คัน)`, size: 'md', weight: 'bold', color: '#FFA500', wrap: true }
      ]
    });

    const displayedShortBookings = {};
    let displayCount = 0;
    shortBookedCars.forEach((item) => {
      if (displayCount >= 10) return;
      // *** เพิ่มการตรวจสอบ item object ก่อนใช้งาน ***
      if (item && item.ยี่ห้อ && item.รุ่น && item.ทะเบียน && item.pickup && item.return && !displayedShortBookings[item.ทะเบียน]) {
        const displayItemPickup = formatDateToDDMMYYYY(item.pickup);
        const displayItemReturn = formatDateToDDMMYYYY(item.return);
        const dateText = displayItemPickup === displayItemReturn
          ? `(${item.pickupTime} - ${item.returnTime})`
          : `(${item.pickupTime}) - ${displayItemReturn} (${item.returnTime})`;

        bodyContents.push({ /* ... แสดงรายการ เหมือนเดิม ... */
          type: 'box', layout: 'vertical', margin: 'md', contents: [
            {
              type: 'box', layout: 'horizontal', contents: [
                { type: 'text', text: '•', size: 'sm', color: '#aaaaaa', flex: 0, margin: 'sm' },
                { type: 'text', text: `${item.ยี่ห้อ} ${item.รุ่น} (${item.ทะเบียน})`, size: 'sm', color: '#555555', wrap: true }
              ]
            },
            { type: 'text', text: `  เช่า: ${displayItemPickup} ${dateText}`, size: 'xs', color: '#888888', wrap: true, margin: 'xs' }
          ]
        });
        displayedShortBookings[item.ทะเบียน] = true;
        displayCount++;
      } else if (!item) {
        Logger.log(LOG_PREFIX_FLEX + '   ⚠️ ข้าม Short Booked Item เนื่องจาก item เป็น null/undefined');
      } else if (!displayedShortBookings[item.ทะเบียน]) {
        let missing = [];
        if (!item.ยี่ห้อ) missing.push('ยี่ห้อ'); if (!item.รุ่น) missing.push('รุ่น'); if (!item.ทะเบียน) missing.push('ทะเบียน');
        if (!item.pickup) missing.push('pickup'); if (!item.return) missing.push('return');
        Logger.log(LOG_PREFIX_FLEX + '   ⚠️ ข้าม Short Booked Item (ทะเบียน: ' + (item.ทะเบียน || 'N/A') + ') ข้อมูลไม่สมบูรณ์ ขาด: ' + missing.join(', ') + ' | Data: ' + JSON.stringify(item));
        displayedShortBookings[item.ทะเบียน] = true;
      }
    });
    // ใช้ shortBookedCount (จำนวนรถไม่ซ้ำ) จาก result.totals
    if (shortBookedCount > displayCount) {
      bodyContents.push({ type: 'text', text: `  (...และอีก ${shortBookedCount - displayCount} คัน)`, size: 'xs', color: '#aaaaaa', margin: 'sm' });
    }
  }

  // --- กรณีไม่มีรถว่างเลย ---
  if (freeCarsCount === 0 && soonAvailableCount === 0 && shortBookedCount === 0) { // <-- เช็ค soonAvailableCount ด้วย
    bodyContents.push({ type: 'separator', margin: 'xl' });
    bodyContents.push({ /* ... ข้อความไม่มีรถว่าง เหมือนเดิม ... */
      type: 'text', text: '⛔ ไม่พบรถว่างในช่วงเวลาที่เลือก', size: 'md', color: '#FF5252', margin: 'lg', align: 'center', weight: 'bold'
    });
  }

  Logger.log(LOG_PREFIX_FLEX + '📦 bodyContents ที่สร้างเสร็จ: ' + bodyContents.length + ' elements');

  // --- สร้าง Flex Message ---
  return { /* ... โครงสร้าง Flex Message เหมือนเดิม ... */
    type: 'flex',
    altText: `รถว่าง ${dateHeaderText}`,
    contents: {
      type: 'bubble',
      hero: { type: 'box', layout: 'vertical', contents: headerContents, paddingAll: 'lg', backgroundColor: '#E8F5E9', spacing: 'xs' },
      body: { type: 'box', layout: 'vertical', contents: bodyContents, paddingTop: 'lg', paddingBottom: 'lg', paddingStart: 'lg', paddingEnd: 'lg', spacing: 'sm' },
      footer: { type: 'box', layout: 'vertical', contents: [{ type: 'separator', margin: 'md' }, { type: 'text', text: 'Powered by KPCRM V.3', size: 'xxs', color: '#AAAAAA', align: 'center', margin: 'lg' }] },
      styles: { hero: { separator: true, separatorColor: '#DDDDDD' } }
    }
  };
}

/**
 * จัดกลุ่มรถตาม 'ยี่ห้อ รุ่น' และนับจำนวน
 * @param {Array<Object>} cars - Array ของ object รถ (ต้องมี 'ยี่ห้อ' และ 'รุ่น')
 * @returns {Array<Object>} Array [{ name: "ยี่ห้อ รุ่น", count: จำนวน }] ที่เรียงตามชื่อ
 */
function groupCarsByBrandModel_(cars) {
  const modelMap = {};
  (cars || []).forEach(car => {
    if (!car || !car.ยี่ห้อ || !car.รุ่น) return;
    const brand = String(car.ยี่ห้อ).trim();
    const model = String(car.รุ่น).trim();
    const key = `${brand} ${model}`;
    modelMap[key] = (modelMap[key] || 0) + 1;
  });
  const grouped = Object.entries(modelMap).map(([name, count]) => ({ name, count }));
  try {
    grouped.sort((a, b) => a.name.localeCompare(b.name, 'th'));
  } catch (_) {
    grouped.sort((a, b) => a.name.localeCompare(b.name));
  }
  return grouped;
}

/**
 * Helper function แปลง YYYY-MM-DD เป็น DD/MM/YYYY
 */
function formatDateToDDMMYYYY(dateString) {
  if (!dateString || typeof dateString !== 'string' || !dateString.includes('-')) {
    return dateString;
  }
  try {
    const parts = dateString.split('-'); // ["YYYY", "MM", "DD"]
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`; // "DD/MM/YYYY"
    }
    return dateString;
  } catch (e) {
    return dateString;
  }
}

// =============================================================================
// 🤖 LINE Bot - Business Logic (ตารางรับส่งรถ)
// =============================================================================

/**
 * ประมวลผลคำสั่ง S (ตารางรับส่งรถ)
 * รูปแบบ: S27/10
 */
function handleScheduleQuery(userData, replyToken, userMessage, startTime) {
  const lineUserId = userData.lineUserId;
  const sheetID = userData.sheetID;
  const userName = userData.userName;

  // Parse คำสั่ง
  const parseResult = parseScheduleCommand(userMessage);

  if (!parseResult.valid) {
    replyFlexMessage(replyToken, createErrorFlex('รูปแบบคำสั่งผิด', parseResult.error));
    logLinebotActivity(sheetID, lineUserId, userName, 'text', userMessage, 'error', 'invalid_s_format', parseResult.error, Date.now() - startTime);
    return;
  }

  try {
    const dateString = Utilities.formatDate(parseResult.date, 'Asia/Bangkok', 'yyyy-MM-dd');

    // ดึงตารางรับส่งรถ
    const scheduleData = getScheduleForDate(dateString, sheetID);
    const schedule = JSON.parse(scheduleData);

    if (!schedule || !schedule.success) {
      replyFlexMessage(replyToken, createSystemErrorFlex());
      logLinebotActivity(sheetID, lineUserId, userName, 'text', userMessage, 'error', 'schedule_failed', 'getScheduleForDate failed', Date.now() - startTime);
      return;
    }

    // สร้าง Flex Message แสดงตาราง
    const flexMessage = createScheduleFlex(schedule.data, dateString);
    replyFlexMessage(replyToken, flexMessage);

    logLinebotActivity(sheetID, lineUserId, userName, 'text', userMessage, flexMessage, 'schedule_success', null, Date.now() - startTime);

  } catch (error) {
    Logger.log('handleScheduleQuery Error: ' + error.toString());
    replyFlexMessage(replyToken, createSystemErrorFlex());
    logLinebotActivity(sheetID, lineUserId, userName, 'text', userMessage, 'error', 'schedule_exception', error.toString(), Date.now() - startTime);
  }
}



/**
 * สร้าง Flex Message แสดงตารางรับส่งรถ (ปรับปรุงใหม่ V.2)
 */
function createScheduleFlex(data, dateString) {
  const LOG_PREFIX_SCHED_FLEX = '[createSchedFlex DEBUG] ';
  Logger.log(LOG_PREFIX_SCHED_FLEX + '📅 เริ่มสร้าง Flex ตารางรับส่งรถ...');
  Logger.log(LOG_PREFIX_SCHED_FLEX + '   Date String: ' + dateString);

  // *** เพิ่มการตรวจสอบ data object ***
  if (!data) {
    Logger.log(LOG_PREFIX_SCHED_FLEX + '❌ ข้อมูล Input (data) เป็น null/undefined');
    return createErrorFlex('ข้อมูลไม่สมบูรณ์', 'ไม่สามารถแสดงตารางรับส่งรถได้');
  }

  const pickups = data.pickups || [];
  const returns = data.returns || [];
  Logger.log(LOG_PREFIX_SCHED_FLEX + `   Pickups: ${pickups.length}, Returns: ${returns.length}`);

  // แปลง Format วันที่ส่วน Header เป็น DD/MM/YYYY
  const displayDate = formatDateToDDMMYYYY(dateString);

  let headerContents = [
    {
      type: 'text',
      text: '📅 ตารางรับ-ส่งรถ',
      weight: 'bold',
      size: 'lg',
      color: '#007BFF', // สีน้ำเงินหลัก
      margin: 'md'
    },
    {
      type: 'text',
      text: displayDate, // ใช้วันที่ Format ใหม่
      size: 'md',
      color: '#333333',
      wrap: true,
      margin: 'sm'
    }
  ];

  let bodyContents = [];

  // --- ส่วนรับรถ ---
  Logger.log(LOG_PREFIX_SCHED_FLEX + '🚗 Processing Pickups...');
  if (pickups.length > 0) {
    bodyContents.push({ type: 'separator', margin: 'lg' });
    bodyContents.push({
      type: 'box',
      layout: 'horizontal',
      margin: 'lg',
      spacing: 'sm',
      contents: [
        { type: 'text', text: '🟢', flex: 0 },
        {
          type: 'text',
          text: `รับรถ (${pickups.length} รายการ)`,
          size: 'md',
          weight: 'bold',
          color: '#28A745', // สีเขียว
          wrap: true
        }
      ]
    });

    pickups.forEach((pickup, index) => {
      // *** เพิ่มการตรวจสอบ pickup object และ properties ก่อนใช้งาน ***
      if (pickup && pickup.เวลา && pickup.รถ && pickup.ชื่อลูกค้า) {
        bodyContents.push({
          type: 'box',
          layout: 'vertical',
          margin: 'md',
          paddingAll: 'sm', // เพิ่ม padding เล็กน้อย
          backgroundColor: index % 2 === 0 ? '#F8F9FA' : '#FFFFFF', // สลับสีพื้นหลัง
          cornerRadius: 'md',
          spacing: 'xs', // ลดระยะห่างภายใน item
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: pickup.เวลา || '--:--', weight: 'bold', size: 'sm', color: '#007BFF', flex: 0 },
                { type: 'text', text: pickup.รถ || 'N/A', size: 'sm', color: '#333333', wrap: true, align: 'start', margin: 'md', weight: 'bold' } // ชิดซ้าย
              ]
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: '👤', flex: 0, size: 'xs', color: '#888888', gravity: 'center' },
                { type: 'text', text: `${pickup.ชื่อลูกค้า || 'N/A'} (${pickup.เบอร์โทรศัพท์ || 'N/A'})`, size: 'xs', color: '#555555', wrap: true, margin: 'sm' }
              ]
            },
            { // *** เพิ่มส่วนแสดงสถานที่ ***
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: '📍', flex: 0, size: 'xs', color: '#888888', gravity: 'center' },
                { type: 'text', text: `รับ: ${pickup.สถานที่รับรถ || 'N/A'}`, size: 'xs', color: '#555555', wrap: true, margin: 'sm' }
              ]
            }
          ]
        });
      } else {
        Logger.log(LOG_PREFIX_SCHED_FLEX + '   ⚠️ ข้าม Pickup index ' + index + ' เนื่องจากข้อมูลไม่สมบูรณ์: ' + JSON.stringify(pickup));
      }
    });
  }

  // --- ส่วนคืนรถ ---
  Logger.log(LOG_PREFIX_SCHED_FLEX + '🏁 Processing Returns...');
  if (returns.length > 0) {
    bodyContents.push({ type: 'separator', margin: 'xl' });
    bodyContents.push({
      type: 'box',
      layout: 'horizontal',
      margin: 'lg',
      spacing: 'sm',
      contents: [
        { type: 'text', text: '🟠', flex: 0 }, // ใช้สีส้ม
        {
          type: 'text',
          text: `คืนรถ (${returns.length} รายการ)`,
          size: 'md',
          weight: 'bold',
          color: '#FD7E14', // สีส้ม
          wrap: true
        }
      ]
    });

    returns.forEach((returnItem, index) => {
      // *** เพิ่มการตรวจสอบ returnItem object และ properties ก่อนใช้งาน ***
      if (returnItem && returnItem.เวลา && returnItem.รถ && returnItem.ชื่อลูกค้า) {
        bodyContents.push({
          type: 'box',
          layout: 'vertical',
          margin: 'md',
          paddingAll: 'sm',
          backgroundColor: index % 2 === 0 ? '#F8F9FA' : '#FFFFFF',
          cornerRadius: 'md',
          spacing: 'xs',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: returnItem.เวลา || '--:--', weight: 'bold', size: 'sm', color: '#007BFF', flex: 0 },
                { type: 'text', text: returnItem.รถ || 'N/A', size: 'sm', color: '#333333', wrap: true, align: 'start', margin: 'md', weight: 'bold' }
              ]
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: '👤', flex: 0, size: 'xs', color: '#888888', gravity: 'center' },
                { type: 'text', text: `${returnItem.ชื่อลูกค้า || 'N/A'} (${returnItem.เบอร์โทรศัพท์ || 'N/A'})`, size: 'xs', color: '#555555', wrap: true, margin: 'sm' }
              ]
            },
            { // *** เพิ่มส่วนแสดงสถานที่ ***
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: '📍', flex: 0, size: 'xs', color: '#888888', gravity: 'center' },
                { type: 'text', text: `คืน: ${returnItem.สถานที่คืนรถ || 'N/A'}`, size: 'xs', color: '#555555', wrap: true, margin: 'sm' }
              ]
            }
          ]
        });
      } else {
        Logger.log(LOG_PREFIX_SCHED_FLEX + '   ⚠️ ข้าม Return index ' + index + ' เนื่องจากข้อมูลไม่สมบูรณ์: ' + JSON.stringify(returnItem));
      }
    });
  }

  // --- กรณีไม่มีรายการ ---
  if (pickups.length === 0 && returns.length === 0) {
    bodyContents.push({ type: 'separator', margin: 'xl' });
    bodyContents.push({
      type: 'text',
      text: 'ℹ️ ไม่มีรายการรับ-ส่งรถในวันนี้',
      size: 'md',
      color: '#6C757D', // สีเทา
      margin: 'lg',
      align: 'center',
      wrap: true
    });
  }

  Logger.log(LOG_PREFIX_SCHED_FLEX + '📦 bodyContents ที่สร้างเสร็จ: ' + bodyContents.length + ' elements');

  // --- สร้าง Flex Message ---
  return {
    type: 'flex',
    altText: `ตารางรับส่งรถ ${displayDate}`,
    contents: {
      type: 'bubble',
      hero: {
        type: 'box',
        layout: 'vertical',
        contents: headerContents,
        paddingAll: 'lg',
        backgroundColor: '#E7F1FF', // สีฟ้าอ่อน
        spacing: 'xs'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: bodyContents,
        paddingTop: 'md', // ลด padding บน body
        paddingBottom: 'lg',
        paddingStart: 'lg',
        paddingEnd: 'lg',
        spacing: 'sm'
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'separator', margin: 'md' },
          { type: 'text', text: 'Powered by KPCRM V.3', size: 'xxs', color: '#AAAAAA', align: 'center', margin: 'lg' }
        ]
      },
      styles: {
        hero: { separator: true, separatorColor: '#BBDDFF' } // สีเส้นคั่นฟ้าอ่อน
      }
    }
  };
}











function getRevenueData(sheetID, year) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName("รายการเช่า");

    // ตรวจสอบว่าเจอ Sheet หรือไม่
    if (!sheet) {
      Logger.log(`Error: ไม่พบ Sheet ชื่อ "รายการเช่า"`);
      return [];
    }

    // อ่านข้อมูลทั้งหมดใน Sheet
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();

    // ตรวจสอบว่ามีข้อมูลหรือไม่ (อย่างน้อยต้องมี Header)
    if (values.length < 2) {
      Logger.log("ไม่มีข้อมูลใน Sheet (มีแค่ Header หรือว่างเปล่า)");
      return [];
    }

    // หาคอลัมน์วันที่ (G) และรายได้ (Q)
    // คอลัมน์ G อยู่ที่ index 6, คอลัมน์ Q อยู่ที่ index 16
    const dateColumnIndex = 6;
    const revenueColumnIndex = 16;

    // เตรียมข้อมูลรายได้รายเดือน
    const monthlyData = [];
    let processedCount = 0;

    // แปลงปีให้เป็นตัวเลข
    const targetYear = parseInt(year, 10);
    if (isNaN(targetYear)) {
      Logger.log(`Error: ปีที่ระบุไม่ถูกต้อง: ${year}`);
      return [];
    }

    // วนลูปตั้งแต่แถวที่ 2 (index = 1) เพราะแถวแรกคือ Header
    for (let i = 1; i < values.length; i++) {
      const row = values[i];

      // ตรวจสอบว่าแถวมีข้อมูลครบ
      if (row.length <= Math.max(dateColumnIndex, revenueColumnIndex)) {
        continue; // ข้ามแถวที่ไม่มีข้อมูลครบ
      }

      const dateValue = row[dateColumnIndex];
      const revenueValue = row[revenueColumnIndex];

      // ข้ามแถวที่ไม่มีข้อมูลวันที่หรือรายได้
      if (!dateValue || !revenueValue) {
        continue;
      }

      // แปลงข้อมูลวันที่
      let rentalDate = null;
      let dateProcessed = false;

      // ถ้าเป็น Date object
      if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
        rentalDate = dateValue;
        dateProcessed = true;
      }
      // ถ้าเป็น String (เช่น "2024-03-27")
      else if (typeof dateValue === 'string') {
        // ลองหลายวิธีในการแปลงวันที่
        try {
          // วิธีที่ 1: ใช้ Date constructor
          rentalDate = new Date(dateValue);
          if (!isNaN(rentalDate.getTime())) {
            dateProcessed = true;
          } else {
            // วิธีที่ 2: แยกวันที่ด้วย "-" (รูปแบบ YYYY-MM-DD)
            const dateParts = dateValue.split('-');
            if (dateParts.length === 3) {
              rentalDate = new Date(
                parseInt(dateParts[0], 10), // ปี
                parseInt(dateParts[1], 10) - 1, // เดือน (0-indexed)
                parseInt(dateParts[2], 10) // วัน
              );
              if (!isNaN(rentalDate.getTime())) {
                dateProcessed = true;
              }
            }

            // วิธีที่ 3: แยกวันที่ด้วย "/" (รูปแบบ DD/MM/YYYY)
            if (!dateProcessed) {
              const dateParts = dateValue.split('/');
              if (dateParts.length === 3) {
                rentalDate = new Date(
                  parseInt(dateParts[2], 10), // ปี
                  parseInt(dateParts[1], 10) - 1, // เดือน (0-indexed)
                  parseInt(dateParts[0], 10) // วัน
                );
                if (!isNaN(rentalDate.getTime())) {
                  dateProcessed = true;
                }
              }
            }
          }
        } catch (e) {
          // ไม่สามารถแปลงวันที่ได้
          dateProcessed = false;
        }
      }

      // ข้ามถ้าไม่สามารถแปลงวันที่ได้
      if (!dateProcessed || !rentalDate || isNaN(rentalDate.getTime())) {
        continue;
      }

      // ตรวจสอบว่าปีตรงกับที่ต้องการหรือไม่
      const rentalYear = rentalDate.getFullYear();
      if (rentalYear !== targetYear) {
        continue;
      }

      // แปลงรายได้เป็นตัวเลข
      let revenue = 0;
      if (typeof revenueValue === 'number') {
        revenue = revenueValue;
      } else if (typeof revenueValue === 'string') {
        // แปลง string เป็นตัวเลข (ลบตัวอักษรที่ไม่ใช่ตัวเลข จุดทศนิยม หรือลบ)
        revenue = parseFloat(revenueValue.replace(/[^\d.-]/g, '')) || 0;
      }

      // เพิ่มข้อมูลลงในอาร์เรย์
      monthlyData.push({
        month: rentalDate.getMonth(), // 0-11
        revenue: revenue
      });

      processedCount++;
    }

    Logger.log(`พบข้อมูลรายได้ปี ${targetYear} จำนวน ${processedCount} รายการ`);
    return monthlyData;
  } catch (error) {
    Logger.log(`เกิดข้อผิดพลาดในการดึงข้อมูลรายได้: ${error.message}`);
    return [];
  }
}






// แก้ไขใน code.txt ในฟังก์ชัน getAllRentals
function getAllRentals(sheetID) {
  try {
    Logger.log(`=== getAllRentals เริ่มทำงาน ===`);
    Logger.log(`Input sheetID: ${sheetID || 'ไม่ได้รับค่า'}`);

    if (!sheetID) {
      Logger.log(`ERROR: ไม่ได้รับค่า sheetID หรือค่าว่างเปล่า`);
      return [];
    }

    const ss = SpreadsheetApp.openById(sheetID);
    Logger.log(`Spreadsheet opened successfully: ${ss.getName()}`);

    const sheet = ss.getSheetByName(RENTAL_SHEET);
    if (!sheet) {
      Logger.log(`Error: ไม่พบ Sheet ชื่อ "${RENTAL_SHEET}"`);
      return [];
    }

    const dataRange = sheet.getDataRange();
    Logger.log(`Data range: ${dataRange.getA1Notation()}`);

    const values = dataRange.getValues();
    Logger.log(`Read ${values.length} rows of data (including header)`);

    if (values.length < 2) {
      Logger.log("ไม่มีข้อมูลใน Sheet (มีแค่ Header หรือว่างเปล่า)");
      return [];
    }

    const headers = values[0].map(h => String(h).trim());
    Logger.log(`Headers found: ${JSON.stringify(headers)}`);

    // เพิ่มการตรวจสอบว่ามีคอลัมน์กิจกรรมปฏิทินหรือไม่
    const calendarHeaders = ["IDกิจกรรมปฏิทิน", "IDปฏิทิน", "ลิงก์ปฏิทิน"];
    const foundCalendarHeaders = calendarHeaders.filter(h => headers.includes(h));
    Logger.log(`Found calendar headers: ${JSON.stringify(foundCalendarHeaders)}`);

    // Ensure required headers exist
    const required = ["วันที่เช่า", "วันที่คืน", "เวลารับรถ", "เวลาคืนรถ", "ราคา", "หมายเลขการจอง"];
    const missing = required.filter(h => headers.indexOf(h) === -1);
    if (missing.length) {
      Logger.log(`Error: Missing headers ${missing.join(', ')}`);
      return [];
    }

    // Process rows
    const rentals = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (!row[headers.indexOf("วันที่เช่า")] && !row[headers.indexOf("หมายเลขการจอง")]) continue;

      const obj = {};
      headers.forEach((h, idx) => {
        let v = row[idx];
        switch (h) {
          case "วันที่เช่า":
          case "วันที่คืน":
            obj[h] = v instanceof Date ? v.toISOString() : null;
            break;
          case "เวลารับรถ":
          case "เวลาคืนรถ":
            obj[h] = formatToHHMM_(v);
            break;
          // === เพิ่มการจัดการข้อมูลกิจกรรมปฏิทิน ===
          case "IDกิจกรรมปฏิทิน":
          case "IDปฏิทิน":
          case "ลิงก์ปฏิทิน":
            // แปลงค่า null, undefined, หรือ empty string เป็น empty string
            // และ log ข้อมูลเพื่อ debug
            const calendarValue = (v === null || v === undefined || v === '') ? '' : String(v).trim();
            obj[h] = calendarValue;

            // Log เฉพาะแถวที่ 2-3 เพื่อไม่ให้ log เยอะเกินไป
            if (i <= 3) {
              Logger.log(`แถว ${i}: ${h} = "${calendarValue}" (original: ${v}, type: ${typeof v})`);
            }
            break;
          default:
            obj[h] = v;
        }
      });
      obj.rowIndex = i + 1;
      rentals.push(obj);
    }

    Logger.log(`ประมวลผลข้อมูลเสร็จสิ้น จำนวน ${rentals.length} รายการ`);

    // Log ตัวอย่างข้อมูลกิจกรรมปฏิทินจากรายการแรก
    if (rentals.length > 0) {
      const firstRental = rentals[0];
      Logger.log(`ตัวอย่างข้อมูลกิจกรรมปฏิทินจากรายการแรก:`, {
        หมายเลขการจอง: firstRental.หมายเลขการจอง,
        IDกิจกรรมปฏิทิน: firstRental.IDกิจกรรมปฏิทิน,
        IDปฏิทิน: firstRental.IDปฏิทิน,
        ลิงก์ปฏิทิน: firstRental.ลิงก์ปฏิทิน
      });
    }

    const json = JSON.stringify(rentals);
    Logger.log(`Return JSON size: ${json.length}`);
    return json;
  } catch (e) {
    Logger.log(`=== CRITICAL ERROR === ${e.message}`);
    return [];
  }
}

// ฟังก์ชันดึงรายการเช่า 4 รายการล่าสุด
function getRecentRentals(sheetID, limit) {
  // Set default value
  if (!limit) limit = 4;

  try {
    Logger.log(`=== getRecentRentals เริ่มทำงาน ===`);
    Logger.log(`Input sheetID: ${sheetID || 'ไม่ได้รับค่า'}, limit: ${limit}`);

    // ตรวจสอบ parameter
    if (!sheetID || sheetID === 'undefined' || sheetID === 'null') {
      Logger.log(`ERROR: ไม่ได้รับค่า sheetID หรือค่าไม่ถูกต้อง: "${sheetID}"`);
      return { success: false, data: [], error: 'Missing or invalid sheetID' };
    }

    // ลองเปิด spreadsheet
    let ss;
    try {
      ss = SpreadsheetApp.openById(sheetID);
    } catch (openError) {
      Logger.log(`ERROR: ไม่สามารถเปิด Spreadsheet ด้วย ID: ${sheetID}`);
      Logger.log(`Error detail: ${openError.message}`);
      return { success: false, data: [], error: 'Cannot open spreadsheet' };
    }

    const sheet = ss.getSheetByName(RENTAL_SHEET);

    if (!sheet) {
      Logger.log(`Error: ไม่พบ Sheet ชื่อ "${RENTAL_SHEET}"`);
      return { success: false, data: [], error: 'Sheet not found' };
    }

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return { success: true, data: [] };
    }

    // คำนวณจำนวนแถวที่จะดึง (ไม่เกิน limit และไม่เกินข้อมูลที่มี)
    const rowsToFetch = Math.min(limit, lastRow - 1);
    const startRow = lastRow - rowsToFetch + 1;

    // ดึงข้อมูลจากแถวล่างสุดขึ้นมา
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const recentData = sheet.getRange(startRow, 1, rowsToFetch, sheet.getLastColumn()).getValues();

    // แปลงเป็น object array และเรียงลำดับจากล่าสุด
    const rentals = [];
    for (let i = recentData.length - 1; i >= 0; i--) {
      const row = recentData[i];
      const obj = {};

      // เก็บทุก field เพื่อให้ครบเหมือนตอนค้นหา
      for (let j = 0; j < headers.length; j++) {
        const h = headers[j];
        const v = row[j];

        // จัดการกับ field วันที่ - ใช้รูปแบบ yyyy-MM-dd เหมือนกับฟังก์ชั่น search
        if ((h === 'วันที่เช่า' || h === 'วันที่คืน') && v instanceof Date) {
          // แก้ปัญหา Timezone โดยการ Format วันที่ใน Timezone กรุงเทพ
          obj[h] = Utilities.formatDate(v, "Asia/Bangkok", "yyyy-MM-dd");
        }
        // จัดการกับ field เวลา - ใช้ formatToHHMM_() เหมือนกับฟังก์ชั่น search
        else if (h === 'เวลารับรถ' || h === 'เวลาคืนรถ') {
          // แก้ปัญหาการแสดงผลเวลา โดยการ Format ให้เป็น HH:mm
          obj[h] = formatToHHMM_(v);
        }
        // field อื่นๆ ทั้งหมด
        else {
          // แปลงค่าให้เป็น string หรือ number ตามประเภท
          if (v === null || v === undefined) {
            obj[h] = '';
          } else if (typeof v === 'number') {
            obj[h] = v; // เก็บเป็น number ไม่ต้องแปลง string
          } else if (typeof v === 'boolean') {
            obj[h] = v;
          } else {
            obj[h] = String(v);
          }
        }
      }

      obj.rowIndex = startRow + i;
      rentals.push(obj);
    }

    Logger.log(`ดึงข้อมูลล่าสุด ${rentals.length} รายการเสร็จสิ้น`);

    // สร้าง result object - ใช้ format ที่ง่ายที่สุด
    const result = {
      success: true,
      data: rentals,
      timestamp: Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss")
    };

    // Log ข้อมูลที่จะ return
    Logger.log(`=== RETURNING RESULT ===`);
    Logger.log(`Success: ${result.success}`);
    Logger.log(`Data length: ${result.data.length}`);
    Logger.log(`First item: ${result.data.length > 0 ? JSON.stringify(result.data[0]).substring(0, 200) : 'No data'}`);

    return result;

  } catch (e) {
    Logger.log(`=== ERROR in getRecentRentals === ${e.message}`);
    Logger.log(`Error stack: ${e.stack}`);
    return {
      success: false,
      data: [],
      error: e.message || 'Unknown error occurred'
    };
  }

  // Safety fallback - should never reach here
  Logger.log(`WARNING: Unexpected code path in getRecentRentals`);
  return {
    success: false,
    data: [],
    error: 'Unexpected error'
  };
}

// ฟังก์ชัน Prewarm Cache สำหรับรายการเช่าล่าสุด
function prewarmRecentRentalsCache(sheetID) {
  try {
    Logger.log(`=== Prewarming Recent Rentals Cache for ${sheetID} ===`);

    // ดึงรายการล่าสุด 4 รายการ
    const result = getRecentRentals(sheetID, 4);

    if (result.success) {
      // สร้าง cache key
      const cacheKey = `recent_rentals_${sheetID}`;
      const cache = CacheService.getScriptCache();

      // เก็บใน cache เป็นเวลา 5 นาที (300 วินาที)
      cache.put(cacheKey, JSON.stringify(result), 300);

      Logger.log(`✅ Successfully prewarmed recent rentals cache for ${sheetID}`);
      return true;
    } else {
      Logger.log(`❌ Failed to prewarm recent rentals cache: ${result.error}`);
      return false;
    }
  } catch (error) {
    Logger.log(`❌ Error in prewarmRecentRentalsCache: ${error.message}`);
    return false;
  }
}

// ฟังก์ชันดึงรายการล่าสุดจาก Cache หรือ Database
function getRecentRentalsWithCache(sheetID, limit = 4) {
  try {
    const cache = CacheService.getScriptCache();
    const cacheKey = `recent_rentals_${sheetID}`;

    // ตรวจสอบ cache ก่อน
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      Logger.log(`✅ Found recent rentals in cache`);
      return JSON.parse(cachedData);
    }

    // ถ้าไม่มีใน cache ให้ดึงจาก database
    Logger.log(`📥 Fetching recent rentals from database`);
    const result = getRecentRentals(sheetID, limit);

    // เก็บใน cache สำหรับครั้งต่อไป
    if (result.success) {
      cache.put(cacheKey, JSON.stringify(result), 300);
    }

    return result;
  } catch (error) {
    Logger.log(`❌ Error in getRecentRentalsWithCache: ${error.message}`);
    return { success: false, data: [], error: error.message };
  }
}

// ฟังก์ชันอัพเดท Cache เมื่อมีการ CRUD รายการเช่า
function invalidateRecentRentalsCache(sheetID) {
  try {
    const cache = CacheService.getScriptCache();
    const cacheKey = `recent_rentals_${sheetID}`;

    // ลบ cache เดิม
    cache.remove(cacheKey);
    Logger.log(`🗑️ Invalidated recent rentals cache for ${sheetID}`);

    // Prewarm cache ใหม่
    prewarmRecentRentalsCache(sheetID);

    return true;
  } catch (error) {
    Logger.log(`❌ Error in invalidateRecentRentalsCache: ${error.message}`);
    return false;
  }
}

// === แนวทางแก้ไขเพิ่มเติม ===
// ถ้ายังไม่ได้ ให้ตรวจสอบว่าคอลัมน์เหล่านี้มีอยู่ใน Google Sheets หรือไม่

function checkCalendarColumns(sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(RENTAL_SHEET);

    if (!sheet) {
      Logger.log("ไม่พบ RENTAL_SHEET");
      return;
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log("Headers ในแผ่นงาน:", headers);

    const calendarColumns = ["IDกิจกรรมปฏิทิน", "IDปฏิทิน", "ลิงก์ปฏิทิน"];

    calendarColumns.forEach(column => {
      const index = headers.indexOf(column);
      if (index === -1) {
        Logger.log(`❌ ไม่พบคอลัมน์: ${column}`);
      } else {
        Logger.log(`✅ พบคอลัมน์: ${column} ที่ตำแหน่ง ${index + 1}`);

        // ตรวจสอบข้อมูลในคอลัมน์นี้ (5 แถวแรก)
        const dataRange = sheet.getRange(2, index + 1, Math.min(5, sheet.getLastRow() - 1), 1);
        const data = dataRange.getValues().flat();
        Logger.log(`   ข้อมูลในคอลัมน์ ${column}: ${JSON.stringify(data)}`);
      }
    });

  } catch (error) {
    Logger.log("เกิดข้อผิดพลาดในการตรวจสอบคอลัมน์:", error);
  }
}

// === ฟังก์ชันเพิ่มคอลัมน์หากไม่มี ===
function ensureCalendarColumns(sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(RENTAL_SHEET);

    if (!sheet) {
      Logger.log("ไม่พบ RENTAL_SHEET");
      return { success: false, message: "ไม่พบ RENTAL_SHEET" };
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const calendarColumns = ["IDกิจกรรมปฏิทิน", "IDปฏิทิน", "ลิงก์ปฏิทิน"];
    const columnsAdded = [];

    calendarColumns.forEach(column => {
      if (headers.indexOf(column) === -1) {
        // เพิ่มคอลัมน์ใหม่
        sheet.insertColumnAfter(sheet.getLastColumn());
        const newColumnIndex = sheet.getLastColumn();
        sheet.getRange(1, newColumnIndex).setValue(column);

        Logger.log(`✅ เพิ่มคอลัมน์: ${column} ที่ตำแหน่ง ${newColumnIndex}`);
        columnsAdded.push(column);
      }
    });

    return {
      success: true,
      message: columnsAdded.length > 0
        ? `เพิ่มคอลัมน์: ${columnsAdded.join(', ')}`
        : "คอลัมน์ครบถ้วนแล้ว",
      columnsAdded: columnsAdded
    };

  } catch (error) {
    Logger.log("เกิดข้อผิดพลาดในการเพิ่มคอลัมน์:", error);
    return { success: false, message: error.toString() };
  }
}

// === ฟังก์ชันเพิ่มคอลัมน์คาร์ซีทและประกันเสริมหากไม่มี ===
function ensureCarSeatAndInsuranceColumns(sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const rentalSheet = ss.getSheetByName(RENTAL_SHEET);
    const configSheet = ss.getSheetByName(CONFIG_SHEET);

    if (!rentalSheet) {
      Logger.log("ไม่พบ RENTAL_SHEET");
      return { success: false, message: "ไม่พบ RENTAL_SHEET" };
    }

    let headers = rentalSheet.getRange(1, 1, 1, rentalSheet.getLastColumn()).getValues()[0];
    const newColumns = [
      "ต้องการคาร์ซีท",
      "คาร์ซีทมีค่าบริการ",
      "ค่าคาร์ซีท",
      "ต้องการประกันเสริม",
      "จำนวนวันประกันเสริม",
      "ราคาประกันเสริมต่อวัน",
      "ค่าประกันเสริมรวม"
    ];
    const columnsAdded = [];

    // Track column index manually เพื่อหลีกเลี่ยงปัญหา getLastColumn() ที่ cache ค่า
    let currentColumnIndex = headers.length;

    newColumns.forEach(column => {
      if (headers.indexOf(column) === -1) {
        // เพิ่ม column index
        currentColumnIndex++;

        // เพิ่มคอลัมน์ใหม่ที่ตำแหน่งถัดไป
        rentalSheet.insertColumnAfter(currentColumnIndex - 1);
        rentalSheet.getRange(1, currentColumnIndex).setValue(column);

        Logger.log(`✅ เพิ่มคอลัมน์: ${column} ที่ตำแหน่ง ${currentColumnIndex}`);
        columnsAdded.push(column);

        // อัปเดต headers array
        headers.push(column);
      }
    });

    // เพิ่มคีย์ "ค่าประกันเสริมต่อวัน" ใน CONFIG_SHEET หากยังไม่มี
    if (configSheet) {
      const configData = configSheet.getDataRange().getValues();
      const configHeaders = configData.length > 0 ? configData[0] : [];
      const keyColumnIndex = configHeaders.indexOf("คีย์");
      const valueColumnIndex = configHeaders.indexOf("ค่า");

      if (keyColumnIndex !== -1 && valueColumnIndex !== -1) {
        let insuranceKeyExists = false;

        // ตรวจสอบว่ามีคีย์นี้อยู่แล้วหรือไม่
        for (let i = 1; i < configData.length; i++) {
          if (configData[i][keyColumnIndex] === "ค่าประกันเสริมต่อวัน") {
            insuranceKeyExists = true;
            break;
          }
        }

        // ถ้ายังไม่มี ให้เพิ่มคีย์ใหม่
        if (!insuranceKeyExists) {
          configSheet.appendRow(["ค่าประกันเสริมต่อวัน", 200]); // ค่าเริ่มต้น 200 บาท/วัน
          Logger.log("✅ เพิ่มคีย์ 'ค่าประกันเสริมต่อวัน' ใน CONFIG_SHEET");
          columnsAdded.push("คีย์: ค่าประกันเสริมต่อวัน (CONFIG_SHEET)");
        }
      }
    }

    return {
      success: true,
      message: columnsAdded.length > 0
        ? `เพิ่มคอลัมน์/คีย์: ${columnsAdded.join(', ')}`
        : "คอลัมน์และคีย์ครบถ้วนแล้ว",
      columnsAdded: columnsAdded
    };

  } catch (error) {
    Logger.log("เกิดข้อผิดพลาดในการเพิ่มคอลัมน์คาร์ซีทและประกันเสริม:", error);
    return { success: false, message: error.toString() };
  }
}











function formatToHHMM_(value) {
  // กำหนด timezone แบบตายตัวเป็น Asia/Bangkok
  const timezone = "Asia/Bangkok";

  // กรณีเป็น Date Object ที่ถูกต้อง
  if (value instanceof Date && !isNaN(value.getTime())) {
    try {
      // ใช้ Utilities.formatDate พร้อมกับ timezone ที่กำหนดตายตัว
      return Utilities.formatDate(value, timezone, 'HH:mm');
    } catch (e) {
      // Fallback เผื่อมีปัญหากับ Utilities.formatDate
      Logger.log(`Utilities.formatDate error for ${value}: ${e}. Using fallback getHours/getMinutes.`);
      const hours = value.getHours().toString().padStart(2, '0');
      const minutes = value.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    // กรณีเป็น String ที่ดูเหมือนเวลาอยู่แล้ว
  } else if (typeof value === 'string') {
    // ตรวจสอบรูปแบบ HH:MM หรือ H:MM
    const match = value.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      // จัดรูปแบบให้เป็น HH:MM เสมอ (เติม 0 ข้างหน้าถ้าหลักเดียว)
      const hours = match[1].padStart(2, '0');
      const minutes = match[2].padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    // พยายามแปลงจาก String เป็น Date ถ้าทำได้
    try {
      const dateFromString = new Date(value);
      if (!isNaN(dateFromString.getTime())) {
        return Utilities.formatDate(dateFromString, timezone, 'HH:mm');
      }
    } catch (error) {
      Logger.log(`Error converting string to date: ${error.message}`);
    }

    // กรณีเป็นตัวเลข (Serial time ของ Excel/Sheets)
  } else if (typeof value === 'number') {
    // ถ้าเป็นตัวเลขที่น่าจะเป็นเวลา (< 1 หรือเศษส่วนของวัน)
    if (value >= 0 && value < 1) {
      // แปลงตัวเลขเป็นจำนวนนาทีตั้งแต่เริ่มวัน
      const totalMinutes = Math.round(value * 24 * 60);
      const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
      const minutes = (totalMinutes % 60).toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    // กรณีเป็นตัวเลขที่มีค่ามากกว่า 1 (อาจมีวันที่รวมอยู่ด้วย)
    else if (value >= 1 && value < 5) {
      // ใช้เฉพาะเศษส่วนของวัน
      const fractionalDay = value - Math.floor(value);
      const totalMinutes = Math.round(fractionalDay * 24 * 60);
      const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
      const minutes = (totalMinutes % 60).toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  }

  // กรณีอื่นๆ หรือค่าไม่ถูกต้อง
  Logger.log(`ไม่สามารถแปลงค่าเวลา "${value}" (ประเภท ${typeof value}) เป็น HH:MM ได้`);
  return ""; // คืนค่าว่างถ้าแปลงไม่ได้
}








/**
 * ดึงข้อมูลตารางรับส่งรถสำหรับวันที่ที่ระบุ พร้อมข้อมูลใบเสร็จที่อัปเดตแล้ว
 * @param {string} dateString - วันที่ในรูปแบบ "yyyy-MM-dd"
 * @param {string} sheetID - ไอดีของ Google Sheet
 * @returns {string} - ผลลัพธ์ในรูปแบบ JSON string
 */
function getScheduleForDate(dateString, sheetID) {
  Logger.log(`[getScheduleForDate] กำลังดึงข้อมูลสดสำหรับวันที่: ${dateString}`);
  try {
    if (!dateString) {
      return JSON.stringify({ success: false, message: 'ไม่ได้รับข้อมูลวันที่' });
    }

    const timeZone = Session.getScriptTimeZone();

    const ss = SpreadsheetApp.openById(sheetID);
    const scheduleSheet = ss.getSheetByName(SCHEDULE_SHEET);
    const rentalSheet = ss.getSheetByName(RENTAL_SHEET);

    if (!scheduleSheet || !rentalSheet) {
      return JSON.stringify({ success: false, message: 'ไม่พบชีต SCHEDULE_SHEET หรือ RENTAL_SHEET' });
    }

    // --- ส่วนที่แก้ไข: ดึง ReceiptInfo, คาร์ซีท, และประกันเสริม ---
    const rentalValues = rentalSheet.getDataRange().getValues();
    const rentalHeaders = rentalValues.length > 0 ? rentalValues[0].map(h => String(h).trim()) : [];
    const rentalBookingNoIndex = rentalHeaders.indexOf("หมายเลขการจอง");
    const rentalPhoneIndex = rentalHeaders.indexOf("เบอร์โทรศัพท์");
    const rentalPickupLocationIndex = rentalHeaders.indexOf("สถานที่รับรถ");
    const rentalReturnLocationIndex = rentalHeaders.indexOf("สถานที่คืนรถ");
    const receiptInfoIndex = rentalHeaders.indexOf("ReceiptInfo"); // << แก้ไข: เปลี่ยนมาใช้คอลัมน์ใหม่
    const carSeatIndex = rentalHeaders.indexOf("ต้องการคาร์ซีท"); // เพิ่มข้อมูลคาร์ซีท
    const insuranceIndex = rentalHeaders.indexOf("ต้องการประกันเสริม"); // เพิ่มข้อมูลประกันเสริม

    const rentalDetailsMap = new Map();
    for (let i = 1; i < rentalValues.length; i++) {
      const row = rentalValues[i];
      const bookingNo = row[rentalBookingNoIndex];
      if (bookingNo) {
        rentalDetailsMap.set(bookingNo, {
          เบอร์โทรศัพท์: row[rentalPhoneIndex] || "",
          สถานที่รับรถ: row[rentalPickupLocationIndex] || "",
          สถานที่คืนรถ: row[rentalReturnLocationIndex] || "",
          // << แก้ไข: อ่านจากคอลัมน์ใหม่
          ReceiptInfo: (receiptInfoIndex !== -1) ? (row[receiptInfoIndex] || '{}') : '{}',
          // เพิ่มข้อมูลคาร์ซีทและประกันเสริม
          ต้องการคาร์ซีท: (carSeatIndex !== -1) ? (row[carSeatIndex] === true || row[carSeatIndex] === 'TRUE' || row[carSeatIndex] === 'true') : false,
          ต้องการประกันเสริม: (insuranceIndex !== -1) ? (row[insuranceIndex] === true || row[insuranceIndex] === 'TRUE' || row[insuranceIndex] === 'true') : false
        });
      }
    }

    const scheduleValues = scheduleSheet.getDataRange().getValues();
    const scheduleHeaders = scheduleValues.length > 0 ? scheduleValues[0].map(h => String(h).trim()) : [];
    const scheduleDateIndex = scheduleHeaders.indexOf("วันที่");
    const scheduleBookingNoIndex = scheduleHeaders.indexOf("หมายเลขการจอง");
    const pickups = [];
    const returns = [];

    for (let i = 1; i < scheduleValues.length; i++) {
      const scheduleRow = scheduleValues[i];
      const itemDateValue = scheduleRow[scheduleDateIndex];
      if (!itemDateValue || !(itemDateValue instanceof Date)) continue;

      const itemDateStr = Utilities.formatDate(new Date(itemDateValue), timeZone, "yyyy-MM-dd");
      if (itemDateStr === dateString) {
        const schedule = {};
        scheduleHeaders.forEach((header, j) => {
          if (header === 'เวลา') {
            schedule[header] = formatToHHMM_(scheduleRow[j]);
          } else if (scheduleRow[j] instanceof Date) {
            schedule[header] = scheduleRow[j].toISOString();
          } else {
            schedule[header] = scheduleRow[j];
          }
        });

        const bookingNumber = scheduleRow[scheduleBookingNoIndex];
        const matchingRentalDetails = rentalDetailsMap.get(bookingNumber);
        if (matchingRentalDetails) {
          schedule.เบอร์โทรศัพท์ = matchingRentalDetails.เบอร์โทรศัพท์;
          schedule.สถานที่รับรถ = matchingRentalDetails.สถานที่รับรถ;
          schedule.สถานที่คืนรถ = matchingRentalDetails.สถานที่คืนรถ;
          // << แก้ไข: เพิ่มข้อมูล ReceiptInfo เข้าไปใน Object ที่จะส่งกลับ
          schedule.ReceiptInfo = matchingRentalDetails.ReceiptInfo;
          // เพิ่มข้อมูลคาร์ซีทและประกันเสริมสำหรับแสดง badge ใน timeline
          schedule.ต้องการคาร์ซีท = matchingRentalDetails.ต้องการคาร์ซีท;
          schedule.ต้องการประกันเสริม = matchingRentalDetails.ต้องการประกันเสริม;
        }

        schedule.id = `schedule_${i}`;
        if (schedule['ประเภท'] === 'รับรถ') {
          pickups.push(schedule);
        } else if (schedule['ประเภท'] === 'ส่งคืนรถ') {
          returns.push(schedule);
        }
      }
    }

    const result = JSON.stringify({
      success: true,
      data: {
        pickups: pickups,
        returns: returns
      }
    });
    return result;
  } catch (e) {
    Logger.log(`Error in getScheduleForDate: ${e.message} \n ${e.stack}`);
    return JSON.stringify({ success: false, message: e.message });
  }
}



function test_getSchedule() {
  // === กรุณาใส่ Sheet ID ของคุณที่นี่ ===
  const sheetID = "1RjRI5kY4QKxVIU4iZWi65rIc_H7JDpwBrZLnTrznYuQ";

  if (sheetID === "YOUR_SPREADSHEET_ID_HERE" || !sheetID) {
    Logger.log("!!! คำเตือน: กรุณาเปลี่ยน YOUR_SPREADSHEET_ID_HERE เป็น Sheet ID จริงของคุณก่อนรันฟังก์ชันนี้");
    return;
  }

  Logger.log(`--- เริ่มการทดสอบฟังก์ชัน getSchedule ด้วย Sheet ID: ${sheetID} ---`);

  try {
    const result = getSchedule(sheetID);

    // ตรวจสอบผลลัพธ์ที่ได้
    if (result && Array.isArray(result)) {
      Logger.log(`--> การทำงานเสร็จสิ้น พบข้อมูลทั้งหมด: ${result.length} รายการ`);

      if (result.length > 0) {
        // แสดงตัวอย่างข้อมูล 5 รายการแรกเพื่อไม่ให้ Log ยาวเกินไป
        Logger.log("--> ตัวอย่างข้อมูล 5 รายการแรก:");
        Logger.log(JSON.stringify(result.slice(0, 5), null, 2));
      } else {
        Logger.log("--> ผลลัพธ์เป็น Array ว่าง อาจเป็นเพราะไม่พบข้อมูลในชีต 'ตารางรับส่งรถ' หรือชื่อชีต/คอลัมน์ไม่ถูกต้อง");
      }

    } else {
      Logger.log("--> ฟังก์ชัน getSchedule ไม่ได้คืนค่าเป็น Array หรือมีค่าเป็น null/undefined");
      Logger.log("--> ผลลัพธ์ที่ได้รับ:");
      Logger.log(result);
    }

  } catch (e) {
    Logger.log(`!!! เกิดข้อผิดพลาดร้ายแรงระหว่างการทดสอบ: ${e.toString()}`);
    Logger.log(`Stack Trace: ${e.stack}`);
  }

  Logger.log("--- สิ้นสุดการทดสอบ ---");
}












/**
 * ⭐ (ฉบับสมบูรณ์) ฟังก์ชันสำหรับอัปโหลดไฟล์และคืนค่า File ID
 * @param {Object} imageData - อ็อบเจกต์ข้อมูลรูปภาพ { base64, name, type }
 * @param {string} fileName - ชื่อไฟล์ใหม่ที่ต้องการบันทึก
 * @param {string} folderId - ID ของโฟลเดอร์ที่จะเก็บไฟล์
 * @returns {Object} ผลลัพธ์การอัปโหลด
 */
function uploadImageAndGetFileId(imageData, fileName, folderId) {
  try {
    const mimeType = imageData.type || 'application/octet-stream'; // ใช้ type ที่ส่งมา หรือใช้ค่าดีฟอลต์
    const decodedData = Utilities.base64Decode(imageData.base64);

    const blob = Utilities.newBlob(decodedData, mimeType, fileName);

    const folder = DriveApp.getFolderById(folderId);
    const file = folder.createFile(blob);

    return { success: true, fileId: file.getId() };

  } catch (e) {
    Logger.log("Upload Error for " + fileName + ": " + e.toString());
    return { success: false, message: e.toString() };
  }
}





//=============================================================================
// 1.3 เพิ่มฟังก์ชัน OCR สำหรับบัตรประชาชนและใบขับขี่
//=============================================================================

// function processIDImage(dataUrl, mimeType) {
//   var bytes = Utilities.base64Decode(dataUrl.split(',')[1]);
//   var blob = Utilities.newBlob(bytes, mimeType, 'uploadedImage.jpg');
//   var formData = {
//     'file': blob
//   };
//   var options = {
//     'method': 'post',
//     'payload': formData,
//     'headers': {
//       'Apikey': 'AfjvxpZHzOubBbdCI9y0iS9qMeGh8CFg' // API Key ของคุณ
//     },
//     'muteHttpExceptions': true
//   };
//   var response = UrlFetchApp.fetch('https://api.aiforthai.in.th/ocr-id-front-iapp', options);
//   var data = JSON.parse(response.getContentText());
//   Logger.log(data);
//   return data;
// }


function processIDImage(dataUrl, mimeType) {
  // Decode Base64 ➔ Blob พร้อมตั้งชื่อ
  const bytes = Utilities.base64Decode(dataUrl.split(',')[1]);
  const blob = Utilities.newBlob(bytes, mimeType, 'idcard.jpg');

  // FormData payload
  const options = {
    method: 'post',
    payload: { file: blob },
    headers: { 'Apikey': 'AfjvxpZHzOubBbdCI9y0iS9qMeGh8CFg' },
    muteHttpExceptions: true
  };

  // เรียก API ด้วย multipart/form-data
  const res = UrlFetchApp.fetch(
    'https://api.aiforthai.in.th/ocr-id-front-iapp',
    options
  );

  if (res.getResponseCode() !== 200) {
    throw new Error('API error: ' + res.getContentText());
  }
  return JSON.parse(res.getContentText());
}



function getTextFromImage(base64Data, fileName) {
  try {
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data.split(',')[1]), 'image/jpeg', fileName);
    var resource = {
      title: fileName,
      mimeType: blob.getContentType() // <-- ★★★ แก้ไขจุดที่ 1: เปลี่ยนจาก getMimeType เป็น getContentType
    };
    var options = {
      ocr: true
    };
    var docFile = Drive.Files.insert(resource, blob, options); // <-- ★★★ แก้ไขจุดที่ 2: เปลี่ยนจาก file.getBlob() เป็น blob
    var doc = DocumentApp.openById(docFile.id);
    var text = doc.getBody().getText();
    Drive.Files.remove(docFile.id); // ลบไฟล์เอกสารชั่วคราว

    // ตรวจจับและส่งกลับตัวเลข 8 หลักชุดแรก
    var pattern = /\b\d{8}\b/;
    var match = text.match(pattern);

    if (match) {
      return match[0];
    } else {
      return 'ไม่พบข้อมูลที่ต้องการ';
    }
  } catch (e) {
    Logger.log("Error in getTextFromImage: " + e.toString());
    return "เกิดข้อผิดพลาดในการประมวลผล";
  }
}




// =============================================================================
// ฟังก์ชัน updateRental() - แก้ไขแล้ว ✅
// =============================================================================

// function updateRental(rowIndex, rentalData, sheetID) {
//   const ss = SpreadsheetApp.openById(sheetID);
//   const sheet = ss.getSheetByName(RENTAL_SHEET);

//   const bookingNumber = rentalData.หมายเลขการจอง;

//   if (!bookingNumber) {
//     return { success: false, message: "ไม่พบหมายเลขการจองในข้อมูลที่ต้องการอัพเดต" };
//   }

//   try {
//     const data = sheet.getDataRange().getValues();
//     const headers = data[0];
//     const bookingNumberIndex = headers.indexOf("หมายเลขการจอง");

//     if (bookingNumberIndex === -1) {
//       return { success: false, message: "ไม่พบคอลัมน์หมายเลขการจอง" };
//     }

//     // ตรวจสอบและเพิ่มคอลัมน์ค่าคอมมิชชั่นถ้ายังไม่มี
//     let commissionIndex = headers.indexOf("ค่าคอมมิชชั่น");
//     let commissionTypeIndex = headers.indexOf("รูปแบบค่าคอมมิชชั่น");

//     if (commissionIndex === -1) {
//       sheet.getRange(1, headers.length + 1).setValue("ค่าคอมมิชชั่น");
//       headers.push("ค่าคอมมิชชั่น");
//       commissionIndex = headers.length - 1;
//     }

//     if (commissionTypeIndex === -1) {
//       sheet.getRange(1, headers.length + 1).setValue("รูปแบบค่าคอมมิชชั่น");
//       headers.push("รูปแบบค่าคอมมิชชั่น");
//       commissionTypeIndex = headers.length - 1;
//     }

//     // ค้นหาแถวที่ต้องการอัพเดต
//     let currentRowIndex = -1;
//     for (let i = 1; i < data.length; i++) {
//       if (data[i][bookingNumberIndex] === bookingNumber) {
//         currentRowIndex = i + 1;
//         break;
//       }
//     }

//     if (currentRowIndex === -1) {
//       return { success: false, message: "ไม่พบรายการเช่าที่ต้องการอัพเดต" };
//     }

//     // ✅ เตรียมข้อมูลทั้งแถวสำหรับการอัพเดต (ใช้ setValues แทน setValue)
//     const rowData = [];

//     for (let i = 0; i < headers.length; i++) {
//       let value;

//       // จัดการคอลัมน์ค่าคอมมิชชั่น
//       if (headers[i] === "ค่าคอมมิชชั่น") {
//         value = parseFloat(rentalData["ค่าคอมมิชชั่น"]) || 0;
//       }
//       else if (headers[i] === "รูปแบบค่าคอมมิชชั่น") {
//         value = rentalData["ค่าคอมมิชชั่นที่เลือก"] || "";
//       }
//       else if (headers[i] === "ผู้ทำรายการ") {
//         value = rentalData["ผู้ทำรายการ"] || "";
//       }
//       // ✅ เพิ่ม ' หน้าเบอร์โทรศัพท์เพื่อบังคับให้เป็น text
//       else if (headers[i] === "เบอร์โทรศัพท์") {
//         const phoneNumber = rentalData[headers[i]] || "";
//         // เพิ่ม ' หน้าเบอร์โทรศัพท์ถ้ายังไม่มี
//         if (phoneNumber && !phoneNumber.toString().startsWith("'")) {
//           value = "'" + phoneNumber;
//         } else {
//           value = phoneNumber;
//         }
//       }
//       else {
//         value = rentalData[headers[i]] || "";
//       }

//       rowData.push(value);
//     }

//     // ✅ ตั้งค่าฟอร์แมตคอลัมน์เบอร์โทรศัพท์ก่อนอัพเดตข้อมูล


//     // ✅ อัพเดตทั้งแถวพร้อมกัน (ใช้ setValues แทน setValue)
//     sheet.getRange(currentRowIndex, 1, 1, rowData.length).setValues([rowData]);

//     // ตั้งค่าฟอร์แมตหลังจากบันทึกข้อมูลแล้ว
//     setupColumnFormatting(sheet, headers, currentRowIndex, rentalData);

//    fixExistingPhoneNumbers(sheetID);

//     // อัพเดตข้อมูลในตารางรับส่งรถและรายรับรายจ่าย
//     updateScheduleBooking(rentalData, sheetID);

//     // เรียกใช้ฟังก์ชันใหม่ที่รองรับค่าคอมมิชชั่น
//     addOrUpdateFinancialRecordWithCommission(sheetID, rentalData.หมายเลขการจอง, rentalData, 'update');
//     clearSummaryCacheForTenant(sheetID);

//     return { success: true, message: "อัพเดตรายการเช่าสำเร็จ" };
//   } catch (e) {
//     return { success: false, message: "เกิดข้อผิดพลาดในการอัพเดตรายการเช่า: " + e.toString() };
//   }
// }

// ==========================================
// 📸 ฟังก์ชันจัดการรูปภาพรายการเช่า
// ==========================================

/**
 * อัพโหลดรูปภาพสำหรับรายการเช่า
 * @param {Object} imageData - ข้อมูลรูปภาพ
 * @param {string} sheetID - ID ของ Google Sheets
 * @returns {Object} ผลลัพธ์การอัพโหลด
 */
function uploadRentalImages(imageData, sheetID) {
  const startTime = new Date();
  Logger.log("🚀 [uploadRentalImages] เริ่มการอัพโหลดรูปภาพ: " + startTime.toISOString());

  try {
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!imageData || !imageData.bookingNumber || !imageData.images) {
      return { success: false, message: "ข้อมูลไม่ครบถ้วน" };
    }

    if (!Array.isArray(imageData.images) || imageData.images.length === 0) {
      return { success: false, message: "ไม่มีรูปภาพที่จะอัพโหลด" };
    }

    Logger.log("📋 [uploadRentalImages] รายการรูปภาพ: " + imageData.images.length + " ไฟล์");

    // หา Google Drive folder สำหรับเก็บรูปภาพ
    const config = getSystemConfig(sheetID).config;
    const rootFolderId = config.IDโฟลเดอร์สัญญาเช่า;
    if (!rootFolderId) {
      return { success: false, message: "ไม่พบการตั้งค่า IDโฟลเดอร์สัญญาเช่า" };
    }

    // ใช้ฟังก์ชันเดียวกับ addNewRental
    const bookingFolder = createOrGetFolder(imageData.bookingNumber, rootFolderId);
    if (!bookingFolder) {
      return { success: false, message: "ไม่สามารถสร้างโฟลเดอร์สำหรับเก็บรูปภาพได้" };
    }

    Logger.log("📁 [uploadRentalImages] ใช้โฟลเดอร์: " + bookingFolder.getName());

    // ลบไฟล์เก่า (ถ้ามี)
    if (imageData.oldImageIds && Array.isArray(imageData.oldImageIds)) {
      Logger.log("🗑️ [uploadRentalImages] ลบรูปภาพเก่า: " + imageData.oldImageIds.length + " ไฟล์");
      imageData.oldImageIds.forEach(fileId => {
        if (fileId) {
          try {
            DriveApp.getFileById(fileId).setTrashed(true);
            Logger.log("✅ ลบไฟล์ ID: " + fileId + " สำเร็จ");
          } catch (e) {
            Logger.log("⚠️ ไม่สามารถลบไฟล์ ID: " + fileId + " - " + e.message);
          }
        }
      });
    }

    // อัพโหลดรูปภาพใหม่
    const imageFileIds = {};
    const uploadedFiles = [];

    for (let i = 0; i < imageData.images.length; i++) {
      const image = imageData.images[i];

      try {
        Logger.log(`📤 [uploadRentalImages] อัพโหลดรูปที่ ${i + 1}: ${image.name}`);

        // สร้างชื่อไฟล์ใหม่
        const bookingId = imageData.bookingNumber;
        const originalName = image.name;
        const extension = originalName.includes('.') ? originalName.split('.').pop() : 'jpg';

        // กำหนด fieldName สำหรับรูปภาพแต่ละรูป
        let fieldName = `รูปเอกสารเพิ่มเติม${i + 1}`;
        if (i === 0) fieldName = 'รูปบัตรประชาชน';
        else if (i === 1) fieldName = 'รูปใบขับขี่';

        const newFileName = `${fieldName}_${bookingId}.${extension}`;

        // อัพโหลดไฟล์
        const uploadResult = uploadImageAndGetFileId({
          base64: image.base64,
          name: image.name,
          type: `image/${extension}`
        }, newFileName, bookingFolder.getId());

        if (uploadResult.success) {
          imageFileIds[fieldName] = uploadResult.fileId;
          uploadedFiles.push({
            fieldName: fieldName,
            fileName: newFileName,
            fileId: uploadResult.fileId,
            originalName: image.name
          });
          Logger.log(`✅ [uploadRentalImages] อัพโหลดสำเร็จ: ${newFileName}`);
        } else {
          Logger.log(`❌ [uploadRentalImages] อัพโหลดล้มเหลว: ${image.name} - ${uploadResult.message}`);
        }

      } catch (e) {
        Logger.log(`❌ [uploadRentalImages] อัพโหลดล้มเหลว: ${image.name} - ${e.message}`);
      }
    }

    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    Logger.log(`🏁 [uploadRentalImages] เสร็จสิ้น: ${uploadedFiles.length}/${imageData.images.length} ไฟล์ (${duration}s)`);

    return {
      success: true,
      imageFileIds: imageFileIds,
      uploadedFiles: uploadedFiles,
      uploadedCount: uploadedFiles.length,
      totalCount: imageData.images.length
    };

  } catch (e) {
    Logger.log("💥 [uploadRentalImages] Error: " + e.toString());
    return {
      success: false,
      message: e.toString()
    };
  }
}

/**
 * อัพเดตข้อมูลรูปภาพในแผ่นงานรายการเช่า
 * @param {string} bookingNumber - หมายเลขการจอง
 * @param {Object} imageFileIds - Object ที่มี File ID ของรูปภาพ
 * @param {string} sheetID - ID ของ Google Sheets
 * @returns {Object} ผลลัพธ์การอัพเดต
 */
function updateRentalImageData(bookingNumber, imageFileIds, sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName("รายการเช่า");

    if (!sheet) {
      return { success: false, message: "ไม่พบแผ่นงาน 'รายการเช่า'" };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // หาคอลัมน์ที่ต้องการ
    const bookingNumberIndex = headers.indexOf("หมายเลขการจอง");

    if (bookingNumberIndex === -1) {
      return { success: false, message: "ไม่พบคอลัมน์ 'หมายเลขการจอง'" };
    }

    // เพิ่มคอลัมน์รูปภาพถ้ายังไม่มี
    const requiredImageColumns = [
      "รูปบัตรประชาชน", "รูปใบขับขี่", "รูปเอกสารเพิ่มเติม1",
      "รูปเอกสารเพิ่มเติม2", "รูปเอกสารเพิ่มเติม3"
    ];

    let currentHeaders = [...headers];
    requiredImageColumns.forEach(colName => {
      if (!currentHeaders.includes(colName)) {
        sheet.insertColumnAfter(currentHeaders.length);
        sheet.getRange(1, currentHeaders.length + 1).setValue(colName);
        currentHeaders.push(colName);
      }
    });

    // ค้นหาแถวที่ตรงกับหมายเลขการจอง
    let targetRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][bookingNumberIndex] === bookingNumber) {
        targetRowIndex = i;
        break;
      }
    }

    if (targetRowIndex === -1) {
      return { success: false, message: `ไม่พบการจองหมายเลข: ${bookingNumber}` };
    }

    // อัพเดตข้อมูลรูปภาพในแต่ละคอลัมน์
    for (const fieldName in imageFileIds) {
      const columnIndex = currentHeaders.indexOf(fieldName);
      if (columnIndex !== -1) {
        sheet.getRange(targetRowIndex + 1, columnIndex + 1).setValue(imageFileIds[fieldName]);
        Logger.log(`📝 อัพเดต ${fieldName}: ${imageFileIds[fieldName]}`);
      }
    }

    Logger.log("✅ อัพเดตข้อมูลรูปภาพสำเร็จ: " + bookingNumber);
    return { success: true, message: "อัพเดตข้อมูลรูปภาพสำเร็จ" };

  } catch (e) {
    Logger.log("❌ อัพเดตข้อมูลรูปภาพไม่สำเร็จ: " + e.toString());
    return { success: false, message: e.toString() };
  }
}

/**
 * ลบรูปภาพตาม File ID
 * @param {string} fileId - ID ของไฟล์
 * @param {string} sheetID - ID ของ Google Sheets
 * @returns {Object} ผลลัพธ์การลบ
 */
function deleteRentalImage(fileId, sheetID) {
  try {
    if (!fileId) {
      return { success: false, message: "ไม่พบ ID ของไฟล์" };
    }

    const file = DriveApp.getFileById(fileId);
    file.setTrashed(true);

    Logger.log("✅ ลบไฟล์ ID: " + fileId + " สำเร็จ");
    return { success: true, message: "ลบไฟล์สำเร็จ" };

  } catch (e) {
    Logger.log("❌ ลบไฟล์ไม่สำเร็จ: " + e.toString());
    return { success: false, message: e.toString() };
  }
}



// =============================================================================
// 4. แก้ไขฟังก์ชัน updateScheduleBooking() - เพิ่ม ' หน้าเบอร์โทรศัพท์
// =============================================================================

function updateScheduleBooking(rentalData, sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);
  const sheet = ss.getSheetByName(SCHEDULE_SHEET);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const bookingNumberIndex = headers.indexOf("หมายเลขการจอง");

  if (bookingNumberIndex === -1) return; // ไม่พบคอลัมน์หมายเลขการจอง

  // ค้นหารายการในตารางรับส่งรถที่มีหมายเลขการจองตรงกัน
  for (let i = 1; i < data.length; i++) {
    if (data[i][bookingNumberIndex] === rentalData.หมายเลขการจอง) {
      // อัพเดตข้อมูลในตารางรับส่งรถ
      const scheduleRow = [];
      for (let j = 0; j < headers.length; j++) {
        if (headers[j] === "หมายเลขการจอง") {
          scheduleRow.push(rentalData.หมายเลขการจอง);
        } else if (headers[j] === "ชื่อลูกค้า") {
          scheduleRow.push(rentalData.ชื่อลูกค้า);
        } else if (headers[j] === "รถ") {
          scheduleRow.push(rentalData.รถ);
        } else if (headers[j] === "หมายเหตุ") {
          scheduleRow.push(rentalData.หมายเหตุ);
        }
        // ✅ เพิ่มการจัดการเบอร์โทรศัพท์ในตารางรับส่งรถด้วย
        else if (headers[j] === "เบอร์โทรศัพท์") {
          const phoneNumber = rentalData.เบอร์โทรศัพท์ || "";
          if (phoneNumber && !phoneNumber.toString().startsWith("'")) {
            scheduleRow.push("'" + phoneNumber);
          } else {
            scheduleRow.push(phoneNumber);
          }
        }
        else {
          // คงค่าเดิมสำหรับฟิลด์อื่นๆ
          scheduleRow.push(data[i][j]);
        }
      }

      // อัพเดตข้อมูลในแถว
      sheet.getRange(i + 1, 1, 1, scheduleRow.length).setValues([scheduleRow]);
    }
  }
}

// =============================================================================
// 5. ฟังก์ชันใหม่: fixExistingPhoneNumbers() - แก้ไขเบอร์โทรศัพท์ที่มีอยู่แล้วทั้งหมด
// =============================================================================

function fixExistingPhoneNumbers(sheetID) {
  try {
    setupPhoneNumberColumn(sheetID);
    return { success: true, message: "แก้ไขเบอร์โทรศัพท์ที่มีอยู่แล้วสำเร็จ" };
  } catch (e) {
    return { success: false, message: "เกิดข้อผิดพลาดในการแก้ไขเบอร์โทรศัพท์: " + e.toString() };
  }
}







// function searchCustomer(searchQuery, sheetID) {
//   if (!searchQuery || searchQuery.trim().length < 2) {
//     return { success: false, message: "กรุณาระบุคำค้นหาอย่างน้อย 2 ตัวอักษร" };
//   }

//   const ss = SpreadsheetApp.openById(sheetID);
//   const sheet = ss.getSheetByName(RENTAL_SHEET);

//   // ตรวจสอบว่ามีข้อมูลในชีทหรือไม่
//   if (sheet.getLastRow() <= 1) {
//     return { success: false, message: "ไม่พบข้อมูลลูกค้าในระบบ" };
//   }

//   // ดึงข้อมูลทั้งหมด
//   const data = sheet.getDataRange().getValues();
//   const headers = data[0];

//   // หาคอลัมน์ชื่อลูกค้าและเบอร์โทรศัพท์
//   const nameIndex = headers.indexOf("ชื่อลูกค้า");
//   const phoneIndex = headers.indexOf("เบอร์โทรศัพท์");
//   const idCardIndex = headers.indexOf("เลขบัตรประชาชน");
//   const drivingLicenseIndex = headers.indexOf("หมายเลขใบขับขี่"); 
//   const addressIndex = headers.indexOf("ที่อยู่ลูกค้า");

//   if (nameIndex === -1 || phoneIndex === -1) {
//     return { success: false, message: "ไม่พบคอลัมน์ชื่อลูกค้าหรือเบอร์โทรศัพท์" };
//   }

//   // แปลงคำค้นหาเป็นพิมพ์เล็กเพื่อค้นหาแบบไม่คำนึงถึงตัวพิมพ์ใหญ่-เล็ก
//   const query = searchQuery.toString().toLowerCase();

//   // ใช้ Object เพื่อเก็บข้อมูลลูกค้าที่ไม่ซ้ำกัน และข้อมูลที่สมบูรณ์ที่สุด
//   const customerData = {};

//   for (let i = 1; i < data.length; i++) {
//     const name = data[i][nameIndex] ? data[i][nameIndex].toString() : "";
//     const phone = data[i][phoneIndex] ? data[i][phoneIndex].toString() : "";
//     const idCard = idCardIndex !== -1 && data[i][idCardIndex] ? data[i][idCardIndex].toString() : "";
//     const drivingLicense = drivingLicenseIndex !== -1 && data[i][drivingLicenseIndex] ? data[i][drivingLicenseIndex].toString() : "";   
//     const address = addressIndex !== -1 && data[i][addressIndex] ? data[i][addressIndex].toString() : "";

//     // ตรวจสอบว่ามีคำค้นหาอยู่ในชื่อ, เบอร์โทรศัพท์, เลขบัตรประชาชน, หมายเลขใบขับขี่, หรือที่อยู่หรือไม่
//     if (
//       (name && name.toLowerCase().includes(query)) ||
//       (phone && phone.toLowerCase().includes(query)) ||
//       (idCard && idCard.toLowerCase().includes(query)) ||
//       (drivingLicense && drivingLicense.toLowerCase().includes(query)) ||     
//       (address && address.toLowerCase().includes(query))
//     ) {
//       // สร้าง key เพื่อเช็คลูกค้าซ้ำ
//       const customerKey = `${name}-${phone}`;

//       // ข้อมูลลูกค้าจากแถวปัจจุบัน
//       const currentCustomerInfo = {
//         ชื่อลูกค้า: name,
//         เบอร์โทรศัพท์: phone,
//         เลขบัตรประชาชน: idCard,
//         หมายเลขใบขับขี่: drivingLicense,
//         ที่อยู่ลูกค้า: address
//       };

//       // คำนวณคะแนนความสมบูรณ์ของข้อมูล (นับจำนวนฟิลด์ที่ไม่ว่าง)
//       const completenessScore = [
//         name, 
//         phone, 
//         idCard, 
//         drivingLicense, 
//         address
//       ].filter(field => field && field.trim() !== "").length;

//       // ถ้ายังไม่มีลูกค้าคนนี้ในแมพ หรือ ข้อมูลชุดใหม่สมบูรณ์กว่า
//       if (!customerData[customerKey] || completenessScore > customerData[customerKey].score) {
//         customerData[customerKey] = {
//           data: currentCustomerInfo,
//           score: completenessScore
//         };
//       }
//     }
//   }

//   // แปลงข้อมูลลูกค้าเป็นอาร์เรย์ของผลลัพธ์
//   const results = Object.values(customerData).map(item => item.data);

//   return { 
//     success: true, 
//     data: results, 
//     message: results.length > 0 ? `พบข้อมูลลูกค้า ${results.length} รายการ` : "ไม่พบข้อมูลลูกค้าที่ตรงกับคำค้นหา"
//   };
// }


/**
 * (อัปเกรด) ค้นหาข้อมูลลูกค้าจากชีต "ข้อมูลลูกค้า" โดยตรง
 * @param {string} searchQuery - คำค้นหาจากผู้ใช้
 * @param {string} sheetID - ID ของ Google Sheet
 * @returns {object} ผลการค้นหา
 */
function searchCustomer(searchQuery, sheetID) {
  if (!searchQuery || searchQuery.trim().length < 2) {
    return { success: false, message: "กรุณาระบุคำค้นหาอย่างน้อย 2 ตัวอักษร" };
  }

  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(CUSTOMERS_SHEET); // ⭐ เปลี่ยนมาใช้ชีตลูกค้า

    if (!sheet || sheet.getLastRow() <= 1) {
      return { success: false, message: "ไม่พบข้อมูลลูกค้าในระบบ" };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data.shift(); // นำหัวข้อออก
    const query = searchQuery.toString().toLowerCase();

    const results = [];

    // วนลูปเพื่อค้นหา
    data.forEach(row => {
      // สร้าง Object ของลูกค้ารายนี้ก่อน
      const customerObj = {};
      let isMatch = false;

      headers.forEach((header, index) => {
        const cellValue = row[index] ? String(row[index]).toLowerCase() : "";
        customerObj[header] = row[index]; // เก็บข้อมูลดิบไว้ใน Object

        // ตรวจสอบว่ามีคำค้นหาหรือไม่
        if (cellValue.includes(query)) {
          isMatch = true;
        }
      });

      // ถ้าเจอข้อมูลที่ตรงกัน ให้เพิ่มลงในผลลัพธ์
      if (isMatch) {
        // Frontend ต้องการฟิลด์เหล่านี้เพื่อกรอกข้อมูลอัตโนมัติ
        // เราจะทำการแปลงชื่อฟิลด์ให้ตรงกับที่ Frontend คาดหวัง
        const formattedCustomer = {
          'ชื่อลูกค้า': customerObj['ชื่อ-นามสกุล'],
          'เบอร์โทรศัพท์': customerObj['เบอร์โทรศัพท์'],
          'เลขบัตรประชาชน': customerObj['เลขบัตรประชาชน'],
          'หมายเลขใบขับขี่': customerObj['หมายเลขใบขับขี่'],
          'ที่อยู่ลูกค้า': customerObj['ที่อยู่']
        };
        results.push(formattedCustomer);
      }
    });

    return {
      success: true,
      data: results,
      message: results.length > 0 ? `พบข้อมูลลูกค้า ${results.length} รายการ` : "ไม่พบข้อมูลลูกค้า"
    };

  } catch (e) {
    Logger.log(`[searchCustomer] Error: ${e.toString()}`);
    return { success: false, message: e.toString() };
  }
}


// ฟังก์ชันสำหรับสร้างหมายเลขการจองใหม่
function generateBookingNumber(sheetID) {
  Logger.log("===== BEGINNING generateBookingNumber() =====");

  const ss = SpreadsheetApp.openById(sheetID);
  const rentalSheet = ss.getSheetByName(RENTAL_SHEET);
  const configSheet = ss.getSheetByName(CONFIG_SHEET);

  Logger.log("Spreadsheet: " + ss.getName());
  Logger.log("Rental Sheet: " + (rentalSheet ? rentalSheet.getName() : "not found"));
  Logger.log("Config Sheet: " + (configSheet ? configSheet.getName() : "not found"));

  // ดึงคำนำหน้าจากชีทตั้งค่าระบบ
  let prefix = "KP"; // ค่าเริ่มต้น

  try {
    // ค้นหาคำนำหน้าจากชีทตั้งค่าระบบ
    Logger.log("Searching for prefix in config sheet...");
    const configData = configSheet.getDataRange().getValues();
    Logger.log("Config rows: " + configData.length);

    for (let i = 0; i < configData.length; i++) {
      if (configData[i][0] === "คำนำหน้าหมายเลขการจอง") {
        prefix = configData[i][1] || prefix;
        Logger.log("Found prefix: " + prefix);
        break;
      }
    }
  } catch (e) {
    Logger.log("Error getting prefix: " + e.toString());
  }

  let lastNumber = 0;

  // ค้นหาหมายเลขการจองล่าสุด
  try {
    Logger.log("Searching for latest booking number...");
    const rentalData = rentalSheet.getDataRange().getValues();
    Logger.log("Rental rows: " + rentalData.length);

    const headers = rentalData[0];
    const bookingNumberIndex = headers.indexOf("หมายเลขการจอง");
    Logger.log("Booking number column index: " + bookingNumberIndex);

    if (bookingNumberIndex > -1) {
      for (let i = 1; i < rentalData.length; i++) {
        const bookingNumber = rentalData[i][bookingNumberIndex] || "";
        if (bookingNumber && bookingNumber.startsWith(prefix)) {
          const numberPart = bookingNumber.substring(prefix.length);
          const number = parseInt(numberPart, 10);
          if (!isNaN(number) && number > lastNumber) {
            lastNumber = number;
            Logger.log("Found larger number: " + number + " from " + bookingNumber);
          }
        }
      }
    }
    Logger.log("Last booking number: " + lastNumber);
  } catch (e) {
    Logger.log("Error finding last booking number: " + e.toString());
  }

  // สร้างหมายเลขใหม่
  const newNumber = lastNumber + 1;
  const paddedNumber = String(newNumber).padStart(5, '0');
  const result = prefix + paddedNumber;

  Logger.log("Generated new booking number: " + result);
  Logger.log("===== ENDING generateBookingNumber() =====");

  return result;
}

// ฟังก์ชันสำหรับอัพเดตสถานะรายการเช่า
function updateRentalStatus(rentalId, newStatus, sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);
  const sheet = ss.getSheetByName(RENTAL_SHEET);

  // หาคอลัมน์ที่เก็บสถานะ
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const statusColumnIndex = headers.indexOf("สถานะ") + 1;

  if (statusColumnIndex > 0) {
    // อัพเดตสถานะในแถวที่กำหนด (rentalId + 1 เพราะแถวแรกเป็นหัวข้อ)
    sheet.getRange(rentalId + 1, statusColumnIndex).setValue(newStatus);
    return { success: true, message: "อัพเดตสถานะสำเร็จ" };
  } else {
    return { success: false, message: "ไม่พบคอลัมน์สถานะ" };
  }
}



function checkCarBookingAvailability(currentCar, pickupDateTime, returnDateTime, startDate, endDate, sheetID, editingBookingNumber, prepTimeMinutes) {
  console.log("checkCarBookingAvailability function called");
  console.log("currentCar:", currentCar);
  console.log("pickupDateTime:", pickupDateTime);
  console.log("returnDateTime:", returnDateTime);
  console.log("startDate:", startDate);
  console.log("endDate:", endDate);
  console.log("sheetID:", sheetID);
  console.log("editingBookingNumber:", editingBookingNumber);
  console.log("prepTimeMinutes:", prepTimeMinutes || "ไม่ได้ระบุ");

  // เปิด sheet ชื่อ 'รายการเช่า'
  const sheet = SpreadsheetApp.openById(sheetID).getSheetByName("รายการเช่า");
  const data = sheet.getDataRange().getValues();
  console.log("data length:", data.length);

  // แปลงวันที่เวลาที่ผู้ใช้ต้องการจองเป็น Date objects
  const userPickup = new Date(pickupDateTime);
  const userReturn = new Date(returnDateTime);
  console.log("userPickup:", userPickup);
  console.log("userReturn:", userReturn);

  // ถ้าไม่ได้รับค่า prepTimeMinutes ให้ใช้ค่าจากการตั้งค่าระบบ
  if (prepTimeMinutes === undefined || prepTimeMinutes === null) {
    const settings = PropertiesService.getScriptProperties().getProperties();
    prepTimeMinutes = parseInt(settings.ระยะเวลาเตรียมรถ) || 0;
  }
  console.log("ระยะเวลาเตรียมรถที่ใช้:", prepTimeMinutes, "นาที");

  let bookingNumber = null;
  let calendarLink = null;
  let available = true;
  let conflict = null;

  // เริ่มตรวจสอบจากแถวที่ 1 (ข้ามแถวหัวตาราง)
  for (let i = 1; i < data.length; i++) {
    // ตรวจสอบว่ามีข้อมูลในแถวหรือไม่
    if (!data[i] || !data[i][4]) continue;

    // ดึงหมายเลขการจองของรายการนี้ (column B, index 1)
    const currentBookingNumber = data[i][1];

    // ข้ามการตรวจสอบถ้าเป็นรายการที่กำลังแก้ไข
    if (editingBookingNumber && currentBookingNumber === editingBookingNumber) {
      console.log("Skipping current editing booking:", editingBookingNumber);
      continue;
    }

    // ดึงข้อมูลรถจาก column E (index 4)
    const carName = data[i][4];

    // เช็คว่าเป็นรถคันเดียวกันกับที่ลูกค้าต้องการจองหรือไม่
    if (carName === currentCar) {
      // ดึงข้อมูลวันเวลารับ-คืนรถจาก columns G, H, I, J (index 6, 7, 8, 9)
      const pickupDate = data[i][6]; // วันที่เช่า
      const returnDate = data[i][7]; // วันที่คืน
      const pickupTime = data[i][8]; // เวลารับรถ
      const returnTime = data[i][9]; // เวลาคืนรถ

      console.log("Found booking for same car:");
      console.log("- pickupDate:", pickupDate);
      console.log("- pickupTime:", pickupTime);
      console.log("- returnDate:", returnDate);
      console.log("- returnTime:", returnTime);

      // จัดการกับข้อมูลวันที่และเวลา
      let formattedPickupDate = "";
      let formattedReturnDate = "";
      let formattedPickupTime = "";
      let formattedReturnTime = "";

      try {
        // จัดการกับวันที่เช่า
        if (pickupDate instanceof Date) {
          formattedPickupDate = Utilities.formatDate(pickupDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
        } else if (typeof pickupDate === 'string') {
          formattedPickupDate = pickupDate;
        } else {
          console.log("Invalid pickupDate, using fallback");
          formattedPickupDate = "2025-04-16"; // ค่าเริ่มต้น
        }

        // จัดการกับวันที่คืน
        if (returnDate instanceof Date) {
          formattedReturnDate = Utilities.formatDate(returnDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
        } else if (typeof returnDate === 'string') {
          formattedReturnDate = returnDate;
        } else {
          console.log("Invalid returnDate, using fallback");
          formattedReturnDate = "2025-04-18"; // ค่าเริ่มต้น
        }

        // จัดการกับเวลารับรถ
        if (typeof pickupTime === 'string') {
          // ตรวจสอบว่ามีรูปแบบ HH:MM:SS หรือ H:MM:SS
          const timeParts = pickupTime.split(':');
          if (timeParts.length >= 2) {
            // มีนาฬิกาและนาที แต่อาจจะไม่มีวินาที
            const hours = timeParts[0].padStart(2, '0');
            const minutes = timeParts[1].padStart(2, '0');
            const seconds = timeParts.length > 2 ? timeParts[2].padStart(2, '0') : '00';
            formattedPickupTime = `${hours}:${minutes}:${seconds}`;
          } else {
            console.log("Invalid pickupTime format, using fallback");
            formattedPickupTime = "08:00:00"; // ค่าเริ่มต้น
          }
        } else if (pickupTime instanceof Date) {
          formattedPickupTime = Utilities.formatDate(pickupTime, Session.getScriptTimeZone(), "HH:mm:ss");
        } else if (typeof pickupTime === 'number') {
          // ถ้าเป็นตัวเลข (เช่น 8.00)
          const hours = Math.floor(pickupTime);
          const minutes = Math.round((pickupTime - hours) * 60);
          formattedPickupTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
        } else {
          console.log("Invalid pickupTime type, using fallback");
          formattedPickupTime = "08:00:00"; // ค่าเริ่มต้น
        }

        // จัดการกับเวลาคืนรถ
        if (typeof returnTime === 'string') {
          // ตรวจสอบว่ามีรูปแบบ HH:MM:SS หรือ H:MM:SS
          const timeParts = returnTime.split(':');
          if (timeParts.length >= 2) {
            // มีนาฬิกาและนาที แต่อาจจะไม่มีวินาที
            const hours = timeParts[0].padStart(2, '0');
            const minutes = timeParts[1].padStart(2, '0');
            const seconds = timeParts.length > 2 ? timeParts[2].padStart(2, '0') : '00';
            formattedReturnTime = `${hours}:${minutes}:${seconds}`;
          } else {
            console.log("Invalid returnTime format, using fallback");
            formattedReturnTime = "08:00:00"; // ค่าเริ่มต้น
          }
        } else if (returnTime instanceof Date) {
          formattedReturnTime = Utilities.formatDate(returnTime, Session.getScriptTimeZone(), "HH:mm:ss");
        } else if (typeof returnTime === 'number') {
          // ถ้าเป็นตัวเลข (เช่น 8.00)
          const hours = Math.floor(returnTime);
          const minutes = Math.round((returnTime - hours) * 60);
          formattedReturnTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
        } else {
          console.log("Invalid returnTime type, using fallback");
          formattedReturnTime = "08:00:00"; // ค่าเริ่มต้น
        }
      } catch (e) {
        console.error("Error formatting dates and times:", e);
        // ใช้ค่าเริ่มต้นในกรณีที่มีข้อผิดพลาด
        formattedPickupDate = formattedPickupDate || "2025-04-16";
        formattedReturnDate = formattedReturnDate || "2025-04-18";
        formattedPickupTime = formattedPickupTime || "08:00:00";
        formattedReturnTime = formattedReturnTime || "08:00:00";
      }

      console.log("Final formatted dates and times:");
      console.log("- formattedPickupDate:", formattedPickupDate);
      console.log("- formattedPickupTime:", formattedPickupTime);
      console.log("- formattedReturnDate:", formattedReturnDate);
      console.log("- formattedReturnTime:", formattedReturnTime);

      // สร้าง Date objects สำหรับการเปรียบเทียบ
      let sheetPickup, sheetReturn;

      try {
        sheetPickup = new Date(`${formattedPickupDate}T${formattedPickupTime}`);
        sheetReturn = new Date(`${formattedReturnDate}T${formattedReturnTime}`);

        console.log("Final Date objects:");
        console.log("- sheetPickup:", sheetPickup);
        console.log("- sheetReturn:", sheetReturn);
      } catch (e) {
        console.error("Error creating Date objects:", e);
        continue; // ข้ามรายการนี้หากสร้าง Date objects ไม่สำเร็จ
      }

      // ตรวจสอบว่าวันเวลาถูกต้องหรือไม่
      if (isNaN(sheetPickup.getTime()) || isNaN(sheetReturn.getTime())) {
        console.log("Invalid date format in the spreadsheet. Skipping this entry.");
        continue;
      }

      // สร้างวันที่เวลาที่รวมเวลาเตรียมรถแล้ว
      const sheetPickupWithPrepTime = new Date(sheetPickup);
      sheetPickupWithPrepTime.setMinutes(sheetPickupWithPrepTime.getMinutes() - prepTimeMinutes);

      const sheetReturnWithPrepTime = new Date(sheetReturn);
      sheetReturnWithPrepTime.setMinutes(sheetReturnWithPrepTime.getMinutes() + prepTimeMinutes);

      console.log("Date objects with prep time:");
      console.log("- sheetPickupWithPrepTime:", sheetPickupWithPrepTime, "(ลบ", prepTimeMinutes, "นาที)");
      console.log("- sheetReturnWithPrepTime:", sheetReturnWithPrepTime, "(บวก", prepTimeMinutes, "นาที)");

      // ตรวจสอบการคาบเกี่ยวโดยคำนึงถึงเวลาเตรียมรถ
      if (userPickup < sheetReturnWithPrepTime && userReturn > sheetPickupWithPrepTime) {
        available = false;
        bookingNumber = data[i][1]; // หมายเลขการจอง (column B, index 1)

        // แปลงรูปแบบวันที่เป็น DD/MM/YYYY สำหรับการแสดงผล
        let formattedPickupDateDMY = formattedPickupDate;
        let formattedReturnDateDMY = formattedReturnDate;

        // แปลง YYYY-MM-DD เป็น DD/MM/YYYY
        if (formattedPickupDate && formattedPickupDate.includes('-')) {
          const parts = formattedPickupDate.split('-');
          formattedPickupDateDMY = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }

        if (formattedReturnDate && formattedReturnDate.includes('-')) {
          const parts = formattedReturnDate.split('-');
          formattedReturnDateDMY = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }

        conflict = {
          bookingNumber: data[i][1],
          customer: data[i][2], // ชื่อลูกค้า (column C, index 2)
          pickupDate: formattedPickupDateDMY,
          pickupTime: formattedPickupTime && formattedPickupTime.substring(0, 5), // ตัด :00 ออก
          returnDate: formattedReturnDateDMY,
          returnTime: formattedReturnTime && formattedReturnTime.substring(0, 5), // ตัด :00 ออก
        };
        break;
      }
    }
  }

  console.log("available:", available);
  console.log("bookingNumber:", bookingNumber);
  console.log("conflict:", conflict);

  return {
    available,
    bookingNumber,
    calendarLink,
    conflict
  };
}






/**
 * ตรวจสอบว่าหมายเลขการจองมีอยู่แล้วในแผ่นงาน "รายการเช่า" หรือไม่
 * 
 * @param {string} bookingNumber - หมายเลขการจองที่ต้องการตรวจสอบ
 * @return {boolean} - คืนค่า true ถ้าหมายเลขการจองนี้มีอยู่แล้ว, false ถ้าไม่มี
 */
function checkBookingNumberExists(bookingNumber, sheetID) {
  Logger.log("===== BEGINNING checkBookingNumberExists() =====");
  Logger.log("Checking booking number: " + bookingNumber);
  Logger.log("Sheet ID: " + sheetID); // เพิ่มบรรทัดนี้

  // ตรวจสอบ sheetID ก่อน
  if (!sheetID || sheetID.trim() === "") {
    Logger.log("Error: sheetID is null, undefined, or empty");
    Logger.log("===== ENDING checkBookingNumberExists() - INVALID SHEET ID =====");
    return false;
  }

  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const rentalSheet = ss.getSheetByName(RENTAL_SHEET);

    Logger.log("Spreadsheet: " + ss.getName());
    Logger.log("Rental Sheet: " + (rentalSheet ? rentalSheet.getName() : "not found"));

    // หาตำแหน่งคอลัมน์ของ "หมายเลขการจอง"
    const headers = rentalSheet.getRange(1, 1, 1, rentalSheet.getLastColumn()).getValues()[0];
    const bookingNumberColIndex = headers.indexOf("หมายเลขการจอง");

    Logger.log("Headers: " + JSON.stringify(headers));
    Logger.log("Booking number column index: " + bookingNumberColIndex);

    if (bookingNumberColIndex === -1) {
      // ไม่พบคอลัมน์ "หมายเลขการจอง"
      Logger.log("Column 'หมายเลขการจอง' not found");
      Logger.log("===== ENDING checkBookingNumberExists() - COLUMN NOT FOUND =====");
      return false;
    }

    // ดึงข้อมูลทั้งหมดในคอลัมน์หมายเลขการจอง
    const lastRow = rentalSheet.getLastRow();
    Logger.log("Last row: " + lastRow);

    if (lastRow <= 1) {
      // มีเฉพาะแถวหัวตาราง ไม่มีข้อมูล
      Logger.log("No data in the sheet (only header row)");
      Logger.log("===== ENDING checkBookingNumberExists() - NO DATA =====");
      return false;
    }

    const bookingNumbers = rentalSheet.getRange(2, bookingNumberColIndex + 1, lastRow - 1, 1).getValues();
    Logger.log("All booking numbers: " + JSON.stringify(bookingNumbers));

    // ตรวจสอบว่ามีหมายเลขการจองซ้ำหรือไม่
    for (let i = 0; i < bookingNumbers.length; i++) {
      const currentBookingNumber = bookingNumbers[i][0];
      Logger.log(`Comparing with [${i}]: "${currentBookingNumber}" === "${bookingNumber}" ? ${currentBookingNumber === bookingNumber}`);

      if (currentBookingNumber === bookingNumber) {
        Logger.log(`Booking number '${bookingNumber}' already exists`);
        Logger.log("===== ENDING checkBookingNumberExists() - DUPLICATE FOUND =====");
        return true;
      }
    }

    // ไม่พบหมายเลขการจองซ้ำ
    Logger.log(`Booking number '${bookingNumber}' is unique`);
    Logger.log("===== ENDING checkBookingNumberExists() - NO DUPLICATE =====");
    return false;

  } catch (error) {
    Logger.log(`Error checking booking number: ${error.toString()}`);
    Logger.log("Stack trace: " + error.stack);
    Logger.log("===== ENDING checkBookingNumberExists() - ERROR =====");
    // ส่งค่า false เพื่อให้กระบวนการดำเนินต่อไปได้ในกรณีที่เกิดข้อผิดพลาด
    return false;
  }
}




// [รหัส.js] - วางทับฟังก์ชัน getSystemConfig เดิมทั้งฟังก์ชัน

function getSystemConfig(sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);
  let sheet = ss.getSheetByName(CONFIG_SHEET); // <<-- แก้ไข: เปลี่ยนจาก const เป็น let

  // ตรวจสอบว่ามีชีทการตั้งค่าหรือไม่
  if (!sheet) {
    // สร้างแผ่นงานการตั้งค่าถ้ายังไม่มี
    const newSheet = ss.insertSheet(CONFIG_SHEET);
    newSheet.appendRow(["หัวข้อ", "ค่า"]);

    // เพิ่มค่าเริ่มต้น
    newSheet.appendRow(["ชื่อบริษัท", "บริษัท เช่ารถ จำกัด"]);
    newSheet.appendRow(["ที่อยู่", ""]);
    newSheet.appendRow(["เบอร์โทรศัพท์", ""]);
    newSheet.appendRow(["อีเมล", ""]);
    newSheet.appendRow(["คำนำหน้าหมายเลขการจอง", "KP"]);
    newSheet.appendRow(["ช่องทางการจอง", "Walk-in, Line, Facebook, Telephone"]);
    newSheet.appendRow(["สถานที่รับรถ", "สนามบินเชียงใหม่, สถานีขนส่งอาเขต, สถานีรถไฟเชียงใหม่, หน้าร้าน"]);
    newSheet.appendRow(["สถานที่คืนรถ", "สนามบินเชียงใหม่, สถานีขนส่งอาเขต, สถานีรถไฟเชียงใหม่, หน้าร้าน"]);
    newSheet.appendRow(["ตรวจสอบคิวรถ", "false"]);
    newSheet.appendRow(["ระยะเวลาเตรียมรถ", "0"]);
    newSheet.appendRow(["ชื่อธนาคาร", ""]);
    newSheet.appendRow(["หมายเลขบัญชีธนาคาร", ""]);
    newSheet.appendRow(["ชื่อบัญชี", ""]);
    newSheet.appendRow(["รหัสใบเสนอราคา", "QUO-"]);
    newSheet.appendRow(["รูปแบบรหัสใบเสนอราคา", "continuous"]);
    newSheet.appendRow(["รหัสบิลเงินสด", "BNS"]);
    newSheet.appendRow(["รูปแบบรหัสบิลเงินสด", "continuous"]);
    newSheet.appendRow(["รหัสใบกำกับภาษี", "TIV"]);
    newSheet.appendRow(["รูปแบบรหัสใบกำกับภาษี", "continuous"]);

    // 🔰 --- จุดแก้ไขที่ 1: เพิ่มสิทธิ์ที่ขาดหายไปในค่าเริ่มต้น (สิทธิ์ผู้ใช้งาน) ---
    newSheet.appendRow(["สิทธิ์ผู้ใช้งาน", JSON.stringify({
      'page-summary': true,
      'page-bookings': true,
      'page-schedule': true,
      'page-newRental': true,
      'page-cars': true,              // 🔰 แก้ไขจาก false
      'page-config': true,            // 🔰 แก้ไขจาก false
      'page-finance': true,           // 🔰 เพิ่มใหม่
      'page-documents': true,         // 🔰 เพิ่มใหม่
      'company-info': true,
      'payment-settings': true,
      'booking-settings': true,
      'location-settings': true,
      'summary-message-settings': true,
      'quote-message-settings': true,
      'commission-settings': true,    // 🔰 เพิ่มใหม่
      'linebot-settings': true,       // 🔰 เพิ่มใหม่
      'translation-settings': false,
      'blacklist-management': false,
      'license-info': false
    })]);

    // 🔰 --- จุดแก้ไขที่ 2: เพิ่มสิทธิ์ที่ขาดหายไปในค่าเริ่มต้น (กลุ่มผู้ใช้และสิทธิ์) ---
    newSheet.appendRow(["กลุ่มผู้ใช้และสิทธิ์", JSON.stringify({
      'admin': {
        'page-summary': true,
        'page-bookings': true,
        'page-schedule': true,
        'page-newRental': true,
        'page-cars': true,
        'page-config': true,
        'page-finance': true,           // 🔰 เพิ่มใหม่
        'page-documents': true,         // 🔰 เพิ่มใหม่
        'company-info': true,
        'payment-settings': true,
        'booking-settings': true,
        'location-settings': true,
        'summary-message-settings': true,
        'quote-message-settings': true,
        'commission-settings': true,    // 🔰 เพิ่มใหม่
        'linebot-settings': true,       // 🔰 เพิ่มใหม่
        'translation-settings': true,
        'blacklist-management': true,
        'license-info': true,
        'user-management': true,
        'role-management': true
      },
      'user': {
        'page-summary': true,
        'page-bookings': true,
        'page-schedule': true,
        'page-newRental': true,
        'page-cars': true,              // 🔰 แก้ไขจาก false
        'page-config': true,            // 🔰 แก้ไขจาก false
        'page-finance': true,           // 🔰 เพิ่มใหม่
        'page-documents': true,         // 🔰 เพิ่มใหม่
        'company-info': true,
        'payment-settings': true,
        'booking-settings': true,
        'location-settings': true,
        'summary-message-settings': true,
        'quote-message-settings': true,
        'commission-settings': true,    // 🔰 เพิ่มใหม่
        'linebot-settings': true,       // 🔰 เพิ่มใหม่
        'translation-settings': false,
        'blacklist-management': false,
        'license-info': false,
        'user-management': false,
        'role-management': false
      }
    })]);
    // 🔰 --- สิ้นสุดจุดแก้ไขที่ 2 ---

    newSheet.appendRow(["ชื่อกลุ่มผู้ใช้", JSON.stringify({ 'admin': 'ผู้ดูแลระบบ', 'user': 'ผู้ใช้งานทั่วไป' })]);
    newSheet.appendRow(["คำอธิบายกลุ่มผู้ใช้", JSON.stringify({ 'admin': 'มีสิทธิ์เข้าถึงทุกส่วนของระบบ', 'user': 'มีสิทธิ์เข้าถึงเฉพาะส่วนที่กำหนด' })]);

    sheet = newSheet; // <<-- แก้ไข: กำหนดค่าให้กับ sheet ที่ประกาศไว้ด้านบน
  } else {
    // ตรวจสอบและเพิ่มฟิลด์ใหม่ถ้ายังไม่มี
    const data = sheet.getDataRange().getValues();
    const existingKeys = data.map(row => row[0]);

    // 🔰 --- จุดแก้ไขที่ 3: เพิ่มสิทธิ์ที่ขาดหายไปในฟิลด์ใหม่ (กรณีชีตมีอยู่แล้ว) ---
    const newFields = [
      ["ชื่อธนาคาร", ""],
      ["หมายเลขบัญชีธนาคาร", ""],
      ["ชื่อบัญชี", ""],
      ["รหัสใบเสนอราคา", "QUO-"],
      ["รูปแบบรหัสใบเสนอราคา", "continuous"],
      ["รหัสบิลเงินสด", "BNS"],
      ["รูปแบบรหัสบิลเงินสด", "continuous"],
      ["รหัสใบกำกับภาษี", "TIV"],
      ["รูปแบบรหัสใบกำกับภาษี", "continuous"],
      ["ค่าล่วงเวลาเริ่มต้น", 100],
      ["จำนวนชั่วโมงล่วงเวลาที่ไม่คิดเงิน", 0],
      ["ค่าประกันเสริมต่อวัน", 200],
      ["สิทธิ์ผู้ใช้งาน", JSON.stringify({
        'page-summary': true,
        'page-bookings': true,
        'page-schedule': true,
        'page-newRental': true,
        'page-cars': true,              // 🔰 แก้ไขจาก false
        'page-config': true,            // 🔰 แก้ไขจาก false
        'page-finance': true,           // 🔰 เพิ่มใหม่
        'page-documents': true,         // 🔰 เพิ่มใหม่
        'company-info': true,
        'payment-settings': true,
        'booking-settings': true,
        'location-settings': true,
        'summary-message-settings': true,
        'quote-message-settings': true,
        'commission-settings': true,    // 🔰 เพิ่มใหม่
        'linebot-settings': true,       // 🔰 เพิ่มใหม่
        'translation-settings': false,
        'blacklist-management': false,
        'license-info': false
      })],
      ["กลุ่มผู้ใช้และสิทธิ์", JSON.stringify({
        'admin': {
          'page-summary': true,
          'page-bookings': true,
          'page-schedule': true,
          'page-newRental': true,
          'page-cars': true,
          'page-config': true,
          'page-finance': true,           // 🔰 เพิ่มใหม่
          'page-documents': true,         // 🔰 เพิ่มใหม่
          'company-info': true,
          'payment-settings': true,
          'booking-settings': true,
          'location-settings': true,
          'summary-message-settings': true,
          'quote-message-settings': true,
          'commission-settings': true,    // 🔰 เพิ่มใหม่
          'linebot-settings': true,       // 🔰 เพิ่มใหม่
          'translation-settings': true,
          'blacklist-management': true,
          'license-info': true,
          'user-management': true,
          'role-management': true
        },
        'user': {
          'page-summary': true,
          'page-bookings': true,
          'page-schedule': true,
          'page-newRental': true,
          'page-cars': true,              // 🔰 แก้ไขจาก false
          'page-config': true,            // 🔰 แก้ไขจาก false
          'page-finance': true,           // 🔰 เพิ่มใหม่
          'page-documents': true,         // 🔰 เพิ่มใหม่
          'company-info': true,
          'payment-settings': true,
          'booking-settings': true,
          'location-settings': true,
          'summary-message-settings': true,
          'quote-message-settings': true,
          'commission-settings': true,    // 🔰 เพิ่มใหม่
          'linebot-settings': true,       // 🔰 เพิ่มใหม่
          'translation-settings': false,
          'blacklist-management': false,
          'license-info': false,
          'user-management': false,
          'role-management': false
        }
      })],
      // 🔰 --- สิ้นสุดจุดแก้ไขที่ 3 ---
      ["ชื่อกลุ่มผู้ใช้", JSON.stringify({ 'admin': 'ผู้ดูแลระบบ', 'user': 'ผู้ใช้งานทั่วไป' })],
      ["คำอธิบายกลุ่มผู้ใช้", JSON.stringify({ 'admin': 'มีสิทธิ์เข้าถึงทุกส่วนของระบบ', 'user': 'มีสิทธิ์เข้าถึงเฉพาะส่วนที่กำหนด' })]
    ];

    for (const field of newFields) {
      if (!existingKeys.includes(field[0])) {
        sheet.appendRow(field);
      }
    }

    // เพิ่มคอลัมน์คาร์ซีทและประกันเสริมอัตโนมัติ
    try {
      ensureCarSeatAndInsuranceColumns(sheetID);
    } catch (e) {
      Logger.log("เกิดข้อผิดพลาดในการเพิ่มคอลัมน์คาร์ซีทและประกันเสริม:", e);
    }
  }

  const data = sheet.getDataRange().getValues();
  const config = {};
  let userPermissions = null;
  let rolePermissions = null;
  let roleNames = null;
  let roleDescriptions = null;

  // ดึงข้อมูลการตั้งค่าทั้งหมด
  for (let i = 1; i < data.length; i++) {
    const key = data[i][0];
    const value = data[i][1];

    if (key === "สิทธิ์ผู้ใช้งาน") {
      try {
        userPermissions = JSON.parse(value);
        if (!userPermissions.hasOwnProperty('page-summary')) {
          userPermissions['page-summary'] = true;
          userPermissions['page-bookings'] = true;
          userPermissions['page-schedule'] = true;
          userPermissions['page-newRental'] = true;
          userPermissions['page-cars'] = false;
          userPermissions['page-config'] = false;
        }
      } catch (e) {
        // 🔰 --- จุดแก้ไขที่ 4: เพิ่มสิทธิ์ที่ขาดหายไปในค่าเริ่มต้น (สิทธิ์ผู้ใช้งาน) ---
        userPermissions = {
          'page-summary': true,
          'page-bookings': true,
          'page-schedule': true,
          'page-newRental': true,
          'page-cars': true,              // 🔰 แก้ไขจาก false
          'page-config': true,            // 🔰 แก้ไขจาก false
          'page-finance': true,           // 🔰 เพิ่มใหม่
          'page-documents': true,         // 🔰 เพิ่มใหม่
          'company-info': true,
          'payment-settings': true,
          'booking-settings': true,
          'location-settings': true,
          'summary-message-settings': true,
          'quote-message-settings': true,
          'commission-settings': true,    // 🔰 เพิ่มใหม่
          'linebot-settings': true,       // 🔰 เพิ่มใหม่
          'translation-settings': false,
          'blacklist-management': false,
          'license-info': false
        };
        // 🔰 --- สิ้นสุดจุดแก้ไขที่ 4 ---
      }
    } else if (key === "กลุ่มผู้ใช้และสิทธิ์") {
      try {
        rolePermissions = JSON.parse(value);
        for (const role in rolePermissions) {
          if (!rolePermissions[role].hasOwnProperty('page-summary')) {
            if (role === 'admin') {
              rolePermissions[role]['page-summary'] = true; rolePermissions[role]['page-bookings'] = true; rolePermissions[role]['page-schedule'] = true;
              rolePermissions[role]['page-newRental'] = true; rolePermissions[role]['page-cars'] = true; rolePermissions[role]['page-config'] = true;
            }
            else if (role === 'user') {
              rolePermissions[role]['page-summary'] = true; rolePermissions[role]['page-bookings'] = true; rolePermissions[role]['page-schedule'] = true;
              rolePermissions[role]['page-newRental'] = true; rolePermissions[role]['page-cars'] = false; rolePermissions[role]['page-config'] = false;
            }
            else {
              const hasConfigAccess = Object.keys(rolePermissions[role]).some(permission => ['company-info', 'payment-settings', 'translation-settings'].includes(permission) && rolePermissions[role][permission] === true);
              rolePermissions[role]['page-summary'] = true; rolePermissions[role]['page-bookings'] = true; rolePermissions[role]['page-schedule'] = true;
              rolePermissions[role]['page-newRental'] = true; rolePermissions[role]['page-cars'] = hasConfigAccess; rolePermissions[role]['page-config'] = hasConfigAccess;
            }
          }
        }
      } catch (e) {
        // 🔰 --- จุดแก้ไขที่ 5: เพิ่มสิทธิ์ที่ขาดหายไปในค่าเริ่มต้น (กลุ่มผู้ใช้และสิทธิ์) ---
        rolePermissions = {
          'admin': {
            'page-summary': true,
            'page-bookings': true,
            'page-schedule': true,
            'page-newRental': true,
            'page-cars': true,
            'page-config': true,
            'page-finance': true,           // 🔰 เพิ่มใหม่
            'page-documents': true,         // 🔰 เพิ่มใหม่
            'company-info': true,
            'payment-settings': true,
            'booking-settings': true,
            'location-settings': true,
            'summary-message-settings': true,
            'quote-message-settings': true,
            'commission-settings': true,    // 🔰 เพิ่มใหม่
            'linebot-settings': true,       // 🔰 เพิ่มใหม่
            'translation-settings': true,
            'blacklist-management': true,
            'license-info': true,
            'user-management': true,
            'role-management': true
          },
          'user': {
            'page-summary': true,
            'page-bookings': true,
            'page-schedule': true,
            'page-newRental': true,
            'page-cars': true,              // 🔰 แก้ไขจาก false
            'page-config': true,            // 🔰 แก้ไขจาก false
            'page-finance': true,           // 🔰 เพิ่มใหม่
            'page-documents': true,         // 🔰 เพิ่มใหม่
            'company-info': true,
            'payment-settings': true,
            'booking-settings': true,
            'location-settings': true,
            'summary-message-settings': true,
            'quote-message-settings': true,
            'commission-settings': true,    // 🔰 เพิ่มใหม่
            'linebot-settings': true,       // 🔰 เพิ่มใหม่
            'translation-settings': false,
            'blacklist-management': false,
            'license-info': false,
            'user-management': false,
            'role-management': false
          }
        };
        // 🔰 --- สิ้นสุดจุดแก้ไขที่ 5 ---
      }
    } else if (key === "ชื่อกลุ่มผู้ใช้") {
      try { roleNames = JSON.parse(value); } catch (e) { roleNames = { 'admin': 'ผู้ดูแลระบบ', 'user': 'ผู้ใช้งานทั่วไป' }; }
    } else if (key === "คำอธิบายกลุ่มผู้ใช้") {
      try { roleDescriptions = JSON.parse(value); } catch (e) { roleDescriptions = { 'admin': 'มีสิทธิ์เข้าถึงทุกส่วนของระบบ', 'user': 'มีสิทธิ์เข้าถึงเฉพาะส่วนที่กำหนด' }; }
    } else if (key === "ตรวจสอบคิวรถ") {
      config[key] = value === "true" || value === true;
    } else {
      config[key] = value;
    }
  }

  if (config["ตรวจสอบคิวรถ"] === undefined) { config["ตรวจสอบคิวรถ"] = false; }
  if (config["ระยะเวลาเตรียมรถ"] === undefined) { config["ระยะเวลาเตรียมรถ"] = "0"; }

  // 🔰 --- จุดแก้ไขที่ 6: เพิ่มสิทธิ์ที่ขาดหายไปในค่าเริ่มต้น (สิทธิ์ผู้ใช้งาน - กรณีไม่มีข้อมูลเลย) ---
  if (!userPermissions) {
    userPermissions = {
      'page-summary': true,
      'page-bookings': true,
      'page-schedule': true,
      'page-newRental': true,
      'page-cars': true,              // 🔰 แก้ไขจาก false
      'page-config': true,            // 🔰 แก้ไขจาก false
      'page-finance': true,           // 🔰 เพิ่มใหม่
      'page-documents': true,         // 🔰 เพิ่มใหม่
      'company-info': true,
      'payment-settings': true,
      'booking-settings': true,
      'location-settings': true,
      'summary-message-settings': true,
      'quote-message-settings': true,
      'commission-settings': true,    // 🔰 เพิ่มใหม่
      'linebot-settings': true,       // 🔰 เพิ่มใหม่
      'translation-settings': false,
      'blacklist-management': false,
      'license-info': false
    };
  }
  // 🔰 --- สิ้นสุดจุดแก้ไขที่ 6 ---

  if (!rolePermissions) {
    rolePermissions = { 'admin': { 'page-summary': true, 'page-bookings': true, 'page-schedule': true, 'page-newRental': true, 'page-cars': true, 'page-config': true, 'company-info': true, 'payment-settings': true, 'booking-settings': true, 'location-settings': true, 'summary-message-settings': true, 'quote-message-settings': true, 'translation-settings': true, 'blacklist-management': true, 'license-info': true, 'user-management': true, 'role-management': true }, 'user': { ...userPermissions } };
  }

  if (!roleNames) { roleNames = { 'admin': 'ผู้ดูแลระบบ', 'user': 'ผู้ใช้งานทั่วไป' }; }
  if (!roleDescriptions) { roleDescriptions = { 'admin': 'มีสิทธิ์เข้าถึงทุกส่วนของระบบ', 'user': 'มีสิทธิ์เข้าถึงเฉพาะส่วนที่กำหนด' }; }

  if (userPermissions && rolePermissions && rolePermissions['user']) {
    rolePermissions['user'] = { ...userPermissions };
  }

  try {
    let needsUpdate = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === "สิทธิ์ผู้ใช้งาน") {
        try {
          const oldUserPermissions = JSON.parse(data[i][1]);
          if (JSON.stringify(oldUserPermissions) !== JSON.stringify(userPermissions)) { sheet.getRange(i + 1, 2).setValue(JSON.stringify(userPermissions)); needsUpdate = true; }
        } catch (e) { sheet.getRange(i + 1, 2).setValue(JSON.stringify(userPermissions)); needsUpdate = true; }
      } else if (data[i][0] === "กลุ่มผู้ใช้และสิทธิ์") {
        try {
          const oldRolePermissions = JSON.parse(data[i][1]);
          if (JSON.stringify(oldRolePermissions) !== JSON.stringify(rolePermissions)) { sheet.getRange(i + 1, 2).setValue(JSON.stringify(rolePermissions)); needsUpdate = true; }
        } catch (e) { sheet.getRange(i + 1, 2).setValue(JSON.stringify(rolePermissions)); needsUpdate = true; }
      }
    }
    if (needsUpdate) { console.log("อัปเดตสิทธิ์การเข้าถึงหน้าเรียบร้อยแล้ว"); }
  } catch (e) { console.error("เกิดข้อผิดพลาดในการบันทึกสิทธิ์: " + e); }

  return {
    config: config,
    userPermissions: userPermissions,
    rolePermissions: rolePermissions,
    roleNames: roleNames,
    roleDescriptions: roleDescriptions
  };
}







function updateSystemConfig(configData, sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);

  // ตรวจสอบว่ามีชีทการตั้งค่าหรือไม่
  let sheet = ss.getSheetByName(CONFIG_SHEET);
  if (!sheet) {
    // สร้างแผ่นงานการตั้งค่าถ้ายังไม่มี
    sheet = ss.insertSheet(CONFIG_SHEET);
    sheet.appendRow(["หัวข้อ", "ค่า"]);
  }

  // แยกข้อมูลการตั้งค่าและข้อมูลสิทธิ์ต่างๆ
  const config = configData.config || {};
  const userPermissions = configData.userPermissions || {};
  const rolePermissions = configData.rolePermissions || {};
  const roleNames = configData.roleNames || {};
  const roleDescriptions = configData.roleDescriptions || {};

  // ดึงข้อมูลการตั้งค่าทั้งหมด
  const data = sheet.getDataRange().getValues();
  const existingKeys = {};
  let userPermissionsRowIndex = -1;
  let rolePermissionsRowIndex = -1;
  let roleNamesRowIndex = -1;
  let roleDescriptionsRowIndex = -1;

  // ตรวจสอบและอัพเดตค่าที่มีอยู่แล้ว
  for (let i = 1; i < data.length; i++) {
    const key = data[i][0];
    existingKeys[key] = true;

    if (key === "สิทธิ์ผู้ใช้งาน") {
      userPermissionsRowIndex = i;
      sheet.getRange(i + 1, 2).setValue(JSON.stringify(userPermissions));
    } else if (key === "กลุ่มผู้ใช้และสิทธิ์") {
      rolePermissionsRowIndex = i;
      sheet.getRange(i + 1, 2).setValue(JSON.stringify(rolePermissions));
    } else if (key === "ชื่อกลุ่มผู้ใช้") {
      roleNamesRowIndex = i;
      sheet.getRange(i + 1, 2).setValue(JSON.stringify(roleNames));
    } else if (key === "คำอธิบายกลุ่มผู้ใช้") {
      roleDescriptionsRowIndex = i;
      sheet.getRange(i + 1, 2).setValue(JSON.stringify(roleDescriptions));
    } else if (config.hasOwnProperty(key)) {
      // ตรวจสอบว่าเป็นคีย์ที่ต้องการให้เป็นข้อความหรือไม่
      if (key === "หมายเลขพร้อมเพย์" || key === "หมายเลขบัญชีธนาคาร" || key === "ระยะเวลาเตรียมรถ") {
        // เพิ่มเครื่องหมาย ' หน้าค่าเพื่อบังคับให้เป็นข้อความ
        const value = config[key];
        if (value && !value.toString().startsWith("'")) {
          sheet.getRange(i + 1, 2).setValue("'" + value);
        } else {
          sheet.getRange(i + 1, 2).setValue(value);
        }
      } else if (key === "ตรวจสอบคิวรถ") {
        // บันทึกค่า boolean เป็นข้อความ "true" หรือ "false"
        sheet.getRange(i + 1, 2).setValue(config[key] === true || config[key] === "true" ? "true" : "false");
      } else {
        // คีย์อื่นๆ ใช้ค่าปกติ
        sheet.getRange(i + 1, 2).setValue(config[key]);
      }
    }
  }

  // เพิ่มค่าใหม่ที่ยังไม่มีในระบบ
  for (const key in config) {
    if (config.hasOwnProperty(key) && !existingKeys[key]) {
      if (key === "หมายเลขพร้อมเพย์" || key === "หมายเลขบัญชีธนาคาร" || key === "ระยะเวลาเตรียมรถ") {
        // เพิ่มเครื่องหมาย ' หน้าค่าเพื่อบังคับให้เป็นข้อความ
        const value = config[key];
        if (value && !value.toString().startsWith("'")) {
          sheet.appendRow([key, "'" + value]);
        } else {
          sheet.appendRow([key, value]);
        }
      } else if (key === "ตรวจสอบคิวรถ") {
        // บันทึกค่า boolean เป็นข้อความ "true" หรือ "false"
        sheet.appendRow([key, config[key] === true || config[key] === "true" ? "true" : "false"]);
      } else {
        // คีย์อื่นๆ ใช้ค่าปกติ
        sheet.appendRow([key, config[key]]);
      }
    }
  }

  // ถ้ายังไม่มีข้อมูลสิทธิ์ผู้ใช้งาน ให้เพิ่มเข้าไป
  if (userPermissionsRowIndex === -1 && !existingKeys["สิทธิ์ผู้ใช้งาน"]) {
    sheet.appendRow(["สิทธิ์ผู้ใช้งาน", JSON.stringify(userPermissions)]);
  }

  // ถ้ายังไม่มีข้อมูลกลุ่มผู้ใช้และสิทธิ์ ให้เพิ่มเข้าไป
  if (rolePermissionsRowIndex === -1 && !existingKeys["กลุ่มผู้ใช้และสิทธิ์"]) {
    sheet.appendRow(["กลุ่มผู้ใช้และสิทธิ์", JSON.stringify(rolePermissions)]);
  }

  // ถ้ายังไม่มีข้อมูลชื่อกลุ่ม ให้เพิ่มเข้าไป
  if (roleNamesRowIndex === -1 && !existingKeys["ชื่อกลุ่มผู้ใช้"]) {
    sheet.appendRow(["ชื่อกลุ่มผู้ใช้", JSON.stringify(roleNames)]);
  }

  // ถ้ายังไม่มีข้อมูลคำอธิบายกลุ่ม ให้เพิ่มเข้าไป
  if (roleDescriptionsRowIndex === -1 && !existingKeys["คำอธิบายกลุ่มผู้ใช้"]) {
    sheet.appendRow(["คำอธิบายกลุ่มผู้ใช้", JSON.stringify(roleDescriptions)]);
  }

  // นอกจากนี้ ให้ตั้งค่ารูปแบบของเซลล์ที่มีหมายเลขพร้อมเพย์และหมายเลขบัญชีธนาคาร
  const keyColumn = sheet.getRange("A:A");
  const values = keyColumn.getValues();

  for (let i = 0; i < values.length; i++) {
    const key = values[i][0];
    if (key === "หมายเลขพร้อมเพย์" || key === "หมายเลขบัญชีธนาคาร" || key === "เงินประกันความเสียหายเริ่มต้น"
      || key === "ค่ามัดจำคิวรถเริ่มต้น" || key === "ระยะเวลาเตรียมรถ") {
      // ตั้งค่าให้เป็นรูปแบบข้อความ (@ หมายถึง Text format)
      sheet.getRange(i + 1, 2).setNumberFormat('@');
    }
  }

  return { success: true, message: "อัพเดตการตั้งค่าสำเร็จ" };
}

/**
 * ฟังก์ชันสำหรับบันทึกข้อมูลสิทธิ์ (รองรับทั้งระบบเก่าและใหม่)
 */
function savePermissions(permissionData, sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(CONFIG_SHEET);

    if (!sheet) {
      throw new Error("ไม่พบชีทการตั้งค่า");
    }

    const data = sheet.getDataRange().getValues();
    let userPermissionsRowIndex = -1;
    let rolePermissionsRowIndex = -1;

    // ค้นหาแถวของข้อมูลสิทธิ์
    for (let i = 1; i < data.length; i++) {
      const key = data[i][0];
      if (key === "สิทธิ์ผู้ใช้งาน") {
        userPermissionsRowIndex = i;
      } else if (key === "กลุ่มผู้ใช้และสิทธิ์") {
        rolePermissionsRowIndex = i;
      }
    }

    // บันทึกข้อมูล userPermissions (แบบเดิม)
    if (permissionData.userPermissions) {
      if (userPermissionsRowIndex !== -1) {
        sheet.getRange(userPermissionsRowIndex + 1, 2).setValue(JSON.stringify(permissionData.userPermissions));
      } else {
        sheet.appendRow(["สิทธิ์ผู้ใช้งาน", JSON.stringify(permissionData.userPermissions)]);
      }
    }

    // บันทึกข้อมูล rolePermissions (แบบใหม่)
    if (permissionData.rolePermissions) {
      if (rolePermissionsRowIndex !== -1) {
        sheet.getRange(rolePermissionsRowIndex + 1, 2).setValue(JSON.stringify(permissionData.rolePermissions));
      } else {
        sheet.appendRow(["กลุ่มผู้ใช้และสิทธิ์", JSON.stringify(permissionData.rolePermissions)]);
      }
    }

    return { success: true };
  } catch (e) {
    console.error('เกิดข้อผิดพลาดในการบันทึกสิทธิ์: ' + e.message);
    return {
      success: false,
      message: e.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับบันทึกข้อมูลกลุ่มและสิทธิ์
 */
function saveRoleData(roleData, sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(CONFIG_SHEET);

    if (!sheet) {
      throw new Error("ไม่พบชีทการตั้งค่า");
    }

    const data = sheet.getDataRange().getValues();
    let rolePermissionsRowIndex = -1;
    let roleNamesRowIndex = -1;
    let roleDescriptionsRowIndex = -1;
    let userPermissionsRowIndex = -1;

    // ค้นหาแถวของข้อมูลกลุ่มและสิทธิ์
    for (let i = 1; i < data.length; i++) {
      const key = data[i][0];
      if (key === "กลุ่มผู้ใช้และสิทธิ์") {
        rolePermissionsRowIndex = i;
      } else if (key === "ชื่อกลุ่มผู้ใช้") {
        roleNamesRowIndex = i;
      } else if (key === "คำอธิบายกลุ่มผู้ใช้") {
        roleDescriptionsRowIndex = i;
      } else if (key === "สิทธิ์ผู้ใช้งาน") {
        userPermissionsRowIndex = i;
      }
    }

    // บันทึกข้อมูลกลุ่มและสิทธิ์
    if (roleData.rolePermissions) {
      if (rolePermissionsRowIndex !== -1) {
        sheet.getRange(rolePermissionsRowIndex + 1, 2).setValue(JSON.stringify(roleData.rolePermissions));
      } else {
        sheet.appendRow(["กลุ่มผู้ใช้และสิทธิ์", JSON.stringify(roleData.rolePermissions)]);
      }

      // อัปเดต userPermissions ให้ตรงกับ rolePermissions['user'] ด้วย
      if (roleData.rolePermissions['user'] && userPermissionsRowIndex !== -1) {
        sheet.getRange(userPermissionsRowIndex + 1, 2).setValue(JSON.stringify(roleData.rolePermissions['user']));
      }
    }

    // บันทึกข้อมูลชื่อกลุ่ม
    if (roleData.roleNames) {
      if (roleNamesRowIndex !== -1) {
        sheet.getRange(roleNamesRowIndex + 1, 2).setValue(JSON.stringify(roleData.roleNames));
      } else {
        sheet.appendRow(["ชื่อกลุ่มผู้ใช้", JSON.stringify(roleData.roleNames)]);
      }
    }

    // บันทึกข้อมูลคำอธิบายกลุ่ม
    if (roleData.roleDescriptions) {
      if (roleDescriptionsRowIndex !== -1) {
        sheet.getRange(roleDescriptionsRowIndex + 1, 2).setValue(JSON.stringify(roleData.roleDescriptions));
      } else {
        sheet.appendRow(["คำอธิบายกลุ่มผู้ใช้", JSON.stringify(roleData.roleDescriptions)]);
      }
    }

    return { success: true };
  } catch (e) {
    console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูลกลุ่ม: ' + e.message);
    return {
      success: false,
      message: e.message
    };
  }
}



function saveUserPermissions(permissions, sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);
  const sheet = ss.getSheetByName(CONFIG_SHEET);

  if (!sheet) {
    return { success: false, message: "ไม่พบแผ่นงานการตั้งค่า" };
  }

  const data = sheet.getDataRange().getValues();
  let permissionsRowIndex = -1;

  // ค้นหาแถวที่มีข้อมูลสิทธิ์ผู้ใช้งาน
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === "สิทธิ์ผู้ใช้งาน") {
      permissionsRowIndex = i;
      break;
    }
  }

  // บันทึกสิทธิ์ผู้ใช้งาน
  if (permissionsRowIndex !== -1) {
    // อัพเดตข้อมูลที่มีอยู่แล้ว
    sheet.getRange(permissionsRowIndex + 1, 2).setValue(JSON.stringify(permissions));
  } else {
    // เพิ่มข้อมูลใหม่
    sheet.appendRow(["สิทธิ์ผู้ใช้งาน", JSON.stringify(permissions)]);
  }

  return { success: true, message: "บันทึกสิทธิ์ผู้ใช้งานเรียบร้อย" };
}



// ฟังก์ชันสำหรับเพิ่มรายการในตารางรับส่งรถ
function addScheduleItem(scheduleData, sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);
  const sheet = ss.getSheetByName(SCHEDULE_SHEET);

  // ตรวจสอบว่าชีทมีข้อมูลหรือไม่
  if (sheet.getLastRow() === 0) {
    // ถ้าไม่มีข้อมูลในชีทเลย ให้สร้างหัวตารางก่อน
    const headers = ["หมายเลขการจอง", "วันที่", "เวลา", "ชื่อลูกค้า", "รถ", "ประเภท", "หมายเหตุ"];
    sheet.appendRow(headers);
  }

  // ดึงหัวข้อตาราง
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // ตรวจสอบว่ามีหัวข้อตารางหรือไม่
  if (headers.length === 0) {
    return { success: false, message: "ไม่พบหัวข้อตารางในตารางรับส่งรถ" };
  }

  const newRow = [];

  for (let i = 0; i < headers.length; i++) {
    newRow.push(scheduleData[headers[i]] || "");
  }

  sheet.appendRow(newRow);

  return { success: true, message: "เพิ่มรายการในตารางรับส่งรถสำเร็จ" };
}



function getAllCars(sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);

  // ตรวจสอบว่ามีชีทรายชื่อรถหรือไม่ ถ้าไม่มีให้สร้าง
  let sheet;
  try {
    sheet = ss.getSheetByName(CARS_SHEET);
    if (!sheet) {
      sheet = ss.insertSheet(CARS_SHEET);
      // สร้างหัวข้อตาราง (เพิ่มฟิลด์ "ชนิดเชื้อเพลิง")
      sheet.appendRow(["ยี่ห้อ", "รุ่น", "ทะเบียน", "พื้นที่การใช้งาน", "สี", "ค่าประกันความเสียหาย", "ประเภท", "ราคาเช่าต่อวัน", "สถานะ", "ชนิดเชื้อเพลิง"]);
    }
  } catch (e) {
    return { success: false, message: "เกิดข้อผิดพลาดในการเปิดชีทรายชื่อรถ: " + e };
  }

  // ถ้ามีเพียงหัวข้อแต่ไม่มีข้อมูล
  if (sheet.getLastRow() <= 1) {
    return { success: true, data: [] };
  }

  const data = sheet.getDataRange().getValues();
  let headers = data[0];

  // === Migration: ตรวจสอบและเพิ่มคอลัมน์ "ค่าล่วงเวลาต่อชั่วโมง" ถ้ายังไม่มี ===
  if (!headers.includes("ค่าล่วงเวลาต่อชั่วโมง")) {
    sheet.insertColumnAfter(headers.length);
    sheet.getRange(1, headers.length + 1).setValue("ค่าล่วงเวลาต่อชั่วโมง");
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log("Migration: เพิ่มคอลัมน์ 'ค่าล่วงเวลาต่อชั่วโมง' ลงในชีตรถทั้งหมด");
  }

  const cars = [];

  for (let i = 1; i < data.length; i++) {
    const car = {};
    for (let j = 0; j < headers.length; j++) {
      car[headers[j]] = data[i][j];
    }
    car.id = i; // เพิ่ม id เพื่อใช้ในการอ้างอิง
    cars.push(car);
  }

  return { success: true, data: cars };
}

/**
 * ดึงรายชื่อรถทั้งหมดสำหรับ Timeline Tab (แบบย่อ)
 * @param {string} sheetID - Sheet ID
 * @returns {Array} รายชื่อรถพร้อมข้อมูลพื้นฐาน
 */
function getCarList(sheetID) {
  try {
    Logger.log('[getCarList] Called with sheetID: ' + sheetID);
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(CARS_SHEET);
    Logger.log('[getCarList] CARS_SHEET name: ' + CARS_SHEET);

    if (!sheet || sheet.getLastRow() <= 1) {
      Logger.log('[getCarList] No sheet or no data found');
      return [];
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    Logger.log('[getCarList] Headers: ' + JSON.stringify(headers));

    const brandIndex = headers.indexOf('ยี่ห้อ');
    const modelIndex = headers.indexOf('รุ่น');
    const plateIndex = headers.indexOf('ทะเบียน');
    const statusIndex = headers.indexOf('สถานะ');
    Logger.log('[getCarList] Column indices - Brand:' + brandIndex + ', Model:' + modelIndex + ', Plate:' + plateIndex + ', Status:' + statusIndex);

    const carList = [];

    for (let i = 1; i < data.length; i++) {
      const brand = data[i][brandIndex] || '';
      const model = data[i][modelIndex] || '';
      const plate = data[i][plateIndex] || '';
      const status = data[i][statusIndex] || '';

      // รวมเป็นชื่อเต็ม
      const fullName = `${brand} ${model} (${plate})`.trim();

      carList.push({
        fullName: fullName,
        brand: brand,
        model: model,
        plate: plate,
        status: status
      });
    }

    Logger.log('[getCarList] Total cars found: ' + carList.length);
    return carList;
  } catch (error) {
    Logger.log('[getCarList] Error: ' + error.toString());
    return [];
  }
}

/**
 * ดึงข้อมูลการจองของรถคันที่เลือกตามเดือน (จากชีต "ตารางรับส่งรถ")
 * @param {string} carName - ชื่อรถเต็ม (เช่น "Honda HRV (จท6096)")
 * @param {number} year - ปี ค.ศ. (เช่น 2025)
 * @param {number} month - เดือน (1-12)
 * @param {string} sheetID - Sheet ID
 * @returns {Object} { bookings: [], summary: {} }
 */
function getCarBookingsByMonth(carName, year, month, sheetID) {
  try {
    Logger.log('[getCarBookingsByMonth] ========== START ==========');
    Logger.log('[getCarBookingsByMonth] Params - carName: ' + carName + ', year: ' + year + ', month: ' + month);

    const timeZone = Session.getScriptTimeZone();
    const ss = SpreadsheetApp.openById(sheetID);
    const scheduleSheet = ss.getSheetByName(SCHEDULE_SHEET);

    if (!scheduleSheet) {
      Logger.log('[getCarBookingsByMonth] ERROR: ไม่พบชีต ' + SCHEDULE_SHEET);
      return {
        bookings: [],
        summary: { totalDays: 0, rentedDays: 0, freeDays: 0 },
        error: 'ไม่พบชีต ตารางรับส่งรถ'
      };
    }

    // แยกชื่อรถออกเป็น Brand, Model และทะเบียน
    // รูปแบบ: "Honda HRV (จท6096)" หรือ "Toyota Camry (กข1234)"
    const match = carName.match(/^(.+?)\s*\(([^)]+)\)$/);
    if (!match) {
      Logger.log('[getCarBookingsByMonth] ERROR: รูปแบบชื่อรถไม่ถูกต้อง - ' + carName);
      return {
        bookings: [],
        summary: { totalDays: 0, rentedDays: 0, freeDays: 0 },
        error: 'รูปแบบชื่อรถไม่ถูกต้อง'
      };
    }

    const carModelBrand = match[1].trim(); // "Honda HRV"
    const plate = match[2].trim(); // "จท6096"
    Logger.log('[getCarBookingsByMonth] Searching for plate: ' + plate);

    // อ่านข้อมูลจากชีต
    const scheduleValues = scheduleSheet.getDataRange().getValues();
    const scheduleHeaders = scheduleValues.length > 0 ? scheduleValues[0].map(h => String(h).trim()) : [];

    Logger.log('[getCarBookingsByMonth] Headers: ' + JSON.stringify(scheduleHeaders));
    Logger.log('[getCarBookingsByMonth] Total rows: ' + scheduleValues.length);

    const scheduleDateIndex = scheduleHeaders.indexOf("วันที่");
    const scheduleCarIndex = scheduleHeaders.indexOf("รถ");
    const scheduleTypeIndex = scheduleHeaders.indexOf("ประเภท");
    const scheduleBookingNoIndex = scheduleHeaders.indexOf("หมายเลขการจอง");
    const scheduleCustomerIndex = scheduleHeaders.indexOf("ชื่อลูกค้า");

    Logger.log('[getCarBookingsByMonth] Column indices - วันที่: ' + scheduleDateIndex + ', รถ: ' + scheduleCarIndex + ', ประเภท: ' + scheduleTypeIndex);

    if (scheduleDateIndex === -1 || scheduleCarIndex === -1) {
      Logger.log('[getCarBookingsByMonth] ERROR: ไม่พบคอลัมน์ที่จำเป็น');
      return {
        bookings: [],
        summary: { totalDays: 0, rentedDays: 0, freeDays: 0 },
        error: 'ไม่พบคอลัมน์ที่จำเป็นในชีต - วันที่: ' + scheduleDateIndex + ', รถ: ' + scheduleCarIndex,
        headers: scheduleHeaders
      };
    }

    // สร้างวันที่เริ่มต้นและสิ้นสุดของเดือน
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);
    Logger.log('[getCarBookingsByMonth] Month range: ' + monthStart + ' to ' + monthEnd);

    // ขั้นตอนที่ 1: เก็บหมายเลขการจองที่มีส่วนเกี่ยวข้องกับเดือนนี้
    const relevantBookingNumbers = new Set();
    let totalRowsChecked = 0;
    let matchingPlateRows = 0;
    let matchingDateRows = 0;

    for (let i = 1; i < scheduleValues.length; i++) {
      totalRowsChecked++;
      const scheduleRow = scheduleValues[i];
      const itemDateValue = scheduleRow[scheduleDateIndex];
      const carPlate = String(scheduleRow[scheduleCarIndex] || '').trim();
      const bookingNo = String(scheduleRow[scheduleBookingNoIndex] || '').trim();

      // ตรวจสอบว่าเป็น Date object และมีค่า
      if (!itemDateValue || !(itemDateValue instanceof Date)) continue;

      // ตรวจสอบว่าทะเบียนรถตรงกันหรือไม่
      if (!carPlate.includes(plate)) continue;
      matchingPlateRows++;

      // ตรวจสอบว่าวันที่อยู่ในช่วงเดือนที่ต้องการหรือไม่
      const eventDate = new Date(itemDateValue);
      if (eventDate < monthStart || eventDate > monthEnd) continue;
      matchingDateRows++;

      // เก็บหมายเลขการจองที่เกี่ยวข้อง
      if (bookingNo) {
        relevantBookingNumbers.add(bookingNo);
      }
    }

    Logger.log('[getCarBookingsByMonth] Found ' + relevantBookingNumbers.size + ' relevant booking numbers in this month');

    // ขั้นตอนที่ 2: ดึงข้อมูลทั้งหมดของหมายเลขการจองเหล่านั้น (ทั้งในและนอกเดือน)
    const bookingMap = new Map();

    for (let i = 1; i < scheduleValues.length; i++) {
      const scheduleRow = scheduleValues[i];
      const itemDateValue = scheduleRow[scheduleDateIndex];
      const carPlate = String(scheduleRow[scheduleCarIndex] || '').trim();
      const eventType = String(scheduleRow[scheduleTypeIndex] || '').trim();
      const bookingNo = String(scheduleRow[scheduleBookingNoIndex] || '').trim();

      // Log ข้อมูลแถวแรกเพื่อ debug
      if (i === 1) {
        Logger.log('[getCarBookingsByMonth] Sample row 1:');
        Logger.log('[getCarBookingsByMonth]   - Date value: ' + itemDateValue + ' (type: ' + typeof itemDateValue + ', instanceof Date: ' + (itemDateValue instanceof Date) + ')');
        Logger.log('[getCarBookingsByMonth]   - Car: "' + carPlate + '"');
        Logger.log('[getCarBookingsByMonth]   - Type: "' + eventType + '"');
        Logger.log('[getCarBookingsByMonth]   - Booking: "' + bookingNo + '"');
        Logger.log('[getCarBookingsByMonth]   - Looking for plate: "' + plate + '"');
        Logger.log('[getCarBookingsByMonth]   - includes() result: ' + carPlate.includes(plate));
      }

      // ตรวจสอบว่าเป็น Date object และมีค่า
      if (!itemDateValue || !(itemDateValue instanceof Date)) continue;

      // ตรวจสอบว่าทะเบียนรถตรงกันหรือไม่
      if (!carPlate.includes(plate)) continue;

      // เฉพาะหมายเลขการจองที่เกี่ยวข้องกับเดือนนี้เท่านั้น
      if (!relevantBookingNumbers.has(bookingNo)) continue;

      const eventDate = new Date(itemDateValue);

      Logger.log('[getCarBookingsByMonth] Processing booking ' + bookingNo + ' - Type: ' + eventType + ', Date: ' + eventDate);

      // จัดกลุ่มตามหมายเลขการจอง
      if (!bookingMap.has(bookingNo)) {
        bookingMap.set(bookingNo, {
          bookingNumber: bookingNo,
          customerName: String(scheduleRow[scheduleCustomerIndex] || ''),
          startDate: null,
          endDate: null,
          pickupDate: null,
          returnDate: null
        });
      }

      const booking = bookingMap.get(bookingNo);

      if (eventType === 'รับรถ') {
        booking.pickupDate = eventDate;
        if (!booking.startDate || eventDate < booking.startDate) {
          booking.startDate = eventDate;
        }
      } else if (eventType === 'ส่งคืนรถ') {
        booking.returnDate = eventDate;
        if (!booking.endDate || eventDate > booking.endDate) {
          booking.endDate = eventDate;
        }
      }
    }

    // แปลง Map เป็น Array และกรองเฉพาะที่มีวันเริ่มต้นและสิ้นสุด
    const bookings = Array.from(bookingMap.values())
      .filter(b => b.startDate && b.endDate)
      .map(b => ({
        bookingNumber: b.bookingNumber,
        customerName: b.customerName,
        startDate: Utilities.formatDate(b.startDate, timeZone, 'yyyy-MM-dd'),
        endDate: Utilities.formatDate(b.endDate, timeZone, 'yyyy-MM-dd'),
        pickupDate: b.pickupDate ? Utilities.formatDate(b.pickupDate, timeZone, 'yyyy-MM-dd') : null,
        returnDate: b.returnDate ? Utilities.formatDate(b.returnDate, timeZone, 'yyyy-MM-dd') : null
      }));

    // คำนวณสถิติ
    const totalDays = monthEnd.getDate();
    const rentedDaysSet = new Set();

    for (const booking of bookings) {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);

      let current = new Date(start);
      while (current <= end) {
        if (current >= monthStart && current <= monthEnd) {
          const dateKey = Utilities.formatDate(current, timeZone, 'yyyy-MM-dd');
          rentedDaysSet.add(dateKey);
        }
        current.setDate(current.getDate() + 1);
      }
    }

    const rentedDays = rentedDaysSet.size;
    const freeDays = totalDays - rentedDays;

    Logger.log('[getCarBookingsByMonth] Rows checked: ' + totalRowsChecked);
    Logger.log('[getCarBookingsByMonth] Matching plate: ' + matchingPlateRows);
    Logger.log('[getCarBookingsByMonth] Matching date range: ' + matchingDateRows);
    Logger.log('[getCarBookingsByMonth] Found ' + bookings.length + ' bookings');
    Logger.log('[getCarBookingsByMonth] Summary - Total: ' + totalDays + ', Rented: ' + rentedDays + ', Free: ' + freeDays);
    Logger.log('[getCarBookingsByMonth] ========== END ==========');

    return {
      bookings: bookings,
      summary: {
        totalDays: totalDays,
        rentedDays: rentedDays,
        freeDays: freeDays
      }
    };

  } catch (error) {
    Logger.log('[getCarBookingsByMonth] EXCEPTION: ' + error.toString());
    Logger.log('[getCarBookingsByMonth] Stack: ' + error.stack);
    return {
      bookings: [],
      summary: { totalDays: 0, rentedDays: 0, freeDays: 0 },
      error: error.toString()
    };
  }
}

/**
 * แปลงวันที่จากรูปแบบไทย (dd/mm/yyyy) เป็น Date object
 * @param {string} dateStr - วันที่ในรูปแบบ dd/mm/yyyy
 * @returns {Date|null} Date object หรือ null ถ้าแปลงไม่ได้
 */
function parseThaiDate(dateStr) {
  if (!dateStr) {
    return null;
  }

  try {
    Logger.log('[parseThaiDate] Input: ' + dateStr);
    Logger.log('[parseThaiDate] typeof: ' + typeof dateStr);
    Logger.log('[parseThaiDate] instanceof Date: ' + (dateStr instanceof Date));

    // ถ้าเป็น object (Date object จาก Google Sheets)
    if (typeof dateStr === 'object' && dateStr !== null) {
      Logger.log('[parseThaiDate] Is object, trying to parse...');

      // ลองแปลงเป็น Date ใหม่โดยใช้ valueOf หรือ toString
      try {
        // วิธีที่ 1: ถ้ามี getTime() ที่ valid ให้สร้าง Date ใหม่
        if (typeof dateStr.getTime === 'function') {
          const timestamp = dateStr.getTime();
          Logger.log('[parseThaiDate] getTime(): ' + timestamp + ', isNaN: ' + isNaN(timestamp));
          if (!isNaN(timestamp)) {
            const newDate = new Date(timestamp);
            Logger.log('[parseThaiDate] Created new Date from timestamp: ' + newDate);
            return newDate;
          }
        }

        // วิธีที่ 2: แปลงเป็น string แล้วสร้าง Date ใหม่
        const dateString = dateStr.toString();
        Logger.log('[parseThaiDate] toString(): ' + dateString);
        const result = new Date(dateString);
        Logger.log('[parseThaiDate] new Date(toString()): ' + result + ', isValid: ' + !isNaN(result.getTime()));
        if (!isNaN(result.getTime())) {
          return result;
        }
      } catch (e) {
        Logger.log('[parseThaiDate] Exception in object parsing: ' + e.toString());
      }

      Logger.log('[parseThaiDate] Returning null for object');
      return null;
    }

    // ถ้าเป็น string รูปแบบ dd/mm/yyyy
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
        const year = parseInt(parts[2], 10);
        const result = new Date(year, month, day);
        if (isNaN(result.getTime())) {
          return null;
        }
        return result;
      }
    }

    // ลองแปลงด้วย new Date()
    const result = new Date(dateStr);
    if (isNaN(result.getTime())) {
      return null;
    }
    return result;
  } catch (error) {
    Logger.log('[parseThaiDate] Error: ' + error.toString());
    return null;
  }
}

/**
 * ดึงข้อมูลรถรุ่นเดียวกันและการจองในเดือนที่เลือก (จากชีต "ตารางรับส่งรถ")
 * @param {string} carName - ชื่อรถที่เลือก (เช่น "Toyota Camry (กก-1234)")
 * @param {number} year - ปี ค.ศ.
 * @param {number} month - เดือน (1-12)
 * @param {string} sheetID - ID ของ Google Sheet
 * @returns {Array} รายการรถรุ่นเดียวกันพร้อมข้อมูลการจอง
 */
function getSimilarCarsBookings(carName, year, month, sheetID) {
  try {
    Logger.log('[getSimilarCarsBookings] ========== START ==========');
    Logger.log('[getSimilarCarsBookings] Params - carName: ' + carName + ', year: ' + year + ', month: ' + month);

    const timeZone = Session.getScriptTimeZone();
    const ss = SpreadsheetApp.openById(sheetID);
    const carsSheet = ss.getSheetByName(CARS_SHEET);
    const scheduleSheet = ss.getSheetByName(SCHEDULE_SHEET);

    if (!carsSheet || !scheduleSheet) {
      Logger.log('[getSimilarCarsBookings] ERROR: Missing sheets');
      return [];
    }

    // แยกชื่อรถออกเป็น Brand, Model และทะเบียน
    const match = carName.match(/^(.+?)\s*\(([^)]+)\)$/);
    if (!match) {
      Logger.log('[getSimilarCarsBookings] ERROR: Invalid car name format - ' + carName);
      return [];
    }

    const carModelBrand = match[1].trim(); // "Toyota  Yaris Ativ 2024"
    const selectedCarPlate = match[2].trim(); // "งบ 484 สงขลา"

    // แยก Brand และ Model
    const selectedCarBrand = carModelBrand.split(' ')[0]; // "Toyota"
    let selectedCarModel = carModelBrand.split(' ').slice(1).join(' ').trim(); // " Yaris Ativ 2024" -> "Yaris Ativ 2024"

    // ลบปีรถออก (ตัวเลข 4 หลักท้ายสุด) เช่น "Yaris Ativ 2024" -> "Yaris Ativ"
    selectedCarModel = selectedCarModel.replace(/\s+\d{4}$/, '').trim();

    Logger.log('[getSimilarCarsBookings] Parsed - Brand: "' + selectedCarBrand + '", Model: "' + selectedCarModel + '" (cleaned), Plate: "' + selectedCarPlate + '"');

    // ดึงข้อมูลรถทั้งหมด
    const carsData = carsSheet.getDataRange().getValues();
    const carsHeaders = carsData[0];
    const brandIndex = carsHeaders.indexOf('ยี่ห้อ');
    const modelIndex = carsHeaders.indexOf('รุ่น');
    const plateIndex = carsHeaders.indexOf('ทะเบียน');
    const statusIndex = carsHeaders.indexOf('สถานะ');

    Logger.log('[getSimilarCarsBookings] Total cars in sheet: ' + (carsData.length - 1));
    Logger.log('[getSimilarCarsBookings] Looking for Model="' + selectedCarModel + '" (เทียบเฉพาะ Model ไม่เทียบ Brand)');

    // หารถรุ่นเดียวกัน
    const similarCars = [];
    for (let i = 1; i < carsData.length; i++) {
      const brand = String(carsData[i][brandIndex] || '').trim();
      const model = String(carsData[i][modelIndex] || '').trim();
      const plate = String(carsData[i][plateIndex] || '').trim();

      // Log แถวแรกเพื่อ debug
      if (i === 1) {
        Logger.log('[getSimilarCarsBookings] Sample row 1 - Brand: "' + brand + '", Model: "' + model + '", Plate: "' + plate + '"');
      }
      const status = String(carsData[i][statusIndex] || '').trim();

      // เช็คว่าตรงกับ Model หรือไม่ (ไม่เช็ค Brand)
      const modelMatch = (model === selectedCarModel);

      if (i <= 3) { // Log 3 แถวแรกเพื่อ debug
        Logger.log('[getSimilarCarsBookings] Row ' + i + ' - Model: "' + model + '" (match: ' + modelMatch + ')');
      }

      if (modelMatch) {
        const fullName = `${brand} ${model} (${plate})`;
        Logger.log('[getSimilarCarsBookings] FOUND similar car: ' + fullName);
        similarCars.push({
          fullName: fullName,
          brand: brand,
          model: model,
          plate: plate,
          status: status
        });
      }
    }

    Logger.log('[getSimilarCarsBookings] Total similar cars found: ' + similarCars.length);

    // อ่านข้อมูลจากชีต "ตารางรับส่งรถ"
    const scheduleValues = scheduleSheet.getDataRange().getValues();
    const scheduleHeaders = scheduleValues.length > 0 ? scheduleValues[0].map(h => String(h).trim()) : [];

    const scheduleDateIndex = scheduleHeaders.indexOf("วันที่");
    const scheduleCarIndex = scheduleHeaders.indexOf("รถ");
    const scheduleTypeIndex = scheduleHeaders.indexOf("ประเภท");
    const scheduleBookingNoIndex = scheduleHeaders.indexOf("หมายเลขการจอง");
    const scheduleCustomerIndex = scheduleHeaders.indexOf("ชื่อลูกค้า");

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);
    const totalDays = monthEnd.getDate();

    // สำหรับแต่ละรถ หาการจองในเดือนที่เลือก
    const results = similarCars.map(car => {
      // ขั้นตอนที่ 1: เก็บหมายเลขการจองที่มีส่วนเกี่ยวข้องกับเดือนนี้
      const relevantBookingNumbers = new Set();

      for (let i = 1; i < scheduleValues.length; i++) {
        const scheduleRow = scheduleValues[i];
        const itemDateValue = scheduleRow[scheduleDateIndex];
        const carPlate = String(scheduleRow[scheduleCarIndex] || '').trim();
        const bookingNo = String(scheduleRow[scheduleBookingNoIndex] || '').trim();

        // ตรวจสอบว่าเป็น Date object และมีค่า
        if (!itemDateValue || !(itemDateValue instanceof Date)) continue;

        // ตรวจสอบว่าทะเบียนรถตรงกันหรือไม่
        if (!carPlate.includes(car.plate)) continue;

        // ตรวจสอบว่าวันที่อยู่ในช่วงเดือนที่ต้องการหรือไม่
        const eventDate = new Date(itemDateValue);
        if (eventDate < monthStart || eventDate > monthEnd) continue;

        // เก็บหมายเลขการจองที่เกี่ยวข้อง
        if (bookingNo) {
          relevantBookingNumbers.add(bookingNo);
        }
      }

      // ขั้นตอนที่ 2: ดึงข้อมูลทั้งหมดของหมายเลขการจองเหล่านั้น (ทั้งในและนอกเดือน)
      const bookingMap = new Map();

      for (let i = 1; i < scheduleValues.length; i++) {
        const scheduleRow = scheduleValues[i];
        const itemDateValue = scheduleRow[scheduleDateIndex];
        const carPlate = String(scheduleRow[scheduleCarIndex] || '').trim();
        const eventType = String(scheduleRow[scheduleTypeIndex] || '').trim();
        const bookingNo = String(scheduleRow[scheduleBookingNoIndex] || '').trim();

        // ตรวจสอบว่าเป็น Date object และมีค่า
        if (!itemDateValue || !(itemDateValue instanceof Date)) continue;

        // ตรวจสอบว่าทะเบียนรถตรงกันหรือไม่
        if (!carPlate.includes(car.plate)) continue;

        // เฉพาะหมายเลขการจองที่เกี่ยวข้องกับเดือนนี้เท่านั้น
        if (!relevantBookingNumbers.has(bookingNo)) continue;

        const eventDate = new Date(itemDateValue);

        // จัดกลุ่มตามหมายเลขการจอง
        if (!bookingMap.has(bookingNo)) {
          bookingMap.set(bookingNo, {
            bookingNumber: bookingNo,
            customerName: String(scheduleRow[scheduleCustomerIndex] || ''),
            startDate: null,
            endDate: null,
            pickupDate: null,
            returnDate: null
          });
        }

        const booking = bookingMap.get(bookingNo);

        if (eventType === 'รับรถ') {
          booking.pickupDate = eventDate;
          if (!booking.startDate || eventDate < booking.startDate) {
            booking.startDate = eventDate;
          }
        } else if (eventType === 'ส่งคืนรถ') {
          booking.returnDate = eventDate;
          if (!booking.endDate || eventDate > booking.endDate) {
            booking.endDate = eventDate;
          }
        }
      }

      // แปลง Map เป็น Array และกรองเฉพาะที่มีวันเริ่มต้นและสิ้นสุด
      const bookings = Array.from(bookingMap.values())
        .filter(b => b.startDate && b.endDate)
        .map(b => ({
          bookingNumber: b.bookingNumber,
          customerName: b.customerName,
          startDate: Utilities.formatDate(b.startDate, timeZone, 'yyyy-MM-dd'),
          endDate: Utilities.formatDate(b.endDate, timeZone, 'yyyy-MM-dd'),
          pickupDate: b.pickupDate ? Utilities.formatDate(b.pickupDate, timeZone, 'yyyy-MM-dd') : null,
          returnDate: b.returnDate ? Utilities.formatDate(b.returnDate, timeZone, 'yyyy-MM-dd') : null
        }));

      // คำนวณสถิติ
      const rentedDaysSet = new Set();

      for (const booking of bookings) {
        const start = new Date(booking.startDate);
        const end = new Date(booking.endDate);

        let current = new Date(start);
        while (current <= end) {
          if (current >= monthStart && current <= monthEnd) {
            const dateKey = Utilities.formatDate(current, timeZone, 'yyyy-MM-dd');
            rentedDaysSet.add(dateKey);
          }
          current.setDate(current.getDate() + 1);
        }
      }

      const rentedDays = rentedDaysSet.size;
      const freeDays = totalDays - rentedDays;

      return {
        car: car,
        bookings: bookings,
        summary: {
          totalDays: totalDays,
          rentedDays: rentedDays,
          freeDays: freeDays
        }
      };
    });

    Logger.log('[getSimilarCarsBookings] Returning ' + results.length + ' cars with booking data');
    Logger.log('[getSimilarCarsBookings] ========== END ==========');

    return results;

  } catch (error) {
    Logger.log('[getSimilarCarsBookings] EXCEPTION: ' + error.toString());
    Logger.log('[getSimilarCarsBookings] Stack: ' + error.stack);
    return [];
  }
}

function addNewCar(carData, sheetID) {
  Logger.log("ค่าที่ส่งมาจาก client: " + JSON.stringify(carData));

  const ss = SpreadsheetApp.openById(sheetID);
  let sheet;

  try {
    sheet = ss.getSheetByName(CARS_SHEET);
    if (!sheet) {
      sheet = ss.insertSheet(CARS_SHEET);
      sheet.appendRow(["ยี่ห้อ", "รุ่น", "ทะเบียน", "พื้นที่การใช้งาน", "สี", "ค่าประกันความเสียหาย", "ประเภท", "ราคาเช่าต่อวัน", "สถานะ", "ชนิดเชื้อเพลิง", "สีปฏิทิน", "รูปแบบค่าคอมมิชชั่น"]);
    }
  } catch (e) {
    return { success: false, message: "เกิดข้อผิดพลาดในการเปิดชีทรถ: " + e };
  }

  // ตรวจสอบว่ามีหัวข้อ "รูปแบบค่าคอมมิชชั่น" หรือยัง
  let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (!headers.includes("รูปแบบค่าคอมมิชชั่น")) {
    sheet.appendRow([]); // กันลบแถว header ผิด
    sheet.insertColumnAfter(headers.length);
    sheet.getRange(1, headers.length + 1).setValue("รูปแบบค่าคอมมิชชั่น");
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }

  const newRow = [];
  for (let i = 0; i < headers.length; i++) {
    newRow.push(carData[headers[i]] || "");
  }

  try {
    sheet.appendRow(newRow);

    // Format ทะเบียนเป็นข้อความ
    const regNoCol = headers.indexOf("ทะเบียน") + 1;
    if (regNoCol > 0) {
      sheet.getRange(2, regNoCol, sheet.getLastRow() - 1, 1).setNumberFormat('@STRING@');
    }
    clearSummaryCacheForTenant(sheetID);
    return { success: true, message: "เพิ่มรถใหม่สำเร็จ" };
  } catch (e) {
    return { success: false, message: "เกิดข้อผิดพลาดในการเพิ่มข้อมูลรถ: " + e };
  }
}



function updateCar(carId, carData, sheetID) {
  Logger.log("ค่าที่ส่งมาจาก client: " + JSON.stringify(carData));

  const ss = SpreadsheetApp.openById(sheetID);
  const sheet = ss.getSheetByName(CARS_SHEET);

  if (!sheet || sheet.getLastRow() <= 1) {
    return { success: false, message: "ไม่พบข้อมูลรถในระบบ" };
  }

  if (carId <= 0 || carId >= sheet.getLastRow()) {
    return { success: false, message: "รหัสรถไม่ถูกต้อง" };
  }

  let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // ตรวจสอบว่ามี "รูปแบบค่าคอมมิชชั่น" หรือยัง
  if (!headers.includes("รูปแบบค่าคอมมิชชั่น")) {
    sheet.insertColumnAfter(headers.length);
    sheet.getRange(1, headers.length + 1).setValue("รูปแบบค่าคอมมิชชั่น");
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }

  // ตรวจสอบว่ามี "ค่าล่วงเวลาต่อชั่วโมง" หรือยัง
  if (!headers.includes("ค่าล่วงเวลาต่อชั่วโมง")) {
    sheet.insertColumnAfter(headers.length);
    sheet.getRange(1, headers.length + 1).setValue("ค่าล่วงเวลาต่อชั่วโมง");
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }

  // ตรวจสอบว่ามี "ค่ามัดจำคิวรถ" หรือยัง
  if (!headers.includes("ค่ามัดจำคิวรถ")) {
    sheet.insertColumnAfter(headers.length);
    sheet.getRange(1, headers.length + 1).setValue("ค่ามัดจำคิวรถ");
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }

  const oldCarData = sheet.getRange(carId + 1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const oldCar = {};
  for (let i = 0; i < headers.length; i++) {
    oldCar[headers[i]] = oldCarData[i];
  }

  const oldCarName = `${oldCar.ยี่ห้อ} ${oldCar.รุ่น} (${oldCar.ทะเบียน})`;

  for (let i = 0; i < headers.length; i++) {
    const key = headers[i];
    if (carData.hasOwnProperty(key)) {
      sheet.getRange(carId + 1, i + 1).setValue(carData[key]);
    }
  }

  const newCarName = `${carData.ยี่ห้อ} ${carData.รุ่น} (${carData.ทะเบียน})`;
  if (oldCarName !== newCarName) {
    try {
      Logger.log("Updating car name from: " + oldCarName + " to: " + newCarName);
      updateCarNameInAllSheets(oldCarName, newCarName);
    } catch (e) {
      Logger.log("Error updating car name in other sheets: " + e.toString());
    }
  }

  // Format ทะเบียนเป็นข้อความ
  const regNoCol = headers.indexOf("ทะเบียน") + 1;
  if (regNoCol > 0) {
    sheet.getRange(2, regNoCol, sheet.getLastRow() - 1, 1).setNumberFormat('@STRING@');
  }
  clearSummaryCacheForTenant(sheetID);
  return { success: true, message: "อัพเดตข้อมูลรถสำเร็จ" };
}




// ฟังก์ชันสำหรับดึงคำอธิบายโซน
function getZoneDescription(zoneKey, sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);

  try {
    // เปิดแผ่นงาน "แปลสัญญาเช่า"
    const sheet = ss.getSheetByName("แปลสัญญาเช่า");
    if (!sheet) {
      return { success: false, message: "ไม่พบแผ่นงาน 'แปลสัญญาเช่า'" };
    }

    // ดึงข้อมูลจากคอลัมน์ A และ B
    const dataRange = sheet.getRange("A:B").getValues();

    // ค้นหา zoneKey ในคอลัมน์ A
    for (let i = 0; i < dataRange.length; i++) {
      if (dataRange[i][0] === zoneKey) {
        return {
          success: true,
          description: dataRange[i][1] || "",
          key: zoneKey
        };
      }
    }

    // กรณีไม่พบข้อมูล
    return { success: true, description: "", key: zoneKey };

  } catch (e) {
    return { success: false, message: "เกิดข้อผิดพลาดในการดึงคำอธิบายโซน: " + e };
  }
}


// ฟังก์ชันแยกชื่อรถเป็นส่วนประกอบต่างๆ
function parseCarName(carName) {
  // รับชื่อรถในรูปแบบ "ยี่ห้อ รุ่น (ทะเบียน)"
  try {
    const result = {
      brand: '',
      model: '',
      license: ''
    };

    // แยกทะเบียนรถ (อยู่ในวงเล็บ)
    const licenseMatch = carName.match(/\(([^)]+)\)/);
    if (licenseMatch && licenseMatch[1]) {
      result.license = licenseMatch[1].trim();

      // แยกยี่ห้อและรุ่น (ส่วนที่อยู่ก่อนวงเล็บ)
      const brandModelPart = carName.split('(')[0].trim();

      // หาช่องว่างสุดท้ายเพื่อแยกยี่ห้อและรุ่น
      const lastSpaceIndex = brandModelPart.lastIndexOf(' ');

      if (lastSpaceIndex !== -1) {
        result.brand = brandModelPart.substring(0, lastSpaceIndex).trim();
        result.model = brandModelPart.substring(lastSpaceIndex + 1).trim();
      } else {
        // กรณีไม่มีช่องว่าง ถือว่าทั้งหมดเป็นยี่ห้อ
        result.brand = brandModelPart;
      }
    } else {
      // กรณีไม่พบวงเล็บ ใช้ชื่อรถเดิมเป็นทะเบียน
      result.license = carName.trim();
    }

    return result;
  } catch (e) {
    Logger.log("Error parsing car name: " + e.toString());
    // กรณีมีข้อผิดพลาด ส่งคืนค่าว่าง
    return { brand: '', model: '', license: carName.trim() };
  }
}



// ฟังก์ชัน updateCarNameInAllSheets ที่ปรับปรุงเพิ่มการอัพเดทแผ่นงานการแจ้งเตือน
function updateCarNameInAllSheets(oldCarName, newCarName, sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);

  // แยกข้อมูลรถเก่าและใหม่
  const oldCarParts = parseCarName(oldCarName);
  const newCarParts = parseCarName(newCarName);

  // ล็อกสำหรับตรวจสอบ
  Logger.log("Starting updateCarNameInAllSheets. Old name: " + oldCarName + " to: " + newCarName);
  Logger.log("Old license: " + oldCarParts.license + ", New license: " + newCarParts.license);

  // อัพเดตในแผ่นงานรายการเช่า
  try {
    const rentalSheet = ss.getSheetByName(RENTAL_SHEET);
    if (rentalSheet) {
      const rentalData = rentalSheet.getDataRange().getValues();
      const rentalHeaders = rentalData[0];

      // ค้นหาคอลัมน์ "รถ" และ "ทะเบียนรถ"
      const carColumnIndex = rentalHeaders.indexOf("รถ");
      const licenseColumnIndex = rentalHeaders.indexOf("ทะเบียนรถ");

      Logger.log("Rental sheet - car column index: " + carColumnIndex + ", license column index: " + licenseColumnIndex);

      let updateCountCar = 0;
      let updateCountLicense = 0;

      for (let i = 1; i < rentalData.length; i++) {
        // อัพเดตคอลัมน์ "รถ"
        if (carColumnIndex !== -1 && rentalData[i][carColumnIndex] === oldCarName) {
          rentalSheet.getRange(i + 1, carColumnIndex + 1).setValue(newCarName);
          updateCountCar++;
        }

        // อัพเดตคอลัมน์ "ทะเบียนรถ"
        if (licenseColumnIndex !== -1 && rentalData[i][licenseColumnIndex] === oldCarParts.license) {
          rentalSheet.getRange(i + 1, licenseColumnIndex + 1).setValue(newCarParts.license);
          updateCountLicense++;
        }
      }

      Logger.log("Updated " + updateCountCar + " car names and " + updateCountLicense + " license plates in rental sheet");
    } else {
      Logger.log("Rental sheet not found");
    }
  } catch (e) {
    Logger.log("Error updating rental sheet: " + e.toString());
  }

  // อัพเดตในแผ่นงานตารางรับส่งรถ (ทำเช่นเดียวกับรายการเช่า)
  try {
    const scheduleSheet = ss.getSheetByName(SCHEDULE_SHEET);
    if (scheduleSheet) {
      const scheduleData = scheduleSheet.getDataRange().getValues();
      const scheduleHeaders = scheduleData[0];

      const carColumnIndex = scheduleHeaders.indexOf("รถ");
      const licenseColumnIndex = scheduleHeaders.indexOf("ทะเบียนรถ");

      Logger.log("Schedule sheet - car column index: " + carColumnIndex + ", license column index: " + licenseColumnIndex);

      let updateCountCar = 0;
      let updateCountLicense = 0;

      for (let i = 1; i < scheduleData.length; i++) {
        // อัพเดตคอลัมน์ "รถ"
        if (carColumnIndex !== -1 && scheduleData[i][carColumnIndex] === oldCarName) {
          scheduleSheet.getRange(i + 1, carColumnIndex + 1).setValue(newCarName);
          updateCountCar++;
        }

        // อัพเดตคอลัมน์ "ทะเบียนรถ"
        if (licenseColumnIndex !== -1 && scheduleData[i][licenseColumnIndex] === oldCarParts.license) {
          scheduleSheet.getRange(i + 1, licenseColumnIndex + 1).setValue(newCarParts.license);
          updateCountLicense++;
        }
      }

      Logger.log("Updated " + updateCountCar + " car names and " + updateCountLicense + " license plates in schedule sheet");
    } else {
      Logger.log("Schedule sheet not found");
    }
  } catch (e) {
    Logger.log("Error updating schedule sheet: " + e.toString());
  }

  // เพิ่มการอัพเดตในแผ่นงานการแจ้งเตือน
  try {
    const maintenanceSheet = ss.getSheetByName(MAINTENANCE_SHEET);
    if (maintenanceSheet) {
      const maintenanceData = maintenanceSheet.getDataRange().getValues();
      const maintenanceHeaders = maintenanceData[0];

      // ค้นหาคอลัมน์ "รถ" (ซึ่งอยู่ที่คอลัมน์ A หรือ index 0)
      const carColumnIndex = maintenanceHeaders.indexOf("รถ");

      Logger.log("Maintenance sheet - car column index: " + carColumnIndex);

      let updateCount = 0;

      if (carColumnIndex !== -1) {
        for (let i = 1; i < maintenanceData.length; i++) {
          // อัพเดตเฉพาะรายการที่ตรงกับชื่อรถเดิม
          if (maintenanceData[i][carColumnIndex] === oldCarName) {
            maintenanceSheet.getRange(i + 1, carColumnIndex + 1).setValue(newCarName);
            updateCount++;
          }
        }
      }

      Logger.log("Updated " + updateCount + " car names in maintenance sheet");
    } else {
      Logger.log("Maintenance sheet not found");
    }
  } catch (e) {
    Logger.log("Error updating maintenance sheet: " + e.toString());
  }
}

// ฟังก์ชัน deleteCar ที่ปรับปรุงเพิ่มการลบข้อมูลในแผ่นงานการแจ้งเตือน
// แก้ไข: ใช้รหัสรถแทนทะเบียนเพื่อป้องกันการลบผิดคันกรณีทะเบียนซ้ำหรือว่าง
function deleteCar(carCode, deleteRelatedRentals, sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);
  const sheet = ss.getSheetByName(CARS_SHEET);

  // ตรวจสอบว่ามีข้อมูลในชีทหรือไม่
  if (sheet.getLastRow() <= 1) {
    return { success: false, message: "ไม่พบข้อมูลรถในระบบ" };
  }

  // ค้นหาแถวที่มีรหัสรถตรงกับที่ต้องการลบ
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const carCodeIndex = headers.indexOf("รหัสรถ");
  const licenseIndex = headers.indexOf("ทะเบียน");

  if (carCodeIndex === -1) {
    return { success: false, message: "ไม่พบคอลัมน์ 'รหัสรถ' ในชีทข้อมูลรถ" };
  }

  let rowToDelete = -1;
  let carInfo = null;
  let licensePlate = null;

  for (let i = 1; i < data.length; i++) {
    if (data[i][carCodeIndex] === carCode) {
      rowToDelete = i + 1; // +1 เพราะแถวในชีทเริ่มจาก 1

      // เก็บข้อมูลรถเพื่อใช้ในการสร้างชื่อรถ
      const brandIndex = headers.indexOf("ยี่ห้อ");
      const modelIndex = headers.indexOf("รุ่น");

      // เก็บทะเบียนสำหรับใช้ลบรายการที่เกี่ยวข้อง
      if (licenseIndex !== -1) {
        licensePlate = data[i][licenseIndex];
      }

      if (brandIndex !== -1 && modelIndex !== -1) {
        carInfo = {
          ยี่ห้อ: data[i][brandIndex],
          รุ่น: data[i][modelIndex],
          ทะเบียน: licensePlate || carCode
        };
      }

      break;
    }
  }

  if (rowToDelete === -1) {
    return { success: false, message: "ไม่พบข้อมูลรถรหัส " + carCode };
  }

  // สร้างชื่อรถสำหรับแสดงผล (ถ้ามีข้อมูลเพียงพอ)
  const carName = carInfo ? `${carInfo.ยี่ห้อ} ${carInfo.รุ่น} (${carInfo.ทะเบียน})` : `รหัส ${carCode}`;

  // ถ้าต้องการลบรายการเช่าที่เกี่ยวข้องด้วย
  let deletedRentalsCount = 0;
  let deletedScheduleCount = 0;
  let deletedMaintenanceCount = 0;

  if (deleteRelatedRentals) {
    try {
      // ลบรายการในตาราง RENTAL_SHEET ด้วยการค้นหาตามทะเบียนรถ
      deletedRentalsCount = deleteRelatedRecordsByLicense(RENTAL_SHEET, licensePlate, sheetID);

      // ลบรายการในตาราง SCHEDULE_SHEET ด้วยการค้นหาตามทะเบียนรถ
      deletedScheduleCount = deleteRelatedRecordsByLicense(SCHEDULE_SHEET, licensePlate, sheetID);

      // เพิ่ม: ลบรายการในตาราง MAINTENANCE_SHEET ด้วยการค้นหาตามชื่อรถ
      deletedMaintenanceCount = deleteRelatedMaintenanceByCarName(carName, sheetID);

    } catch (e) {
      Logger.log("Error deleting related rentals: " + e.toString());
      return {
        success: false,
        message: "เกิดข้อผิดพลาดในการลบรายการที่เกี่ยวข้อง: " + e.toString()
      };
    }
  }

  // ลบแถวข้อมูลรถ
  try {
    sheet.deleteRow(rowToDelete);

    // สร้างข้อความสรุปผลการลบ
    let message = `ลบรถ ${carName} สำเร็จ`;
    if (deleteRelatedRentals) {
      message += ` พร้อมลบรายการเช่า ${deletedRentalsCount} รายการ, ตารางรับส่งรถ ${deletedScheduleCount} รายการ และการแจ้งเตือน ${deletedMaintenanceCount} รายการ`;
    }

    clearSummaryCacheForTenant(sheetID);
    return { success: true, message: message };
  } catch (e) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการลบข้อมูลรถ: " + e.toString()
    };
  }
}

// ฟังก์ชันใหม่สำหรับลบข้อมูลการแจ้งเตือนตามชื่อรถ
function deleteRelatedMaintenanceByCarName(carName, sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);
  const sheet = ss.getSheetByName(MAINTENANCE_SHEET);

  if (!sheet) {
    Logger.log("Maintenance sheet not found");
    return 0;
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return 0; // มีแค่แถวหัวข้อ ไม่มีข้อมูล
  }

  const headers = data[0];
  const carColumnIndex = headers.indexOf("รถ");

  if (carColumnIndex === -1) {
    Logger.log("Column 'รถ' not found in maintenance sheet");
    return 0;
  }

  // รวบรวมแถวที่ต้องลบ (ย้อนกลับจากล่างขึ้นบน)
  const rowsToDelete = [];
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][carColumnIndex] === carName) {
      rowsToDelete.push(i + 1);
    }
  }

  // ลบแถวทีละแถว (จากแถวที่สูงไปต่ำ)
  rowsToDelete.forEach(row => {
    sheet.deleteRow(row);
  });

  Logger.log(`Deleted ${rowsToDelete.length} records from maintenance sheet for car: ${carName}`);
  return rowsToDelete.length;
}



function deleteRelatedRecordsByLicense(sheetName, licensePlate, sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    Logger.log("Sheet not found: " + sheetName);
    return 0;
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return 0; // มีแค่แถวหัวข้อ ไม่มีข้อมูล
  }

  const headers = data[0];

  // ค้นหาคอลัมน์ "ทะเบียนรถ" หรือ "รถ" (กรณีที่อาจมีชื่อคอลัมน์แตกต่างกัน)
  let columnIndex = headers.indexOf("ทะเบียนรถ");
  if (columnIndex === -1) {
    // ถ้าไม่มีคอลัมน์ "ทะเบียนรถ" ลองค้นหาคอลัมน์ "รถ" แทน
    columnIndex = headers.indexOf("รถ");

    // ถ้ายังไม่พบ ให้ใช้วิธีค้นหาจากค่าในทุกคอลัมน์
    if (columnIndex === -1) {
      // แก้ไขตรงนี้: ส่ง sheetName และ sheetID ไปด้วย
      return deleteRelatedRecordsBySearchAll(sheetName, licensePlate, sheetID);
    }
  }

  // รวบรวมแถวที่ต้องลบ (ย้อนกลับจากล่างขึ้นบน)
  const rowsToDelete = [];
  for (let i = data.length - 1; i >= 1; i--) {
    const cellValue = data[i][columnIndex];

    // ตรวจสอบว่าค่าในเซลล์มีทะเบียนรถที่ต้องการหรือไม่
    if (cellValue === licensePlate ||
      (typeof cellValue === 'string' && cellValue.includes(`(${licensePlate})`))) {
      rowsToDelete.push(i + 1);
    }
  }

  // ลบแถวทีละแถว (จากแถวที่สูงไปต่ำ)
  rowsToDelete.forEach(row => {
    sheet.deleteRow(row);
  });

  return rowsToDelete.length;
}



function deleteRelatedRecordsBySearchAll(sheetName, licensePlate, sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    return 0;
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return 0;
  }

  // รวบรวมแถวที่ต้องลบ (ย้อนกลับจากล่างขึ้นบน)
  const rowsToDelete = [];

  for (let i = data.length - 1; i >= 1; i--) {
    // ตรวจสอบทุกคอลัมน์ในแถวนี้
    const found = data[i].some(cellValue =>
      cellValue === licensePlate ||
      (typeof cellValue === 'string' && cellValue.includes(`(${licensePlate})`))
    );

    if (found) {
      rowsToDelete.push(i + 1);
    }
  }

  // ลบแถวทีละแถว (จากแถวที่สูงไปต่ำ)
  rowsToDelete.forEach(row => {
    sheet.deleteRow(row);
  });

  return rowsToDelete.length;
}











// ฟังก์ชันสำหรับดึงข้อมูลรายการเช่าตาม หมายเลขการจอง
function getRentalByBookingNumber(bookingNumber, sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);
  const sheet = ss.getSheetByName(RENTAL_SHEET);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const bookingNumberIndex = headers.indexOf("หมายเลขการจอง");

  if (bookingNumberIndex === -1) {
    return { success: false, message: "ไม่พบคอลัมน์หมายเลขการจอง" };
  }

  for (let i = 1; i < data.length; i++) {
    if (data[i][bookingNumberIndex] === bookingNumber) {
      const rental = {};
      for (let j = 0; j < headers.length; j++) {
        rental[headers[j]] = data[i][j];
      }
      rental.rowIndex = i + 1; // เก็บตำแหน่งแถวสำหรับการอ้างอิงเท่านั้น (จะไม่ใช้โดยตรงอีกต่อไป)
      return { success: true, data: rental };
    }
  }

  return { success: false, message: "ไม่พบรายการเช่าที่มีหมายเลขการจองนี้" };
}












// ฟังก์ชัน updateRentalContract ที่ปรับปรุงแล้ว - ค้นหาจากหมายเลขการจองแทนการตรวจสอบลำดับแถว
function updateRentalContract(bookingNumber, contractUrl, sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);
  const sheet = ss.getSheetByName(RENTAL_SHEET);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const bookingNumberIndex = headers.indexOf("หมายเลขการจอง");
  const contractUrlIndex = headers.indexOf("ลิงก์สัญญาเช่า");

  // เพิ่มคอลัมน์ "ลิงก์สัญญาเช่า" ถ้ายังไม่มี
  if (contractUrlIndex === -1) {
    sheet.getRange(1, headers.length + 1).setValue("ลิงก์สัญญาเช่า");
    headers.push("ลิงก์สัญญาเช่า");
  }

  // ตรวจสอบว่ามีคอลัมน์หมายเลขการจองหรือไม่
  if (bookingNumberIndex === -1) {
    return { success: false, message: "ไม่พบคอลัมน์หมายเลขการจอง" };
  }

  // ค้นหารายการเช่าตามหมายเลขการจอง
  let rentalRowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][bookingNumberIndex] === bookingNumber) {
      rentalRowIndex = i + 1; // +1 เพราะ index เริ่มจาก 0 แต่แถวเริ่มจาก 1
      break;
    }
  }

  // ถ้าไม่พบรายการเช่าที่มีหมายเลขการจองตรงกับที่ระบุ
  if (rentalRowIndex === -1) {
    return { success: false, message: "ไม่พบรายการเช่าที่มีหมายเลขการจองนี้" };
  }

  // อัพเดตลิงก์สัญญาเช่า
  const actualUrlIndex = contractUrlIndex === -1 ? headers.length - 1 : contractUrlIndex;
  sheet.getRange(rentalRowIndex, actualUrlIndex + 1).setValue(contractUrl);

  return { success: true, message: "อัพเดตลิงก์สัญญาเช่าสำเร็จ" };
}




function checkLogin(username, password) {
  try {
    // Log ข้อมูลที่ได้รับ
    Logger.log("Checking login for: " + username);

    // เรียกใช้ฟังก์ชันจากไลบรารี
    const result = LicenseLib.checkLogin(username, password);

    // Log ผลลัพธ์
    Logger.log("Login result: " + JSON.stringify(result));

    return result;
  } catch (e) {
    Logger.log("Login error: " + e.toString());
    return {
      success: false,
      message: "เกิดข้อผิดพลาด: " + e.toString()
    };
  }
}


function checkLicense(sheetID, storeSID) {
  try {
    // เรียกใช้ฟังก์ชันจากไลบรารีแทน
    const licenseStatus = LicenseLib.checkLicenseStatus(sheetID, storeSID);
    // ลบคีย์ storeSID และ sheetID ออกถ้าไม่ต้องการให้ส่งกลับ
    delete licenseStatus.storeSID;
    delete licenseStatus.sheetID;
    return licenseStatus;
  } catch (e) {
    return {
      valid: false,
      message: "เกิดข้อผิดพลาดในการตรวจสอบ License: " + e.toString()
    };
  }
}


// ฟังก์ชันตรวจสอบสถานะ license โดยไม่ต้องตรวจสอบรหัสผ่าน
function checkLicenseStatus(sheetID, storeSID) {
  try {
    // เรียกใช้ฟังก์ชันจากไลบรารี
    return LicenseLib.checkLicenseStatus(sheetID, storeSID);
  } catch (e) {
    return {
      valid: false,
      message: "เกิดข้อผิดพลาดในการตรวจสอบ License: " + e.toString()
    };
  }
}



function debugLicense() {
  // ใช้ค่าเดียวกับที่อยู่ในแผ่นงาน "Login"
  const sheetID = "1udoc7Wbo-9UUQmK2bCpHBaq6H9255Fk6GEmJJd4fBGE";
  const storeSID = "SID2875";

  // เปิดสเปรดชีต
  const licenseSpreadsheet = SpreadsheetApp.openById("1JEbD4MOM1jgm6cA9D4AlW8z8x4yUZo1rfys6u4a_hvc");
  const licenseSheet = licenseSpreadsheet.getSheetByName("licenseV_3");

  if (!licenseSheet) {
    Logger.log("ไม่พบแผ่นงาน licenseV_3");
    return;
  }

  // ดึงข้อมูลทั้งหมด
  const licenseData = licenseSheet.getDataRange().getValues();

  // แสดงข้อมูลทั้งหมดเพื่อตรวจสอบ
  Logger.log("จำนวนแถวทั้งหมด: " + licenseData.length);
  Logger.log("หัวข้อคอลัมน์: " + licenseData[0].join(", "));

  // ค้นหาในข้อมูล
  let found = false;
  for (let i = 1; i < licenseData.length; i++) {
    Logger.log(`แถวที่ ${i}: sheetID="${licenseData[i][0]}", storeSID="${licenseData[i][1]}"`);
    if (licenseData[i][0] === sheetID && licenseData[i][1] === storeSID) {
      Logger.log("พบข้อมูลที่ตรงกันในแถวที่ " + i);
      found = true;
      break;
    }
  }

  if (!found) {
    Logger.log("ไม่พบข้อมูลที่ตรงกับ sheetID=" + sheetID + " และ storeSID=" + storeSID);
  }
}

/**
 * ฟังก์ชันตรวจสอบชื่อคอลัมน์จริงๆ ในชีต licenseV_3
 * รันฟังก์ชันนี้ใน Apps Script Editor เพื่อเช็คชื่อคอลัมน์
 */
function checkLicenseV3Headers() {
  try {
    const ss = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const sheet = ss.getSheetByName(TENANT_SHEET_NAME);

    if (!sheet) {
      Logger.log('❌ ไม่พบชีต licenseV_3');
      return;
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log('📋 ชื่อคอลัมน์ทั้งหมดในชีต licenseV_3:');
    Logger.log(JSON.stringify(headers, null, 2));

    // เช็คว่าเป็นแบบไหน
    Logger.log('\n🔍 ตรวจสอบคอลัมน์:');
    Logger.log('- sheetID (s เล็ก): ' + (headers.indexOf('sheetID') !== -1 ? '✅ พบ' : '❌ ไม่พบ'));
    Logger.log('- SheetID (S ใหญ่): ' + (headers.indexOf('SheetID') !== -1 ? '✅ พบ' : '❌ ไม่พบ'));
    Logger.log('- ชื่อร้าน (ภาษาไทย): ' + (headers.indexOf('ชื่อร้าน') !== -1 ? '✅ พบ' : '❌ ไม่พบ'));
    Logger.log('- storeName (s เล็ก): ' + (headers.indexOf('storeName') !== -1 ? '✅ พบ' : '❌ ไม่พบ'));
    Logger.log('- StoreName (S ใหญ่): ' + (headers.indexOf('StoreName') !== -1 ? '✅ พบ' : '❌ ไม่พบ'));
    Logger.log('- status (s เล็ก): ' + (headers.indexOf('status') !== -1 ? '✅ พบ' : '❌ ไม่พบ'));
    Logger.log('- Status (S ใหญ่): ' + (headers.indexOf('Status') !== -1 ? '✅ พบ' : '❌ ไม่พบ'));
    Logger.log('- LineBotSecretID: ' + (headers.indexOf('LineBotSecretID') !== -1 ? '✅ พบ' : '❌ ไม่พบ'));
    Logger.log('- storeSID: ' + (headers.indexOf('storeSID') !== -1 ? '✅ พบ' : '❌ ไม่พบ'));

  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
  }
}


function getAllUsers(sheetID, storeSID) {
  try {
    // ตรวจสอบว่ามีการส่ง sheetID และ storeSID มาหรือไม่
    if (!sheetID || !storeSID) {
      return {
        success: false,
        message: "กรุณาระบุ sheetID และ storeSID"
      };
    }

    // เรียกใช้ไลบรารีเพื่อดึงข้อมูลผู้ใช้
    return LicenseLib.getAllUsers(sheetID, storeSID);
  } catch (e) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้: " + e.toString()
    };
  }
}


function addNewUser(userData, sheetID, storeSID) {
  try {
    // ตรวจสอบค่า userData
    console.log("userData:", JSON.stringify(userData));

    // ตรวจสอบว่ามีการส่ง sheetID และ storeSID มาหรือไม่
    if (!sheetID || !storeSID) {
      return {
        success: false,
        message: "กรุณาระบุ sheetID และ storeSID"
      };
    }

    // ถ้าไม่มี displayName ให้ใช้ username แทน
    const displayName = userData.displayName || userData.username;

    // เรียกใช้ไลบรารีเพื่อเพิ่มผู้ใช้ใหม่
    return LicenseLib.createOrUpdateUser(
      userData.username,
      userData.password,
      sheetID,
      storeSID,
      userData.role || "user",
      displayName
    );
  } catch (e) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการเพิ่มผู้ใช้: " + e.toString()
    };
  }
}

function updateUser(userId, userData, sheetID, storeSID) {
  try {
    // ตรวจสอบว่ามีการส่ง sheetID และ storeSID มาหรือไม่
    if (!sheetID || !storeSID) {
      return {
        success: false,
        message: "กรุณาระบุ sheetID และ storeSID"
      };
    }

    // เรียกใช้ไลบรารีเพื่ออัพเดทผู้ใช้
    return LicenseLib.updateUserById(
      userId,
      userData.username, // อีเมล
      userData.password,
      sheetID,
      storeSID,
      userData.role || "user",
      userData.displayName // ชื่อผู้ใช้งาน
    );
  } catch (e) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการอัพเดตผู้ใช้: " + e.toString()
    };
  }
}


function deleteUser(userId, sheetID, storeSID) {
  try {
    // ตรวจสอบว่ามีการส่ง sheetID และ storeSID มาหรือไม่
    if (!sheetID || !storeSID) {
      return {
        success: false,
        message: "กรุณาระบุ sheetID และ storeSID"
      };
    }

    // เรียกใช้ไลบรารีเพื่อลบผู้ใช้
    return LicenseLib.deleteUserById(userId, sheetID, storeSID);
  } catch (e) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการลบผู้ใช้: " + e.toString()
    };
  }
}



/**
 * ฟังก์ชันทดสอบการสร้าง QR Code URL
 * ใช้เพื่อทดสอบการส่งค่าไปยังฟังก์ชัน generatePromtPay
 */
function testGeneratePromptPay(sheetID) {
  try {
    // ตัวอย่างเบอร์พร้อมเพย์
    const promptPayNumbers = [
      "0812345678",  // เบอร์มือถือ
      "1234567890123", // เลขบัตรประชาชน
      "0-81234-5678", // เบอร์มือถือที่มีเครื่องหมายขีด
      "promptpay@email.com" // อีเมล (ดูว่ารองรับหรือไม่)
    ];

    // ตัวอย่างจำนวนเงิน
    const amounts = [
      100,       // จำนวนเต็ม
      1234.56,   // ทศนิยม
      0,         // ศูนย์
      "",        // ค่าว่าง
      "1000"     // สตริง
    ];

    // สร้างแผ่นงานทดสอบ
    const ss = SpreadsheetApp.openById(sheetID);
    let testSheet = ss.getSheetByName("PromptPayTest");

    if (testSheet) {
      ss.deleteSheet(testSheet);
    }

    testSheet = ss.insertSheet("PromptPayTest");

    // สร้างหัวข้อ
    testSheet.getRange("A1").setValue("ลำดับ");
    testSheet.getRange("B1").setValue("หมายเลขพร้อมเพย์");
    testSheet.getRange("C1").setValue("จำนวนเงิน");
    testSheet.getRange("D1").setValue("URL ที่ได้");
    testSheet.getRange("E1").setValue("ทดสอบฟังก์ชัน IMAGE()");

    // ทำหัวข้อให้เด่นชัด
    testSheet.getRange("A1:E1").setFontWeight("bold").setBackground("#eeeeee");

    let row = 2;
    let counter = 1;

    // ทดสอบทุกคู่ค่า
    for (const number of promptPayNumbers) {
      for (const amount of amounts) {
        // เรียกใช้ฟังก์ชัน generatePromtPay
        const url = generatePromtPay(number, amount);

        // เพิ่มข้อมูลลงในตาราง
        testSheet.getRange(`A${row}`).setValue(counter);
        testSheet.getRange(`B${row}`).setValue(number);
        testSheet.getRange(`C${row}`).setValue(amount);
        testSheet.getRange(`D${row}`).setValue(url);

        // ทดสอบฟังก์ชัน IMAGE() กับ URL ที่ได้
        testSheet.getRange(`E${row}`).setValue(`=IMAGE("${url}")`);

        row++;
        counter++;
      }
    }

    // ทดสอบกรณีเฉพาะที่ต้องการ
    const customNumber = "0995588665"; // ใส่เบอร์พร้อมเพย์ที่ต้องการทดสอบโดยเฉพาะ
    const customAmount = 8500; // ใส่จำนวนเงินที่ต้องการทดสอบโดยเฉพาะ

    testSheet.getRange(`A${row}`).setValue(counter);
    testSheet.getRange(`B${row}`).setValue(customNumber + " (กรณีเฉพาะ)");
    testSheet.getRange(`C${row}`).setValue(customAmount);

    const customUrl = generatePromtPay(customNumber, customAmount);
    testSheet.getRange(`D${row}`).setValue(customUrl);
    testSheet.getRange(`E${row}`).setValue(`=IMAGE("${customUrl}")`);

    // ปรับความกว้างคอลัมน์
    testSheet.autoResizeColumn(2);
    testSheet.autoResizeColumn(4);
    testSheet.setColumnWidth(5, 200);

    // เลือกแผ่นงานทดสอบ
    testSheet.activate();

    return "ทดสอบการสร้าง QR Code URL เรียบร้อยแล้ว";

  } catch (e) {
    Logger.log("Error in testGeneratePromptPay: " + e.toString());
    return "เกิดข้อผิดพลาด: " + e.toString();
  }
}

/**
 * เพิ่มเมนูสำหรับทดสอบการสร้าง URL
 */


function generatePromtPay(qrCodeNumber, amount) {
  const ppUrl = "https://promptpay.io/";
  return ppUrl + qrCodeNumber + ".png" + "/" + amount;
}




/**
 * สร้างไฟล์ PDF สัญญาเช่าจากข้อมูลการจองและภาษาที่ระบุ
 * (เวอร์ชันแก้ไข: เพิ่มการจัดการซ่อนแถวสำหรับค่าที่เป็นศูนย์ + จัดรูปแบบตัวเลข)
 * @param {string} bookingNumber หมายเลขการจอง
 * @param {string} language รหัสภาษา (เช่น 'th', 'en')
 * @param {string} sheetID - ID ของ Google Sheet
 * @returns {{success: boolean, message: string, pdfUrl?: string}} ผลลัพธ์การทำงาน
 */
function generateRentalContract(bookingNumber, language, sheetID) {
  let tempSheet = null; // ประกาศไว้นอก try เพื่อใช้ใน catch ได้
  const tempSheetBaseName = "temp_"; // ชื่อพื้นฐานของ temp sheet

  try {
    Logger.log("Generating rental contract for booking " + bookingNumber + " in language " + language);

    // 1. Get rental data
    const rentalData = getRentalByBookingNumber(bookingNumber, sheetID);// สมมติว่าฟังก์ชันนี้คืน { success: boolean, data: object }
    if (!rentalData.success) {
      return { success: false, message: "ไม่พบข้อมูลรายการเช่า: " + rentalData.message };
    }

    // 2. Get config settings directly from the sheet
    const ss = SpreadsheetApp.openById(sheetID);
    const configSheet = ss.getSheetByName("ตั้งค่าระบบ");
    if (!configSheet) {
      return { success: false, message: "ไม่พบแผ่นงาน 'ตั้งค่าระบบ'" };
    }

    // --- อ่านค่า Config ---
    let rootFolderId = null;
    let extraHoursThreshold = 4;
    let bankName = "";
    let accountNumber = "";
    let accountName = "";
    let promptpayNumber = "";
    let qrCodeMethod = "auto"; // เปลี่ยนจาก useUploadedQRCode
    let qrCodeUrl = "";
    let companyName = "";
    let shopLogoUrl = ""; // เพิ่มตัวแปรสำหรับเก็บ URL รูปโลโก้ร้าน

    const configData = configSheet.getDataRange().getValues();
    for (let i = 0; i < configData.length; i++) {
      const key = configData[i][0];
      const value = configData[i][1];
      switch (key) {
        case "IDโฟลเดอร์สัญญาเช่า": rootFolderId = value; break;
        case "จำนวนชั่วโมงคิดเพิ่มเป็นหนึ่งวัน": extraHoursThreshold = parseFloat(value) || 4; break;
        case "ชื่อธนาคาร": bankName = value || ""; break;
        case "หมายเลขบัญชีธนาคาร": accountNumber = value || ""; break;
        case "ชื่อบัญชี": accountName = value || ""; break;
        case "หมายเลขพร้อมเพย์": promptpayNumber = value || ""; break;
        case "วิธีการใช้QRCode": qrCodeMethod = value || "auto"; break; // เปลี่ยนใหม่
        case "URLรูปQRCode": qrCodeUrl = value || ""; break;
        case "ชื่อบริษัท": companyName = value || ""; break;
        case "URLรูปโลโก้ร้าน": shopLogoUrl = value || ""; break; // เพิ่มการอ่านค่า URL รูปโลโก้ร้าน
      }
    }

    if (!rootFolderId) {
      return { success: false, message: "ไม่พบค่า 'IDโฟลเดอร์สัญญาเช่า' ในแผ่นงานตั้งค่าระบบ" };
    }

    // 3. Get translations
    const translationsResult = getContractTranslations(language, sheetID); // สมมติว่าฟังก์ชันนี้คืน { success: boolean, data: object }
    if (!translationsResult.success) {
      return { success: false, message: "ไม่สามารถดึงข้อมูลแปลได้: " + translationsResult.message };
    }
    const translationsMap = translationsResult.data || {}; // object เก็บ key-value คำแปล

    // 4. Create a folder for the rental
    const folderName = bookingNumber;
    const folder = createOrGetFolder(folderName, rootFolderId); // สมมติว่ามีฟังก์ชันนี้
    if (!folder) {
      return { success: false, message: "ไม่สามารถสร้างโฟลเดอร์สำหรับเก็บสัญญาเช่าได้" };
    }

    // 5. หา Template Sheet และ Fuel Type
    const carName = rentalData.data.รถ;
    let templateSheetName = "Template_สัญญาเช่า_รถยนต์"; // Default
    let fuelType = "[FUELTYPE_1]"; // ตั้งค่าเริ่มต้น ถ้าไม่พบข้อมูล
    let useZone = "[ZONE1]"; // ตั้งค่าเริ่มต้น ถ้าไม่พบข้อมูล
    const carListSheet = ss.getSheetByName("รายชื่อรถ");

    // แสดงคีย์ทั้งหมดในข้อมูลแปลภาษาเพื่อดีบัก
    Logger.log("คีย์ทั้งหมดในข้อมูลแปลภาษา (เฉพาะ FUELTYPE และ ZONE):");
    for (const key in translationsMap) {
      if (key.includes("FUELTYPE") || key.includes("ZONE")) {
        Logger.log("  - คีย์: '" + key + "', ค่า: '" + translationsMap[key] + "'");
      }
    }

    if (carListSheet) {
      const carListData = carListSheet.getDataRange().getValues();
      const headers = carListData[0];
      Logger.log("หัวคอลัมน์ทั้งหมด: " + JSON.stringify(headers));

      const brandColIndex = headers.indexOf("ยี่ห้อ");
      const modelColIndex = headers.indexOf("รุ่น");
      const plateColIndex = headers.indexOf("ทะเบียน");
      const typeColIndex = headers.indexOf("ประเภท");
      const fuelTypeColIndex = headers.indexOf("ชนิดเชื้อเพลิง");
      const zoneColIndex = headers.indexOf("พื้นที่การใช้งาน");

      // แสดงตำแหน่งคอลัมน์
      Logger.log("ตำแหน่งคอลัมน์: ยี่ห้อ=" + brandColIndex + ", รุ่น=" + modelColIndex +
        ", ทะเบียน=" + plateColIndex + ", ประเภท=" + typeColIndex +
        ", ชนิดเชื้อเพลิง=" + fuelTypeColIndex + ", พื้นที่การใช้งาน=" + zoneColIndex);

      // แยก ยี่ห้อ, รุ่น, ทะเบียน จาก carName
      const plateMatch = carName.match(/(.*?)\s*\(([^\)]+)\)$/);
      let mainCarName = carName, plate = "";
      if (plateMatch) { mainCarName = plateMatch[1].trim(); plate = plateMatch[2]; }
      const brandModelMatch = mainCarName.match(/^([^\s]+)\s+(.+)$/);
      let brand = "", model = "";
      if (brandModelMatch) { brand = brandModelMatch[1]; model = brandModelMatch[2]; }

      Logger.log("ค้นหารถ: ยี่ห้อ=" + brand + ", รุ่น=" + model + ", ทะเบียน=" + plate);

      let carFound = false; // เพิ่มตัวแปรเพื่อตรวจสอบว่าพบรถหรือไม่

      for (let i = 1; i < carListData.length; i++) {
        const row = carListData[i];
        const rowBrand = brandColIndex !== -1 ? row[brandColIndex] : '';
        const rowModel = modelColIndex !== -1 ? row[modelColIndex] : '';
        const rowPlate = plateColIndex !== -1 ? row[plateColIndex] : '';

        // แสดงข้อมูลแต่ละแถวเพื่อดีบัก
        // Logger.log("แถวที่ " + i + ": ยี่ห้อ=" + rowBrand + ", รุ่น=" + rowModel + ", ทะเบียน=" + rowPlate);

        if (rowBrand === brand && rowModel === model && ((plate && rowPlate === plate) || (!plate && !rowPlate) || !plateColIndex || plateColIndex === -1)) {
          carFound = true; // พบรถที่ตรงกัน
          const vehicleType = typeColIndex !== -1 ? row[typeColIndex] : '';
          Logger.log("======== พบรถที่ตรงกัน ========");
          Logger.log("พบรถที่ตรงกัน ประเภท: " + vehicleType);

          // สร้าง Object เก็บข้อมูลทั้งหมดของรถ
          const carData = {};
          for (let j = 0; j < headers.length; j++) {
            if (headers[j]) { // ถ้าหัวคอลัมน์ไม่ว่างเปล่า
              carData[headers[j]] = row[j];
            }
          }
          Logger.log("ข้อมูลรถทั้งหมด: " + JSON.stringify(carData, null, 2));

          if (fuelTypeColIndex !== -1) {
            const rawFuelType = row[fuelTypeColIndex];
            if (rawFuelType) {
              fuelType = String(rawFuelType).trim(); // แปลงเป็น String และตัดช่องว่าง
              Logger.log("ชนิดเชื้อเพลิง (Key): '" + fuelType + "', ความยาว: " + fuelType.length);
              // แสดง ASCII code เพื่อตรวจหาอักขระพิเศษ
              Logger.log("รหัส ASCII ของชนิดเชื้อเพลิง: " + [...fuelType].map(c => c.charCodeAt(0)).join(", "));
            } else {
              Logger.log("ไม่พบข้อมูลชนิดเชื้อเพลิง ใช้ค่าเริ่มต้น: " + fuelType);
            }
          } else {
            Logger.log("ไม่พบคอลัมน์ชนิดเชื้อเพลิง ใช้ค่าเริ่มต้น: " + fuelType);
          }

          if (zoneColIndex !== -1) {
            const rawZone = row[zoneColIndex];
            if (rawZone) {
              useZone = String(rawZone).trim(); // แปลงเป็น String และตัดช่องว่าง
              Logger.log("พื้นที่การใช้งาน (Key): '" + useZone + "', ความยาว: " + useZone.length);
              // แสดง ASCII code เพื่อตรวจหาอักขระพิเศษ
              Logger.log("รหัส ASCII ของพื้นที่การใช้งาน: " + [...useZone].map(c => c.charCodeAt(0)).join(", "));
            } else {
              Logger.log("ไม่พบข้อมูลพื้นที่การใช้งาน ใช้ค่าเริ่มต้น: " + useZone);
            }
          } else {
            Logger.log("ไม่พบคอลัมน์พื้นที่การใช้งาน ใช้ค่าเริ่มต้น: " + useZone);
          }
          Logger.log("================================");

          // เลือก Template ตามประเภท
          if (vehicleType === "รถยนต์(น้ำมัน)") templateSheetName = "Template_สัญญาเช่า_รถยนต์";
          else if (vehicleType === "รถยนต์(รถไฟฟ้า)") templateSheetName = "Template_สัญญาเช่า_รถยนต์ไฟฟ้า";
          else if (vehicleType === "รถจักรยานยนต์(น้ำมัน)") templateSheetName = "Template_สัญญาเช่า_รถจักรยานยนต์";
          else if (vehicleType === "รถจักรยานยนต์(รถไฟฟ้า)") templateSheetName = "Template_สัญญาเช่า_รถจักรยานยนต์ไฟฟ้า";
          break;
        }
      }

      // ถ้าไม่พบรถที่ตรงกัน
      if (!carFound) {
        Logger.log("ไม่พบรถที่ตรงกับเงื่อนไข: ยี่ห้อ=" + brand + ", รุ่น=" + model + ", ทะเบียน=" + plate);
        Logger.log("ใช้ค่าเริ่มต้น: ชนิดเชื้อเพลิง=" + fuelType + ", พื้นที่การใช้งาน=" + useZone);
      }
    } else {
      Logger.log("ไม่พบแผ่นงาน 'รายชื่อรถ' ใช้เทมเพลตเริ่มต้นและค่าเริ่มต้น");
      Logger.log("ค่าเริ่มต้น: ชนิดเชื้อเพลิง=" + fuelType + ", พื้นที่การใช้งาน=" + useZone);
    }
    Logger.log("เลือกใช้แผ่นงานเทมเพลต: " + templateSheetName);

    // 6. คำนวณ Duration และ Format เวลา
    const rentalDuration = calculateRentalDuration(rentalData.data, extraHoursThreshold, language, sheetID); // สมมติว่ามีฟังก์ชันนี้
    const formattedPickupTime = formatTimeOnly(rentalData.data.เวลารับรถ); // สมมติว่ามีฟังก์ชันนี้
    const formattedReturnTime = formatTimeOnly(rentalData.data.เวลาคืนรถ); // สมมติว่ามีฟังก์ชันนี้

    // 7. *** (ใหม่) สร้าง Placeholder Map ***
    const placeholderMap = {};

    // -- (กลุ่มที่ 1) ข้อมูล {{...}} ที่แสดงเสมอ (ไม่ใช่ตัวเลข) --
    placeholderMap["{{BOOKING_NUMBER}}"] = bookingNumber;
    placeholderMap["{{BOOKING_DATE}}"] = formatDate(rentalData.data.วันที่เช่า, language); // สมมติว่ามีฟังก์ชันนี้
    placeholderMap["{{RETURN_DATE}}"] = formatDate(rentalData.data.วันที่คืน, language);
    placeholderMap["{{CUSTOMER_NAME}}"] = rentalData.data.ชื่อลูกค้า || "";
    placeholderMap["{{CUSTOMER_TEL}}"] = rentalData.data.เบอร์โทรศัพท์ || "";
    placeholderMap["{{CARNAME}}"] = rentalData.data.รถ || "";
    placeholderMap["{{COMPANY_NAME}}"] = companyName; // จาก config
    placeholderMap["{{BOOKING_TIME}}"] = formattedPickupTime;
    placeholderMap["{{RETURN_TIME}}"] = formattedReturnTime;
    placeholderMap["{{TOTALDATE}}"] = rentalDuration.rentalPeriodText || "";
    placeholderMap["{{PICKUP_LOCATION}}"] = rentalData.data.สถานที่รับรถ || "";
    placeholderMap["{{RETURN_LOCATION}}"] = rentalData.data.สถานที่คืนรถ || "";
    placeholderMap["{{ID_PASSPORT}}"] = rentalData.data.เลขบัตรประชาชน || "";
    placeholderMap["{{DRIVING_LICENSE}}"] = rentalData.data.หมายเลขใบขับขี่ || "";
    placeholderMap["{{CUSTOMER_ADDRESS}}"] = rentalData.data.ที่อยู่ลูกค้า || "";
    placeholderMap["{{ACCOUNT_BANKNAME}}"] = bankName; // จาก config
    placeholderMap["{{ACCOUNT_NUMBER}}"] = accountNumber; // จาก config
    placeholderMap["{{ACCOUNT_NAME}}"] = accountName; // จาก config
    placeholderMap["{{CONTRACT_LINK}}"] = rentalData.data.ลิงก์สัญญาเช่า || ""; // ลิงก์สัญญาเช่า


    // =======================================================================
    // ⭐⭐ START: (กลุ่มที่ 1.1) ข้อมูลตัวเลข {{...}} ที่แสดงเสมอ (จัดรูปแบบ) ⭐⭐
    // =======================================================================
    const dailyRate = parseFloat(rentalData.data.ราคา) || 0;
    const rentalDays = rentalDuration.rentalDays || 1;
    const baseRentalCost = rentalDays * dailyRate;

    placeholderMap["{{PERDAY_RENTAL_PRICE}}"] = dailyRate.toLocaleString('th-TH');
    placeholderMap["{{TOTAL_RENTAL_PRICE}}"] = (parseFloat(rentalData.data.ค่าเช่ารวมทั้งหมด) || 0).toLocaleString('th-TH');
    placeholderMap["{{BOOKING_DEPOSIT}}"] = (parseFloat(rentalData.data.ค่ามัดจำคิวรถ) || 0).toLocaleString('th-TH');
    placeholderMap["{{SECURITY_DEPOSIT}}"] = (parseFloat(rentalData.data.เงินประกันความเสียหาย) || 0).toLocaleString('th-TH');
    // ❌ ลบ {{ADDITIONAL_FEE}} ออกจากตรงนี้ เพราะจะไปอยู่กลุ่มที่ 4
    placeholderMap["{{PICKUP_DAY_PAYMENT}}"] = (parseFloat(rentalData.data.รวมยอดชำระวันรับรถ) || 0).toLocaleString('th-TH');
    // สูตรการคำนวณค่าเช่า: จำนวนวัน x ราคาต่อวัน = ค่าเช่าพื้นฐาน
    placeholderMap["{{RENTAL_CALCULATION}}"] = `${rentalDays} x ${dailyRate.toLocaleString('th-TH')} = ${baseRentalCost.toLocaleString('th-TH')}`;
    // ค่าเช่าพื้นฐาน (จำนวนวัน x ราคาต่อวัน) - ตัวเลขอย่างเดียว
    placeholderMap["{{BASE_RENTAL_COST}}"] = baseRentalCost.toLocaleString('th-TH');
    // =======================================================================
    // ⭐⭐ END: สิ้นสุดกลุ่มที่ 1.1 ⭐⭐
    // =======================================================================

    // -- (กลุ่มที่ 2) คำแปล [[...]] และ เคสพิเศษ (เหมือนเดิม) --
    for (const key in translationsMap) {
      if (key !== "[[EXTRA_HOURS_INFO]]" && !key.startsWith("[FUELTYPE_") && !key.startsWith("[ZONE") && !key.includes("_label")) {
        placeholderMap[key] = String(translationsMap[key] || "");
      }
    }

    // จัดการ {{FUELTYPE}}
    let fuelReplacement = "";
    if (fuelType && fuelType.trim() !== "") {
      if (translationsMap.hasOwnProperty(fuelType)) {
        fuelReplacement = String(translationsMap[fuelType] || "");
        Logger.log("พบคำแปลแบบตรงๆ สำหรับชนิดเชื้อเพลิง: " + fuelReplacement);
      } else {
        Logger.log("ไม่พบคำแปลสำหรับชนิดเชื้อเพลิง '" + fuelType + "' ใช้ค่าว่าง");
        fuelReplacement = "";
      }
    } else {
      fuelReplacement = "";
    }
    placeholderMap["{{FUELTYPE}}"] = fuelReplacement;

    // จัดการ {{USE_ZONE}}
    let zoneReplacement = "";
    if (useZone && useZone.trim() !== "") {
      if (translationsMap.hasOwnProperty(useZone)) {
        zoneReplacement = String(translationsMap[useZone] || "");
        Logger.log("พบคำแปลแบบตรงๆ สำหรับพื้นที่การใช้งาน: " + zoneReplacement);
      } else {
        Logger.log("ไม่พบคำแปลสำหรับพื้นที่การใช้งาน '" + useZone + "' ใช้ค่าว่าง");
        zoneReplacement = "";
      }
    } else {
      zoneReplacement = "";
    }
    placeholderMap["{{USE_ZONE}}"] = zoneReplacement;

    // จัดการ [[EXTRA_HOURS_INFO]]
    const shouldShowExtraHours = rentalDuration.remainingHours > extraHoursThreshold;
    Logger.log("shouldShowExtraHours check - remainingHours: " + rentalDuration.remainingHours +
      ", extraHoursThreshold: " + extraHoursThreshold +
      ", shouldShowExtraHours: " + shouldShowExtraHours);
    if (shouldShowExtraHours && translationsMap.hasOwnProperty("[[EXTRA_HOURS_INFO]]")) {
      const translatedText = String(translationsMap["[[EXTRA_HOURS_INFO]]"] || "").replace("{0}", extraHoursThreshold);
      placeholderMap["[[EXTRA_HOURS_INFO]]"] = translatedText;
    } else {
      placeholderMap["[[EXTRA_HOURS_INFO]]"] = ""; // ถ้าไม่เข้าเงื่อนไข หรือไม่มีคำแปล ให้แทนที่เป็นค่าว่าง
    }

    // =======================================================================
    // ⭐⭐ START: (กลุ่มที่ 4) รายการที่ "ต้องซ่อนได้" (3-Part Placeholders) ⭐⭐
    // =======================================================================

    // ดึงคำแปล "บาท" มาเก็บไว้ (จากคีย์ที่ผู้ใช้ยืนยัน)
    const bahtUnitText = translationsMap["[[TRANSLATION_34]]"] || "บาท";

    // --- 4.1 ค่าบริการเพิ่มเติม (ADDITIONAL_FEE) ---
    const additionalFee = parseFloat(rentalData.data.ค่าบริการเพิ่มเติม) || 0;
    // (ดึง Label - ใช้คีย์ที่ตกลงกัน)
    const additionalFeeLabel = translationsMap["[[additional_service_label]]"] || "ค่าบริการเพิ่มเติม";

    if (additionalFee > 0) {
      placeholderMap["{{ADDITIONAL_FEE_LABEL}}"] = additionalFeeLabel;
      placeholderMap["{{ADDITIONAL_FEE_VALUE}}"] = additionalFee.toLocaleString('th-TH');
      placeholderMap["{{ADDITIONAL_FEE_UNIT}}"] = bahtUnitText;
    } else {
      placeholderMap["{{ADDITIONAL_FEE_LABEL}}"] = "";
      placeholderMap["{{ADDITIONAL_FEE_VALUE}}"] = "";
      placeholderMap["{{ADDITIONAL_FEE_UNIT}}"] = "";
    }

    // --- 4.2 ค่าล่วงเวลา (OVERTIME_FEE) ---
    const overtimeFee = parseFloat(rentalData.data.ค่าล่วงเวลา) || 0;
    const overtimeLabel = translationsMap["[[overtime_label]]"] || "ค่าล่วงเวลา";

    if (overtimeFee > 0) {
      placeholderMap["{{OVERTIME_FEE_LABEL}}"] = overtimeLabel;
      placeholderMap["{{OVERTIME_FEE_VALUE}}"] = overtimeFee.toLocaleString('th-TH');
      placeholderMap["{{OVERTIME_FEE_UNIT}}"] = bahtUnitText;
    } else {
      placeholderMap["{{OVERTIME_FEE_LABEL}}"] = "";
      placeholderMap["{{OVERTIME_FEE_VALUE}}"] = "";
      placeholderMap["{{OVERTIME_FEE_UNIT}}"] = "";
    }

    // --- 4.3 ค่าประกันเสริม (INSURANCE_FEE) ---
    const insuranceFee = parseFloat(rentalData.data.ค่าประกันเสริมรวม) || 0;
    const insuranceLabel = translationsMap["[[insurance_label]]"] || "ค่าประกันเสริม";

    if (insuranceFee > 0) {
      placeholderMap["{{INSURANCE_FEE_LABEL}}"] = insuranceLabel;
      placeholderMap["{{INSURANCE_FEE_VALUE}}"] = insuranceFee.toLocaleString('th-TH');
      placeholderMap["{{INSURANCE_FEE_UNIT}}"] = bahtUnitText;
    } else {
      placeholderMap["{{INSURANCE_FEE_LABEL}}"] = "";
      placeholderMap["{{INSURANCE_FEE_VALUE}}"] = "";
      placeholderMap["{{INSURANCE_FEE_UNIT}}"] = "";
    }

    // --- 4.4 ค่าคาร์ซีท (CARSEAT_FEE) ---
    const carseatFee = parseFloat(rentalData.data.ค่าคาร์ซีท) || 0;
    const carseatLabel = translationsMap["[[carseat_label]]"] || "ค่าคาร์ซีท";

    if (carseatFee > 0) {
      placeholderMap["{{CARSEAT_FEE_LABEL}}"] = carseatLabel;
      placeholderMap["{{CARSEAT_FEE_VALUE}}"] = carseatFee.toLocaleString('th-TH');
      placeholderMap["{{CARSEAT_FEE_UNIT}}"] = bahtUnitText;
    } else {
      placeholderMap["{{CARSEAT_FEE_LABEL}}"] = "";
      placeholderMap["{{CARSEAT_FEE_VALUE}}"] = "";
      placeholderMap["{{CARSEAT_FEE_UNIT}}"] = "";
    }

    // --- 4.45 ส่วนลด (DISCOUNT) ---
    const discountAmount = parseFloat(rentalData.data.ส่วนลด) || 0;
    const discountLabel = translationsMap["[[discount_label]]"] || "ส่วนลด";

    if (discountAmount > 0) {
      placeholderMap["{{DISCOUNT_LABEL}}"] = discountLabel;
      placeholderMap["{{DISCOUNT_VALUE}}"] = discountAmount.toLocaleString('th-TH');
      placeholderMap["{{DISCOUNT_UNIT}}"] = bahtUnitText;
    } else {
      placeholderMap["{{DISCOUNT_LABEL}}"] = "";
      placeholderMap["{{DISCOUNT_VALUE}}"] = "";
      placeholderMap["{{DISCOUNT_UNIT}}"] = "";
    }

    // --- 4.5 VAT สำหรับใบกำกับภาษี (TAX_INVOICE_VAT) ---
    // ตรวจสอบว่ามี ReceiptInfo และต้องการใบกำกับภาษีหรือไม่
    let wantsTaxInvoice = false;
    let taxInvoiceAmountExVAT = 0;
    let taxInvoiceVATAmount = 0;
    let taxInvoiceTotal = 0;

    try {
      if (rentalData.data.ReceiptInfo) {
        const receiptInfo = JSON.parse(rentalData.data.ReceiptInfo);
        wantsTaxInvoice = receiptInfo.wantsTaxInvoice || false;
        taxInvoiceAmountExVAT = parseFloat(receiptInfo.taxInvoiceAmountExVAT) || 0;
        taxInvoiceVATAmount = parseFloat(receiptInfo.taxInvoiceVATAmount) || 0;
        taxInvoiceTotal = parseFloat(receiptInfo.taxInvoiceTotal) || 0;
      }
    } catch (e) {
      Logger.log("Error parsing ReceiptInfo for VAT: " + e.message);
      wantsTaxInvoice = false;
    }

    const vatLabel = translationsMap["[[vat_label]]"] || "VAT 7%";
    const totalExVATLabel = translationsMap["[[total_ex_vat_label]]"] || "จำนวนเงินก่อน VAT";
    const totalIncVATLabel = translationsMap["[[total_inc_vat_label]]"] || "ยอดรวมทั้งสิ้น (รวม VAT)";

    // ลอจิกพิเศษ:
    // - ถ้าไม่มี VAT: [[total_exVAT]] ใช้คำแปลปกติ (จาก loop ก่อนหน้า)
    // - ถ้ามี VAT: override [[total_exVAT]] ให้ใช้คำแปลของ [[total_incVAT]]
    if (wantsTaxInvoice && taxInvoiceTotal > 0) {
      // มี VAT - override [[total_exVAT]] ให้ใช้คำแปลของ [[total_incVAT]]
      placeholderMap["[[total_exVAT]]"] = translationsMap["[[total_incVAT]]"] || totalIncVATLabel;

      // เพิ่ม placeholders เพิ่มเติมสำหรับแสดงรายละเอียด VAT
      placeholderMap["[[total_incVAT]]"] = translationsMap["[[total_incVAT]]"] || totalIncVATLabel;
      placeholderMap["[[VAT_7]]"] = vatLabel;
      placeholderMap["[[amount_before_vat]]"] = taxInvoiceAmountExVAT > 0 ? taxInvoiceAmountExVAT.toLocaleString('th-TH') : "";
      placeholderMap["[[vat_amount]]"] = taxInvoiceVATAmount > 0 ? taxInvoiceVATAmount.toLocaleString('th-TH') : "";
      placeholderMap["[[total_with_vat]]"] = taxInvoiceTotal > 0 ? taxInvoiceTotal.toLocaleString('th-TH') : "";

      // เพิ่ม placeholders แบบ LABEL/VALUE/UNIT สำหรับ VAT (เหมือน CARSEAT_FEE)
      placeholderMap["{{AMOUNT_EX_VAT_LABEL}}"] = totalExVATLabel;
      placeholderMap["{{AMOUNT_EX_VAT_VALUE}}"] = taxInvoiceAmountExVAT.toLocaleString('th-TH');
      placeholderMap["{{AMOUNT_EX_VAT_UNIT}}"] = bahtUnitText;

      placeholderMap["{{VAT_LABEL}}"] = vatLabel;
      placeholderMap["{{VAT_VALUE}}"] = taxInvoiceVATAmount.toLocaleString('th-TH');
      placeholderMap["{{VAT_UNIT}}"] = bahtUnitText;

      placeholderMap["{{TOTAL_INC_VAT_LABEL}}"] = totalIncVATLabel;
      placeholderMap["{{TOTAL_INC_VAT_VALUE}}"] = taxInvoiceTotal.toLocaleString('th-TH');
      placeholderMap["{{TOTAL_INC_VAT_UNIT}}"] = bahtUnitText;
    } else {
      // ไม่มี VAT - ใช้คำแปลปกติจาก loop (ไม่ต้อง override [[total_exVAT]])
      // ล้าง placeholders ที่เกี่ยวกับ VAT
      placeholderMap["[[total_incVAT]]"] = "";
      placeholderMap["[[VAT_7]]"] = "";
      placeholderMap["[[amount_before_vat]]"] = "";
      placeholderMap["[[vat_amount]]"] = "";
      placeholderMap["[[total_with_vat]]"] = "";

      // ล้าง placeholders แบบ LABEL/VALUE/UNIT สำหรับ VAT
      placeholderMap["{{AMOUNT_EX_VAT_LABEL}}"] = "";
      placeholderMap["{{AMOUNT_EX_VAT_VALUE}}"] = "";
      placeholderMap["{{AMOUNT_EX_VAT_UNIT}}"] = "";

      placeholderMap["{{VAT_LABEL}}"] = "";
      placeholderMap["{{VAT_VALUE}}"] = "";
      placeholderMap["{{VAT_UNIT}}"] = "";

      placeholderMap["{{TOTAL_INC_VAT_LABEL}}"] = "";
      placeholderMap["{{TOTAL_INC_VAT_VALUE}}"] = "";
      placeholderMap["{{TOTAL_INC_VAT_UNIT}}"] = "";
    }

    // --- 4.6 หัก ณ ที่จ่าย (Withholding Tax) ---
    let wantsWHT = false;
    let whtPercentage = 5;
    let whtAmount = 0;

    try {
      if (rentalData.data.ReceiptInfo) {
        const receiptInfoWHT = JSON.parse(rentalData.data.ReceiptInfo);
        wantsWHT = receiptInfoWHT.wantsWHT || false;
        whtPercentage = parseFloat(receiptInfoWHT.whtPercentage) || 5;
        whtAmount = parseFloat(receiptInfoWHT.whtAmount) || 0;
      }
    } catch (e) {
      Logger.log("Error parsing ReceiptInfo for WHT: " + e.message);
      wantsWHT = false;
    }

    const whtLabel = translationsMap["[[withholding_tax_label]]"] || "หัก ณ ที่จ่าย";
    const netPaymentLabel = translationsMap["[[net_payment_label]]"] || "ยอดชำระสุทธิ";

    if (wantsWHT && whtAmount > 0) {
      // มีหัก ณ ที่จ่าย
      placeholderMap["{{WHT_LABEL}}"] = whtLabel + " " + whtPercentage + "%";
      placeholderMap["{{WHT_VALUE}}"] = whtAmount.toLocaleString('th-TH');
      placeholderMap["{{WHT_UNIT}}"] = bahtUnitText;
      placeholderMap["{{WHT_PERCENTAGE}}"] = whtPercentage.toString();

      // คำนวณยอดสุทธิ (รวมค่าบริการที่ไม่อยู่ใน VAT)
      let netPayment = 0;
      if (wantsTaxInvoice && taxInvoiceTotal > 0) {
        // มีทั้ง VAT และหัก ณ ที่จ่าย
        netPayment = taxInvoiceTotal - whtAmount;
      } else {
        // มีแค่หัก ณ ที่จ่าย (ไม่มี VAT)
        const baseAmount = parseFloat(rentalData.data.ค่าเช่ารวมทั้งหมด) || 0;
        netPayment = baseAmount - whtAmount;
      }

      // บวกค่าบริการที่ไม่ได้รวมใน VAT/WHT
      try {
        if (rentalData.data.ReceiptInfo) {
          const receiptInfoNonVAT = JSON.parse(rentalData.data.ReceiptInfo);

          // ค่าบริการเพิ่มเติมที่ไม่รวม VAT
          if (receiptInfoNonVAT.additionalServiceIncludeVAT === false) {
            netPayment += parseFloat(rentalData.data.ค่าบริการเพิ่มเติม) || 0;
          }

          // ค่าคาร์ซีทที่ไม่รวม VAT
          if (receiptInfoNonVAT.carSeatIncludeVAT === false && rentalData.data.ต้องการคาร์ซีท) {
            netPayment += parseFloat(rentalData.data.ค่าคาร์ซีท) || 0;
          }

          // ค่าประกันเสริมที่ไม่รวม VAT
          if (receiptInfoNonVAT.insuranceIncludeVAT === false && rentalData.data.ต้องการประกันเสริม) {
            netPayment += parseFloat(rentalData.data.ค่าประกันเสริมรวม) || 0;
          }
        }
      } catch (e) {
        Logger.log("Error calculating non-VAT services for net payment: " + e.message);
      }

      placeholderMap["{{NET_PAYMENT_LABEL}}"] = netPaymentLabel;
      placeholderMap["{{NET_PAYMENT_VALUE}}"] = netPayment.toLocaleString('th-TH');
      placeholderMap["{{NET_PAYMENT_UNIT}}"] = bahtUnitText;

      // Placeholders สำหรับแสดงในเอกสาร
      placeholderMap["[[withholding_tax]]"] = whtAmount.toLocaleString('th-TH');
      placeholderMap["[[net_payment]]"] = netPayment.toLocaleString('th-TH');
    } else {
      // ไม่มีหัก ณ ที่จ่าย
      placeholderMap["{{WHT_LABEL}}"] = "";
      placeholderMap["{{WHT_VALUE}}"] = "";
      placeholderMap["{{WHT_UNIT}}"] = "";
      placeholderMap["{{WHT_PERCENTAGE}}"] = "";

      placeholderMap["{{NET_PAYMENT_LABEL}}"] = "";
      placeholderMap["{{NET_PAYMENT_VALUE}}"] = "";
      placeholderMap["{{NET_PAYMENT_UNIT}}"] = "";

      placeholderMap["[[withholding_tax]]"] = "";
      placeholderMap["[[net_payment]]"] = "";
    }

    // =======================================================================
    // ⭐⭐ END: สิ้นสุดส่วนที่เพิ่มเข้ามาใหม่ ⭐⭐
    // =======================================================================


    // --- จบการสร้าง Placeholder Map ---

    // 8. Copy Template Sheet
    const templateSheet = ss.getSheetByName(templateSheetName);
    if (!templateSheet) {
      throw new Error("ไม่พบแผ่นงานเทมเพลต '" + templateSheetName + "'");
    }

    const tempSheetName = tempSheetBaseName + bookingNumber;
    tempSheet = ss.getSheetByName(tempSheetName); // กำหนดค่าให้ตัวแปรนอก try-catch
    if (tempSheet) {
      ss.deleteSheet(tempSheet);
    }
    tempSheet = templateSheet.copyTo(ss).setName(tempSheetName);
    SpreadsheetApp.flush(); // อาจจะช่วยให้ copy เสร็จสมบูรณ์

    // 9. *** (ใหม่) อ่านข้อมูล, แทนที่ใน Memory, เขียนกลับรอบเดียว ***
    const targetRange = tempSheet.getDataRange();
    const targetData = targetRange.getValues();
    // RegExp เพื่อค้นหา {{key}} หรือ [[key]] ทั้งหมด
    // ใช้ .+? เพื่อให้ non-greedy matching ป้องกันการจับคู่ข้าม placeholder
    const regex = /(\{\{.+?\}\}|\[\[.+?\]\])/g;
    let replacementMade = false; // ตรวจสอบว่ามีการเปลี่ยนแปลงหรือไม่

    Logger.log("Starting replacements in memory...");
    for (let r = 0; r < targetData.length; r++) {
      for (let c = 0; c < targetData[r].length; c++) {
        let cellValue = targetData[r][c];
        if (typeof cellValue === 'string' && (cellValue.includes('{{') || cellValue.includes('[['))) {
          let originalCellValue = cellValue;
          // ใช้ replace กับ callback function
          targetData[r][c] = cellValue.replace(regex, (match) => {
            if (placeholderMap.hasOwnProperty(match)) {
              // Logger.log("Replacing in Cell[" + r + "," + c + "]: '" + match + "' with '" + placeholderMap[match] + "'");
              return placeholderMap[match]; // คืนค่าจาก Map ถ้าเจอ
            } else {
              // Logger.log("Warning: Key '" + match + "' not found in placeholderMap at Cell[" + r + "," + c + "]");
              return match; // คืนค่าเดิมถ้าไม่เจอใน Map
            }
          });
          if (targetData[r][c] !== originalCellValue) {
            replacementMade = true;
          }
        }
      }
    }

    if (replacementMade) {
      Logger.log("Writing modified data back to sheet: " + tempSheetName);
      targetRange.setValues(targetData);
      SpreadsheetApp.flush(); // Ensure changes are written before proceeding
      Logger.log("Finished writing data.");
    } else {
      Logger.log("No replacements were made in the data array.");
    }
    // --- จบส่วนการแทนที่ใน Memory ---

    // 10. จัดการ QR Code (แก้ไขใหม่ - รองรับ 3 ตัวเลือก)
    Logger.log("Handling QR Code...");
    const qrCodePlaceholder = "{{QRCODE}}";
    try {
      const qrCodeFinder = tempSheet.createTextFinder(qrCodePlaceholder);
      const qrCodeRanges = qrCodeFinder.findAll();

      if (qrCodeRanges && qrCodeRanges.length > 0) {
        Logger.log("Found " + qrCodeRanges.length + " instance(s) of '" + qrCodePlaceholder + "'. Processing first one at " + qrCodeRanges[0].getA1Notation());
        const qrCodeRange = qrCodeRanges[0];

        // ตรวจสอบค่า qrCodeMethod
        Logger.log("QR Code method: " + qrCodeMethod);

        if (qrCodeMethod === "none") {
          // กรณีไม่ใช้ QR Code - ลบ placeholder ทิ้งเลย
          qrCodeRange.setValue("");
          Logger.log("QR Code method set to 'none'. Removed placeholder without replacement.");

        } else if (qrCodeMethod === "manual") {
          // กรณีใช้รูป QR Code ที่อัปโหลด
          if (qrCodeUrl) {
            try {
              const fileIdMatch = qrCodeUrl.match(/\/d\/([^\/]+)/);
              if (fileIdMatch && fileIdMatch[1]) {
                const fileId = fileIdMatch[1];
                const imageBlob = UrlFetchApp.fetch("https://drive.google.com/uc?export=download&id=" + fileId).getBlob();

                tempSheet.insertImage(imageBlob, qrCodeRange.getColumn(), qrCodeRange.getRow())
                  .setAnchorCell(qrCodeRange)
                  .setAnchorCellXOffset(5)
                  .setAnchorCellYOffset(5)
                  .setWidth(200)
                  .setHeight(200);
                qrCodeRange.setValue("");
                Logger.log("Inserted uploaded QR Code from URL (manual method).");
              } else {
                qrCodeRange.setValue("");
                Logger.log("Could not extract File ID from QR Code URL. Clearing placeholder.");
              }
            } catch (qrError) {
              qrCodeRange.setValue("");
              Logger.log("Error processing uploaded QR code image: " + qrError.toString() + ". Clearing placeholder.");
            }
          } else {
            qrCodeRange.setValue("");
            Logger.log("Manual QR Code method selected but no QR Code URL provided. Clearing placeholder.");
          }

        } else if (qrCodeMethod === "auto") {
          // กรณีสร้าง QR Code อัตโนมัติ
          if (promptpayNumber) {
            try {
              const amount = parseFloat(rentalData.data.รวมยอดชำระวันรับรถ) || 0;
              const qrCodeImageUrl = generatePromtPay(promptpayNumber, amount);

              if (qrCodeImageUrl) {
                const imageBlob = UrlFetchApp.fetch(qrCodeImageUrl).getBlob();
                tempSheet.insertImage(imageBlob, qrCodeRange.getColumn(), qrCodeRange.getRow())
                  .setAnchorCell(qrCodeRange)
                  .setAnchorCellXOffset(5)
                  .setAnchorCellYOffset(5)
                  .setWidth(200)
                  .setHeight(200);
                qrCodeRange.setValue("");
                Logger.log("Generated and inserted PromptPay QR Code (auto method).");
              } else {
                qrCodeRange.setValue("");
                Logger.log("Failed to generate PromptPay QR code URL. Clearing placeholder.");
              }
            } catch (qrError) {
              qrCodeRange.setValue("");
              Logger.log("Error generating PromptPay QR code: " + qrError.toString() + ". Clearing placeholder.");
            }
          } else {
            qrCodeRange.setValue("");
            Logger.log("Auto QR Code method selected but no PromptPay number provided. Clearing placeholder.");
          }
        } else {
          // กรณีค่าไม่ถูกต้อง - ลบ placeholder และใช้ค่าเริ่มต้น
          qrCodeRange.setValue("");
          Logger.log("Invalid QR Code method: " + qrCodeMethod + ". Clearing placeholder.");
        }
      } else {
        Logger.log("Placeholder '" + qrCodePlaceholder + "' not found in temp sheet.");
      }
    } catch (finderError) {
      Logger.log("Error finding QR Code placeholder: " + finderError.toString());
    }

    // 10.1 จัดการ SHOP_LOGO (เพิ่มเติม)
    Logger.log("Handling Shop Logo...");
    const shopLogoPlaceholder = "{{SHOP_LOGO}}";
    try {
      const shopLogoFinder = tempSheet.createTextFinder(shopLogoPlaceholder);
      const shopLogoRanges = shopLogoFinder.findAll(); // หาตำแหน่งโลโก้ทั้งหมด

      if (shopLogoRanges && shopLogoRanges.length > 0) {
        Logger.log("Found " + shopLogoRanges.length + " instance(s) of '" + shopLogoPlaceholder + "'. Processing first one at " + shopLogoRanges[0].getA1Notation());
        const shopLogoRange = shopLogoRanges[0]; // ทำกับตำแหน่งแรกที่เจอ

        if (shopLogoUrl) {
          let imageBlob = null;
          let logMsg = "";
          try {
            // แปลง URL เป็น FileID ถ้าเป็น Google Drive URL
            const fileIdMatch = shopLogoUrl.match(/\/d\/([^\/]+)/);
            if (fileIdMatch && fileIdMatch[1]) {
              const fileId = fileIdMatch[1];
              imageBlob = UrlFetchApp.fetch("https://drive.google.com/uc?export=download&id=" + fileId).getBlob();
              logMsg = "Inserted shop logo from URL.";
            } else if (shopLogoUrl.trim() !== "") {
              // ถ้าไม่ใช่ Google Drive URL แต่มี URL อื่น
              try {
                imageBlob = UrlFetchApp.fetch(shopLogoUrl).getBlob();
                logMsg = "Inserted shop logo from direct URL.";
              } catch (urlError) {
                logMsg = "Could not fetch shop logo from URL: " + shopLogoUrl + ". Clearing placeholder.";
              }
            } else {
              logMsg = "Shop logo URL is empty. Clearing placeholder.";
            }

            // แทรกรูปภาพถ้ามี Blob
            if (imageBlob) {
              // กำหนดขนาดสูงสุดที่ต้องการ (ปรับให้เหมาะสม)
              const maxWidth = 250;  // ความกว้างสูงสุด (pixel)
              const maxHeight = 120; // ความสูงสูงสุด (pixel)

              // ตรวจสอบว่าเซลล์เป็นเซลล์รวมหรือไม่
              let rangeA1Notation = shopLogoRange.getA1Notation();
              Logger.log("Logo placeholder cell: " + rangeA1Notation);

              // แทรกรูปภาพและจัดให้อยู่กึ่งกลางเซลล์
              const image = tempSheet.insertImage(imageBlob, shopLogoRange.getColumn(), shopLogoRange.getRow())
                .setAnchorCell(shopLogoRange)
                .setAnchorCellXOffset(10) // ปรับตำแหน่งให้อยู่กึ่งกลางมากขึ้น
                .setAnchorCellYOffset(10);

              // ดึงขนาดดั้งเดิมของรูป
              const originalWidth = image.getWidth();
              const originalHeight = image.getHeight();
              const ratio = originalWidth / originalHeight;

              // คำนวณขนาดที่เหมาะสม โดยรักษาสัดส่วนและไม่เกินขนาดสูงสุดที่กำหนด
              let newWidth, newHeight;

              if (ratio >= 1) {
                // รูปกว้างกว่าสูง หรือเป็นสี่เหลี่ยมจัตุรัส - ใช้ความกว้างเป็นตัวกำหนด
                newWidth = Math.min(originalWidth, maxWidth);
                newHeight = newWidth / ratio;

                // ตรวจสอบว่าความสูงไม่เกินขีดจำกัด
                if (newHeight > maxHeight) {
                  newHeight = maxHeight;
                  newWidth = newHeight * ratio;
                }
              } else {
                // รูปสูงกว่ากว้าง - ใช้ความสูงเป็นตัวกำหนด
                newHeight = Math.min(originalHeight, maxHeight);
                newWidth = newHeight * ratio;

                // ตรวจสอบว่าความกว้างไม่เกินขีดจำกัด
                if (newWidth > maxWidth) {
                  newWidth = maxWidth;
                  newHeight = newWidth / ratio;
                }
              }

              // ปรับขนาดรูป
              image.setWidth(newWidth).setHeight(newHeight);

              Logger.log("Resized logo image to: " + newWidth + "x" + newHeight +
                " (original: " + originalWidth + "x" + originalHeight +
                ", ratio: " + ratio + ")");

              shopLogoRange.setValue(""); // ลบ Placeholder หลังแทรกรูป
              Logger.log(logMsg);
            } else {
              shopLogoRange.setValue(""); // ลบ Placeholder ถ้าไม่มี Blob
              Logger.log(logMsg);
            }

          } catch (logoError) {
            Logger.log("Error processing shop logo image: " + logoError.toString() + ". Clearing placeholder.");
            shopLogoRange.setValue(""); // ลบ Placeholder กรณี Error
          }
        } else {
          Logger.log("No shop logo URL provided. Clearing placeholder '" + shopLogoPlaceholder + "'.");
          shopLogoRange.setValue(""); // ไม่มี URL ก็ลบ Placeholder
        }
      } else {
        Logger.log("Placeholder '" + shopLogoPlaceholder + "' not found in temp sheet.");
      }
    } catch (finderError) {
      Logger.log("Error finding Shop Logo placeholder: " + finderError.toString());
    }

    // 11. สร้างไฟล์ PDF จากแผ่นงาน temp
    Logger.log("Generating PDF...");
    SpreadsheetApp.flush(); // Ensure all updates are processed

    const spreadsheetId = ss.getId();
    // ตั้งค่า Export URL ตามต้องการ
    const pdfExportUrl = 'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/export?format=pdf'
      + '&size=7' // Example: Use A4 size
      + '&portrait=true'
      + '&fitw=true' // Fit to width
      + '&top_margin=0.2' // Adjust margins (inches)
      + '&bottom_margin=0.2'
      + '&left_margin=0.2'
      + '&right_margin=0.2'
      + '&sheetnames=false&printtitle=false'
      + '&pagenumbers=false' // Hide page numbers if needed
      + '&gridlines=false'
      + '&fzr=false' // Don't repeat frozen rows
      + '&gid=' + tempSheet.getSheetId(); // Export only the temp sheet

    // --- แก้ไขตรงนี้ ---
    const response = UrlFetchApp.fetch(pdfExportUrl, { // <--- เก็บผลลัพธ์ในตัวแปร response
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
      },
      muteHttpExceptions: true // Prevent script stopping on fetch error
    });

    const responseCode = response.getResponseCode(); // <--- เรียกจากตัวแปร response
    // --- สิ้นสุดการแก้ไข ---

    if (responseCode !== 200) {
      // เพิ่ม Log URL ที่ใช้ไปด้วย เพื่อช่วยดีบั๊ก
      Logger.log("Failed to fetch PDF. Response code: " + responseCode + ". URL: " + pdfExportUrl);
      throw new Error("Failed to fetch PDF. Response code: " + responseCode);
    }

    // --- แก้ไขตรงนี้ ---
    const blob = response.getBlob(); // <--- เรียกจากตัวแปร response
    // --- สิ้นสุดการแก้ไข ---

    if (!blob || blob.getContentType() !== 'application/pdf') {
      // เพิ่ม Log ContentType ที่ได้ เพื่อช่วยดีบั๊ก
      Logger.log("Failed to generate PDF blob or invalid content type. ContentType received: " + (blob ? blob.getContentType() : 'null blob'));
      throw new Error("Failed to generate PDF blob or invalid content type.");
    }


    // 12. บันทึกไฟล์ PDF ในโฟลเดอร์
    const pdfFileName = "สัญญาเช่า_" + bookingNumber + ".pdf";
    const pdfFile = folder.createFile(blob.setName(pdfFileName));
    Logger.log("PDF saved: " + pdfFile.getUrl());

    // 13. ตั้งค่าการแชร์ (ถ้าต้องการ)
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // 14. อัพเดตลิงก์สัญญาเช่าในรายการเช่า (ถ้ามี)
    try {

      updateRentalContract(bookingNumber, pdfFile.getUrl(), sheetID);
    } catch (updateError) {
      Logger.log("Warning: ไม่สามารถอัพเดตลิงก์สัญญาเช่าได้: " + updateError.toString());
    }

    // 15. ลบแผ่นงาน temp (ย้ายมาทำสุดท้ายก่อน return สำเร็จ)
    Logger.log("Deleting temp sheet: " + tempSheetName);
    ss.deleteSheet(tempSheet);
    tempSheet = null; // เคลียร์ตัวแปร

    // 16. ส่งคืนผลลัพธ์สำเร็จ
    return {
      success: true,
      pdfUrl: pdfFile.getUrl(),
      message: "สร้างสัญญาเช่าสำเร็จ"
    };

  } catch (e) {
    Logger.log("Error generating contract: " + e.toString() + (e.stack ? "\nStack: " + e.stack : ""));

    // Cleanup: ลบแผ่นงาน temp ถ้ายังอยู่
    try {
      if (tempSheet) { // ใช้ตัวแปรที่ประกาศไว้นอก try
        const ss = SpreadsheetApp.openById(sheetID);
        // ตรวจสอบอีกครั้งว่าชีตยังอยู่จริงก่อนลบ
        const checkSheet = ss.getSheetByName(tempSheet.getName());
        if (checkSheet) {
          Logger.log("Cleaning up temp sheet: " + tempSheet.getName());
          ss.deleteSheet(checkSheet);
        }
      } else {
        // ถ้า tempSheet เป็น null ลองหาจากชื่อ เผื่อสร้างเสร็จแต่เกิด error ก่อนกำหนดค่าให้ tempSheet นอก try
        const ss = SpreadsheetApp.openById(sheetID);
        const tempSheetNameToDelete = tempSheetBaseName + bookingNumber;
        const checkSheet = ss.getSheetByName(tempSheetNameToDelete);
        if (checkSheet) {
          Logger.log("Cleaning up temp sheet by name: " + tempSheetNameToDelete);
          ss.deleteSheet(checkSheet);
        }
      }
    } catch (cleanupError) {
      Logger.log("Error during cleanup: " + cleanupError.toString());
    }

    return { success: false, message: "เกิดข้อผิดพลาดในการสร้างสัญญาเช่า: " + e.message };
  }
}







// ฟังก์ชันสำหรับการแปลงเวลาให้เป็นรูปแบบ HH:MM
function formatTimeOnly(timeValue) {
  if (!timeValue) return "";

  // กรณีที่เป็น Date object
  if (timeValue instanceof Date) {
    const hours = String(timeValue.getHours()).padStart(2, '0');
    const minutes = String(timeValue.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // กรณีที่เป็นสตริงที่มี ':' อยู่แล้ว (เช่น "08:00")
  if (typeof timeValue === 'string' && timeValue.includes(':')) {
    const parts = timeValue.split(':');
    if (parts.length >= 2) {
      const hours = String(parseInt(parts[0], 10)).padStart(2, '0');
      const minutes = String(parseInt(parts[1], 10)).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  }

  // กรณีที่เป็นสตริงที่มีรูปแบบอื่น พยายามแปลงเป็น Date
  try {
    const dateObj = new Date(timeValue);
    if (!isNaN(dateObj.getTime())) {
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  } catch (e) {
    Logger.log("Error parsing time: " + e.toString());
  }

  // กรณีที่ไม่สามารถแปลงได้ ส่งคืนค่าเดิม
  return timeValue;
}




function calculateRentalDuration(rentalData, extraHoursThreshold, language, sheetID) {
  // กำหนดค่าเริ่มต้น
  let diffDays = 1;
  let remainingHours = 0;
  let rentalDays = 1;
  let rentalPeriodText = "1 วัน";

  // ? ดึงคำแปลจากชีต
  const translationResult = getContractTranslations(language, sheetID);
  const translations = translationResult.success ? translationResult.data : {};

  const daysText = translations["[[DAYS]]"] || "days";
  const hoursText = translations["[[HOURS]]"] || "hours";

  // คำนวณจำนวนวันและชั่วโมง
  try {
    let startDateObj, endDateObj;

    // แปลงวันที่เช่าเป็น Date
    if (typeof rentalData.วันที่เช่า === 'string') {
      let startYear, startMonth, startDay;

      if (rentalData.วันที่เช่า.includes('T')) {
        const isoDate = new Date(rentalData.วันที่เช่า);
        startYear = isoDate.getFullYear();
        startMonth = isoDate.getMonth();
        startDay = isoDate.getDate();
      } else if (rentalData.วันที่เช่า.includes('/')) {
        const parts = rentalData.วันที่เช่า.split('/');
        if (parts.length === 3) {
          startDay = parseInt(parts[0], 10);
          startMonth = parseInt(parts[1], 10) - 1;
          startYear = parseInt(parts[2], 10);
          if (startYear >= 2500) startYear -= 543;
        }
      }

      let startHour = 8, startMinute = 0;
      if (rentalData.เวลารับรถ) {
        const formattedTime = formatTimeOnly(rentalData.เวลารับรถ);
        if (formattedTime?.includes(':')) {
          const timeParts = formattedTime.split(':');
          startHour = parseInt(timeParts[0], 10);
          startMinute = parseInt(timeParts[1], 10);
        }
      }

      startDateObj = new Date(startYear, startMonth, startDay, startHour, startMinute, 0);
    } else if (rentalData.วันที่เช่า instanceof Date) {
      startDateObj = new Date(rentalData.วันที่เช่า);
      if (rentalData.เวลารับรถ) {
        const formattedTime = formatTimeOnly(rentalData.เวลารับรถ);
        if (formattedTime?.includes(':')) {
          const timeParts = formattedTime.split(':');
          startDateObj.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), 0, 0);
        }
      }
    }

    // แปลงวันที่คืนเป็น Date
    if (typeof rentalData.วันที่คืน === 'string') {
      let endYear, endMonth, endDay;

      if (rentalData.วันที่คืน.includes('T')) {
        const isoDate = new Date(rentalData.วันที่คืน);
        endYear = isoDate.getFullYear();
        endMonth = isoDate.getMonth();
        endDay = isoDate.getDate();
      } else if (rentalData.วันที่คืน.includes('/')) {
        const parts = rentalData.วันที่คืน.split('/');
        if (parts.length === 3) {
          endDay = parseInt(parts[0], 10);
          endMonth = parseInt(parts[1], 10) - 1;
          endYear = parseInt(parts[2], 10);
          if (endYear >= 2500) endYear -= 543;
        }
      }

      let endHour = 18, endMinute = 0;
      if (rentalData.เวลาคืนรถ) {
        const formattedTime = formatTimeOnly(rentalData.เวลาคืนรถ);
        if (formattedTime?.includes(':')) {
          const timeParts = formattedTime.split(':');
          endHour = parseInt(timeParts[0], 10);
          endMinute = parseInt(timeParts[1], 10);
        }
      }

      endDateObj = new Date(endYear, endMonth, endDay, endHour, endMinute, 0);
    } else if (rentalData.วันที่คืน instanceof Date) {
      endDateObj = new Date(rentalData.วันที่คืน);
      if (rentalData.เวลาคืนรถ) {
        const formattedTime = formatTimeOnly(rentalData.เวลาคืนรถ);
        if (formattedTime?.includes(':')) {
          const timeParts = formattedTime.split(':');
          endDateObj.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), 0, 0);
        }
      }
    }

    if (startDateObj && endDateObj && !isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
      const diffMs = Math.abs(endDateObj - startDateObj);
      const diffHours = diffMs / (1000 * 60 * 60);

      diffDays = Math.floor(diffHours / 24);
      remainingHours = Math.floor(diffHours % 24);

      rentalDays = diffDays;
      if (remainingHours > extraHoursThreshold) {
        rentalDays += 1;
      }

      rentalDays = Math.max(1, rentalDays);

      // แสดงผลลัพธ์เป็นข้อความ
      if (remainingHours > extraHoursThreshold) {
        rentalPeriodText = rentalDays + " " + daysText;
      } else {
        rentalPeriodText = diffDays + " " + daysText;
        if (remainingHours > 0) {
          rentalPeriodText += " " + remainingHours + " " + hoursText;
        }
      }
    }
  } catch (error) {
    Logger.log("เกิดข้อผิดพลาดในการคำนวณวันเช่า: " + error.toString());
  }

  return {
    diffDays: diffDays,
    remainingHours: remainingHours,
    rentalDays: rentalDays,
    rentalPeriodText: rentalPeriodText
  };
}





// แก้ไขฟังก์ชัน getContractTranslations เพื่อรองรับรูปแบบ [[TRANSLATION_X]]
function getContractTranslations(language, sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(CONTRACT_SHEET);

    if (!sheet) {
      return { success: false, message: "ไม่พบแผ่นงาน 'แปลสัญญาเช่า'" };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Find the column index for the selected language
    let langIndex = -1;
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] === language) {
        langIndex = i;
        break;
      }
    }

    if (langIndex === -1) {
      // If exact match not found, try to match on prefix (e.g., 'zh' should match 'zh-CN')
      for (let i = 0; i < headers.length; i++) {
        if (headers[i].startsWith(language) || language.startsWith(headers[i])) {
          langIndex = i;
          break;
        }
      }
    }

    if (langIndex === -1) {
      // If still not found, default to Thai
      langIndex = headers.indexOf("th");

      if (langIndex === -1) {
        return { success: false, message: "ไม่พบภาษาที่เลือกและไม่พบภาษาไทยเป็นค่าเริ่มต้น" };
      }
    }

    // Create translations object
    const translations = {};
    for (let i = 1; i < data.length; i++) {
      const key = data[i][0]; // Key is in column A (now in [[TRANSLATION_X]] format)
      const value = data[i][langIndex]; // Translation is in the language column

      if (key) {
        translations[key] = value || "";
      }
    }

    return { success: true, data: translations };
  } catch (e) {
    Logger.log("Error getting translations: " + e.toString());
    return { success: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูลแปล: " + e.toString() };
  }
}


function deleteRentalContract(bookingNumber, sheetID) {
  console.log("🔄 [deleteRentalContract] เริ่มต้นการลบสัญญาเช่า");
  console.log("📝 [deleteRentalContract] Parameters:", {
    bookingNumber: bookingNumber,
    sheetID: sheetID
  });

  try {
    // 1. ตรวจสอบว่ามีไฟล์สัญญาเช่าอยู่หรือไม่
    console.log("⚙️ [deleteRentalContract] กำลังดึงการตั้งค่าระบบ...");
    const config = getSystemConfig(sheetID);

    if (!config) {
      console.error("❌ [deleteRentalContract] ไม่สามารถดึงการตั้งค่าระบบได้");
      return { success: false, message: "ไม่สามารถดึงการตั้งค่าระบบได้" };
    }

    // เพิ่ม log เพื่อดูโครงสร้าง config object
    console.log("📁 [deleteRentalContract] โครงสร้าง config object:", {
      configKeys: Object.keys(config),
      hasNestedConfig: !!config.config,
      nestedConfigKeys: config.config ? Object.keys(config.config) : "N/A"
    });

    // เข้าถึงจาก nested config (ถูกต้องตามโครงสร้างของ getSystemConfig)
    const rootFolderId = config.config?.IDโฟลเดอร์สัญญาเช่า;

    console.log("📁 [deleteRentalContract] ข้อมูลการตั้งค่า:", {
      rootFolderId: rootFolderId || "ไม่ได้ตั้งค่า",
      nestedConfigExists: !!config.config,
      availableConfigKeys: config.config ? Object.keys(config.config) : "ไม่มี config object"
    });

    if (!rootFolderId) {
      console.error("❌ [deleteRentalContract] ไม่พบ ID ของโฟลเดอร์เก็บสัญญาเช่าในการตั้งค่า");
      return { success: false, message: "ไม่พบ ID ของโฟลเดอร์เก็บสัญญาเช่า" };
    }

    console.log("📂 [deleteRentalContract] กำลังเปิดโฟลเดอร์หลัก...");
    let rootFolder;
    try {
      rootFolder = DriveApp.getFolderById(rootFolderId);
      console.log("✅ [deleteRentalContract] เปิดโฟลเดอร์หลักสำเร็จ:", {
        folderName: rootFolder.getName(),
        folderId: rootFolderId
      });
    } catch (folderError) {
      console.error("❌ [deleteRentalContract] ไม่สามารถเปิดโฟลเดอร์หลักได้:", folderError);
      return { success: false, message: "ไม่สามารถเข้าถึงโฟลเดอร์เก็บสัญญาเช่าได้: " + folderError.toString() };
    }

    // 2. ค้นหาโฟลเดอร์ที่มีชื่อตรงกับหมายเลขการจอง
    console.log("🔍 [deleteRentalContract] กำลังค้นหาโฟลเดอร์สำหรับหมายเลขการจอง:", bookingNumber);
    const folderIterator = rootFolder.getFoldersByName(bookingNumber);

    console.log("📊 [deleteRentalContract] ผลการค้นหาโฟลเดอร์:", {
      hasResults: folderIterator.hasNext(),
      searchTerm: bookingNumber
    });

    if (!folderIterator.hasNext()) {
      console.warn("⚠️ [deleteRentalContract] ไม่พบโฟลเดอร์สัญญาเช่าสำหรับหมายเลขการจองนี้");

      // Log โฟลเดอร์ย่อยทั้งหมดเพื่อ debug
      console.log("🔍 [deleteRentalContract] รายการโฟลเดอร์ย่อยทั้งหมดในโฟลเดอร์หลัก:");
      const allSubFolders = rootFolder.getFolders();
      let subFolderCount = 0;
      while (allSubFolders.hasNext() && subFolderCount < 10) { // แสดงแค่ 10 โฟลเดอร์แรก
        const subFolder = allSubFolders.next();
        console.log(`  - ${subFolder.getName()}`);
        subFolderCount++;
      }

      return { success: false, message: "ไม่พบโฟลเดอร์สัญญาเช่าสำหรับหมายเลขการจองนี้" };
    }

    // 3. ค้นหาและลบไฟล์สัญญาเช่าเฉพาะ (ไม่ลบโฟลเดอร์)
    const folder = folderIterator.next();
    console.log("📁 [deleteRentalContract] พบโฟลเดอร์สัญญาเช่า:", {
      folderName: folder.getName(),
      folderId: folder.getId(),
      createdDate: folder.getDateCreated(),
      lastUpdated: folder.getLastUpdated()
    });

    let filesDeleted = 0;
    let totalFilesInFolder = 0;
    console.log("🔍 [deleteRentalContract] เริ่มค้นหาไฟล์สัญญาเช่าในโฟลเดอร์...");

    // ค้นหาไฟล์ที่ขึ้นต้นด้วย "สัญญาเช่า_" และลงท้ายด้วย ".pdf"
    const fileIterator = folder.getFiles();
    const contractFiles = [];

    // รวบรวมไฟล์ทั้งหมดก่อน
    while (fileIterator.hasNext()) {
      const file = fileIterator.next();
      totalFilesInFolder++;

      const fileName = file.getName();
      console.log(`📄 [deleteRentalContract] พบไฟล์: ${fileName}`, {
        fileName: fileName,
        fileId: file.getId(),
        mimeType: file.getBlob().getContentType(),
        size: file.getSize(),
        createdDate: file.getDateCreated()
      });

      // ตรวจสอบว่าเป็นไฟล์สัญญาเช่าหรือไม่
      if (fileName.startsWith('สัญญาเช่า_') && fileName.endsWith('.pdf')) {
        console.log(`✅ [deleteRentalContract] ไฟล์นี้ตรงเงื่อนไข: ${fileName}`);
        contractFiles.push(file);
      } else {
        console.log(`⏭️ [deleteRentalContract] ไฟล์นี้ไม่ตรงเงื่อนไข (ข้าม): ${fileName}`);
      }
    }

    console.log(`📊 [deleteRentalContract] สรุปการสแกนไฟล์:`, {
      totalFilesInFolder: totalFilesInFolder,
      contractFilesFound: contractFiles.length,
      contractFileNames: contractFiles.map(f => f.getName())
    });

    // ลบไฟล์สัญญาเช่าที่พบ
    console.log("🗑️ [deleteRentalContract] เริ่มลบไฟล์สัญญาเช่า...");

    for (const file of contractFiles) {
      console.log(`🗂️ [deleteRentalContract] กำลังลบไฟล์: ${file.getName()}`, {
        fileName: file.getName(),
        fileId: file.getId(),
        size: file.getSize()
      });

      try {
        file.setTrashed(true);
        filesDeleted++;
        console.log(`✅ [deleteRentalContract] ลบไฟล์สำเร็จ: ${file.getName()}`);
      } catch (fileDeleteError) {
        console.error(`❌ [deleteRentalContract] ลบไฟล์ไม่สำเร็จ: ${file.getName()}`, fileDeleteError);
      }
    }

    console.log(`📊 [deleteRentalContract] สรุปการลบไฟล์สัญญาเช่า: ${filesDeleted}/${contractFiles.length} ไฟล์`);

    // ไม่ลบโฟลเดอร์ - เก็บไว้สำหรับไฟล์อื่นที่อาจมี
    console.log("📁 [deleteRentalContract] เก็บโฟลเดอร์ไว้ (ไม่ลบ) - อาจมีไฟล์อื่นที่สำคัญ");

    const successMessage = `ลบไฟล์สัญญาเช่าสำเร็จ (${filesDeleted} ไฟล์)`;
    console.log("✅ [deleteRentalContract] การลบไฟล์สัญญาเช่าเสร็จสิ้น");
    console.log("📊 [deleteRentalContract] สรุปผลลัพธ์:", {
      success: true,
      filesDeleted: filesDeleted,
      totalFilesInFolder: totalFilesInFolder,
      contractFilesFound: contractFiles.length,
      bookingNumber: bookingNumber,
      folderKept: true,
      message: successMessage
    });

    return {
      success: true,
      message: successMessage,
      details: {
        filesDeleted: filesDeleted,
        totalFilesInFolder: totalFilesInFolder,
        contractFilesFound: contractFiles.length,
        bookingNumber: bookingNumber,
        folderName: folder.getName(),
        folderId: folder.getId(),
        folderKept: true
      }
    };

  } catch (e) {
    console.error("💥 [deleteRentalContract] เกิดข้อผิดพลาดร้ายแรง:", e);
    console.error("📍 [deleteRentalContract] Error Details:", {
      message: e.message,
      stack: e.stack,
      toString: e.toString(),
      name: e.name
    });
    console.error("📝 [deleteRentalContract] Parameters ที่ทำให้เกิด Error:", {
      bookingNumber: bookingNumber,
      sheetID: sheetID
    });

    // Log ข้อมูลเพิ่มเติมสำหรับ debug
    try {
      const config = getSystemConfig(sheetID);
      console.error("⚙️ [deleteRentalContract] Config ณ เวลาที่เกิด Error:", {
        hasConfig: !!config,
        rootFolderId: config ? config.IDโฟลเดอร์สัญญาเช่า : "N/A"
      });
    } catch (configError) {
      console.error("❌ [deleteRentalContract] ไม่สามารถดึง config สำหรับ debug ได้:", configError);
    }

    Logger.log("Error deleting contract: " + e.toString());
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการลบสัญญาเช่า: " + e.toString(),
      error: {
        message: e.message,
        stack: e.stack,
        name: e.name
      }
    };
  }
}


// Helper function to create a folder or get it if it exists
function createOrGetFolder(folderName, parentFolderId) {
  try {
    const parentFolder = DriveApp.getFolderById(parentFolderId);

    // Check if folder already exists
    const folderIterator = parentFolder.getFoldersByName(folderName);
    if (folderIterator.hasNext()) {
      return folderIterator.next();
    }

    // Create a new folder
    return parentFolder.createFolder(folderName);
  } catch (e) {
    Logger.log("Error creating folder: " + e.toString());
    return null;
  }
}


// Helper function to format date in different languages
function formatDate(dateValue, language) {
  if (!dateValue) return "";

  let date;
  if (dateValue instanceof Date) {
    date = dateValue;
  } else {
    date = new Date(dateValue);
  }

  if (isNaN(date.getTime())) return dateValue.toString();

  // Normalize language code (รองรับทั้ง 'th'/'en' และ 'ไทย'/'อังกฤษ')
  let normalizedLang = 'en';
  if (language === 'th' || language === 'ไทย') {
    normalizedLang = 'th';
  } else if (language === 'en' || language === 'อังกฤษ' || language === 'English') {
    normalizedLang = 'en';
  }

  // Language-specific month names and formatting
  const monthNames = {
    'th': [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
      "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
      "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ],
    'en': [
      "January", "February", "March", "April",
      "May", "June", "July", "August",
      "September", "October", "November", "December"
    ]
  };

  // Get month names based on normalized language
  const months = monthNames[normalizedLang];

  // Special handling for Thai language (Buddhist Era)
  if (normalizedLang === 'th') {
    const thaiYear = date.getFullYear() + 543;
    return `${date.getDate()} ${months[date.getMonth()]} ${thaiYear}`;
  }

  // Default English format
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// Helper function to replace text in the document
function replaceText(body, searchText, replaceText) {
  if (!searchText || !replaceText) return;

  // Ensure replaceText is a string
  replaceText = String(replaceText || "");

  body.replaceText(searchText, replaceText);
}





function generateTranslationKeysForExistingData(sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);
  const sheet = ss.getSheetByName("แปลสัญญาเช่า"); // ชื่อแผ่นงานที่ต้องการเติมคีย์

  // ตรวจสอบว่ามีข้อมูลในแผ่นงานหรือไม่
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log("ไม่พบข้อมูลในแผ่นงาน");
    return;
  }

  // ดึงข้อมูลทั้งหมดจากแผ่นงาน
  const data = sheet.getDataRange().getValues();

  // เริ่มเติมคีย์จากแถวที่ 2 (แถวแรกเป็นหัวข้อ)
  for (let i = 1; i < data.length; i++) {
    // ตรวจสอบว่าแถวนี้มีข้อมูลในคอลัมน์ใดคอลัมน์หนึ่งหรือไม่
    let hasData = false;
    for (let j = 1; j < data[i].length; j++) {
      if (data[i][j] && data[i][j].toString().trim() !== '') {
        hasData = true;
        break;
      }
    }

    // เติมคีย์เฉพาะแถวที่มีข้อมูล
    if (hasData) {
      const translationKey = `[[TRANSLATION_${i}]]`;
      sheet.getRange(i + 1, 1).setValue(translationKey);
      Logger.log(`เติมคีย์ ${translationKey} ในแถวที่ ${i + 1}`);
    }
  }

  Logger.log("เติมคีย์เสร็จสิ้น");
}




function checkIDCard(idCardValue) {
  try {
    if (!idCardValue || (idCardValue.length !== 13 && idCardValue.length < 6)) {
      return { found: false, message: "เลขบัตรประชาชนไม่ถูกต้อง" };
    }

    // ใช้ ID ของสเปรดชีตที่กำหนด
    const sheetId = "1ysy0Q4vzfpbrbNerkjFQtJcSOqg4hDOVS7faNZCxOa4";
    const sheetName = "data";

    try {
      // เปิดใช้งานสเปรดชีตจาก ID ที่กำหนด
      const ss = SpreadsheetApp.openById(sheetId);
      const sheet = ss.getSheetByName(sheetName);

      if (sheet) {
        // ดึงข้อมูลทั้งหมดจากชีต
        const data = sheet.getDataRange().getValues();
        var fileUrl = '';

        for (var i = 0; i < data.length; i++) {
          if (data[i][1] === idCardValue) {
            var fileId = data[i][4]; // column E contains the file ID
            if (fileId) {
              var file = DriveApp.getFileById(fileId);
              fileUrl = file.getUrl();
            } else {
              fileUrl = 'No File';
            }

            return {
              found: true,
              data: {
                idCard: data[i][1],
                name: data[i][0],
                scamType: data[i][2],
                photoUrl: fileUrl
              }
            };
          }
        }
      }

      // ถ้าไม่พบข้อมูล
      return { found: false };

    } catch (e) {
      Logger.log("Error accessing blacklist database: " + e.toString());
      return { found: false, error: e.toString() };
    }
  } catch (e) {
    Logger.log("Error in checkIDCard: " + e.toString());
    return { found: false, error: e.toString() };
  }
}




// ฟังก์ชันค้นหาข้อมูลใน Blacklist
function searchBlacklist(sheetId, query) {
  try {
    // เปิดไฟล์สเปรดชีตตาม ID ที่กำหนด
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheets()[0]; // เลือกชีตแรก

    // ดึงข้อมูลทั้งหมด
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // ตรวจสอบว่ามีข้อมูลหรือไม่
    if (data.length <= 1) {
      return { success: true, data: [] }; // ไม่มีข้อมูล (มีเฉพาะหัวตาราง)
    }

    // ค้นหาคอลัมน์ "ชื่อ" และ "เลขบัตรประชาชน"
    const nameIndex = headers.indexOf("ชื่อ");
    const idCardIndex = headers.indexOf("เลขบัตรประจำตัวประชาชน");

    if (nameIndex === -1 || idCardIndex === -1) {
      return { success: false, message: "ไม่พบคอลัมน์ 'ชื่อ' หรือ 'เลขบัตรประจำตัวประชาชน'" };
    }

    // แปลง query เป็นพิมพ์เล็กเพื่อการค้นหาแบบไม่คำนึงถึงตัวพิมพ์
    const lowerQuery = query.toString().toLowerCase();

    // ค้นหาข้อมูลที่ตรงกับคำค้นหา
    const results = [];
    for (let i = 1; i < data.length; i++) {
      const name = data[i][nameIndex] ? data[i][nameIndex].toString().toLowerCase() : "";
      const idCard = data[i][idCardIndex] ? data[i][idCardIndex].toString() : "";

      // ตรวจสอบว่าคำค้นหาตรงกับชื่อหรือเลขบัตรประชาชนหรือไม่
      if (name.includes(lowerQuery) || idCard.includes(query)) {
        const item = {};
        for (let j = 0; j < headers.length; j++) {
          item[headers[j]] = data[i][j];
        }
        item.id = i + 1; // เก็บ ID เป็นหมายเลขแถว (เริ่มจาก 1)
        results.push(item);
      }
    }

    return { success: true, data: results };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// ฟังก์ชันเพิ่มรายการใหม่ใน Blacklist
function addBlacklistItem(sheetId, blacklistData) {
  try {
    // เปิดไฟล์สเปรดชีตตาม ID ที่กำหนด
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheets()[0]; // เลือกชีตแรก

    // ตรวจสอบว่ามีหัวตารางหรือไม่
    if (sheet.getLastRow() === 0) {
      // ถ้าไม่มีแถวใดๆ ให้สร้างหัวตาราง (รวมคอลัมน์ "รูป" ด้วย)
      sheet.appendRow(["ชื่อ", "เลขบัตรประจำตัวประชาชน", "รูปแบบการโกง", "ผู้บันทึก", "รูป", "วันที่บันทึก"]);
    }

    // ตรวจสอบว่าเลขบัตรประชาชนซ้ำหรือไม่
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idCardIndex = headers.indexOf("เลขบัตรประจำตัวประชาชน");

    if (idCardIndex !== -1) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][idCardIndex] === blacklistData.เลขบัตรประจำตัวประชาชน) {
          return { success: false, message: "เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว" };
        }
      }
    }

    // แทนที่ username ด้วยชื่อบริษัท (ถ้ามี)
    const reporter = blacklistData.บริษัท || blacklistData.ผู้บันทึก || "";

    // สร้างรายการใหม่ (เพิ่มคอลัมน์ "รูป" เป็นค่าว่าง)
    const newRow = [
      blacklistData.ชื่อ,
      blacklistData.เลขบัตรประจำตัวประชาชน,
      blacklistData.รูปแบบการโกง,
      reporter,
      "", // คอลัมน์ "รูป" เป็นค่าว่าง
      blacklistData.วันที่บันทึก
    ];

    // เพิ่มข้อมูลใหม่ลงในชีต
    sheet.appendRow(newRow);

    // กำหนดให้คอลัมน์ "เลขบัตรประจำตัวประชาชน" เป็น Text
    const lastRow = sheet.getLastRow();
    const idCardCell = sheet.getRange(lastRow, idCardIndex + 1);
    idCardCell.setNumberFormat('@STRING@'); // ตั้งค่าให้เป็นข้อความ (Text)

    return { success: true, message: "เพิ่มรายชื่อ Blacklist สำเร็จ" };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}




function deleteBlacklistItem(sheetId, rowId, currentCompany) {
  try {
    // เปิดไฟล์สเปรดชีตตาม ID ที่กำหนด
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheets()[0]; // เลือกชีตแรก

    // ตรวจสอบว่า rowId อยู่ในช่วงที่ถูกต้องหรือไม่
    if (rowId <= 1 || rowId > sheet.getLastRow()) {
      return { success: false, message: "ไม่พบรายการที่ต้องการลบ" };
    }

    // ดึงข้อมูลทั้งหมด
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // หาดัชนีของคอลัมน์ผู้บันทึก
    const reporterIndex = headers.indexOf("ผู้บันทึก");

    if (reporterIndex === -1) {
      return { success: false, message: "ไม่พบคอลัมน์ผู้บันทึก" };
    }

    // ตรวจสอบชื่อบริษัทผู้บันทึก
    const reporterCompany = data[rowId - 1][reporterIndex];

    // ถ้าชื่อบริษัทไม่ตรงกับบริษัทปัจจุบัน
    if (reporterCompany !== currentCompany) {
      return {
        success: false,
        message: "ไม่สามารถลบรายชื่อนี้ได้ ต้องเป็นร้านที่บันทึกเท่านั้น"
      };
    }

    // ลบแถวตาม rowId
    sheet.deleteRow(rowId);

    return { success: true, message: "ลบรายชื่อ Blacklist สำเร็จ" };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}



function uploadQRCodeImage(base64Data, fileName, folderId, sheetID) {
  try {
    // ตรวจสอบว่ามี folder ID หรือไม่
    if (!folderId) {
      // ถ้าไม่มี folder ID ให้สร้างโฟลเดอร์ใหม่
      const folder = DriveApp.createFolder("QR_Code_Images");
      folderId = folder.getId();

      // บันทึก folder ID ลงในการตั้งค่า
      const ss = SpreadsheetApp.openById(sheetID);
      const configSheet = ss.getSheetByName(CONFIG_SHEET);

      // ตรวจสอบว่ามี key "IDโฟลเดอร์หลัก" หรือไม่
      const configData = configSheet.getDataRange().getValues();
      let keyExists = false;
      let keyRow = -1;

      for (let i = 1; i < configData.length; i++) {
        if (configData[i][0] === "IDโฟลเดอร์หลัก") {
          keyExists = true;
          keyRow = i + 1; // +1 เพราะ index เริ่มจาก 0 แต่แถวเริ่มจาก 1
          break;
        }
      }

      if (keyExists) {
        // อัปเดตค่าที่มีอยู่แล้ว
        configSheet.getRange(keyRow, 2).setValue(folderId);
      } else {
        // เพิ่มค่าใหม่
        configSheet.appendRow(["IDโฟลเดอร์หลัก", folderId]);
      }
    }

    // ดึงนามสกุลไฟล์จากชื่อไฟล์เดิม
    let fileExtension = "";
    if (fileName && fileName.includes('.')) {
      fileExtension = fileName.substring(fileName.lastIndexOf('.'));
    } else {
      // ถ้าไม่มีนามสกุลให้ใช้ .png เป็นค่าเริ่มต้น
      fileExtension = ".png";
    }

    // กำหนดชื่อไฟล์ใหม่เป็น "QRCode" ตามด้วยนามสกุลไฟล์
    const newFileName = "QRCode" + fileExtension;

    // แปลง base64 เป็น Blob
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), MimeType.PNG, newFileName);

    // อัปโหลดไฟล์เข้า Google Drive
    const folder = DriveApp.getFolderById(folderId);

    // ตรวจสอบว่ามีไฟล์ QRCode อยู่แล้วหรือไม่
    const existingFiles = folder.getFilesByName(newFileName);
    if (existingFiles.hasNext()) {
      // ถ้ามีไฟล์อยู่แล้ว ให้ลบไฟล์เก่าก่อน
      while (existingFiles.hasNext()) {
        existingFiles.next().setTrashed(true);
      }
    }

    // สร้างไฟล์ใหม่
    const file = folder.createFile(blob);

    // ตั้งค่าสิทธิ์การเข้าถึง (ให้ทุกคนที่มีลิงก์สามารถดูได้)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // ใช้ URL ของไฟล์ดั้งเดิมสำหรับการเปิดดู
    const fileUrl = file.getUrl();

    // ส่งคืน URL ของไฟล์และข้อมูลอื่นๆ
    return {
      success: true,
      fileUrl: fileUrl,
      fileId: file.getId()
    };
  } catch (e) {
    Logger.log("Error uploading QR code image: " + e.toString());
    return { success: false, message: e.toString() };
  }
}






// ฟังก์ชันลบไฟล์จาก Google Drive
function deleteFile(fileId) {
  try {
    // ตรวจสอบว่ามี fileId หรือไม่
    if (!fileId) {
      return { success: false, message: "ไม่พบ File ID" };
    }

    // ลบไฟล์
    const file = DriveApp.getFileById(fileId);
    file.setTrashed(true);

    return { success: true, message: "ลบไฟล์สำเร็จ" };
  } catch (e) {
    Logger.log("Error deleting file: " + e.toString());
    return { success: false, message: e.toString() };
  }
}


function formatTimeOnly(value) {
  if (!(value instanceof Date)) return value;

  const hours = value.getHours().toString().padStart(2, '0');
  const minutes = value.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}



function getbookingData(selectedMonth, selectedYear, sheetID) {
  Logger.log("Starting getbookingData with:", { selectedMonth, selectedYear });

  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(RENTAL_SHEET);

    if (!sheet) {
      Logger.error(`ไม่พบชีท "${RENTAL_SHEET}"`);
      return {};
    }

    const dataRange = sheet.getDataRange();
    const dataValues = dataRange.getValues();
    const headers = dataValues[0];

    // หา index ของคอลัมน์ที่ต้องการ
    const carNameIndex = headers.indexOf("รถ");
    const startDateIndex = headers.indexOf("วันที่เช่า");
    const endDateIndex = headers.indexOf("วันที่คืน");
    const startTimeIndex = headers.indexOf("เวลารับรถ");
    const endTimeIndex = headers.indexOf("เวลาคืนรถ");
    const bookingNoIndex = headers.indexOf("หมายเลขการจอง");
    const customerNameIndex = headers.indexOf("ชื่อลูกค้า");
    const customerPhoneIndex = headers.indexOf("เบอร์โทรศัพท์");
    const pickupLocationIndex = headers.indexOf("สถานที่รับรถ");
    const returnLocationIndex = headers.indexOf("สถานที่คืนรถ");
    const dailyRateIndex = headers.indexOf("ราคา");
    const totalRentIndex = headers.indexOf("ค่าเช่ารวมทั้งหมด");
    const depositIndex = headers.indexOf("เงินประกันความเสียหาย");
    const bookingDepositIndex = headers.indexOf("ค่ามัดจำคิวรถ");
    const pdfLinkIndex = headers.indexOf("ลิงก์สัญญาเช่า");

    // ตรวจสอบว่ามีคอลัมน์จำเป็นหรือไม่
    if (carNameIndex === -1 || startDateIndex === -1 || endDateIndex === -1 || bookingNoIndex === -1) {
      Logger.error("ไม่พบคอลัมน์ที่จำเป็น:", {
        carNameIndex, startDateIndex, endDateIndex, bookingNoIndex
      });
      return {};
    }

    // แปลงเป็นตัวเลข
    const currentMonth = parseInt(selectedMonth);
    const currentYear = parseInt(selectedYear);

    // ตรวจสอบความถูกต้องของเดือนและปี
    if (isNaN(currentMonth) || isNaN(currentYear) ||
      currentMonth < 1 || currentMonth > 12) {
      Logger.error("เดือนหรือปีไม่ถูกต้อง:", { currentMonth, currentYear });
      return {};
    }

    // โครงสร้างข้อมูลใหม่: รถ -> หมายเลขการจอง -> ข้อมูลวันที่และการจอง
    let bookingsByReference = {};

    for (let row = 1; row < dataValues.length; row++) {
      const rowData = dataValues[row];

      // ข้ามแถวที่ไม่มีข้อมูลสำคัญ
      if (!rowData[carNameIndex] || !rowData[startDateIndex] || !rowData[endDateIndex] || !rowData[bookingNoIndex]) {
        continue;
      }

      const carName = rowData[carNameIndex];
      const startDate = rowData[startDateIndex];
      const endDate = rowData[endDateIndex];
      const bookingNo = rowData[bookingNoIndex];

      // ข้ามรายการที่วันที่ไม่ถูกต้อง
      if (!(startDate instanceof Date) || !(endDate instanceof Date) ||
        isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        continue;
      }

      // ถ้ายังไม่มี entry สำหรับรถคันนี้ ให้สร้างใหม่
      if (!bookingsByReference[carName]) {
        bookingsByReference[carName] = {};
      }

      // แปลงค่าเวลาเป็นรูปแบบ HH:MM
      let startTime = '00:00';
      let endTime = '00:00';

      if (startTimeIndex !== -1 && rowData[startTimeIndex]) {
        startTime = formatTimeOnly(rowData[startTimeIndex]);
      }

      if (endTimeIndex !== -1 && rowData[endTimeIndex]) {
        endTime = formatTimeOnly(rowData[endTimeIndex]);
      }

      // สร้าง object สำหรับเก็บข้อมูลการจอง
      const bookingInfo = {
        bookingNo: bookingNo || '',
        customerName: rowData[customerNameIndex] || '',
        customerPhone: rowData[customerPhoneIndex] || '',
        startDate: Utilities.formatDate(startDate, "GMT+7", "dd/MM/yyyy"),
        startTime: startTime,
        pickupLocation: rowData[pickupLocationIndex] || '',
        endDate: Utilities.formatDate(endDate, "GMT+7", "dd/MM/yyyy"),
        endTime: endTime,
        returnLocation: rowData[returnLocationIndex] || '',
        dailyRate: rowData[dailyRateIndex] || 0,
        totalRent: rowData[totalRentIndex] || rowData[dailyRateIndex] || 0,
        deposit: rowData[depositIndex] || 0,
        bookingDeposit: rowData[bookingDepositIndex] || 0,
        days: [], // จะเก็บวันที่การจองครอบคลุม
        startDay: startDate.getDate(),
        endDay: endDate.getDate(),
        consecutive: true
      };

      // หา PDF ID จาก URL (ถ้ามี)
      if (pdfLinkIndex !== -1 && rowData[pdfLinkIndex]) {
        const pdfUrl = rowData[pdfLinkIndex];
        const pdfIdMatch = pdfUrl.match(/\/d\/([^\/]+)/);
        if (pdfIdMatch && pdfIdMatch[1]) {
          bookingInfo.pdfId = pdfIdMatch[1];
        }
      }

      // วนลูปเพื่อเก็บวันที่ที่การจองครอบคลุมในเดือนนี้
      let currentDate = new Date(startDate);
      let isFirstDay = true;

      while (currentDate <= endDate) {
        if (currentDate.getMonth() + 1 === currentMonth &&
          currentDate.getFullYear() === currentYear) {
          const day = currentDate.getDate();

          // เพิ่มวันนี้เข้าไปในรายการวันที่การจองครอบคลุม
          bookingInfo.days.push({
            day: day,
            isFirstDay: isFirstDay,
            isLastDay: currentDate.getTime() === endDate.getTime()
          });
        }

        // ไม่ใช่วันแรกแล้วสำหรับวันถัดไป
        isFirstDay = false;

        // เพิ่มวันขึ้นทีละ 1 วัน
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // ถ้ามีวันที่อยู่ในเดือนที่เลือก (bookingInfo.days ไม่ว่าง)
      if (bookingInfo.days.length > 0) {
        // สร้างหรือเพิ่มข้อมูลในหมายเลขการจองนี้
        if (!bookingsByReference[carName][bookingNo]) {
          bookingsByReference[carName][bookingNo] = bookingInfo;
        } else {
          // กรณีมีการจองเดียวกันหลายครั้ง (ไม่น่าจะเกิดขึ้น แต่รองรับไว้)
          console.log("พบการจองซ้ำ:", bookingNo);
        }
      }
    }

    Logger.log("Successfully processed booking data");
    return bookingsByReference;
  } catch (error) {
    Logger.error("Error in getbookingData:", error);
    return {};
  }
}



function uploadLogoImage(base64Data, fileName, folderId, sheetID) {
  try {
    // ตรวจสอบว่ามี folder ID หรือไม่
    if (!folderId) {
      // ถ้าไม่มี folder ID ให้สร้างโฟลเดอร์ใหม่
      const folder = DriveApp.createFolder("Shop_Assets");
      folderId = folder.getId();

      // บันทึก folder ID ลงในการตั้งค่า
      const ss = SpreadsheetApp.openById(sheetID);
      const configSheet = ss.getSheetByName(CONFIG_SHEET);

      // ตรวจสอบว่ามี key "IDโฟลเดอร์หลัก" หรือไม่
      const configData = configSheet.getDataRange().getValues();
      let keyExists = false;
      let keyRow = -1;

      for (let i = 1; i < configData.length; i++) {
        if (configData[i][0] === "IDโฟลเดอร์หลัก") {
          keyExists = true;
          keyRow = i + 1; // +1 เพราะ index เริ่มจาก 0 แต่แถวเริ่มจาก 1
          break;
        }
      }

      if (keyExists) {
        // อัปเดตค่าที่มีอยู่แล้ว
        configSheet.getRange(keyRow, 2).setValue(folderId);
      } else {
        // เพิ่มค่าใหม่
        configSheet.appendRow(["IDโฟลเดอร์หลัก", folderId]);
      }
    }

    // ดึงนามสกุลไฟล์จากชื่อไฟล์เดิม
    let fileExtension = "";
    if (fileName && fileName.includes('.')) {
      fileExtension = fileName.substring(fileName.lastIndexOf('.'));
    } else {
      // ถ้าไม่มีนามสกุลให้ใช้ .png เป็นค่าเริ่มต้น
      fileExtension = ".png";
    }

    // กำหนดชื่อไฟล์ใหม่เป็น "ShopLogo" ตามด้วยนามสกุลไฟล์
    const newFileName = "ShopLogo" + fileExtension;

    // แปลง base64 เป็น Blob
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), MimeType.PNG, newFileName);

    // อัปโหลดไฟล์เข้า Google Drive
    const folder = DriveApp.getFolderById(folderId);

    // ตรวจสอบว่ามีไฟล์โลโก้อยู่แล้วหรือไม่
    const existingFiles = folder.getFilesByName(newFileName);
    if (existingFiles.hasNext()) {
      // ถ้ามีไฟล์อยู่แล้ว ให้ลบไฟล์เก่าก่อน
      while (existingFiles.hasNext()) {
        existingFiles.next().setTrashed(true);
      }
    }

    // สร้างไฟล์ใหม่
    const file = folder.createFile(blob);

    // ตั้งค่าสิทธิ์การเข้าถึง (ให้ทุกคนที่มีลิงก์สามารถดูได้)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // ใช้ URL ของไฟล์ดั้งเดิมสำหรับการเปิดดู
    const fileUrl = file.getUrl();

    // ส่งคืน URL ของไฟล์และข้อมูลอื่นๆ
    return {
      success: true,
      fileUrl: fileUrl,
      fileId: file.getId()
    };
  } catch (e) {
    Logger.log("Error uploading logo image: " + e.toString());
    return { success: false, message: e.toString() };
  }
}


/**
 * ฟังก์ชันสำหรับโหลดข้อมูลคำแปล
 */
function getTranslations(sheetID) {
  try {
    // เปิดชีต "แปลสรุปสัญญาเช่า"
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName("แปลสรุปสัญญาเช่า");

    if (!sheet) {
      return { success: false, message: "ไม่พบชีต 'แปลสรุปสัญญาเช่า'" };
    }

    // อ่านข้อมูลทั้งหมด
    const data = sheet.getDataRange().getValues();

    // หัวคอลัมน์ (ภาษาต่างๆ)
    const headers = data[0];

    // สร้าง object สำหรับเก็บคำแปล
    const translations = {};

    // วนลูปอ่านข้อมูลแต่ละแถว (เริ่มจากแถวที่ 1 เพราะแถว 0 เป็นหัว)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const key = row[0]; // คอลัมน์แรกเป็น key

      if (!key) continue; // ข้ามแถวที่ไม่มี key

      translations[key] = {};

      // วนลูปเก็บค่าแต่ละภาษา
      for (let j = 1; j < headers.length; j++) {
        const lang = headers[j];
        if (lang) {
          translations[key][lang] = row[j] || "";
        }
      }
    }

    return { success: true, data: translations };
  } catch (error) {
    return { success: false, message: "เกิดข้อผิดพลาดในการโหลดข้อมูลคำแปล: " + error.toString() };
  }
}



// รหัสสำหรับสร้างไฟล์ Excel คำแปลใน Google Apps Script

function createTranslationSheet(sheetID) {
  // เปิด Spreadsheet ปัจจุบัน
  const ss = SpreadsheetApp.openById(sheetID);

  // ตรวจสอบว่ามีชีต "แปลสรุปสัญญาเช่า" อยู่แล้วหรือไม่
  let sheet = ss.getSheetByName("แปลสรุปสัญญาเช่า");

  // ถ้ามีชีตอยู่แล้ว ให้ลบออกเพื่อสร้างใหม่
  if (sheet) {
    ss.deleteSheet(sheet);
  }

  // สร้างชีตใหม่
  sheet = ss.insertSheet("แปลสรุปสัญญาเช่า");

  // คำแปลทั้งหมด
  const translations = [
    ["key", "th", "en", "zh", "zh-TW", "ko", "ru", "ms", "ja", "he", "fr", "tr", "es", "it", "lo", "my", "vi", "de", "id"],
    ["rental_summary_title", "ใบยืนยันการจองรถเช่า", "Car Rental Confirmation", "租车确认", "租車確認", "렌터카 확인", "Подтверждение аренды автомобиля", "Pengesahan Sewaan Kereta", "レンタカー確認", "אישור השכרת רכב", "Confirmation de location de voiture", "Araba Kiralama Onayı", "Confirmación de alquiler de coche", "Conferma di noleggio auto", "ໃບຢືນຢັນການເຊົ່າລົດ", "ကားငှားရမ်းမှု အတည်ပြုချက်", "Xác nhận thuê xe", "Mietwagenbestätigung", "Konfirmasi Sewa Mobil"],
    ["booking_number", "หมายเลขการจอง:", "Booking No.:", "预订号：", "預訂號：", "예약 번호：", "Номер бронирования：", "No. Tempahan:", "予約番号：", "מספר הזמנה:", "Numéro de réservation :", "Rezervasyon No:", "Número de reserva:", "Numero di prenotazione:", "ເລກການຈອງ:", "ဘွတ်ကင်နံပါတ်:", "Số đặt trước:", "Buchungsnummer:", "Nomor Pemesanan:"],
    ["document_date", "วันที่ออกเอกสาร:", "Document Date:", "文件日期：", "文件日期：", "문서 날짜：", "Дата документа：", "Tarikh Dokumen:", "書類日付：", "תאריך מסמך:", "Date du document :", "Belge Tarihi:", "Fecha del documento:", "Data del documento:", "ວັນທີເອກະສານ:", "စာရွက်စာတမ်း ရက်စွဲ:", "Ngày tạo tài liệu:", "Dokumentdatum:", "Tanggal Dokumen:"],
    ["customer_info", "ข้อมูลลูกค้า", "Customer Information", "客户信息", "客戶信息", "고객 정보", "Информация о клиенте", "Maklumat Pelanggan", "お客様情報", "פרטי לקוח", "Informations client", "Müşteri Bilgisi", "Información del cliente", "Informazioni cliente", "ຂໍ້ມູນລູກຄ້າ", "ဖောက်သည် အချက်အလက်", "Thông tin khách hàng", "Kundeninformationen", "Informasi Pelanggan"],
    ["customer_name", "ชื่อ:", "Name:", "姓名：", "姓名：", "이름：", "Имя：", "Nama:", "名前：", "שם:", "Nom :", "İsim:", "Nombre:", "Nome:", "ຊື່:", "အမည်:", "Tên:", "Name:", "Nama:"],
    ["phone_number", "เบอร์โทรศัพท์:", "Phone Number:", "电话号码：", "電話號碼：", "전화번호：", "Номер телефона：", "Nombor Telefon:", "電話番号：", "מספר טלפון:", "Numéro de téléphone :", "Telefon Numarası:", "Número de teléfono:", "Numero di telefono:", "ເບີໂທລະສັບ:", "ဖုန်းနံပါတ်:", "Số điện thoại:", "Telefonnummer:", "Nomor Telepon:"],
    ["car_info", "ข้อมูลรถ", "Car Information", "车辆信息", "車輛信息", "차량 정보", "Информация об автомобиле", "Maklumat Kereta", "車両情報", "פרטי הרכב", "Informations sur le véhicule", "Araba Bilgisi", "Información del coche", "Informazioni sul veicolo", "ຂໍ້ມູນລົດ", "ကား အချက်အလက်", "Thông tin xe", "Fahrzeuginformationen", "Informasi Mobil"],
    ["car_model", "รถ:", "Car Model:", "车型：", "車型：", "차량 모델：", "Модель автомобиля：", "Model Kereta:", "車種：", "דגם רכב:", "Modèle de voiture :", "Araba Modeli:", "Modelo de coche:", "Modello dell'auto:", "ລຸ້ນລົດ:", "ကားမော်ဒယ်:", "Kiểu xe:", "Automodell:", "Model Mobil:"],
    ["license_plate", "ทะเบียนรถ:", "License Plate:", "车牌号：", "車牌號：", "번호판：", "Номерной знак：", "Nombor Plat:", "ナンバープレート：", "מספר רישוי:", "Plaque d'immatriculation :", "Plaka:", "Matrícula:", "Targa:", "ປ້າຍທະບຽນລົດ:", "လိုင်စင်ပြား:", "Biển số xe:", "Kennzeichen:", "Plat Nomor:"],
    ["rental_period", "ระยะเวลาเช่า", "Rental Period", "租期", "租期", "렌탈 기간", "Срок аренды", "Tempoh Sewaan", "レンタル期間", "תקופת שכירות", "Période de location", "Kiralama Süresi", "Período de alquiler", "Periodo di noleggio", "ໄລຍະເວລາເຊົ່າ", "ငှားရမ်းသည့်ကာလ", "Thời gian thuê", "Mietdauer", "Periode Sewa"],
    ["pickup_date", "วันที่รับรถ:", "Pickup Date:", "取车日期：", "取車日期：", "픽업 날짜：", "Дата получения：", "Tarikh Ambil:", "受取日：", "תאריך איסוף:", "Date de prise en charge :", "Alış Tarihi:", "Fecha de recogida:", "Data di ritiro:", "ວັນທີຮັບລົດ:", "ကားယူမည့်ရက်:", "Ngày nhận xe:", "Abholdatum:", "Tanggal Pengambilan:"],
    ["return_date", "วันที่คืนรถ:", "Return Date:", "还车日期：", "還車日期：", "반납 날짜：", "Дата возврата：", "Tarikh Pemulangan:", "返却日：", "תאריך החזרה:", "Date de retour :", "İade Tarihi:", "Fecha de devolución:", "Data di restituzione:", "ວັນທີສົ່ງລົດ:", "ကားပြန်အပ်မည့်ရက်:", "Ngày trả xe:", "Rückgabedatum:", "Tanggal Pengembalian:"],
    ["time", "เวลา:", "Time:", "时间：", "時間：", "시간：", "Время：", "Masa:", "時間：", "שעה:", "Heure :", "Saat:", "Hora:", "Ora:", "ເວລາ:", "အချိန်:", "Thời gian:", "Uhrzeit:", "Waktu:"],
    ["rental_days", "จำนวนวัน:", "Rental Days:", "租期天数：", "租期天數：", "대여 일수：", "Дней аренды：", "Hari Sewaan:", "レンタル日数：", "ימי שכירות:", "Jours de location :", "Kiralama Günleri:", "Días de alquiler:", "Giorni di noleggio:", "ຈຳນວນມື້:", "ငှားရမ်းရက်အရေအတွက်:", "Số ngày thuê:", "Miettage:", "Hari Sewa:"],
    ["days", "วัน", "days", "天", "天", "일", "дней", "hari", "日", "ימים", "jours", "gün", "días", "giorni", "ມື້", "ရက်", "ngày", "Tage", "hari"],
    ["hours", "ชั่วโมง", "hours", "小时", "小時", "시간", "часов", "jam", "時間", "שעות", "heures", "saat", "horas", "ore", "ຊົ່ວໂມງ", "နာရီ", "giờ", "Stunden", "jam"],
    ["pickup_location", "สถานที่รับรถ:", "Pickup Location:", "取车地点：", "取車地點：", "픽업 위치：", "Место получения：", "Lokasi Ambil:", "受取場所：", "מיקום איסוף:", "Lieu de prise en charge :", "Alış Yeri:", "Lugar de recogida:", "Luogo di ritiro:", "ສະຖານທີ່ຮັບລົດ:", "ကားယူရမည့်နေရာ:", "Địa điểm nhận xe:", "Abholort:", "Lokasi Pengambilan:"],
    ["return_location", "สถานที่คืนรถ:", "Return Location:", "还车地点：", "還車地點：", "반납 위치：", "Место возврата：", "Lokasi Pemulangan:", "返却場所：", "מיקום החזרה:", "Lieu de retour :", "İade Yeri:", "Lugar de devolución:", "Luogo di restituzione:", "ສະຖານທີ່ສົ່ງລົດ:", "ကားပြန်အပ်ရမည့်နေရာ:", "Địa điểm trả xe:", "Rückgabeort:", "Lokasi Pengembalian:"],
    ["payment_info", "ข้อมูลการชำระเงิน", "Payment Information", "付款信息", "付款信息", "결제 정보", "Информация об оплате", "Maklumat Pembayaran", "支払い情報", "פרטי תשלום", "Informations de paiement", "Ödeme Bilgisi", "Información de pago", "Informazioni di pagamento", "ຂໍ້ມູນການຈ່າຍເງິນ", "ငွေပေးချေမှု အချက်အလက်", "Thông tin thanh toán", "Zahlungsinformationen", "Informasi Pembayaran"],
    ["daily_rate", "ค่าเช่าต่อวัน:", "Daily Rate:", "日租金：", "日租金：", "일일 요금：", "Дневная ставка：", "Kadar Harian:", "1日のレンタル料：", "תעריף יומי:", "Tarif journalier :", "Günlük Ücret:", "Tarifa diaria:", "Tariffa giornaliera:", "ລາຄາຕໍ່ມື້:", "နေ့စဉ်နှုန်း:", "Giá thuê mỗi ngày:", "Tagestarif:", "Tarif Harian:"],
    ["total_rental", "ค่าเช่ารวมทั้งหมด:", "Total Rental:", "租金总额：", "租金總額：", "총 렌탈 비용：", "Общая стоимость аренды：", "Jumlah Sewaan:", "総レンタル料：", "סך השכירות:", "Total de la location :", "Toplam Kiralama:", "Alquiler total:", "Noleggio totale:", "ລາຄາເຊົ່າທັງໝົດ:", "စုစုပေါင်းငှားရမ်းခ:", "Tổng tiền thuê:", "Gesamtmiete:", "Total Sewa:"],
    ["booking_deposit", "ค่ามัดจำคิวรถ:", "Booking Deposit:", "预订押金：", "預訂押金：", "예약 보증금：", "Депозит за бронирование：", "Deposit Tempahan:", "予約デポジット：", "מקדמת הזמנה:", "Acompte de réservation :", "Rezervasyon Depozitosu:", "Depósito de reserva:", "Deposito di prenotazione:", "ເງິນມັດຈຳ:", "ကြိုတင်ငွေ:", "Tiền đặt cọc:", "Buchungskaution:", "Deposit Pemesanan:"],
    ["security_deposit", "เงินประกันความเสียหาย:", "Security Deposit:", "安全押金：", "安全押金：", "보증금：", "Залог：", "Deposit Keselamatan:", "保証金：", "פיקדון ביטחון:", "Caution :", "Güvenlik Depozitosu:", "Depósito de seguridad:", "Deposito cauzionale:", "ເງິນຄ້ຳປະກັນ:", "အာမခံငွေ:", "Tiền đặt cọc bảo đảm:", "Kaution:", "Deposit Keamanan:"],
    ["additional_service", "ค่าบริการเพิ่มเติม:", "Additional Service:", "额外服务费：", "額外服務費：", "추가 서비스：", "Дополнительные услуги：", "Perkhidmatan Tambahan:", "追加サービス料：", "שירות נוסף:", "Service supplémentaire :", "Ek Hizmet:", "Servicio adicional:", "Servizio aggiuntivo:", "ຄ່າບໍລິການເພີ່ມເຕີມ:", "အပိုဝန်ဆောင်မှု:", "Dịch vụ bổ sung:", "Zusatzleistung:", "Layanan Tambahan:"],
    ["total_amount", "รวมยอดชำระวันรับรถ:", "Total Amount Due on Pickup:", "取车时应付总额：", "取車時應付總額：", "픽업 시 총 결제 금액：", "Общая сумма при получении：", "Jumlah Bayaran Semasa Ambil:", "受取時支払い総額：", "סכום כולל לתשלום באיסוף:", "Montant total à payer à la prise en charge :", "Alışta Ödenecek Toplam Tutar:", "Importe total a pagar en la recogida:", "Importo totale dovuto al ritiro:", "ຍອດຊຳລະວັນຮັບລົດ:", "ကားယူချိန်တွင်ပေးချေရမည့်စုစုပေါင်း:", "Tổng số tiền phải trả khi nhận xe:", "Gesamtbetrag bei Abholung:", "Total Pembayaran Saat Pengambilan:"],
    ["payment_method", "ช่องทางการชำระเงิน", "Payment Method", "付款方式", "付款方式", "결제 방법", "Способ оплаты", "Kaedah Pembayaran", "支払い方法", "אמצעי תשלום", "Méthode de paiement", "Ödeme Yöntemi", "Método de pago", "Metodo di pagamento", "ວິທີການຊຳລະເງິນ", "ငွေပေးချေနည်း", "Phương thức thanh toán", "Zahlungsmethode", "Metode Pembayaran"],
    ["bank_name", "ธนาคาร:", "Bank:", "银行：", "銀行：", "은행：", "Банк：", "Bank:", "銀行：", "בנק:", "Banque :", "Banka:", "Banco:", "Banca:", "ທະນາຄານ:", "ဘဏ်:", "Ngân hàng:", "Bank:", "Bank:"],
    ["account_number", "เลขที่บัญชี:", "Account Number:", "账号：", "賬號：", "계좌번호：", "Номер счета：", "Nombor Akaun:", "口座番号：", "מספר חשבון:", "Numéro de compte :", "Hesap Numarası:", "Número de cuenta:", "Numero di conto:", "ເລກບັນຊີ:", "အကောင့်နံပါတ်:", "Số tài khoản:", "Kontonummer:", "Nomor Rekening:"],
    ["account_name", "ชื่อบัญชี:", "Account Name:", "账户名：", "賬戶名：", "계좌명：", "Имя владельца счета：", "Nama Akaun:", "口座名義：", "שם חשבון:", "Nom du compte :", "Hesap Adı:", "Nombre de la cuenta:", "Nome del conto:", "ຊື່ບັນຊີ:", "အကောင့်အမည်:", "Tên tài khoản:", "Kontoinhaber:", "Nama Pemilik Rekening:"],
    ["rental_contract", "สัญญาเช่า:", "Rental Contract:", "租赁合同：", "租賃合同：", "렌탈 계약서：", "Договор аренды：", "Kontrak Sewaan:", "レンタล契約書：", "חוזה שכירות:", "Contrat de location :", "Kiralama Sözleşmesi:", "Contrato de alquiler:", "Contratto di noleggio:", "ສັນຍາເຊົ່າ:", "ငှားရမ်းမှုစာချုပ်:", "Hợp đồng thuê:", "Mietvertrag:", "Kontrak Sewa:"],
    ["issued_by", "ออกโดย:", "Issued By:", "签发人：", "簽發人：", "발행자：", "Выдано：", "Dikeluarkan Oleh:", "発行者：", "הונפק על ידי:", "Émis par :", "Düzenleyen:", "Emitido por:", "Emesso da:", "ອອກໂດຍ:", "ထုတ်ပြန်သူ:", "Cấp bởi:", "Ausgestellt von:", "Dikeluarkan Oleh:"],

    // 5 keys ใหม่
    ["overtime_hours", "ชั่วโมงล่วงเวลา:", "Overtime Hours:", "超时小时：", "超時小時：", "초과 시간：", "Часы сверхурочно：", "Jam Lebih Masa:", "超過時間：", "שעות נוספות:", "Heures supplémentaires :", "Fazla Mesai Saatleri:", "Horas extra:", "Ore supplementari:", "ຊົ່ວໂມງເກີນ:", "ထပ်ဆောင်းအချိန်:", "Giờ vượt quá:", "Überstunden:", "Jam Lembur:"],
    ["overtime_fee", "ค่าล่วงเวลา:", "Overtime Fee:", "超时费：", "超時費：", "초과 요금：", "Плата за сверхурочные：", "Bayaran Lebih Masa:", "超過料金：", "דמי שעות נוספות:", "Frais d'heures supplémentaires :", "Fazla Mesai Ücreti:", "Tarifa de horas extra:", "Tariffa ore supplementari:", "ຄ່າເກີນເວລາ:", "အချိန်ပိုခ:", "Phí vượt giờ:", "Überstundengebühr:", "Biaya Lembur:"],
    ["car_seat_fee", "ค่าบริการคาร์ซีท:", "Car Seat Fee:", "儿童座椅费：", "兒童座椅費：", "카시트 요금：", "Плата за детское кресло：", "Bayaran Kerusi Kereta:", "チャイルドシート料金：", "דמי מושב בטיחות:", "Frais de siège auto :", "Çocuk Koltuğu Ücreti:", "Tarifa de silla de coche:", "Tariffa seggiolino auto:", "ຄ່າບໍລິການທີ່ນັ່ງເດັກ:", "ကလေးထိုင်ခုံခ:", "Phí ghế trẻ em:", "Kindersitzgebühr:", "Biaya Kursi Mobil Anak:"],
    ["additional_insurance_fee", "ค่าประกันเสริม:", "Additional Insurance Fee:", "额外保险费：", "額外保險費：", "추가 보험료：", "Дополнительная страховка：", "Bayaran Insurans Tambahan:", "追加保険料：", "דמי ביטוח נוסף:", "Frais d'assurance supplémentaire :", "Ek Sigorta Ücreti:", "Tarifa de seguro adicional:", "Tariffa assicurazione aggiuntiva:", "ຄ່າປະກັນເພີ່ມເຕີມ:", "အပိုအာမခံကြေး:", "Phí bảo hiểm bổ sung:", "Zusätzliche Versicherungsgebühr:", "Biaya Asuransi Tambahan:"],
    ["insurance_days", "จำนวนวันประกันเสริม:", "Insurance Days:", "保险天数：", "保險天數：", "보험 일수：", "Дней страхования：", "Hari Insurans:", "保険日数：", "ימי ביטוח:", "Jours d'assurance :", "Sigorta Günleri:", "Días de seguro:", "Giorni di assicurazione:", "ຈຳນວນມື້ປະກັນ:", "အာမခံရက်အရေအတွက်:", "Số ngày bảo hiểm:", "Versicherungstage:", "Hari Asuransi:"]
  ];

  // เพิ่ม [[]] ให้กับ key name (ยกเว้น row แรกที่เป็น header)
  for (let i = 1; i < translations.length; i++) {
    translations[i][0] = "[[" + translations[i][0] + "]]";
  }

  // เขียนข้อมูลลงในชีต
  sheet.getRange(1, 1, translations.length, translations[0].length).setValues(translations);

  // จัดรูปแบบหัวข้อ
  const headerRange = sheet.getRange(1, 1, 1, translations[0].length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#4285f4");
  headerRange.setFontColor("#ffffff");

  // จัดรูปแบบคอลัมน์ key
  const keyColumn = sheet.getRange(1, 1, translations.length, 1);
  keyColumn.setFontWeight("bold");
  keyColumn.setBackground("#e6e6e6");

  // ปรับความกว้างคอลัมน์อัตโนมัติ
  for (let i = 1; i <= translations[0].length; i++) {
    sheet.autoResizeColumn(i);
  }

  // เพิ่มการตรึงแถวแรก
  sheet.setFrozenRows(1);

  // เพิ่มการตรึงคอลัมน์แรก
  sheet.setFrozenColumns(1);

  // สร้างตัวกรอง
  headerRange.createFilter();

  Logger.log("สร้างชีต 'แปลสรุปสัญญาเช่า' เรียบร้อยแล้ว");

  // เลือกเซลล์ A1
  sheet.getRange("A1").activate();

  return "สร้างชีต 'แปลสรุปสัญญาเช่า' เรียบร้อยแล้ว";
}

/**
 * ซิงค์คีย์คำแปลสรุปสัญญาเช่า (Smart Merge)
 * ตรวจสอบและเพิ่มเฉพาะคีย์ที่ขาดหายไป โดยไม่ลบข้อมูลเดิม
 * @param {string} sheetID - ID ของ Spreadsheet
 * @returns {Object} ผลลัพธ์การซิงค์
 */
function syncSummaryTranslationKeys(sheetID) {
  try {
    Logger.log("เริ่มฟังก์ชัน syncSummaryTranslationKeys");

    const ss = SpreadsheetApp.openById(sheetID);
    let sheet = ss.getSheetByName(SUMMARY_TRANSLATION_SHEET);

    // ถ้าไม่มีชีต ให้สร้างใหม่เลย
    if (!sheet) {
      Logger.log("ไม่พบชีต - สร้างใหม่");
      createTranslationSheet(sheetID);
      return {
        success: true,
        message: "สร้างชีตใหม่พร้อม 47 keys",
        addedCount: 47,
        isNewSheet: true
      };
    }

    // อ่าน keys ที่มีอยู่
    const data = sheet.getDataRange().getValues();
    let existingKeys = data.slice(1).map(row => row[0]).filter(key => key);
    Logger.log("พบ " + existingKeys.length + " keys ในชีต");

    // ลบ keys ที่ไม่มี [[]] ออก (keys ผิดรูปแบบจากการ sync ครั้งก่อน)
    const invalidKeys = [];
    for (let i = 1; i < data.length; i++) {
      const key = data[i][0];
      if (key && !key.startsWith("[[") && !key.startsWith("key")) {
        invalidKeys.push(i);
      }
    }

    if (invalidKeys.length > 0) {
      Logger.log("พบ keys ที่ไม่มี [[]]: " + invalidKeys.length + " รายการ - กำลังลบออก");
      // ลบจากล่างขึ้นบนเพื่อไม่ให้ index เปลี่ยน
      for (let i = invalidKeys.length - 1; i >= 0; i--) {
        sheet.deleteRow(invalidKeys[i] + 1); // +1 เพราะ sheet index เริ่มที่ 1
      }
      // อ่าน keys ใหม่อีกครั้ง
      const newData = sheet.getDataRange().getValues();
      existingKeys = newData.slice(1).map(row => row[0]).filter(key => key);
      Logger.log("หลังลบ keys ผิดรูปแบบเหลือ " + existingKeys.length + " keys");
    }

    // กำหนด standard keys ทั้งหมด (41 เดิม + 6 ใหม่ + 3 VAT)
    const standardKeys = [
      // 41 keys เดิม
      ["rental_summary_title", "ใบยืนยันการจองรถเช่า", "Car Rental Confirmation", "租车确认", "租車確認", "렌터카 확인", "Подтверждение аренды автомобиля", "Pengesahan Sewaan Kereta", "レンタカー確認", "אישור השכרת רכב", "Confirmation de location de voiture", "Araba Kiralama Onayı", "Confirmación de alquiler de coche", "Conferma di noleggio auto", "ໃບຢືນຢັນການເຊົ່າລົດ", "ကားငှားရမ်းမှု အတည်ပြုချက်", "Xác nhận thuê xe", "Mietwagenbestätigung", "Konfirmasi Sewa Mobil"],
      ["booking_number", "หมายเลขการจอง:", "Booking No.:", "预订号：", "預訂號：", "예약 번호：", "Номер бронирования：", "No. Tempahan:", "予約番号：", "מספר הזמנה:", "Numéro de réservation :", "Rezervasyon No:", "Número de reserva:", "Numero di prenotazione:", "ເລກການຈອງ:", "ဘွတ်ကင်နံပါတ်:", "Số đặt trước:", "Buchungsnummer:", "Nomor Pemesanan:"],
      ["document_date", "วันที่ออกเอกสาร:", "Document Date:", "文件日期：", "文件日期：", "문서 날짜：", "Дата документа：", "Tarikh Dokumen:", "書類日付：", "תאריך מסמך:", "Date du document :", "Belge Tarihi:", "Fecha del documento:", "Data del documento:", "ວັນທີເອກະສານ:", "စာရွက်စာတမ်း ရက်စွဲ:", "Ngày tạo tài liệu:", "Dokumentdatum:", "Tanggal Dokumen:"],
      ["customer_info", "ข้อมูลลูกค้า", "Customer Information", "客户信息", "客戶信息", "고객 정보", "Информация о клиенте", "Maklumat Pelanggan", "お客様情報", "פרטי לקוח", "Informations client", "Müşteri Bilgisi", "Información del cliente", "Informazioni cliente", "ຂໍ້ມູນລູກຄ້າ", "ဖောက်သည် အချက်အလက်", "Thông tin khách hàng", "Kundeninformationen", "Informasi Pelanggan"],
      ["customer_name", "ชื่อ:", "Name:", "姓名：", "姓名：", "이름：", "Имя：", "Nama:", "名前：", "שם:", "Nom :", "İsim:", "Nombre:", "Nome:", "ຊື່:", "အမည်:", "Tên:", "Name:", "Nama:"],
      ["phone_number", "เบอร์โทรศัพท์:", "Phone Number:", "电话号码：", "電話號碼：", "전화번호：", "Номер телефона：", "Nombor Telefon:", "電話番号：", "מספר טלפון:", "Numéro de téléphone :", "Telefon Numarası:", "Número de teléfono:", "Numero di telefono:", "ເບີໂທລະສັບ:", "ဖုန်းနံပါတ်:", "Số điện thoại:", "Telefonnummer:", "Nomor Telepon:"],
      ["car_info", "ข้อมูลรถ", "Car Information", "车辆信息", "車輛信息", "차량 정보", "Информация об автомобиле", "Maklumat Kereta", "車両情報", "פרטי הרכב", "Informations sur le véhicule", "Araba Bilgisi", "Información del coche", "Informazioni sul veicolo", "ຂໍ້ມູນລົດ", "ကား အချက်အလက်", "Thông tin xe", "Fahrzeuginformationen", "Informasi Mobil"],
      ["car_model", "รถ:", "Car Model:", "车型：", "車型：", "차량 모델：", "Модель автомобиля：", "Model Kereta:", "車種：", "דגם רכב:", "Modèle de voiture :", "Araba Modeli:", "Modelo de coche:", "Modello dell'auto:", "ລຸ້ນລົດ:", "ကားမော်ဒယ်:", "Kiểu xe:", "Automodell:", "Model Mobil:"],
      ["license_plate", "ทะเบียนรถ:", "License Plate:", "车牌号：", "車牌號：", "번호판：", "Номерной знак：", "Nombor Plat:", "ナンバープレート：", "מספר רישוי:", "Plaque d'immatriculation :", "Plaka:", "Matrícula:", "Targa:", "ປ້າຍທະບຽນລົດ:", "လိုင်စင်ပြား:", "Biển số xe:", "Kennzeichen:", "Plat Nomor:"],
      ["rental_period", "ระยะเวลาเช่า", "Rental Period", "租期", "租期", "렌탈 기간", "Срок аренды", "Tempoh Sewaan", "レンタル期間", "תקופת שכירות", "Période de location", "Kiralama Süresi", "Período de alquiler", "Periodo di noleggio", "ໄລຍະເວລາເຊົ່າ", "ငှားရမ်းသည့်ကာလ", "Thời gian thuê", "Mietdauer", "Periode Sewa"],
      ["pickup_date", "วันที่รับรถ:", "Pickup Date:", "取车日期：", "取車日期：", "픽업 날짜：", "Дата получения：", "Tarikh Ambil:", "受取日：", "תאריך איסוף:", "Date de prise en charge :", "Alış Tarihi:", "Fecha de recogida:", "Data di ritiro:", "ວັນທີຮັບລົດ:", "ကားယူမည့်ရက်:", "Ngày nhận xe:", "Abholdatum:", "Tanggal Pengambilan:"],
      ["return_date", "วันที่คืนรถ:", "Return Date:", "还车日期：", "還車日期：", "반납 날짜：", "Дата возврата：", "Tarikh Pemulangan:", "返却日：", "תאריך החזרה:", "Date de retour :", "İade Tarihi:", "Fecha de devolución:", "Data di restituzione:", "ວັນທີສົ່ງລົດ:", "ကားပြန်အပ်မည့်ရက်:", "Ngày trả xe:", "Rückgabedatum:", "Tanggal Pengembalian:"],
      ["time", "เวลา:", "Time:", "时间：", "時間：", "시간：", "Время：", "Masa:", "時間：", "שעה:", "Heure :", "Saat:", "Hora:", "Ora:", "ເວລາ:", "အချိန်:", "Thời gian:", "Uhrzeit:", "Waktu:"],
      ["rental_days", "จำนวนวัน:", "Rental Days:", "租期天数：", "租期天數：", "대여 일수：", "Дней аренды：", "Hari Sewaan:", "レンタル日数：", "ימי שכירות:", "Jours de location :", "Kiralama Günleri:", "Días de alquiler:", "Giorni di noleggio:", "ຈຳນວນມື້:", "ငှားရမ်းရက်အရေအတွက်:", "Số ngày thuê:", "Miettage:", "Hari Sewa:"],
      ["days", "วัน", "days", "天", "天", "일", "дней", "hari", "日", "ימים", "jours", "gün", "días", "giorni", "ມື້", "ရက်", "ngày", "Tage", "hari"],
      ["hours", "ชั่วโมง", "hours", "小时", "小時", "시간", "часов", "jam", "時間", "שעות", "heures", "saat", "horas", "ore", "ຊົ່ວໂມງ", "နာရီ", "giờ", "Stunden", "jam"],
      ["extra_hours_info", "หากเกิน {0} ชั่วโมง จะคิดเพิ่มเป็นหนึ่งวัน", "If exceed {0} hours, will be charged as one more day", "如果超过 {0} 小时，将按一天计费", "如果超過 {0} 小時，將按一天計費", "{0}시간을 초과하면 하루 추가 요금이 부과됩니다", "Если превышено {0} часов, будет начислен еще один день", "Jika melebihi {0} jam, akan dikenakan bayaran satu hari tambahan", "{0}時間を超えた場合、1日分追加料金が発生します", "אם עובר {0} שעות, יחויב כיום נוסף", "Si dépassement de {0} heures, facturé comme un jour de plus", "{0} saati aşarsa bir gün daha ücretlendirilecek", "Si supera {0} horas, se cobrará como un día más", "Se supera {0} ore, verrà addebitato come un giorno in più", "ຖ້າເກີນ {0} ຊົ່ວໂມງ ຈະຄິດເພີ່ມເປັນໜຶ່ງວັນ", "အကယ်၍ {0} နာရီကျော်လွန်ပါက တစ်ရက်အပိုပေးရမည်", "Nếu vượt quá {0} giờ, sẽ tính thêm một ngày", "Bei Überschreitung von {0} Stunden wird ein weiterer Tag berechnet", "Jika melebihi {0} jam, akan dikenakan biaya satu hari tambahan"],
      ["pickup_location", "สถานที่รับรถ:", "Pickup Location:", "取车地点：", "取車地點：", "픽업 위치：", "Место получения：", "Lokasi Ambil:", "受取場所：", "מיקום איסוף:", "Lieu de prise en charge :", "Alış Yeri:", "Lugar de recogida:", "Luogo di ritiro:", "ສະຖານທີ່ຮັບລົດ:", "ကားယူရမည့်နေရာ:", "Địa điểm nhận xe:", "Abholort:", "Lokasi Pengambilan:"],
      ["return_location", "สถานที่คืนรถ:", "Return Location:", "还车地点：", "還車地點：", "반납 위치：", "Место возврата：", "Lokasi Pemulangan:", "返却場所：", "מיקום החזרה:", "Lieu de retour :", "İade Yeri:", "Lugar de devolución:", "Luogo di restituzione:", "ສະຖານທີ່ສົ່ງລົດ:", "ကားပြန်အပ်ရမည့်နေရာ:", "Địa điểm trả xe:", "Rückgabeort:", "Lokasi Pengembalian:"],
      ["payment_info", "ข้อมูลการชำระเงิน", "Payment Information", "付款信息", "付款信息", "결제 정보", "Информация об оплате", "Maklumat Pembayaran", "支払い情報", "פרטי תשלום", "Informations de paiement", "Ödeme Bilgisi", "Información de pago", "Informazioni di pagamento", "ຂໍ້ມູນການຈ່າຍເງິນ", "ငွေပေးချေမှု အချက်အလက်", "Thông tin thanh toán", "Zahlungsinformationen", "Informasi Pembayaran"],
      ["daily_rate", "ค่าเช่าต่อวัน:", "Daily Rate:", "日租金：", "日租金：", "일일 요금：", "Дневная ставка：", "Kadar Harian:", "1日のレンタル料：", "תעריף יומי:", "Tarif journalier :", "Günlük Ücret:", "Tarifa diaria:", "Tariffa giornaliera:", "ລາຄາຕໍ່ມື້:", "နေ့စဉ်နှုန်း:", "Giá thuê mỗi ngày:", "Tagestarif:", "Tarif Harian:"],
      ["total_rental", "ค่าเช่ารวมทั้งหมด:", "Total Rental:", "租金总额：", "租金總額：", "총 렌탈 비용：", "Общая стоимость аренды：", "Jumlah Sewaan:", "総レンタル料：", "סך השכירות:", "Total de la location :", "Toplam Kiralama:", "Alquiler total:", "Noleggio totale:", "ລາຄາເຊົ່າທັງໝົດ:", "စုစုပေါင်းငှားရမ်းခ:", "Tổng tiền thuê:", "Gesamtmiete:", "Total Sewa:"],
      ["booking_deposit", "ค่ามัดจำคิวรถ:", "Booking Deposit:", "预订押金：", "預訂押金：", "예약 보증금：", "Депозит за бронирование：", "Deposit Tempahan:", "予約デポジット：", "מקדמת הזמנה:", "Acompte de réservation :", "Rezervasyon Depozitosu:", "Depósito de reserva:", "Deposito di prenotazione:", "ເງິນມັດຈຳ:", "ကြိုတင်ငွေ:", "Tiền đặt cọc:", "Buchungskaution:", "Deposit Pemesanan:"],
      ["security_deposit", "เงินประกันความเสียหาย:", "Security Deposit:", "安全押金：", "安全押金：", "보증금：", "Залог：", "Deposit Keselamatan:", "保証金：", "פיקדון ביטחון:", "Caution :", "Güvenlik Depozitosu:", "Depósito de seguridad:", "Deposito cauzionale:", "ເງິນຄ້ຳປະກັນ:", "အာမခံငွေ:", "Tiền đặt cọc bảo đảm:", "Kaution:", "Deposit Keamanan:"],
      ["additional_service", "ค่าบริการเพิ่มเติม:", "Additional Service:", "额外服务费：", "額外服務費：", "추가 서비스：", "Дополнительные услуги：", "Perkhidmatan Tambahan:", "追加サービス料：", "שירות נוסף:", "Service supplémentaire :", "Ek Hizmet:", "Servicio adicional:", "Servizio aggiuntivo:", "ຄ່າບໍລິການເພີ່ມເຕີມ:", "အပိုဝန်ဆောင်မှု:", "Dịch vụ bổ sung:", "Zusatzleistung:", "Layanan Tambahan:"],
      ["total_amount", "รวมยอดชำระวันรับรถ:", "Total Amount Due on Pickup:", "取车时应付总额：", "取車時應付總額：", "픽업 시 총 결제 금액：", "Общая сумма при получении：", "Jumlah Bayaran Semasa Ambil:", "受取時支払い総額：", "סכום כולל לתשלום באיסוף:", "Montant total à payer à la prise en charge :", "Alışta Ödenecek Toplam Tutar:", "Importe total a pagar en la recogida:", "Importo totale dovuto al ritiro:", "ຍອດຊຳລະວັນຮັບລົດ:", "ကားယူချိန်တွင်ပေးချေရမည့်စုစုပေါင်း:", "Tổng số tiền phải trả khi nhận xe:", "Gesamtbetrag bei Abholung:", "Total Pembayaran Saat Pengambilan:"],
      ["payment_method", "ช่องทางการชำระเงิน", "Payment Method", "付款方式", "付款方式", "결제 방법", "Способ оплаты", "Kaedah Pembayaran", "支払い方法", "אמצעי תשלום", "Méthode de paiement", "Ödeme Yöntemi", "Método de pago", "Metodo di pagamento", "ວິທີການຊຳລະເງິນ", "ငွေပေးချေနည်း", "Phương thức thanh toán", "Zahlungsmethode", "Metode Pembayaran"],
      ["bank_name", "ธนาคาร:", "Bank:", "银行：", "銀行：", "은행：", "Банк：", "Bank:", "銀行：", "בנק:", "Banque :", "Banka:", "Banco:", "Banca:", "ທະນາຄານ:", "ဘဏ်:", "Ngân hàng:", "Bank:", "Bank:"],
      ["account_number", "เลขที่บัญชี:", "Account Number:", "账号：", "賬號：", "계좌번호：", "Номер счета：", "Nombor Akaun:", "口座番号：", "מספר חשבון:", "Numéro de compte :", "Hesap Numarası:", "Número de cuenta:", "Numero di conto:", "ເລກບັນຊີ:", "အကောင့်နံပါတ်:", "Số tài khoản:", "Kontonummer:", "Nomor Rekening:"],
      ["account_name", "ชื่อบัญชี:", "Account Name:", "账户名：", "賬戶名：", "계좌명：", "Имя владельца счета：", "Nama Akaun:", "口座名義：", "שם חשבון:", "Nom du compte :", "Hesap Adı:", "Nombre de la cuenta:", "Nome del conto:", "ຊື່ບັນຊີ:", "အကောင့်အမည်:", "Tên tài khoản:", "Kontoinhaber:", "Nama Pemilik Rekening:"],
      ["rental_contract", "สัญญาเช่า:", "Rental Contract:", "租赁合同：", "租賃合同：", "렌탈 계약서：", "Договор аренды：", "Kontrak Sewaan:", "レンタル契約書：", "חוזה שכירות:", "Contrat de location :", "Kiralama Sözleşmesi:", "Contrato de alquiler:", "Contratto di noleggio:", "ສັນຍາເຊົ່າ:", "ငှားရမ်းမှုစာချုပ်:", "Hợp đồng thuê:", "Mietvertrag:", "Kontrak Sewa:"],
      ["issued_by", "ออกโดย:", "Issued By:", "签发人：", "簽發人：", "발행자：", "Выдано：", "Dikeluarkan Oleh:", "発行者：", "הונפק על ידי:", "Émis par :", "Düzenleyen:", "Emitido por:", "Emesso da:", "ອອກໂດຍ:", "ထုတ်ပြန်သူ:", "Cấp bởi:", "Ausgestellt von:", "Dikeluarkan Oleh:"],

      // 6 keys ใหม่
      ["overtime_hours", "ชั่วโมงล่วงเวลา:", "Overtime Hours:", "超时小时：", "超時小時：", "초과 시간：", "Часы сверхурочно：", "Jam Lebih Masa:", "超過時間：", "שעות נוספות:", "Heures supplémentaires :", "Fazla Mesai Saatleri:", "Horas extra:", "Ore supplementari:", "ຊົ່ວໂມງເກີນ:", "ထပ်ဆောင်းအချိန်:", "Giờ vượt quá:", "Überstunden:", "Jam Lembur:"],
      ["overtime_fee", "ค่าล่วงเวลา:", "Overtime Fee:", "超时费：", "超時費：", "초과 요금：", "Плата за сверхурочные：", "Bayaran Lebih Masa:", "超過料金：", "דמי שעות נוספות:", "Frais d'heures supplémentaires :", "Fazla Mesai Ücreti:", "Tarifa de horas extra:", "Tariffa ore supplementari:", "ຄ່າເກີນເວລາ:", "အချိန်ပိုခ:", "Phí vượt giờ:", "Überstundengebühr:", "Biaya Lembur:"],
      ["car_seat_fee", "ค่าบริการคาร์ซีท:", "Car Seat Fee:", "儿童座椅费：", "兒童座椅費：", "카시트 요금：", "Плата за детское кресло：", "Bayaran Kerusi Kereta:", "チャイルドシート料金：", "דמי מושב בטיחות:", "Frais de siège auto :", "Çocuk Koltuğu Ücreti:", "Tarifa de silla de coche:", "Tariffa seggiolino auto:", "ຄ່າບໍລິການທີ່ນັ່ງເດັກ:", "ကလေးထိုင်ခုံခ:", "Phí ghế trẻ em:", "Kindersitzgebühr:", "Biaya Kursi Mobil Anak:"],
      ["additional_insurance_fee", "ค่าประกันเสริม:", "Additional Insurance Fee:", "额外保险费：", "額外保險費：", "추가 보험료：", "Дополнительная страховка：", "Bayaran Insurans Tambahan:", "追加保険料：", "דמי ביטוח נוסף:", "Frais d'assurance supplémentaire :", "Ek Sigorta Ücreti:", "Tarifa de seguro adicional:", "Tariffa assicurazione aggiuntiva:", "ຄ່າປະກັນເພີ່ມເຕີມ:", "အပိုအာမခံကြေး:", "Phí bảo hiểm bổ sung:", "Zusätzliche Versicherungsgebühr:", "Biaya Asuransi Tambahan:"],
      ["insurance_days", "จำนวนวันประกันเสริม:", "Insurance Days:", "保险天数：", "保險天數：", "보험 일수：", "Дней страхования：", "Hari Insurans:", "保険日数：", "ימי ביטוח:", "Jours d'assurance :", "Sigorta Günleri:", "Días de seguro:", "Giorni di assicurazione:", "ຈຳນວນມື້ປະກັນ:", "အာမခံရက်အရေအတွက်:", "Số ngày bảo hiểm:", "Versicherungstage:", "Hari Asuransi:"],

      // 3 keys ใหม่สำหรับ VAT
      ["amount_before_vat", "จำนวนเงินก่อน VAT:", "Amount before VAT:", "增值税前金额：", "增值稅前金額：", "VAT 제외 금액：", "Сумма до НДС：", "Jumlah sebelum VAT:", "VAT前の金額：", "סכום לפני מע\"מ:", "Montant hors TVA :", "KDV Öncesi Tutar:", "Monto antes de IVA:", "Importo prima dell'IVA:", "ຈຳນວນເງິນກ່ອນ VAT:", "VAT မတိုင်မီပမာဏ:", "Số tiền trước VAT:", "Betrag vor MwSt:", "Jumlah sebelum PPN:"],
      ["vat_7_percent", "VAT 7%:", "VAT 7%:", "增值税 7%：", "增值稅 7%：", "VAT 7%：", "НДС 7%：", "VAT 7%:", "VAT 7%：", "מע\"מ 7%:", "TVA 7% :", "KDV %7:", "IVA 7%:", "IVA 7%:", "VAT 7%:", "VAT 7%:", "VAT 7%:", "MwSt 7%:", "PPN 7%:"],
      ["total_with_vat", "ยอดรวม VAT:", "Total with VAT:", "含税总额：", "含稅總額：", "VAT 포함 총액：", "Итого с НДС：", "Jumlah dengan VAT:", "VAT込み合計：", "סכום כולל מע\"מ:", "Total TTC :", "KDV Dahil Toplam:", "Total con IVA:", "Totale con IVA:", "ຍອດລວມ VAT:", "VAT ပါဝင်သောစုစုပေါင်း:", "Tổng cộng bao gồm VAT:", "Gesamtbetrag inkl. MwSt:", "Total termasuk PPN:"],

      // 1 key ใหม่สำหรับค่าเช่าพื้นฐาน
      ["base_rental_cost", "ค่าเช่าพื้นฐาน:", "Base Rental Cost:", "基础租金：", "基礎租金：", "기본 렌탈 비용：", "Базовая стоимость аренды：", "Kos Sewaan Asas:", "基本レンタル料：", "עלות שכירות בסיסית:", "Coût de location de base :", "Temel Kiralama Maliyeti:", "Costo base de alquiler:", "Costo base del noleggio:", "ຄ່າເຊົ່າພື້ນຖານ:", "အခြေခံငှားရမ်းကုန်ကျစရိတ်:", "Chi phí thuê cơ bản:", "Basis-Mietkosten:", "Biaya Sewa Dasar:"]
    ];

    // หา keys ที่ขาดหายไป
    const missingKeys = [];
    for (let i = 0; i < standardKeys.length; i++) {
      const keyName = "[[" + standardKeys[i][0] + "]]"; // เพิ่ม [[]] เพื่อเทียบกับ keys ในชีต
      if (!existingKeys.includes(keyName)) {
        // เพิ่ม [[]] ให้กับ key name ก่อน push
        const keyWithBrackets = [...standardKeys[i]];
        keyWithBrackets[0] = keyName;
        missingKeys.push(keyWithBrackets);
      }
    }

    if (missingKeys.length === 0) {
      Logger.log("ชีตมี keys ครบแล้ว");
      return {
        success: true,
        message: "ชีตมี keys ครบแล้ว",
        addedCount: 0
      };
    }

    // เพิ่ม keys ที่ขาดต่อท้าย
    const lastRow = sheet.getLastRow();
    Logger.log("เพิ่ม " + missingKeys.length + " keys ใหม่ที่แถว " + (lastRow + 1));

    sheet.getRange(lastRow + 1, 1, missingKeys.length, missingKeys[0].length)
      .setValues(missingKeys);

    // จัดรูปแบบแถวใหม่
    const newKeyColumn = sheet.getRange(lastRow + 1, 1, missingKeys.length, 1);
    newKeyColumn.setFontWeight("bold");
    newKeyColumn.setBackground("#e6e6e6");

    Logger.log("ซิงค์คีย์สำเร็จ - เพิ่ม " + missingKeys.length + " keys");

    return {
      success: true,
      message: "เพิ่ม " + missingKeys.length + " keys ใหม่สำเร็จ",
      addedCount: missingKeys.length,
      addedKeys: missingKeys.map(k => k[0])
    };

  } catch (error) {
    Logger.log("เกิดข้อผิดพลาดใน syncSummaryTranslationKeys: " + error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาด: " + error.toString(),
      addedCount: 0
    };
  }
}

// ******** ฟังก์ชันสำหรับจัดการแปลภาษา ********

/**
 * ดึงรายการคีย์แปลภาษาทั้งหมด
 * @returns {Array} รายการคีย์ทั้งหมด
 */
function getTranslationKeys(sheetID) {
  try {
    Logger.log("เริ่มฟังก์ชัน getTranslationKeys");

    const ss = SpreadsheetApp.openById(sheetID);
    Logger.log("เชื่อมต่อ Spreadsheet สำเร็จ");

    const sheet = ss.getSheetByName("แปลสัญญาเช่า");
    Logger.log("พยายามเข้าถึงชีต 'แปลสัญญาเช่า'");

    if (!sheet) {
      Logger.log("ไม่พบชีต 'แปลสัญญาเช่า'");
      return [];
    }

    Logger.log("เข้าถึงชีต 'แปลสัญญาเช่า' สำเร็จ");

    // ดึงข้อมูลจากคอลัมน์ A เริ่มจากแถวที่ 2
    const keyRange = sheet.getRange("A2:A");
    Logger.log("เลือกช่วงข้อมูล A2:A สำเร็จ");

    const keyValues = keyRange.getValues();
    Logger.log("ดึงค่าจากช่วงข้อมูลสำเร็จ, จำนวนแถวทั้งหมด: " + keyValues.length);

    // กรองเอาเฉพาะค่าที่ไม่ว่างเปล่า
    const keys = keyValues
      .filter(row => row[0] !== "")
      .map(row => row[0]);

    Logger.log("กรองและแปลงข้อมูลสำเร็จ, จำนวนคีย์ที่ไม่ว่างเปล่า: " + keys.length);
    Logger.log("คีย์ทั้งหมด: " + JSON.stringify(keys));

    return keys;
  } catch (error) {
    Logger.log("Error in getTranslationKeys: " + error.toString());
    Logger.log("Stack trace: " + error.stack);
    throw new Error("ไม่สามารถดึงรายการคีย์แปลภาษาได้: " + error.toString());
  }
}

/**
 * ดึงข้อมูลแปลภาษาตามคีย์
 * @param {string} key - คีย์ที่ต้องการ
 * @returns {Object} ข้อมูลแปลภาษา
 */
function getTranslationByKey(key, sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName("แปลสัญญาเช่า");

    if (!sheet) {
      Logger.log("ไม่พบชีต 'แปลสัญญาเช่า'");
      return null;
    }

    // ค้นหาแถวที่มีคีย์ตรงกับที่ระบุ
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) {
      Logger.log("ไม่พบคีย์ " + key);
      return null;
    }

    // ลำดับภาษา: th/en/zh-CN/ko/ru/ms/ja/he/fr/tr/es/it/lo/my/vi/de/zh-TW/id
    const translation = {
      th: data[rowIndex][1] || '',
      en: data[rowIndex][2] || '',
      'zh-CN': data[rowIndex][3] || '',
      ko: data[rowIndex][4] || '',
      ru: data[rowIndex][5] || '',
      ms: data[rowIndex][6] || '',
      ja: data[rowIndex][7] || '',
      he: data[rowIndex][8] || '',
      fr: data[rowIndex][9] || '',
      tr: data[rowIndex][10] || '',
      es: data[rowIndex][11] || '',
      it: data[rowIndex][12] || '',
      lo: data[rowIndex][13] || '',
      my: data[rowIndex][14] || '',
      vi: data[rowIndex][15] || '',
      de: data[rowIndex][16] || '',
      'zh-TW': data[rowIndex][17] || '',
      id: data[rowIndex][18] || ''
    };

    return translation;
  } catch (error) {
    Logger.log("Error in getTranslationByKey: " + error.toString());
    throw new Error("ไม่สามารถดึงข้อมูลแปลภาษาได้: " + error.toString());
  }
}

/**
 * อัปเดตข้อมูลแปลภาษา
 * @param {string} key - คีย์ที่ต้องการอัปเดต
 * @param {Object} translation - ข้อมูลแปลภาษาใหม่
 * @returns {Object} ผลลัพธ์การอัปเดต
 */
function updateTranslation(key, translation, sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName("แปลสัญญาเช่า");

    if (!sheet) {
      Logger.log("ไม่พบชีต 'แปลสัญญาเช่า'");
      return { success: false, message: "ไม่พบชีตแปลสัญญาเช่า" };
    }

    // ค้นหาแถวที่มีคีย์ตรงกับที่ระบุ
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        rowIndex = i + 1; // +1 เพราะแถวใน Sheet เริ่มที่ 1 แต่ Array เริ่มที่ 0
        break;
      }
    }

    if (rowIndex === -1) {
      Logger.log("ไม่พบคีย์ " + key);
      return { success: false, message: "ไม่พบคีย์ในระบบ" };
    }

    // สร้างอาร์เรย์ข้อมูลที่จะอัปเดต
    const values = [
      translation.th || '',
      translation.en || '',
      translation['zh-CN'] || '',
      translation.ko || '',
      translation.ru || '',
      translation.ms || '',
      translation.ja || '',
      translation.he || '',
      translation.fr || '',
      translation.tr || '',
      translation.es || '',
      translation.it || '',
      translation.lo || '',
      translation.my || '',
      translation.vi || '',
      translation.de || '',
      translation['zh-TW'] || '',
      translation.id || ''
    ];

    // อัปเดตข้อมูลในชีต
    sheet.getRange(rowIndex, 2, 1, values.length).setValues([values]);

    return { success: true, message: "อัปเดตข้อมูลแปลภาษาสำเร็จ" };
  } catch (error) {
    Logger.log("Error in updateTranslation: " + error.toString());
    return { success: false, message: "ไม่สามารถอัปเดตข้อมูลแปลภาษาได้: " + error.toString() };
  }
}

/**
 * เพิ่มข้อมูลแปลภาษาใหม่
 * @param {string} key - คีย์ใหม่
 * @param {Object} translation - ข้อมูลแปลภาษา
 * @returns {Object} ผลลัพธ์การเพิ่ม
 */
function addNewTranslation(key, translation, sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName("แปลสัญญาเช่า");

    if (!sheet) {
      Logger.log("ไม่พบชีต 'แปลสัญญาเช่า'");
      return { success: false, message: "ไม่พบชีตแปลสัญญาเช่า" };
    }

    // ตรวจสอบว่าคีย์ซ้ำหรือไม่
    const keys = getTranslationKeys(sheetID);
    if (keys.includes(key)) {
      return { success: false, message: "คีย์นี้มีอยู่ในระบบแล้ว" };
    }

    // สร้างอาร์เรย์ข้อมูลที่จะเพิ่ม
    const values = [
      key,
      translation.th || '',
      translation.en || '',
      translation['zh-CN'] || '',
      translation.ko || '',
      translation.ru || '',
      translation.ms || '',
      translation.ja || '',
      translation.he || '',
      translation.fr || '',
      translation.tr || '',
      translation.es || '',
      translation.it || '',
      translation.lo || '',
      translation.my || '',
      translation.vi || '',
      translation.de || '',
      translation['zh-TW'] || '',
      translation.id || ''
    ];

    // หาแถวว่างถัดไป
    const lastRow = sheet.getLastRow() + 1;

    // เพิ่มข้อมูลในชีต
    sheet.getRange(lastRow, 1, 1, values.length).setValues([values]);

    return { success: true, message: "เพิ่มข้อมูลแปลภาษาใหม่สำเร็จ" };
  } catch (error) {
    Logger.log("Error in addNewTranslation: " + error.toString());
    return { success: false, message: "ไม่สามารถเพิ่มข้อมูลแปลภาษาใหม่ได้: " + error.toString() };
  }
}

/**
 * แปลข้อความจากภาษาไทยไปยังภาษาอื่นๆ โดยใช้ Google Translate
 * @param {string} sourceText - ข้อความภาษาไทย
 * @param {Array} targetLanguages - รายการภาษาปลายทาง
 * @returns {Object} ผลลัพธ์การแปล
 */
function translateText(sourceText, targetLanguages) {
  if (!sourceText) {
    return {};
  }

  // รายการภาษา Google Translate
  const languageMapping = {
    'en': 'en',      // อังกฤษ
    'zh-CN': 'zh-CN', // จีน (ประเทศจีน)
    'ko': 'ko',      // เกาหลี
    'ru': 'ru',      // รัสเซีย
    'ms': 'ms',      // มาเลย์
    'ja': 'ja',      // ญี่ปุ่น
    'he': 'iw',      // ฮิบรู
    'fr': 'fr',      // ฝรั่งเศส
    'tr': 'tr',      // ตุรกี
    'es': 'es',      // สเปน
    'it': 'it',      // อิตาลี
    'lo': 'lo',      // ลาว
    'my': 'my',      // พม่า
    'vi': 'vi',      // เวียดนาม
    'de': 'de',      // เยอรมัน
    'zh-TW': 'zh-TW', // จีน (ไต้หวัน)
    'id': 'id'       // อินโดนีเซีย
  };

  const result = {};

  try {
    // แปลไปยังภาษาปลายทางแต่ละภาษา
    targetLanguages.forEach(lang => {
      try {
        if (languageMapping[lang]) {
          result[lang] = LanguageApp.translate(sourceText, 'th', languageMapping[lang]);
        }
      } catch (error) {
        Logger.log("Error translating to " + lang + ": " + error.toString());
        // ไม่แปลภาษานี้ แต่ยังแปลภาษาอื่นต่อไป
      }
    });

    return result;
  } catch (error) {
    Logger.log("Error in translateText: " + error.toString());
    throw new Error("ไม่สามารถแปลข้อความได้: " + error.toString());
  }
}








/**
 * ลบคีย์แปลภาษาและคำแปลที่เกี่ยวข้องทั้งหมด
 * @param {string} key - คีย์ที่ต้องการลบ
 * @returns {Object} ผลลัพธ์การลบ
 */
function deleteTranslationKey(key, sheetID) {
  try {
    Logger.log("เริ่มฟังก์ชัน deleteTranslationKey กับคีย์: " + key);

    if (!key) {
      Logger.log("ไม่ได้ระบุคีย์ที่ต้องการลบ");
      return { success: false, message: "ไม่ได้ระบุคีย์ที่ต้องการลบ" };
    }

    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName("แปลสัญญาเช่า");

    if (!sheet) {
      Logger.log("ไม่พบชีต 'แปลสัญญาเช่า'");
      return { success: false, message: "ไม่พบชีตแปลสัญญาเช่า" };
    }

    Logger.log("เข้าถึงชีต 'แปลสัญญาเช่า' สำเร็จ");

    // ค้นหาแถวที่มีคีย์ตรงกับที่ระบุ
    const data = sheet.getDataRange().getValues();
    Logger.log("จำนวนแถวข้อมูลทั้งหมด: " + data.length);

    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        rowIndex = i + 1; // +1 เพราะแถวใน Sheet เริ่มที่ 1 แต่ Array เริ่มที่ 0
        Logger.log("พบคีย์ " + key + " ที่แถวที่ " + rowIndex);
        break;
      }
    }

    if (rowIndex === -1) {
      Logger.log("ไม่พบคีย์ " + key + " ในชีต");
      return { success: false, message: "ไม่พบคีย์ในระบบ" };
    }

    // ลบแถวที่มีคีย์นั้น
    sheet.deleteRow(rowIndex);
    Logger.log("ลบแถวที่ " + rowIndex + " สำเร็จ");

    return { success: true, message: "ลบคีย์ " + key + " สำเร็จ" };
  } catch (error) {
    Logger.log("Error in deleteTranslationKey: " + error.toString());
    Logger.log("Stack trace: " + error.stack);
    return { success: false, message: "ไม่สามารถลบคีย์ได้: " + error.toString() };
  }
}



/**
 * ฟังก์ชันสำหรับดึงเทมเพลตข้อความสรุปเริ่มต้น
 * @return {string} เทมเพลตข้อความสรุปเริ่มต้น
 */
function getDefaultSummaryTemplate(sheetID) {
  // ดึงข้อมูลจาก Sheet ตั้งค่าระบบ
  const ss = SpreadsheetApp.openById(sheetID);
  const configSheet = ss.getSheetByName("ตั้งค่าระบบ");

  // ตรวจสอบว่าชีตมีอยู่หรือไม่
  if (!configSheet) {
    // ถ้าไม่มีชีต ให้ใช้ค่าเริ่มต้นแบบฮาร์ดโค้ด
    return `ใบยืนยันการจองรถเช่า
หมายเลขการจอง: {{หมายเลขการจอง}}
วันที่ออกเอกสาร: {{วันที่เวลาปัจจุบัน}}

ข้อมูลลูกค้า
ชื่อ: {{ชื่อลูกค้า}}
เบอร์โทรศัพท์: {{เบอร์โทรศัพท์}}

ข้อมูลรถ
รถที่เช่า: {{รถ}}
ทะเบียนรถ: {{ทะเบียนรถ}}

ระยะเวลาเช่า
วันที่เช่า: {{วันที่เช่า}} เวลา {{เวลารับรถ}}
วันที่คืน: {{วันที่คืน}} เวลา {{เวลาคืนรถ}}
จำนวนวัน: {{จำนวนวัน}}

สถานที่รับรถ: {{สถานที่รับรถ}}
สถานที่คืนรถ: {{สถานที่คืนรถ}}

ค่าใช้จ่าย
ราคาเช่าต่อวัน: {{ราคาต่อวัน}}
ค่าเช่ารวมทั้งหมด: {{ค่าเช่ารวมทั้งหมด}}
ค่ามัดจำคิวรถ: {{ค่ามัดจำคิวรถ}}
เงินประกันความเสียหาย: {{เงินประกันความเสียหาย}}
ค่าบริการเพิ่มเติม: {{ค่าบริการเพิ่มเติม}}
ค่าล่วงเวลา: {{ค่าล่วงเวลา}}
ค่าบริการคาร์ซีท: {{ค่าคาร์ซีท}}
ค่าประกันเสริม: {{ค่าประกันเสริมรวม}}
จำนวนวันประกันเสริม: {{จำนวนวันประกันเสริม}}
ยอดชำระวันรับรถ: {{รวมยอดชำระวันรับรถ}}

ช่องทางการชำระเงิน
ธนาคาร: {{ชื่อธนาคาร}}
เลขที่บัญชี: {{หมายเลขบัญชีธนาคาร}}
ชื่อบัญชี: {{ชื่อบัญชี}}

ออกโดย: {{ชื่อบริษัท}}`;
  }

  // ค้นหาคอลัมน์ของ summaryMessageTemplate
  const headerRow = 1;
  const headers = configSheet.getRange(headerRow, 1, 1, configSheet.getLastColumn()).getValues()[0];
  const templateColIndex = headers.indexOf("summaryMessageTemplate");

  if (templateColIndex === -1) {
    // ถ้าไม่พบคอลัมน์ ให้ใช้ค่าเริ่มต้นแบบฮาร์ดโค้ด
    return `ใบยืนยันการจองรถเช่า
หมายเลขการจอง: {{หมายเลขการจอง}}
วันที่ออกเอกสาร: {{วันที่เวลาปัจจุบัน}}

ข้อมูลลูกค้า
ชื่อ: {{ชื่อลูกค้า}}
เบอร์โทรศัพท์: {{เบอร์โทรศัพท์}}

ข้อมูลรถ
รถที่เช่า: {{รถ}}
ทะเบียนรถ: {{ทะเบียนรถ}}

ระยะเวลาเช่า
วันที่เช่า: {{วันที่เช่า}} เวลา {{เวลารับรถ}}
วันที่คืน: {{วันที่คืน}} เวลา {{เวลาคืนรถ}}
จำนวนวัน: {{จำนวนวัน}}

สถานที่รับรถ: {{สถานที่รับรถ}}
สถานที่คืนรถ: {{สถานที่คืนรถ}}

ค่าใช้จ่าย
ราคาเช่าต่อวัน: {{ราคาต่อวัน}}
ค่าเช่ารวมทั้งหมด: {{ค่าเช่ารวมทั้งหมด}}
ค่ามัดจำคิวรถ: {{ค่ามัดจำคิวรถ}}
เงินประกันความเสียหาย: {{เงินประกันความเสียหาย}}
ค่าบริการเพิ่มเติม: {{ค่าบริการเพิ่มเติม}}
ค่าล่วงเวลา: {{ค่าล่วงเวลา}}
ค่าบริการคาร์ซีท: {{ค่าคาร์ซีท}}
ค่าประกันเสริม: {{ค่าประกันเสริมรวม}}
จำนวนวันประกันเสริม: {{จำนวนวันประกันเสริม}}
ยอดชำระวันรับรถ: {{รวมยอดชำระวันรับรถ}}

ช่องทางการชำระเงิน
ธนาคาร: {{ชื่อธนาคาร}}
เลขที่บัญชี: {{หมายเลขบัญชีธนาคาร}}
ชื่อบัญชี: {{ชื่อบัญชี}}

ออกโดย: {{ชื่อบริษัท}}`;
  }

  // ค้นหาข้อมูลในคอลัมน์ summaryMessageTemplate
  const dataRange = configSheet.getRange(headerRow + 1, templateColIndex + 1, 1, 1);
  const templateValue = dataRange.getValue();

  if (!templateValue) {
    // ถ้าไม่มีค่า ให้ใช้ค่าเริ่มต้นแบบฮาร์ดโค้ด
    return `ใบยืนยันการจองรถเช่า
หมายเลขการจอง: {{หมายเลขการจอง}}
วันที่ออกเอกสาร: {{วันที่เวลาปัจจุบัน}}

ข้อมูลลูกค้า
ชื่อ: {{ชื่อลูกค้า}}
เบอร์โทรศัพท์: {{เบอร์โทรศัพท์}}

ข้อมูลรถ
รถที่เช่า: {{รถ}}
ทะเบียนรถ: {{ทะเบียนรถ}}

ระยะเวลาเช่า
วันที่เช่า: {{วันที่เช่า}} เวลา {{เวลารับรถ}}
วันที่คืน: {{วันที่คืน}} เวลา {{เวลาคืนรถ}}
จำนวนวัน: {{จำนวนวัน}}

สถานที่รับรถ: {{สถานที่รับรถ}}
สถานที่คืนรถ: {{สถานที่คืนรถ}}

ค่าใช้จ่าย
ราคาเช่าต่อวัน: {{ราคาต่อวัน}}
ค่าเช่ารวมทั้งหมด: {{ค่าเช่ารวมทั้งหมด}}
ค่ามัดจำคิวรถ: {{ค่ามัดจำคิวรถ}}
เงินประกันความเสียหาย: {{เงินประกันความเสียหาย}}
ค่าบริการเพิ่มเติม: {{ค่าบริการเพิ่มเติม}}
ค่าล่วงเวลา: {{ค่าล่วงเวลา}}
ค่าบริการคาร์ซีท: {{ค่าคาร์ซีท}}
ค่าประกันเสริม: {{ค่าประกันเสริมรวม}}
จำนวนวันประกันเสริม: {{จำนวนวันประกันเสริม}}
ยอดชำระวันรับรถ: {{รวมยอดชำระวันรับรถ}}

ช่องทางการชำระเงิน
ธนาคาร: {{ชื่อธนาคาร}}
เลขที่บัญชี: {{หมายเลขบัญชีธนาคาร}}
ชื่อบัญชี: {{ชื่อบัญชี}}

ออกโดย: {{ชื่อบริษัท}}`;
  }

  return templateValue;
}



// โค้ดการแจ้งเตือน

// ==============================
// ฝั่ง Google Apps Script (Server)
// ==============================



// สร้าง Trigger ทำงานทุกวัน
function createDailyTrigger() {
  // ลบ Trigger เดิมถ้ามี
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'checkMonthlyMaintenance') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // สร้าง Trigger ใหม่ ให้ทำงานทุกวันเวลาเที่ยงคืน
  ScriptApp.newTrigger('checkMonthlyMaintenance')
    .timeBased()
    .everyDays(1)
    .atHour(0)
    .create();
}


function testGetAllMaintenance() {
  const result = getAllMaintenance();
  Logger.log("ผลลัพธ์: %s", JSON.stringify(result, null, 2));

  if (result.success && result.data) {
    Logger.log("จำนวนข้อมูล: %s รายการ", result.data.length);

    // ถ้ามีข้อมูล แสดงตัวอย่างรายการแรก
    if (result.data.length > 0) {
      Logger.log("ตัวอย่างข้อมูลแรก: %s", JSON.stringify(result.data[0], null, 2));
    }
  }
}


function addNewMaintenance(maintenanceData, sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);
  const dateFields = ["วันที่แจ้งเตือน", "สร้างเมื่อ", "อัพเดตล่าสุด", "ทำรายการเมื่อ"];

  let sheet;
  try {
    sheet = ss.getSheetByName(MAINTENANCE_SHEET);
    if (!sheet) {
      // สร้างชีทใหม่
      sheet = ss.insertSheet(MAINTENANCE_SHEET);
      sheet.appendRow([
        "รถ",
        "ประเภทการแจ้งเตือน",
        "รูปแบบการแจ้งเตือน",
        "วันที่แจ้งเตือน",
        "วันที่ในเดือน",
        "ระยะทางเป้าหมาย",
        "ระยะทางปัจจุบัน",
        "หมายเหตุ",
        "สถานะ",
        "สร้างเมื่อ",
        "อัพเดตล่าสุด",
        "ทำรายการแล้ว",
        "ทำรายการเมื่อ"
      ]);
    }
  } catch (e) {
    return { success: false, message: "เกิดข้อผิดพลาดในการเปิดชีทการแจ้งเตือน: " + e };
  }

  try {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = [];

    for (let i = 0; i < headers.length; i++) {
      const key = headers[i];
      if (key === "ทำรายการแล้ว") {
        newRow.push(false);
      } else if (key === "สถานะ") {
        newRow.push("Active");
      } else if (dateFields.includes(key) && maintenanceData[key]) {
        newRow.push(new Date(maintenanceData[key]));
      } else {
        newRow.push(maintenanceData[key] !== undefined ? maintenanceData[key] : "");
      }
    }

    sheet.appendRow(newRow);
    const lastRow = sheet.getLastRow();

    // ช่องทำเครื่องหมาย
    let checkboxColumn = headers.indexOf("ทำรายการแล้ว") + 1;
    if (checkboxColumn > 0) {
      sheet.getRange(lastRow, checkboxColumn).insertCheckboxes();
    }

    clearSummaryCacheForTenant(sheetID);
    return { success: true, message: "เพิ่มการแจ้งเตือนสำเร็จ", id: lastRow - 1 };
  } catch (e) {
    return { success: false, message: "เกิดข้อผิดพลาดในการเพิ่มข้อมูล: " + e };
  }
}

// ฟังก์ชัน getAllMaintenance ที่ปรับปรุงแล้ว
function getAllMaintenance(sheetID) {
  // const sheetID = ('1udoc7Wbo-9UUQmK2bCpHBaq6H9255Fk6GEmJ3d4fBGE');
  const ss = SpreadsheetApp.openById(sheetID);
  const dateFields = ["วันที่แจ้งเตือน", "สร้างเมื่อ", "อัพเดตล่าสุด", "ทำรายการเมื่อ"];

  try {
    checkMonthlyMaintenance(sheetID);
    let sheet = ss.getSheetByName(MAINTENANCE_SHEET);
    if (!sheet) {
      Logger.log("ยังไม่พบชีท '%s'  สร้างใหม่", MAINTENANCE_SHEET);
      sheet = ss.insertSheet(MAINTENANCE_SHEET);
      // สร้าง header แถวแรก
      sheet.appendRow([
        "รถ",
        "ประเภทการแจ้งเตือน",
        "รูปแบบการแจ้งเตือน",
        "วันที่แจ้งเตือน",
        "วันที่ในเดือน",
        "ระยะทางเป้าหมาย",
        "ระยะทางปัจจุบัน",
        "หมายเหตุ",
        "สถานะ",
        "สร้างเมื่อ",
        "อัพเดตล่าสุด",
        "ทำรายการแล้ว",
        "ทำรายการเมื่อ"
      ]);
      sheet.getRange(1, 1, 1, sheet.getLastColumn())
        .setBackground('#f3f4f6')
        .setFontWeight('bold')
        .setBorder(true, true, true, true, true, true);
      sheet.autoResizeColumns(1, sheet.getLastColumn());
      Logger.log("สร้างชีทและหัวข้อเรียบร้อย");
    }

    // ถ้าไม่มีข้อมูล (Row เดียวคือ header) ให้คืน data = []
    if (sheet.getLastRow() <= 1) {
      Logger.log("getAllMaintenance: ไม่มีข้อมูลในชีท");
      const emptyResult = { success: true, data: [] };
      return JSON.parse(JSON.stringify(emptyResult));
    }

    // ดึงข้อมูลทั้งหมด
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const maintenanceData = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const obj = {};

      // แปลงข้อมูลในแต่ละคอลัมน์ให้เป็นรูปแบบที่เหมาะสม
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        let value = row[j];

        // แปลงวันที่เป็นสตริงในรูปแบบมาตรฐาน YYYY-MM-DD
        if (value instanceof Date && dateFields.includes(header)) {
          value = value.toISOString().split('T')[0]; // รูปแบบ YYYY-MM-DD
        }

        obj[header] = value;
      }

      obj.id = i;  // ใช้แถวเป็น id
      maintenanceData.push(obj);
    }

    // สร้างผลลัพธ์และแปลงเป็น JSON และกลับมาเป็นวัตถุอีกครั้ง
    const result = { success: true, data: maintenanceData };
    const jsonString = JSON.stringify(result);
    Logger.log("getAllMaintenance คืนข้อมูล %s รายการ (JSON length: %s)",
      maintenanceData.length, jsonString.length);

    // แปลงกลับเป็นวัตถุเพื่อให้แน่ใจว่าไม่มีประเภทข้อมูลพิเศษที่อาจทำให้เกิดปัญหา
    return JSON.parse(jsonString);
  } catch (e) {
    Logger.log("getAllMaintenance exception: %s\n%s", e.toString(), e.stack);
    return { success: false, message: "Error in getAllMaintenance: " + e.toString() };
  }
}

// ฟังก์ชัน updateMaintenance ที่ปรับปรุงแล้ว
function updateMaintenance(maintenanceId, maintenanceData, sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);
  const sheet = ss.getSheetByName(MAINTENANCE_SHEET);
  const dateFields = ["วันที่แจ้งเตือน", "สร้างเมื่อ", "อัพเดตล่าสุด", "ทำรายการเมื่อ"];

  if (!sheet || sheet.getLastRow() <= 1) {
    return { success: false, message: "ไม่พบข้อมูลการแจ้งเตือนในระบบ" };
  }

  if (maintenanceId <= 0 || maintenanceId >= sheet.getLastRow()) {
    return { success: false, message: "รหัสการแจ้งเตือนไม่ถูกต้อง" };
  }

  try {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    for (let i = 0; i < headers.length; i++) {
      const key = headers[i];
      if (maintenanceData.hasOwnProperty(key)) {
        let value = maintenanceData[key];

        if (dateFields.includes(key) && value) {
          value = new Date(value);
        }

        sheet.getRange(maintenanceId + 1, i + 1).setValue(value);
      }
    }

    // ช่องทำเครื่องหมาย
    let checkboxColumn = headers.indexOf("ทำรายการแล้ว") + 1;
    if (checkboxColumn > 0) {
      sheet.getRange(maintenanceId + 1, checkboxColumn).insertCheckboxes();
    }

    clearSummaryCacheForTenant(sheetID);

    return { success: true, message: "อัพเดตการแจ้งเตือนสำเร็จ" };
  } catch (e) {
    return { success: false, message: "เกิดข้อผิดพลาดในการอัพเดตข้อมูล: " + e };
  }
}

// ฟังก์ชัน markMaintenanceAsCompleted ที่ปรับปรุงแล้ว
function markMaintenanceAsCompleted(updateData, sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);
  const sheet = ss.getSheetByName(MAINTENANCE_SHEET);
  const dateFields = ["วันที่แจ้งเตือน", "สร้างเมื่อ", "อัพเดตล่าสุด", "ทำรายการเมื่อ"];

  // ตรวจสอบว่ามีข้อมูลในชีทหรือไม่
  if (sheet.getLastRow() <= 1) {
    return { success: false, message: "ไม่พบข้อมูลการแจ้งเตือนในระบบ" };
  }

  // ตรวจสอบว่า id อยู่ในช่วงที่ถูกต้อง
  if (updateData.id <= 0 || updateData.id >= sheet.getLastRow()) {
    return { success: false, message: "รหัสการแจ้งเตือนไม่ถูกต้อง" };
  }

  try {
    // ดึงหัวข้อตาราง
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // หาคอลัมน์ต่างๆ
    const completedIndex = headers.indexOf("ทำรายการแล้ว");
    const completedDateIndex = headers.indexOf("ทำรายการเมื่อ");
    const lastMarkedMonthIndex = headers.indexOf("เดือนที่ทำเครื่องหมายล่าสุด");
    const lastMarkedYearIndex = headers.indexOf("ปีที่ทำเครื่องหมายล่าสุด");

    // เพิ่มคอลัมน์ใหม่ถ้ายังไม่มี
    if (lastMarkedMonthIndex === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue("เดือนที่ทำเครื่องหมายล่าสุด");
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue("ปีที่ทำเครื่องหมายล่าสุด");
    }

    // อัพเดตคอลัมน์
    if (completedIndex !== -1) {
      // อัพเดตสถานะ "ทำรายการแล้ว"
      sheet.getRange(updateData.id + 1, completedIndex + 1).setValue(true);
      sheet.getRange(updateData.id + 1, completedIndex + 1).insertCheckboxes();
    }

    if (completedDateIndex !== -1) {
      // อัพเดตวันที่ทำรายการในรูปแบบวัตถุ Date
      let completedDate;
      if (updateData.ทำรายการเมื่อ) {
        completedDate = new Date(updateData.ทำรายการเมื่อ);
      } else {
        completedDate = new Date();
      }

      sheet.getRange(updateData.id + 1, completedDateIndex + 1).setValue(completedDate);
    }

    // บันทึกเดือนและปีปัจจุบัน
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // ดึงค่าคอลัมน์ใหม่อีกครั้ง (กรณีมีการเพิ่มคอลัมน์ใหม่)
    const updatedHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const updatedLastMarkedMonthIndex = updatedHeaders.indexOf("เดือนที่ทำเครื่องหมายล่าสุด");
    const updatedLastMarkedYearIndex = updatedHeaders.indexOf("ปีที่ทำเครื่องหมายล่าสุด");

    if (updatedLastMarkedMonthIndex !== -1) {
      sheet.getRange(updateData.id + 1, updatedLastMarkedMonthIndex + 1).setValue(currentMonth);
    }

    if (updatedLastMarkedYearIndex !== -1) {
      sheet.getRange(updateData.id + 1, updatedLastMarkedYearIndex + 1).setValue(currentYear);
    }

    clearSummaryCacheForTenant(sheetID);
    return { success: true, message: "อัพเดตสถานะเสร็จสิ้น" };
  } catch (e) {
    return { success: false, message: "เกิดข้อผิดพลาดในการอัพเดตสถานะ: " + e };
  }
}


// ตรวจสอบและรีเซ็ตการแจ้งเตือนรายเดือน
function checkMonthlyMaintenance(sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);
  try {
    const sheet = ss.getSheetByName(MAINTENANCE_SHEET);
    if (!sheet || sheet.getLastRow() <= 1) return;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // ดึงข้อมูลทั้งหมด
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];

    // หาคอลัมน์
    const typeIndex = headers.indexOf("รูปแบบการแจ้งเตือน");
    const completedIndex = headers.indexOf("ทำรายการแล้ว");
    const lastMarkedMonthIndex = headers.indexOf("เดือนที่ทำเครื่องหมายล่าสุด");
    const lastMarkedYearIndex = headers.indexOf("ปีที่ทำเครื่องหมายล่าสุด");

    // ถ้าไม่มีคอลัมน์ที่จำเป็น ให้ออกจากฟังก์ชัน
    if (typeIndex === -1 || completedIndex === -1) return;

    // ตรวจสอบแต่ละแถว
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      // เฉพาะการแจ้งเตือนทุกเดือนที่ทำเครื่องหมายเสร็จสิ้นแล้ว
      if (row[typeIndex] === "ทุกเดือน" && row[completedIndex] === true) {
        let shouldReset = false;

        // กรณีมีการบันทึกเดือนปีที่ทำเครื่องหมายล่าสุด
        if (lastMarkedMonthIndex !== -1 && lastMarkedYearIndex !== -1) {
          const lastMarkedMonth = row[lastMarkedMonthIndex];
          const lastMarkedYear = row[lastMarkedYearIndex];

          // ถ้าเป็นเดือนใหม่หรือปีใหม่
          if (lastMarkedMonth && lastMarkedYear) {
            if (currentYear > lastMarkedYear ||
              (currentYear === lastMarkedYear && currentMonth > lastMarkedMonth)) {
              shouldReset = true;
            }
          } else {
            // ถ้าไม่มีข้อมูลเดือนปีที่ทำเครื่องหมาย
            shouldReset = true;
          }
        } else {
          // ถ้าไม่มีคอลัมน์เดือนปีที่ทำเครื่องหมาย
          shouldReset = true;
        }

        // รีเซ็ตสถานะเป็นยังไม่เสร็จสิ้น
        if (shouldReset) {
          sheet.getRange(i + 1, completedIndex + 1).setValue(false);
          sheet.getRange(i + 1, completedIndex + 1).insertCheckboxes();
          Logger.log("รีเซ็ตสถานะการแจ้งเตือนทุกเดือน ID: " + i);
        }
      }
    }
  } catch (e) {
    Logger.log("เกิดข้อผิดพลาดใน checkMonthlyMaintenance: " + e);
  }
}


// ฟังก์ชันสำหรับลบการแจ้งเตือน
function deleteMaintenance(maintenanceId, sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);
  const sheet = ss.getSheetByName(MAINTENANCE_SHEET);

  // ตรวจสอบว่ามีข้อมูลในชีทหรือไม่
  if (sheet.getLastRow() <= 1) {
    return { success: false, message: "ไม่พบข้อมูลการแจ้งเตือนในระบบ" };
  }

  // ตรวจสอบว่า maintenanceId อยู่ในช่วงที่ถูกต้อง
  if (maintenanceId <= 0 || maintenanceId >= sheet.getLastRow()) {
    return { success: false, message: "รหัสการแจ้งเตือนไม่ถูกต้อง" };
  }

  try {
    // ลบแถวที่กำหนด (maintenanceId + 1 เพราะแถวแรกเป็นหัวข้อ)
    sheet.deleteRow(maintenanceId + 1);

    clearSummaryCacheForTenant(sheetID);
    return { success: true, message: "ลบการแจ้งเตือนสำเร็จ" };
  } catch (e) {
    return { success: false, message: "เกิดข้อผิดพลาดในการลบข้อมูล: " + e };
  }
}

// ฟังก์ชันสำหรับอัพเดตระยะทางของรถ
function updateCarMileage(carId, newMileage, sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);
  const carsSheet = ss.getSheetByName(CARS_SHEET);
  const maintenanceSheet = ss.getSheetByName(MAINTENANCE_SHEET);

  // ตรวจสอบว่ามีข้อมูลในชีทรถหรือไม่
  if (carsSheet.getLastRow() <= 1) {
    return { success: false, message: "ไม่พบข้อมูลรถในระบบ" };
  }

  // ตรวจสอบว่า carId อยู่ในช่วงที่ถูกต้อง
  if (carId <= 0 || carId >= carsSheet.getLastRow()) {
    return { success: false, message: "รหัสรถไม่ถูกต้อง" };
  }

  try {
    // ดึงข้อมูลรถ
    const carData = carsSheet.getRange(carId + 1, 1, 1, carsSheet.getLastColumn()).getValues()[0];
    const carHeaders = carsSheet.getRange(1, 1, 1, carsSheet.getLastColumn()).getValues()[0];

    // หาคอลัมน์ระยะทางปัจจุบัน
    const mileageIndex = carHeaders.indexOf("ระยะทางปัจจุบัน");

    // ถ้าไม่มีคอลัมน์ระยะทางปัจจุบัน ให้เพิ่มใหม่
    if (mileageIndex === -1) {
      carsSheet.getRange(1, carsSheet.getLastColumn() + 1).setValue("ระยะทางปัจจุบัน");
      carsSheet.getRange(carId + 1, carsSheet.getLastColumn()).setValue(newMileage);
    } else {
      // อัพเดตระยะทางปัจจุบัน
      carsSheet.getRange(carId + 1, mileageIndex + 1).setValue(newMileage);
    }

    // อัพเดตระยะทางในการแจ้งเตือนที่เกี่ยวข้อง
    if (maintenanceSheet && maintenanceSheet.getLastRow() > 1) {
      // ดึงข้อมูลรถเป็นสตริง (ในรูปแบบ "ยี่ห้อ รุ่น (ทะเบียน)")
      const carString = `${carData[carHeaders.indexOf("ยี่ห้อ")]} ${carData[carHeaders.indexOf("รุ่น")]} (${carData[carHeaders.indexOf("ทะเบียน")]})`;

      // ดึงข้อมูลการแจ้งเตือนทั้งหมด
      const maintenanceData = maintenanceSheet.getDataRange().getValues();
      const maintenanceHeaders = maintenanceData[0];

      // หาคอลัมน์ต่างๆ
      const carIndex = maintenanceHeaders.indexOf("รถ");
      const typeIndex = maintenanceHeaders.indexOf("รูปแบบการแจ้งเตือน");
      const currentMileageIndex = maintenanceHeaders.indexOf("ระยะทางปัจจุบัน");

      // อัพเดตระยะทางปัจจุบันในการแจ้งเตือนที่เกี่ยวข้อง
      for (let i = 1; i < maintenanceData.length; i++) {
        if (maintenanceData[i][carIndex] === carString &&
          maintenanceData[i][typeIndex] === "ตามระยะทางที่กำหนด" &&
          currentMileageIndex !== -1) {
          maintenanceSheet.getRange(i + 1, currentMileageIndex + 1).setValue(newMileage);
        }
      }
    }

    return { success: true, message: "อัพเดตระยะทางสำเร็จ" };
  } catch (e) {
    return { success: false, message: "เกิดข้อผิดพลาดในการอัพเดตระยะทาง: " + e };
  }
}




function searchBookingsWithFilters(filters, sheetID) {
  Logger.log("--- เริ่ม searchBookingsWithFilters ---");
  Logger.log("Sheet ID: " + sheetID + ", Filters: " + JSON.stringify(filters));
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(RENTAL_SHEET);
    const allData = sheet.getDataRange().getValues();
    const headers = allData.shift();
    Logger.log("Headers ที่อ่านได้: " + headers.join(', '));
    const results = [];
    allData.forEach((row, index) => {
      let isMatch = true;
      for (const key in filters) {
        if (filters[key]) {
          const colIndex = headers.indexOf(key);
          if (colIndex !== -1) {
            const cellValue = row[colIndex] ? row[colIndex].toString().toLowerCase() : "";
            if (!cellValue.includes(filters[key].toString().toLowerCase())) {

              isMatch = false;
              break;
            }
          }
        }
      }

      if (isMatch) {
        const rental = {};
        headers.forEach((header, i) => {
          const cellValue = row[i];

          // --- ✅ ส่วนที่แก้ไขใหม่ทั้งหมด ---
          if ((header === 'วันที่เช่า' || header === 'วันที่คืน') && cellValue instanceof Date) {
            // แก้ปัญหา Timezone โดยการ Format วันที่ใน Timezone กรุงเทพ
            rental[header] = Utilities.formatDate(cellValue, "Asia/Bangkok", "yyyy-MM-dd");
          } else if ((header === 'เวลารับรถ' || header === 'เวลาคืนรถ')) {
            // แก้ปัญหาการแสดงผลเวลา โดยการ Format ให้เป็น HH:mm
            rental[header] = formatToHHMM_(cellValue);
          } else {
            rental[header] = cellValue;
          }
          // --- ✅ สิ้นสุดส่วนที่แก้ไข ---
        });
        rental.rowIndex = index + 2;
        results.push(rental);
      }
    });

    Logger.log("ค้นหาเสร็จสิ้น พบ " + results.length + " รายการ");
    return JSON.stringify({ success: true, data: results });

  } catch (e) {
    Logger.log("!!!!!! ERROR in searchBookingsWithFilters: " + e.stack);
    return JSON.stringify({ success: false, message: e.message });
  }
}



function searchBookingsAdvanced(query, sheetID) {
  Logger.log("--- เริ่ม searchBookingsAdvanced ---");
  Logger.log("Sheet ID: " + sheetID + ", Query: " + query);
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(RENTAL_SHEET);
    const allData = sheet.getDataRange().getValues();
    const headers = allData.shift();
    Logger.log("Headers ที่อ่านได้: " + headers.join(', '));
    const results = [];
    const lowerCaseQuery = query.toLowerCase();

    allData.forEach((row, index) => {
      if (row.some(cell => cell && cell.toString().toLowerCase().includes(lowerCaseQuery))) {
        Logger.log("แถวที่ " + (index + 2) + " ตรงเงื่อนไข");
        const rental = {};
        headers.forEach((header, i) => {
          const cellValue = row[i];

          // --- ✅ ส่วนที่แก้ไขใหม่ทั้งหมด ---
          if ((header === 'วันที่เช่า' || header === 'วันที่คืน') && cellValue instanceof Date) {
            // แก้ปัญหา Timezone โดยการ Format วันที่ใน Timezone กรุงเทพ
            rental[header] = Utilities.formatDate(cellValue, "Asia/Bangkok", "yyyy-MM-dd");
          } else if ((header === 'เวลารับรถ' || header === 'เวลาคืนรถ')) {
            // แก้ปัญหาการแสดงผลเวลา โดยการ Format ให้เป็น HH:mm
            rental[header] = formatToHHMM_(cellValue);
          } else {
            rental[header] = cellValue;
          }
          // --- ✅ สิ้นสุดส่วนที่แก้ไข ---
        });
        rental.rowIndex = index + 2;

        results.push(rental);
      }
    });
    Logger.log("ค้นหาเสร็จสิ้น พบ " + results.length + " รายการ");
    return JSON.stringify({ success: true, data: results });

  } catch (e) {
    Logger.log("!!!!!! ERROR in searchBookingsAdvanced: " + e.stack);
    return JSON.stringify({ success: false, message: e.message });
  }
}



// === ✅ เพิ่มฟังก์ชันสำหรับตรวจสอบคอลัมน์ ===
function checkSearchBookingsColumns(sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName('รายการเช่า');

    if (!sheet) {
      console.log("❌ ไม่พบชีต 'รายการเช่า'");
      return;
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    console.log("📋 Headers ทั้งหมดในแผ่นงาน:");
    headers.forEach((header, index) => {
      console.log(`   ${index}: ${header}`);
    });

    const calendarColumns = ['IDกิจกรรมปฏิทิน', 'IDปฏิทิน', 'ลิงก์ปฏิทิน'];
    console.log("\n🔍 ตรวจสอบคอลัมน์กิจกรรมปฏิทิน:");
    calendarColumns.forEach(column => {
      const index = headers.indexOf(column);
      if (index === -1) {
        console.log(`   ❌ ไม่พบคอลัมน์: ${column}`);
      } else {
        console.log(`   ✅ พบคอลัมน์: ${column} ที่ตำแหน่ง ${index}`);

        // ตรวจสอบข้อมูลในคอลัมน์นี้ (3 แถวแรก)
        const sampleData = sheet.getRange(2, index + 1, Math.min(3, sheet.getLastRow() - 1), 1)
          .getValues().flat();
        console.log(`     ข้อมูลตัวอย่าง: ${JSON.stringify(sampleData)}`);
      }
    });

  } catch (error) {
    console.log("❌ เกิดข้อผิดพลาดในการตรวจสอบคอลัมน์:", error);
  }
}

// === ✅ ฟังก์ชันทดสอบ ===
function testSearchBookingsAdvanced() {
  const sheetID = '1qLubMynT8kMnb4gBt9xBayD-BHrfHN08jRZNDqwPiAA'; // ใส่ Sheet ID ของคุณ

  // ตรวจสอบคอลัมน์ก่อน
  console.log("=== ตรวจสอบคอลัมน์ ===");
  checkSearchBookingsColumns(sheetID);

  // ทดสอบค้นหา
  console.log("\n=== ทดสอบการค้นหา ===");
  const result = searchBookingsAdvanced('KP', sheetID); // ค้นหารายการที่มี 'KP'
  const parsed = JSON.parse(result);

  if (parsed.success && parsed.data.length > 0) {
    console.log("✅ ผลการค้นหา:", parsed.data[0]);
  } else {
    console.log("❌ ไม่พบผลลัพธ์หรือเกิดข้อผิดพลาด:", parsed);
  }
}









/**
 * เรียงลำดับผลลัพธ์ตามเงื่อนไขที่กำหนด
 * @param {Array} results - ผลลัพธ์ที่จะเรียงลำดับ
 * @param {string} sortBy - เงื่อนไขการเรียงลำดับ (เช่น date_asc, name_desc)
 */
function sortResults(results, sortBy) {
  if (!results || !sortBy) return;

  switch (sortBy) {
    case 'date_asc':
      results.sort((a, b) => {
        const dateA = new Date(a.วันที่เช่า);
        const dateB = new Date(b.วันที่เช่า);
        return dateA - dateB;
      });
      break;

    case 'date_desc':
      results.sort((a, b) => {
        const dateA = new Date(a.วันที่เช่า);
        const dateB = new Date(b.วันที่เช่า);
        return dateB - dateA;
      });
      break;

    case 'name_asc':
      results.sort((a, b) => {
        const nameA = String(a.ชื่อลูกค้า || '').toUpperCase();
        const nameB = String(b.ชื่อลูกค้า || '').toUpperCase();
        return nameA.localeCompare(nameB);
      });
      break;

    case 'name_desc':
      results.sort((a, b) => {
        const nameA = String(a.ชื่อลูกค้า || '').toUpperCase();
        const nameB = String(b.ชื่อลูกค้า || '').toUpperCase();
        return nameB.localeCompare(nameA);
      });
      break;
  }
}

/**
 * ค้นหาข้อเสนอแนะสำหรับการค้นหาอัตโนมัติ
 * @param {string} query - คำค้นหา
 * @return {Array} รายการคำแนะนำสำหรับ autocomplete
 */
function getSearchSuggestions(query, sheetID) {
  try {
    if (!query || query.trim() === '') {
      return [];
    }

    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName('รายการเช่า');

    if (!sheet) {
      return [];
    }

    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();

    if (values.length <= 1) {
      return [];
    }

    const headers = values[0];
    const queryUpper = query.toUpperCase().trim();

    // เก็บคำแนะนำที่ไม่ซ้ำกัน
    const suggestions = new Set();

    // ดึงข้อมูลจากคอลัมน์ที่สำคัญ
    const importantColumns = [1, 2, 3, 4, 5, 21, 22]; // หมายเลขการจอง, ชื่อลูกค้า, เบอร์โทร, รถ, ทะเบียน, เลขบัตรประชาชน, ใบขับขี่

    // ค้นหาข้อมูลในแต่ละแถว
    for (let i = 1; i < values.length && suggestions.size < 5; i++) {
      const row = values[i];

      for (const colIndex of importantColumns) {
        if (row[colIndex]) {
          const cellValue = String(row[colIndex]);
          const cellValueUpper = cellValue.toUpperCase();

          if (cellValueUpper.includes(queryUpper)) {
            // ถ้าค่าในเซลล์มีคำค้นหา ให้เพิ่มในรายการแนะนำ
            suggestions.add(cellValue);

            // ถ้ามีคำแนะนำครบ 5 รายการแล้ว ให้หยุดการค้นหา
            if (suggestions.size >= 5) {
              break;
            }
          }
        }
      }
    }

    // แปลง Set เป็น Array และส่งคืน
    return Array.from(suggestions);

  } catch (e) {
    Logger.log('เกิดข้อผิดพลาดในการดึงคำแนะนำ: ' + e.toString());
    return [];
  }
}



// ค้นหารถว่าง

function getAvailableCars(sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const carsSheet = ss.getSheetByName(CARS_SHEET);

    if (!carsSheet) {
      throw new Error(`ไม่พบแผ่นงาน "${CARS_SHEET}"`);
    }

    // Get all data from the cars sheet
    const carsData = carsSheet.getDataRange().getValues();

    // Extract header row
    const headers = carsData[0];

    // Find the column index for the status
    const statusColIndex = headers.indexOf("สถานะ");

    if (statusColIndex === -1) {
      throw new Error(`ไม่พบคอลัมน์ "สถานะ" ในแผ่นงาน "${CARS_SHEET}"`);
    }

    // Convert the data to an array of objects
    const cars = [];

    for (let i = 1; i < carsData.length; i++) {
      const row = carsData[i];

      // Skip rows with empty values in important columns
      if (!row[0] || row[0] === "") continue;

      // Create a car object with all columns
      const car = {};

      for (let j = 0; j < headers.length; j++) {
        car[headers[j]] = row[j];
      }

      // Only include cars with status "พร้อมให้เช่า"
      if (car["สถานะ"] === CAR_STATUS_READY) {
        cars.push(car);
      }
    }

    return cars;
  } catch (error) {
    Logger.log(`Error in getAvailableCars: ${error.message}`);
    throw new Error(`ไม่สามารถดึงข้อมูลรถได้: ${error.message}`);
  }
}

/**
 * Get all rental records from the rental sheet
 * @returns {Array} Array of rental objects
 */
function getRentalRecords(sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const rentalSheet = ss.getSheetByName(RENTAL_SHEET);

    if (!rentalSheet) {
      throw new Error(`ไม่พบแผ่นงาน "${RENTAL_SHEET}"`);
    }

    // Get all data from the rental sheet
    const rentalData = rentalSheet.getDataRange().getValues();

    // Extract header row
    const headers = rentalData[0];

    // Find the required column indices
    const carModelColIndex = headers.indexOf("รถ");
    const pickupDateColIndex = headers.indexOf("วันที่เช่า");
    const pickupTimeColIndex = headers.indexOf("เวลารับรถ");
    const returnDateColIndex = headers.indexOf("วันที่คืน");
    const returnTimeColIndex = headers.indexOf("เวลาคืนรถ");
    const statusColIndex = headers.indexOf("สถานะ");

    // Validate that all required columns exist
    if (carModelColIndex === -1 ||
      pickupDateColIndex === -1 ||
      pickupTimeColIndex === -1 ||
      returnDateColIndex === -1 ||
      returnTimeColIndex === -1 ||
      statusColIndex === -1) {
      throw new Error("ไม่พบคอลัมน์ที่จำเป็นในแผ่นงานรายการเช่า");
    }

    // Convert the data to an array of rental objects
    const rentals = [];

    for (let i = 1; i < rentalData.length; i++) {
      const row = rentalData[i];

      // Skip rows with empty values in important columns
      if (!row[carModelColIndex] || !row[pickupDateColIndex] || !row[returnDateColIndex]) continue;

      // Create a rental object with normalized date and time values
      const rental = {
        รถ: row[carModelColIndex],
        วันที่เช่า: normalizeDate(row[pickupDateColIndex]),
        เวลารับรถ: normalizeTime(row[pickupTimeColIndex]),
        วันที่คืน: normalizeDate(row[returnDateColIndex]),
        เวลาคืนรถ: normalizeTime(row[returnTimeColIndex]),
        สถานะ: row[statusColIndex]
      };

      // Add the full rental object for debugging
      for (let j = 0; j < headers.length; j++) {
        rental[headers[j]] = row[j];
      }

      rentals.push(rental);
    }

    return rentals;
  } catch (error) {
    Logger.log(`Error in getRentalRecords: ${error.message}`);
    throw new Error(`ไม่สามารถดึงข้อมูลการเช่าได้: ${error.message}`);
  }
}





function normalizeDateToStartOfDay(date) {
  if (!(date instanceof Date)) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}


/**
 * Normalize date value to YYYY-MM-DD format
 * @param {Date|string} date - Date to normalize
 * @returns {string} Normalized date string
 */
function normalizeDate(date) {
  if (!date) return null;

  try {
    // If already a Date object
    if (date instanceof Date) {
      return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
    }

    // If a string, try to parse it
    if (typeof date === 'string') {
      // Check if format is already yyyy-MM-dd
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }

      // Check if format is dd/MM/yyyy
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date)) {
        const parts = date.split('/');
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    // Create a date object and format it
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new Error(`Invalid date: ${date}`);
    }

    return Utilities.formatDate(dateObj, Session.getScriptTimeZone(), "yyyy-MM-dd");
  } catch (error) {
    Logger.log(`Error normalizing date ${date}: ${error.message}`);
    // Return the original value if normalization fails
    return typeof date === 'string' ? date : date.toString();
  }
}



/**
 * Parse date and time into a Date object
 * @param {string|Date} dateStr - Date string or Date object
 * @param {string|Date|number} timeStr - Time string, Date object, or number (Google Sheets time format)
 * @returns {Date} Date object representing the date and time
 */
function parseDateTime(dateStr, timeStr) {
  try {
    if (!dateStr) {
      throw new Error("Date is required");
    }

    // Create a new Date object from dateStr (whether it's string or Date)
    let dateObj;

    if (dateStr instanceof Date) {
      dateObj = new Date(dateStr.getTime());
    } else {
      // Try to parse the date string
      dateObj = new Date(dateStr);

      // If it failed, try to parse dd/mm/yyyy format
      if (isNaN(dateObj.getTime()) && typeof dateStr === 'string' && dateStr.includes('/')) {
        const parts = dateStr.split('/');
        dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    }

    if (isNaN(dateObj.getTime())) {
      throw new Error(`Invalid date: ${dateStr}`);
    }

    // Handle the time part
    if (timeStr) {
      let hours = 0;
      let minutes = 0;

      if (typeof timeStr === 'string') {
        // Format "HH:MM"
        if (timeStr.includes(':')) {
          const timeParts = timeStr.split(':');
          hours = parseInt(timeParts[0]);
          minutes = parseInt(timeParts[1]);
        }
      } else if (timeStr instanceof Date) {
        // Extract hours and minutes from Date object (likely from Google Sheets)
        hours = timeStr.getHours();
        minutes = timeStr.getMinutes();
      } else if (typeof timeStr === 'number') {
        // Google Sheets stores times as decimal fractions of a day
        // E.g., 0.5 means 12:00 (noon), 0.75 means 18:00 (6 PM)
        const totalMinutes = Math.round(timeStr * 24 * 60);
        hours = Math.floor(totalMinutes / 60);
        minutes = totalMinutes % 60;
      }

      // Set the time part on the date object
      dateObj.setHours(hours, minutes, 0, 0);
    }

    return dateObj;
  } catch (error) {
    Logger.log(`Error parsing date ${dateStr} and time ${timeStr}: ${error.message}`);
    throw error;
  }
}

/**
 * Normalize time value to HH:MM format
 * @param {string|Date|number} time - Time to normalize
 * @returns {string} Normalized time string
 */
function normalizeTime(time) {
  if (!time) return "00:00";

  try {
    let hours = 0;
    let minutes = 0;

    // If already in correct format HH:MM
    if (typeof time === 'string' && /^\d{1,2}:\d{2}$/.test(time)) {
      const [h, m] = time.split(':');
      hours = parseInt(h);
      minutes = parseInt(m);
    }
    // If it's a Date object (common for Google Sheets)
    else if (time instanceof Date) {
      hours = time.getHours();
      minutes = time.getMinutes();
    }
    // If it's a number (Google Sheets decimal time format)
    else if (typeof time === 'number') {
      const totalMinutes = Math.round(time * 24 * 60);
      hours = Math.floor(totalMinutes / 60);
      minutes = totalMinutes % 60;
    }
    // Try to handle other formats
    else {
      const timeStr = time.toString();

      // Handle special case for times like "12.30" (dot instead of colon)
      if (/^\d{1,2}\.\d{2}$/.test(timeStr)) {
        const [h, m] = timeStr.split('.');
        hours = parseInt(h);
        minutes = parseInt(m);
      }
      // Extract times from standard date strings
      else if (timeStr.includes(':')) {
        const match = timeStr.match(/(\d{1,2}):(\d{2})/);
        if (match) {
          hours = parseInt(match[1]);
          minutes = parseInt(match[2]);
        }
      }
    }

    // Format the time as HH:MM
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } catch (error) {
    Logger.log(`Error normalizing time ${time}: ${error.message}`);
    return "00:00";
  }
}

/**
 * Check if a car is available during a specific time range
 * @param {Object} car - Car object
 * @param {Array} rentals - Array of rental objects
 * @param {Date} pickupDateTime - Adjusted pickup date and time
 * @param {Date} returnDateTime - Adjusted return date and time
 * @returns {boolean} True if the car is available, false otherwise
 */
function isCarAvailable(car, rentals, pickupDateTime, returnDateTime) {
  // Find all rentals for this specific car
  const carRentals = rentals.filter(rental => {
    // Check if this rental is for the current car
    // Compare both by full name (รถ), and partial matches that may include license plate
    return rental.รถ === car.ยี่ห้อ + " " + car.รุ่น ||
      rental.รถ === car.ยี่ห้อ + " " + car.รุ่น + " (" + car.ทะเบียน + ")" ||
      (typeof rental.รถ === 'string' &&
        rental.รถ.includes(car.ยี่ห้อ) &&
        rental.รถ.includes(car.รุ่น) &&
        rental.รถ.includes(car.ทะเบียน));
  });

  // If there are no rentals for this car, it's available
  if (carRentals.length === 0) {
    return true;
  }

  // Check if any of the rentals overlap with the requested time range
  for (const rental of carRentals) {
    try {
      // Skip rentals that are marked as cancelled or similar
      if (rental.สถานะ &&
        (rental.สถานะ.toLowerCase().includes("ยกเลิก") ||
          rental.สถานะ.toLowerCase().includes("cancel"))) {
        continue;
      }

      // Parse rental dates and times
      const rentalPickupDateTime = parseDateTime(rental.วันที่เช่า, rental.เวลารับรถ);
      const rentalReturnDateTime = parseDateTime(rental.วันที่คืน, rental.เวลาคืนรถ);

      // Check for overlap
      if (!(returnDateTime <= rentalPickupDateTime || pickupDateTime >= rentalReturnDateTime)) {
        // There is an overlap, so the car is not available
        return false;
      }
    } catch (error) {
      Logger.log(`Error checking rental overlap for car ${car.ยี่ห้อ} ${car.รุ่น}: ${error.message}`);
      // If there's an error, we'll assume the car is not available to be safe
      return false;
    }
  }

  // If we've checked all rentals and found no overlaps, the car is available
  return true;
}



/**
 * Find available cars for a specific date and time range
 * @param {string} pickupDate - Pickup date in YYYY-MM-DD format
 * @param {string} pickupTime - Pickup time in HH:MM format
 * @param {string} returnDate - Return date in YYYY-MM-DD format
 * @param {string} returnTime - Return time in HH:MM format
 * @param {number} prepTimeMinutes - Preparation time in minutes
 * @returns {Object} Object containing array of available cars
 */
function findAvailableCars(pickupDate, pickupTime, returnDate, returnTime, prepTimeMinutes, sheetID) {
  try {
    // Validate inputs
    if (!pickupDate || !pickupTime || !returnDate || !returnTime) {
      throw new Error("กรุณากรอกข้อมูลวันที่และเวลาให้ครบถ้วน");
    }

    // Convert date strings to Date objects
    const pickupDateTime = new Date(`${pickupDate}T${pickupTime}:00`);
    const returnDateTime = new Date(`${returnDate}T${returnTime}:00`);

    // Adjust for preparation time
    // Subtract prep time from pickup and add prep time to return
    const adjustedPickupDateTime = new Date(pickupDateTime.getTime() - (prepTimeMinutes * 60 * 1000));
    const adjustedReturnDateTime = new Date(returnDateTime.getTime() + (prepTimeMinutes * 60 * 1000));

    // Validate date range
    if (returnDateTime <= pickupDateTime) {
      throw new Error("วันที่และเวลาคืนรถต้องมากกว่าวันที่และเวลารับรถ");
    }

    // First, get all cars that are ready for rent
    const allAvailableCars = getAvailableCars(sheetID);

    // Load all rental records
    const rentals = getRentalRecords(sheetID);

    logRentalData(rentals);

    // Filter out cars that are already booked during the requested time range
    const availableCars = allAvailableCars.filter(car => {
      return isCarAvailable(car, rentals, adjustedPickupDateTime, adjustedReturnDateTime);
    });

    // Log the result
    Logger.log(`Found ${availableCars.length} available cars out of ${allAvailableCars.length} total cars`);

    return {
      availableCars: availableCars,
      totalCars: allAvailableCars.length,
      requestDetails: {
        pickupDate: pickupDate,
        pickupTime: pickupTime,
        returnDate: returnDate,
        returnTime: returnTime,
        prepTimeMinutes: prepTimeMinutes
      }
    };
  } catch (error) {
    Logger.log(`Error in findAvailableCars: ${error.message}`);
    throw new Error(`ไม่สามารถค้นหารถว่างได้: ${error.message}`);
  }
}






/**
 * Log rental data for debugging
 * @param {Array} rentals - Array of rental objects
 */
function logRentalData(rentals) {
  if (!rentals || rentals.length === 0) {
    Logger.log("No rental data available");
    return;
  }

  // Log the first few rentals for debugging
  const samplesToLog = Math.min(rentals.length, 3);

  for (let i = 0; i < samplesToLog; i++) {
    const rental = rentals[i];
    Logger.log(`======= Rental ${i + 1} =======`);
    Logger.log(`รถ: ${rental.รถ}`);
    Logger.log(`วันที่เช่า (raw): ${rental.วันที่เช่า}`);
    Logger.log(`เวลารับรถ (raw): ${rental.เวลารับรถ}`);

    if (rental.เวลารับรถ instanceof Date) {
      Logger.log(`เวลารับรถ (as Date): ${rental.เวลารับรถ.toISOString()}`);
      Logger.log(`เวลารับรถ (hours): ${rental.เวลารับรถ.getHours()}`);
      Logger.log(`เวลารับรถ (minutes): ${rental.เวลารับรถ.getMinutes()}`);
    }

    if (typeof rental.เวลารับรถ === 'number') {
      Logger.log(`เวลารับรถ (as number): ${rental.เวลารับรถ}`);
      const hours = Math.floor(rental.เวลารับรถ * 24);
      const minutes = Math.round((rental.เวลารับรถ * 24 - hours) * 60);
      Logger.log(`เวลารับรถ (calculated): ${hours}:${minutes}`);
    }

    // Try to parse and normalize
    try {
      const normalizedTime = normalizeTime(rental.เวลารับรถ);
      Logger.log(`เวลารับรถ (normalized): ${normalizedTime}`);

      const dateTime = parseDateTime(rental.วันที่เช่า, rental.เวลารับรถ);
      Logger.log(`วันที่และเวลารับรถ (parsed): ${dateTime.toISOString()}`);
    } catch (error) {
      Logger.log(`Error parsing rental data: ${error.message}`);
    }
  }
}




//ประกาศ

// ========================================================================
// START: ANNOUNCEMENT AND PROBLEM REPORTING FUNCTIONS
// ========================================================================

const SHEET_Announcements = '1JEbD4MOM1jgm6cA9D4AlW8z8x4yUZo1rfys6u4a_hvc';
const SHEET_Announcements_NAME = 'Announcements';
const SHEET_ProblemReports_NAME = 'ProblemReports';



/**
 * ดึงข้อมูลประกาศทั้งหมดที่ยังไม่หมดอายุและเผยแพร่แล้ว (เวอร์ชันแก้ไข)
 */
function getAllAnnouncements() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_Announcements);
    const sheet = ss.getSheetByName(SHEET_Announcements_NAME);
    if (!sheet) {
      const newSheet = ss.insertSheet(SHEET_Announcements_NAME);
      newSheet.appendRow(['Title', 'Detail', 'Type', 'StartDate', 'EndDate', 'IsPublished']);
      return { success: true, data: [] };
    }

    const data = sheet.getDataRange().getValues();
    data.shift(); // เอาหัวข้อออก

    const today = new Date();
    today.setHours(0, 0, 0, 0); // กำหนดเวลาเป็นเที่ยงคืนเพื่อใช้เปรียบเทียบ

    const announcements = data
      .map((row, index) => ({
        id: index,
        title: row[0] || '',
        detail: row[1] || '',
        type: (row[2] || 'general').toLowerCase(),
        startDate: row[3] ? new Date(row[3]) : null,
        endDate: row[4] ? new Date(row[4]) : null,
        isPublished: row[5] === true,
      }))
      .filter(ann => {
        // ขั้นตอนการกรองที่ปลอดภัยและเข้าใจง่ายขึ้น
        if (!ann.isPublished) {
          return false;
        }

        // ann.startDate เป็น Date object หรือ null อยู่แล้ว
        const start = ann.startDate;

        // สำหรับวันสิ้นสุด เราต้องสร้าง Date object ใหม่และกำหนดเวลาเป็นท้ายสุดของวัน
        const end = ann.endDate ? new Date(ann.endDate) : null;
        if (end) {
          end.setHours(23, 59, 59, 999);
        }

        // ตรวจสอบว่าวันนี้อยู่ในช่วงที่กำหนดหรือไม่
        const isAfterStart = start ? today >= start : true;
        const isBeforeEnd = end ? today <= end : true;

        return isAfterStart && isBeforeEnd;
      })
      .map(ann => {
        // แปลง Date object เป็น String เพื่อส่งไปให้หน้าเว็บ
        return {
          ...ann,
          startDate: ann.startDate ? ann.startDate.toISOString().split('T')[0] : '',
          endDate: ann.endDate ? ann.endDate.toISOString().split('T')[0] : '',
        }
      });

    return { success: true, data: announcements };
  } catch (error) {
    // เพิ่มการ Log stack trace เพื่อให้แก้ปัญหาง่ายขึ้นในอนาคต
    Logger.log('Error in getAllAnnouncements: ' + error.message + ' Stack: ' + error.stack);
    return { success: false, message: error.message };
  }
}





/**
 * บันทึกปัญหาการใช้งานลงในชีต
 */
function reportProblem(problemData) {
  try {
    const { storeName, problemType, details } = problemData;
    const ss = SpreadsheetApp.openById(SHEET_Announcements);
    let sheet = ss.getSheetByName(SHEET_ProblemReports_NAME);

    // สร้างชีตถ้ายังไม่มี
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_ProblemReports_NAME);
      sheet.appendRow(['Timestamp', 'StoreName', 'ProblemType', 'Details']);
    }

    sheet.appendRow([new Date(), storeName, problemType, details]);
    return { success: true };
  } catch (error) {
    Logger.log('Error in reportProblem: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * ตรวจสอบว่ามีปัญหาร้ายแรงที่ต้องล็อกระบบหรือไม่
 */
function checkCriticalProblems() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_Announcements);
    const sheet = ss.getSheetByName(SHEET_ProblemReports_NAME);
    if (!sheet) {
      return { shouldLock: false };
    }
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { shouldLock: false };

    const today = new Date().toISOString().slice(0, 10);
    const criticalReportsToday = new Set();

    for (let i = data.length - 1; i > 0; i--) {
      const row = data[i];
      // ตรวจสอบว่า row[0] (Timestamp) มีค่าและเป็น Date object ที่ถูกต้อง
      if (!row[0] || !(row[0] instanceof Date)) continue;

      const reportDate = new Date(row[0]).toISOString().slice(0, 10);
      const storeName = row[1];
      const problemType = row[2];

      if (reportDate === today && problemType === 'ร้ายแรง') {
        criticalReportsToday.add(storeName);
      }

      if (criticalReportsToday.size >= 2) {
        break;
      }
    }

    return { shouldLock: criticalReportsToday.size >= 2 };
  } catch (e) {
    Logger.log('Error in checkCriticalProblems: ' + e.message);
    return { shouldLock: false };
  }
}

// ========================================================================
// END: ANNOUNCEMENT AND PROBLEM REPORTING FUNCTIONS
// ========================================================================







function appendRegistration(sheetName, rowData) {
  const ss = SpreadsheetApp.openById(sheetID);
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    // ตั้งหัวคอลัมน์แรก
    sheet.appendRow(['Email', 'Password', 'Shop Name', 'Plan', 'Timestamp']);
  }
  sheet.appendRow(rowData);
}



// ฟังก์ชันรับข้อมูลการต่ออายุ License
function submitLicenseRenewal(formData) {
  Logger.log('--- เริ่ม submitLicenseRenewal ---');
  try {
    // ดึงค่าที่รับมา
    const {
      email, plan, renewalDate, storeSID,
      base64File, fileName, fileType
    } = formData;

    Logger.log(`ข้อมูลการต่ออายุ — email: ${email}, storeSID: ${storeSID}, plan: ${plan}`);

    // ถ้ามี base64File ให้แปลงเป็น Blob
    let slipBlob = null;
    if (base64File) {
      const decoded = Utilities.base64Decode(base64File);
      slipBlob = Utilities.newBlob(decoded, fileType || 'application/octet-stream', fileName || 'slip');
      Logger.log('สร้าง Blob จาก Base64 แล้ว: ' + slipBlob.getName());
    } else {
      Logger.log('ไม่มี base64File ส่งมา');
      throw new Error('ไม่พบไฟล์สลิปการชำระเงิน');
    }

    // บันทึกลงชีต
    const ss = SpreadsheetApp.openById('1JEbD4MOM1jgm6cA9D4AlW8z8x4yUZo1rfys6u4a_hvc');
    let sheet = ss.getSheetByName('ต่ออายุ');
    if (!sheet) {
      sheet = ss.insertSheet('ต่ออายุ');
      sheet.appendRow(['วันที่ต่ออายุ', 'อีเมล', 'แพลนที่เลือก', 'สถานะการชำระเงิน', 'ลิงก์สลิป', 'รหัสร้าน']);
      sheet.getRange('A1:F1').setBackground('#4285F4').setFontColor('#FFFFFF').setFontWeight('bold');
    }

    // อัพโหลดสลิปและบันทึกข้อมูล
    return saveLicenseRenewalToSheet(
      sheet,
      email, plan, renewalDate, slipBlob, storeSID
    );

  } catch (e) {
    Logger.log('Error in submitLicenseRenewal: ' + e);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาด: ' + e.message
    };
  }
}


// ฟังก์ชันบันทึกข้อมูลการต่ออายุลงชีต
function saveLicenseRenewalToSheet(
  sheet, email, plan, renewalDate, slipBlob, storeSID
) {
  Logger.log('--- เริ่ม saveLicenseRenewalToSheet ---');
  try {
    const folderId = '1mp5bBrR35TPJdcIGiVBVIf31kbh9RnPC'; // ใช้โฟลเดอร์เดียวกับการลงทะเบียน
    let fileUrl = 'ไม่มีสลิป';

    if (slipBlob) {
      try {
        const folder = DriveApp.getFolderById(folderId);
        const timestamp = new Date().getTime();
        // ใช้ storeSID แทน storeName ในการตั้งชื่อไฟล์
        const name = `สลิปต่ออายุ_${storeSID}_${timestamp}.${slipBlob.getName().split('.').pop()}`;
        const file = folder.createFile(slipBlob).setName(name);
        fileUrl = file.getUrl();
        Logger.log('อัพโหลดสลิปสำเร็จ: ' + fileUrl);
      } catch (dE) {
        Logger.log('Drive upload error: ' + dE);
        fileUrl = 'Error uploading slip: ' + dE.message;
      }
    }

    // แปลง renewalDate
    let dt = new Date(renewalDate);
    if (isNaN(dt)) dt = new Date();

    const row = [
      dt, email, plan, 'รอตรวจสอบ', fileUrl, storeSID
    ];
    sheet.appendRow(row);
    const last = sheet.getLastRow();
    sheet.autoResizeColumns(1, 6);

    Logger.log('บันทึกลง Sheet เรียบร้อย');

    // คำนวณวันหมดอายุใหม่ตามแผนที่เลือก
    let expireDate = new Date();
    let daysToExpiration = 0;

    switch (plan) {
      case 'monthly':
        expireDate.setMonth(expireDate.getMonth() + 1);
        daysToExpiration = 30;
        break;
      case 'yearly':
        expireDate.setFullYear(expireDate.getFullYear() + 1);
        daysToExpiration = 365;
        break;
      case 'lifetime':
        // ตั้งวันหมดอายุเป็น 100 ปีในอนาคต (เสมือนไม่มีวันหมดอายุ)
        expireDate.setFullYear(expireDate.getFullYear() + 100);
        daysToExpiration = 36500; // ประมาณ 100 ปี
        break;
    }

    // แปลงวันที่เป็น string format สำหรับ return กลับไปที่ client
    const expireDateString = Utilities.formatDate(expireDate, Session.getScriptTimeZone(), "yyyy-MM-dd");

    // ส่งแจ้งเตือนทั้ง Google Chat และ SMS
    // ใช้ storeSID แทน storeName ในการแจ้งเตือน
    const planText = getPlanText(plan);
    const smsText = `มีการต่ออายุ จากร้าน SID:${storeSID} แผน: ${planText}`;

    // ใช้ฟังก์ชัน sendNotification สำหรับแจ้งเตือน (ฟังก์ชันเดียวกับการลงทะเบียน)
    // แต่เราจะไม่ส่ง phoneNumber เพราะเราไม่มีข้อมูลนี้
    const notificationResult = sendRenewalNotification(email, storeSID, plan, smsText);

    return {
      success: true,
      message: 'บันทึกข้อมูลการต่ออายุเรียบร้อยแล้ว',
      expireDate: expireDateString,
      daysToExpiration: daysToExpiration,
      notificationResult: notificationResult
    };

  } catch (e) {
    Logger.log('Error in saveLicenseRenewalToSheet: ' + e);
    return {
      success: false,
      message: 'บันทึกข้อมูลการต่ออายุไม่สำเร็จ: ' + e.message
    };
  }
}




// ฟังก์ชันส่งการแจ้งเตือนการต่ออายุผ่าน Google Chat และ SMS
function sendRenewalNotification(email, storeSID, plan, smsText) {
  try {
    const today = new Date();
    const formattedDate = Utilities.formatDate(today, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");

    // แปลงชื่อแผนให้อ่านง่าย
    let planText = getPlanText(plan);

    // ใช้ข้อความที่ส่งมาหรือสร้างข้อความเริ่มต้น
    if (!smsText) {
      smsText = `มีการต่ออายุ จากร้าน SID:${storeSID} แผน: ${planText}`;
    }

    // ส่งข้อความไปยัง Google Chat
    const messageText = `แจ้งต่ออายุการใช้งาน\nวันที่แจ้ง: ${formattedDate}\nแผนที่เลือก: ${planText}\nรหัสร้าน: ${storeSID}\nอีเมล: ${email}`;
    const webhookUrl = "https://chat.googleapis.com/v1/spaces/AAQA1zKDek0/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=0NO0yLXkFp_C4RU7sVtRQ8WJoaxKFXZp4LdeweNJOPQ";

    const payload = {
      "text": messageText
    };

    const options = {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify(payload)
    };

    UrlFetchApp.fetch(webhookUrl, options);

    // ส่ง SMS แจ้งเตือน - ใช้เบอร์แอดมินเป็นค่าตายตัว
    const adminPhoneNumber = "+66995588665"; // กำหนดเบอร์แอดมินเป็นค่าตายตัว
    const apiKey = "3f4vh2jG5CFPk8iKteJ5G5DGDqzIvNcUjgeBPoVCr1E=";
    const clientId = "8e3f94dc-29a7-44ed-8e94-30e77a12244c";
    const senderId = "KPCarrent";
    var baseurl = "https://api.send-sms.in.th/api/v2/SendSMS";
    var message = encodeURIComponent(smsText);
    var url = baseurl + "?SenderId=" + senderId + "&Is_Unicode=true" + "&Message=" + message + "&MobileNumbers=" + adminPhoneNumber + "&ApiKey=" + apiKey + "&ClientId=" + clientId;
    var smsOptions = {
      method: "get",
      headers: {
        "accept": "text/plain"
      }
    };
    var response = UrlFetchApp.fetch(url, smsOptions);

    let smsStatus;
    if (response.getResponseCode() === 200) {
      smsStatus = "success";
    } else {
      smsStatus = "error: " + response.getContentText();
    }

    return {
      success: true,
      message: "ส่งข้อมูลการต่ออายุเรียบร้อยแล้ว",
      smsStatus: smsStatus
    };

  } catch (e) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการส่งข้อมูลการต่ออายุ: " + e.toString()
    };
  }
}



// ฟังก์ชันช่วยแปลงชื่อแผนเป็นข้อความที่อ่านง่าย
function getPlanText(plan) {
  switch (plan) {
    case "monthly":
      return "รายเดือน (300 บาท)";
    case "yearly":
      return "รายปี (3,000 บาท)";
    case "lifetime":
      return "ซื้อครั้งเดียว (25,000 บาท)";
    default:
      return plan;
  }
}

// ลงทะเบียน


function saveRegistration(formData) {
  Logger.log('--- เริ่ม saveRegistration (Base64 version) ---');
  try {
    // ดึงค่าที่รับมา
    const {
      email, password, phoneNumber,
      storeName, plan, registrationDate,
      base64File, fileName, fileType
    } = formData;

    Logger.log(`ข้อมูล Text — email:?${email}, phone:?${phoneNumber}, plan:?${plan}`);

    // ถ้ามี base64File ให้แปลงเป็น Blob
    let slipBlob = null;
    if (base64File) {
      const decoded = Utilities.base64Decode(base64File);
      slipBlob = Utilities.newBlob(decoded, fileType || 'application/octet-stream', fileName || 'slip');
      Logger.log('สร้าง Blob จาก Base64 แล้ว: ' + slipBlob.getName());
    } else {
      Logger.log('ไม่มี base64File ส่งมา');
    }

    // ไปต่อที่ saveRegistrationToSheet
    const ss = SpreadsheetApp.openById(SHEET_Announcements);
    let sheet = ss.getSheetByName('ลงทะเบียน');
    if (!sheet) {
      sheet = ss.insertSheet('ลงทะเบียน');
      sheet.appendRow(['วันที่ลงทะเบียน', 'อีเมล', 'รหัสผ่าน', 'เบอร์โทรศัพท์', 'ชื่อร้าน', 'แพลนที่เลือก', 'สถานะการชำระเงิน', 'ลิงก์สลิป']);
      sheet.getRange('A1:H1').setBackground('#4285F4').setFontColor('#FFFFFF').setFontWeight('bold');
    }

    return saveRegistrationToSheet(
      sheet,
      email, password, phoneNumber, storeName, plan,
      registrationDate, slipBlob
    );

  } catch (e) {
    Logger.log('Error in saveRegistration: ' + e);
    throw new Error('saveRegistration failed: ' + e.message);
  }
}


function sendNotification(phoneNumber, customerName, plan, smsText) {
  try {
    const today = new Date();
    const formattedDate = Utilities.formatDate(today, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");

    // 1. สร้างข้อความสำหรับส่งแจ้งเตือน
    let planText = "";
    switch (plan) {
      case "monthly":
        planText = "รายเดือน (300 บาท)";
        break;
      case "yearly":
        planText = "รายปี (3,000 บาท)";
        break;
      case "lifetime":
        planText = "ซื้อครั้งเดียว (25,000 บาท)";
        break;
    }

    // ใช้ข้อความที่ส่งมาหรือสร้างข้อความเริ่มต้น
    if (!smsText) {
      smsText = `แจ้งสมัครใช้บริการ จากร้าน ${customerName} แผน: ${planText}`;
    }

    // 2. ส่งข้อความไปยัง Google Chat
    const messageText = `แจ้งสมัครใช้บริการ\nวันที่แจ้ง: ${formattedDate}\nแผนที่เลือก: ${planText}\nชื่อร้าน: ${customerName}`;
    const webhookUrl = "https://chat.googleapis.com/v1/spaces/AAQA1zKDek0/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=0NO0yLXkFp_C4RU7sVtRQ8WJoaxKFXZp4LdeweNJOPQ";

    const payload = {
      "text": messageText
    };

    const options = {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify(payload)
    };

    UrlFetchApp.fetch(webhookUrl, options);

    // 3. ส่ง SMS แจ้งเตือน - ใช้เบอร์แอดมินเป็นค่าตายตัว
    const adminPhoneNumber = "+66995588665"; // กำหนดเบอร์แอดมินเป็นค่าตายตัว
    const apiKey = "3f4vh2jG5CFPk8iKteJ5G5DGDqzIvNcUjgeBPoVCr1E=";
    const clientId = "8e3f94dc-29a7-44ed-8e94-30e77a12244c";
    const senderId = "KPCarrent";
    var baseurl = "https://api.send-sms.in.th/api/v2/SendSMS";
    var message = encodeURIComponent(smsText);
    var url = baseurl + "?SenderId=" + senderId + "&Is_Unicode=true" + "&Message=" + message + "&MobileNumbers=" + adminPhoneNumber + "&ApiKey=" + apiKey + "&ClientId=" + clientId;
    var smsOptions = {
      method: "get",
      headers: {
        "accept": "text/plain"
      }
    };
    var response = UrlFetchApp.fetch(url, smsOptions);

    let smsStatus;
    if (response.getResponseCode() === 200) {
      smsStatus = "success";
    } else {
      smsStatus = "error: " + response.getContentText();
    }

    return {
      success: true,
      message: "ส่งข้อมูลการต่ออายุเรียบร้อยแล้ว",
      smsStatus: smsStatus
    };

  } catch (e) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการส่งข้อมูลการต่ออายุ: " + e.toString()
    };
  }
}

function saveRegistrationToSheet(
  sheet, email, password, phoneNumber, storeName, plan, registrationDate, slipBlob
) {
  Logger.log('--- เริ่ม saveRegistrationToSheet (Base64 version) ---');
  try {
    const folderId = '1mp5bBrR35TPJdcIGiVBVIf31kbh9RnPC';
    let fileUrl = 'ไม่มีสลิป';

    if (slipBlob) {
      try {
        const folder = DriveApp.getFolderById(folderId);
        const timestamp = new Date().getTime();
        const sanitized = storeName.replace(/[^a-zA-Z0-9ก-๙]/g, '_').substring(0, 50);
        const name = `สลิป_${sanitized}_${timestamp}.${slipBlob.getName().split('.').pop()}`;
        const file = folder.createFile(slipBlob).setName(name);
        fileUrl = file.getUrl();
        Logger.log('อัพโหลดสลิปสำเร็จ: ' + fileUrl);
      } catch (dE) {
        Logger.log('Drive upload error: ' + dE);
        fileUrl = 'Error uploading slip: ' + dE.message;
      }
    }

    // แปลง registrationDate
    let dt = new Date(registrationDate);
    if (isNaN(dt)) dt = new Date();

    // แก้ไข: แปลงเบอร์โทรเป็นข้อความโดยใส่เครื่องหมาย ' ไว้ข้างหน้า
    // เพื่อป้องกันไม่ให้ Google Sheets แปลงเป็นตัวเลขและตัดเลข 0 นำหน้าออก
    const formattedPhoneNumber = "'" + phoneNumber;

    const row = [
      dt, email, password, formattedPhoneNumber,
      storeName, plan, 'รอตรวจสอบ', fileUrl
    ];
    sheet.appendRow(row);
    const last = sheet.getLastRow();
    sheet.getRange(last, 3).setNumberFormat('@');
    sheet.getRange(last, 4).setNumberFormat('@');
    sheet.autoResizeColumns(1, 8);

    Logger.log('บันทึกลง Sheet เรียบร้อย');

    // เรียกใช้ฟังก์ชั่นแจ้งเตือนเมื่อบันทึกสำเร็จ
    // ใช้ phoneNumber ปกติสำหรับการส่ง SMS ไม่ใช้ formattedPhoneNumber
    const smsText = `มีการสมัครใช้งานใหม่ จากร้าน ${storeName} แผน: ${plan}`;
    const notificationResult = sendNotification(phoneNumber, storeName, plan, smsText);

    return {
      success: true,
      message: 'บันทึกสำเร็จและส่งการแจ้งเตือนแล้ว',
      notificationResult: notificationResult
    };

  } catch (e) {
    Logger.log('Error in saveRegistrationToSheet: ' + e);
    throw new Error('saveRegistrationToSheet failed: ' + e.message);
  }
}




function checkEmailExists(email) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_Announcements);
    const registrationSheet = ss.getSheetByName("ลงทะเบียน");

    // ถ้าไม่มีแผ่นงาน "ลงทะเบียน" แสดงว่ายังไม่มีข้อมูลการลงทะเบียน
    if (!registrationSheet) {
      return {
        exists: false,
        message: "อีเมลนี้สามารถใช้ลงทะเบียนได้"
      };
    }

    // ดึงข้อมูลทั้งหมดในคอลัมน์ "อีเมล"
    const dataRange = registrationSheet.getRange(2, 2, registrationSheet.getLastRow() - 1, 1);
    const emails = dataRange.getValues();

    // ตรวจสอบว่ามีอีเมลนี้อยู่ในระบบหรือไม่
    for (let i = 0; i < emails.length; i++) {
      if (emails[i][0].toString().toLowerCase() === email.toLowerCase()) {
        return {
          exists: true,
          message: "อีเมลนี้ถูกใช้ลงทะเบียนไปแล้ว กรุณาใช้อีเมลอื่น"
        };
      }
    }

    return {
      exists: false,
      message: "อีเมลนี้สามารถใช้ลงทะเบียนได้"
    };
  } catch (error) {
    return {
      error: true,
      message: "เกิดข้อผิดพลาดในการตรวจสอบอีเมล: " + error.toString()
    };
  }
}


function getAllRegistrations() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_Announcements);
    const registrationSheet = ss.getSheetByName("ลงทะเบียน");

    if (!registrationSheet) {
      return {
        success: false,
        message: "ไม่พบข้อมูลการลงทะเบียน",
        data: []
      };
    }

    // ดึงข้อมูลทั้งหมด
    const dataRange = registrationSheet.getDataRange();
    const values = dataRange.getValues();

    // แปลงข้อมูลให้อยู่ในรูปแบบที่ใช้งานง่าย
    const headers = values[0];
    const registrationData = [];

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const registration = {};

      for (let j = 0; j < headers.length; j++) {
        registration[headers[j]] = row[j];
      }

      registrationData.push(registration);
    }

    return {
      success: true,
      message: "ดึงข้อมูลการลงทะเบียนสำเร็จ",
      data: registrationData
    };
  } catch (error) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาด: " + error.toString(),
      data: []
    };
  }
}


function updatePaymentStatus(email, status) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_Announcements);
    const registrationSheet = ss.getSheetByName("ลงทะเบียน");

    if (!registrationSheet) {
      return {
        success: false,
        message: "ไม่พบข้อมูลการลงทะเบียน"
      };
    }

    // ดึงข้อมูลทั้งหมดในคอลัมน์ "อีเมล"
    const dataRange = registrationSheet.getRange(2, 2, registrationSheet.getLastRow() - 1, 1);
    const emails = dataRange.getValues();

    // หาแถวที่มีอีเมลที่ต้องการ
    for (let i = 0; i < emails.length; i++) {
      if (emails[i][0].toString().toLowerCase() === email.toLowerCase()) {
        // อัพเดทสถานะการชำระเงิน (คอลัมน์ที่ 7)
        registrationSheet.getRange(i + 2, 7).setValue(status);

        return {
          success: true,
          message: "อัพเดทสถานะการชำระเงินสำเร็จ"
        };
      }
    }

    return {
      success: false,
      message: "ไม่พบอีเมลในระบบ"
    };
  } catch (error) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาด: " + error.toString()
    };
  }
}







function getRoleData() {
  try {
    const userProps = PropertiesService.getUserProperties();

    // ดึงข้อมูลกลุ่มและสิทธิ์
    const rolePermissionsString = userProps.getProperty('rolePermissions');
    const roleNamesString = userProps.getProperty('roleNames');
    const roleDescriptionsString = userProps.getProperty('roleDescriptions');

    // แปลงข้อมูลจาก JSON string เป็น object
    const rolePermissions = rolePermissionsString ? JSON.parse(rolePermissionsString) : null;
    const roleNames = roleNamesString ? JSON.parse(roleNamesString) : null;
    const roleDescriptions = roleDescriptionsString ? JSON.parse(roleDescriptionsString) : null;

    return {
      rolePermissions: rolePermissions,
      roleNames: roleNames,
      roleDescriptions: roleDescriptions
    };
  } catch (e) {
    console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลกลุ่ม: ' + e.message);
    return { error: e.message };
  }
}







/**
 * สร้างสัญญาเช่าเปล่าสำหรับกรอกเอง
 * 
 * @param {string} refNumber - หมายเลขอ้างอิงสำหรับตั้งชื่อไฟล์
 * @param {string} templateName - ชื่อแผ่นงานเทมเพลต
 * @param {string} language - รหัสภาษา
 * @param {string} sheetID - ID ของ Google Sheet
 * @return {Object} ผลลัพธ์การสร้างสัญญา
 */
// function generateBlankContract(refNumber, templateName, language, sheetID) {
//   let tempSheet = null; // ประกาศไว้นอก try เพื่อใช้ใน catch ได้
//   const tempSheetBaseName = "temp_blank_"; // ชื่อพื้นฐานของ temp sheet

//   try {
//     Logger.log("Generating blank contract with reference " + refNumber + " using template " + templateName + " in language " + language);

//     // 1. เชื่อมต่อกับ Sheet และดึง Config
//     const ss = SpreadsheetApp.openById(sheetID);
//     const configSheet = ss.getSheetByName("ตั้งค่าระบบ");
//     if (!configSheet) {
//       return { success: false, message: "ไม่พบแผ่นงาน 'ตั้งค่าระบบ'" };
//     }

//     // --- อ่านค่า Config ---
//     let rootFolderId = null;
//     let bankName = "";
//     let accountNumber = "";
//     let accountName = "";
//     let promptpayNumber = "";
//     // บังคับใช้ useUploadedQRCode เป็น true เสมอ ไม่ต้องอ่านจากการตั้งค่า
//     const useUploadedQRCode = true;
//     let qrCodeUrl = "";
//     let companyName = "";
//     let shopLogoUrl = "";

//     const configData = configSheet.getDataRange().getValues();
//     for (let i = 0; i < configData.length; i++) {
//       const key = configData[i][0];
//       const value = configData[i][1];
//       switch (key) {
//         case "IDโฟลเดอร์สัญญาเช่า": rootFolderId = value; break;
//         case "ชื่อธนาคาร": bankName = value || ""; break;
//         case "หมายเลขบัญชีธนาคาร": accountNumber = value || ""; break;
//         case "ชื่อบัญชี": accountName = value || ""; break;
//         case "หมายเลขพร้อมเพย์": promptpayNumber = value || ""; break;
//         // ข้ามการอ่านค่า "ใช้รูปQRCodeที่อัปโหลด" เนื่องจากบังคับใช้ true เสมอ
//         case "URLรูปQRCode": qrCodeUrl = value || ""; break;
//         case "ชื่อบริษัท": companyName = value || ""; break;
//         case "URLรูปโลโก้ร้าน": shopLogoUrl = value || ""; break;
//       }
//     }

//     if (!rootFolderId) {
//       return { success: false, message: "ไม่พบค่า 'IDโฟลเดอร์สัญญาเช่า' ในแผ่นงานตั้งค่าระบบ" };
//     }

//     // 2. ดึงข้อมูลคำแปล
//     const translationsResult = getContractTranslations(language, sheetID);
//     if (!translationsResult.success) {
//       return { success: false, message: "ไม่สามารถดึงข้อมูลแปลได้: " + translationsResult.message };
//     }
//     const translationsMap = translationsResult.data || {};

//     // 3. สร้างโฟลเดอร์เก็บไฟล์
//     const folderName = "สัญญาเปล่า";
//     const folder = createOrGetFolder(folderName, rootFolderId);
//     if (!folder) {
//       return { success: false, message: "ไม่สามารถสร้างโฟลเดอร์สำหรับเก็บสัญญาเช่าได้" };
//     }

//     // 4. สร้าง Placeholder Map สำหรับแทนที่
//     // 4. สร้าง Placeholder Map สำหรับแทนที่
// const placeholderMap = {};

// // แทนที่ค่าจาก Config
// placeholderMap["{{ACCOUNT_BANKNAME}}"] = bankName;
// placeholderMap["{{ACCOUNT_NUMBER}}"] = accountNumber;
// placeholderMap["{{ACCOUNT_NAME}}"] = accountName;
// placeholderMap["{{COMPANY_NAME}}"] = companyName;



// // แทนที่คำแปล [[...]]
// for (const key in translationsMap) {
//   if (!key.startsWith("[FUELTYPE_") && !key.startsWith("[ZONE")) {
//     placeholderMap[key] = String(translationsMap[key] || "");
//   }
// }

//     // เตรียมแทนที่คำแปลกรณีพิเศษ
//     placeholderMap["{{FUELTYPE}}"] = "";
//     placeholderMap["{{USE_ZONE}}"] = "";
//     placeholderMap["[[EXTRA_HOURS_INFO]]"] = ""; // ไม่แสดงข้อมูลนี้ในสัญญาเปล่า

//     // 5. คัดลอกแผ่นงานเทมเพลต
//     const templateSheet = ss.getSheetByName(templateName);
//     if (!templateSheet) {
//       return { success: false, message: "ไม่พบแผ่นงานเทมเพลต '" + templateName + "'" };
//     }

//     const tempSheetName = tempSheetBaseName + refNumber;
//     tempSheet = ss.getSheetByName(tempSheetName);
//     if (tempSheet) {
//       ss.deleteSheet(tempSheet);
//     }
//     tempSheet = templateSheet.copyTo(ss).setName(tempSheetName);
//     SpreadsheetApp.flush();

//     // 6. ทำการแทนที่ข้อความทั้งหมด
//     const targetRange = tempSheet.getDataRange();
//     const targetData = targetRange.getValues();
//     const regex = /(\{\{.+?\}\}|\[\[.+?\]\])/g;
//     let replacementMade = false;

//     Logger.log("Starting replacements in memory...");
//     for (let r = 0; r < targetData.length; r++) {
//       for (let c = 0; c < targetData[r].length; c++) {
//         let cellValue = targetData[r][c];
//         if (typeof cellValue === 'string' && (cellValue.includes('{{') || cellValue.includes('[['))) {
//           let originalCellValue = cellValue;
//           targetData[r][c] = cellValue.replace(regex, (match) => {
//             // ถ้าเป็น Placeholder ที่มีค่าใน Map
//             if (placeholderMap.hasOwnProperty(match)) {
//               return placeholderMap[match];
//             } 
//             // ถ้าเป็น Placeholder ทั่วไปที่ต้องการแทนที่ด้วยค่าว่าง (ยกเว้น QRCODE และ SHOP_LOGO)
//             else if (match.includes('{{') && match !== "{{QRCODE}}" && match !== "{{SHOP_LOGO}}") {
//               return "";
//             }
//             // กรณีอื่นๆ คืนค่าเดิม
//             return match;
//           });
//           if (targetData[r][c] !== originalCellValue) {
//             replacementMade = true;
//           }
//         }
//       }
//     }

//     if (replacementMade) {
//       Logger.log("Writing modified data back to sheet: " + tempSheetName);
//       targetRange.setValues(targetData);
//       SpreadsheetApp.flush();
//       Logger.log("Finished writing data.");
//     } else {
//       Logger.log("No replacements were made in the data array.");
//     }

//     // 7. จัดการ QR Code (บังคับใช้ useUploadedQRCode = true เสมอ)
//     Logger.log("Handling QR Code...");
//     const qrCodePlaceholder = "{{QRCODE}}";
//     try {
//       const qrCodeFinder = tempSheet.createTextFinder(qrCodePlaceholder);
//       const qrCodeRanges = qrCodeFinder.findAll();

//       if (qrCodeRanges && qrCodeRanges.length > 0) {
//         Logger.log("Found " + qrCodeRanges.length + " instance(s) of '" + qrCodePlaceholder + "'. Processing first one at " + qrCodeRanges[0].getA1Notation());
//         const qrCodeRange = qrCodeRanges[0];

//         // ตรวจสอบเฉพาะ qrCodeUrl (useUploadedQRCode เป็น true เสมอ)
//         if (qrCodeUrl) {
//           try {
//             const fileIdMatch = qrCodeUrl.match(/\/d\/([^\/]+)/);
//             if (fileIdMatch && fileIdMatch[1]) {
//               const fileId = fileIdMatch[1];
//               const imageBlob = UrlFetchApp.fetch("https://drive.google.com/uc?export=download&id=" + fileId).getBlob();

//               tempSheet.insertImage(imageBlob, qrCodeRange.getColumn(), qrCodeRange.getRow())
//                        .setAnchorCell(qrCodeRange)
//                        .setAnchorCellXOffset(5)
//                        .setAnchorCellYOffset(5)
//                        .setWidth(200)
//                        .setHeight(200);
//               qrCodeRange.setValue("");
//               Logger.log("Inserted uploaded QR Code from URL.");
//             } else {
//               qrCodeRange.setValue("");
//               Logger.log("Could not extract File ID from QR Code URL. Clearing placeholder.");
//             }
//           } catch (qrError) {
//             qrCodeRange.setValue("");
//             Logger.log("Error processing QR code image: " + qrError.toString() + ". Clearing placeholder.");
//           }
//         } else {
//           qrCodeRange.setValue("");
//           Logger.log("No QR code URL provided. Clearing placeholder.");
//         }
//       }
//     } catch (finderError) {
//       Logger.log("Error finding QR Code placeholder: " + finderError.toString());
//     }

//     // 8. จัดการโลโก้ร้าน
//     Logger.log("Handling Shop Logo...");
//     const shopLogoPlaceholder = "{{SHOP_LOGO}}";
//     try {
//       const shopLogoFinder = tempSheet.createTextFinder(shopLogoPlaceholder);
//       const shopLogoRanges = shopLogoFinder.findAll();

//       if (shopLogoRanges && shopLogoRanges.length > 0) {
//         Logger.log("Found " + shopLogoRanges.length + " instance(s) of '" + shopLogoPlaceholder + "'. Processing first one at " + shopLogoRanges[0].getA1Notation());
//         const shopLogoRange = shopLogoRanges[0];

//         if (shopLogoUrl) {
//           try {
//             const fileIdMatch = shopLogoUrl.match(/\/d\/([^\/]+)/);
//             if (fileIdMatch && fileIdMatch[1]) {
//               const fileId = fileIdMatch[1];
//               const imageBlob = UrlFetchApp.fetch("https://drive.google.com/uc?export=download&id=" + fileId).getBlob();

//               // กำหนดขนาดสูงสุด
//               const maxWidth = 250;
//               const maxHeight = 120;

//               // แทรกรูปภาพ
//               const image = tempSheet.insertImage(imageBlob, shopLogoRange.getColumn(), shopLogoRange.getRow())
//                                   .setAnchorCell(shopLogoRange)
//                                   .setAnchorCellXOffset(10)
//                                   .setAnchorCellYOffset(10);

//               // ปรับขนาดรูปภาพให้เหมาะสม
//               const originalWidth = image.getWidth();
//               const originalHeight = image.getHeight();
//               const ratio = originalWidth / originalHeight;

//               let newWidth, newHeight;
//               if (ratio >= 1) {
//                 newWidth = Math.min(originalWidth, maxWidth);
//                 newHeight = newWidth / ratio;
//                 if (newHeight > maxHeight) {
//                   newHeight = maxHeight;
//                   newWidth = newHeight * ratio;
//                 }
//               } else {
//                 newHeight = Math.min(originalHeight, maxHeight);
//                 newWidth = newHeight * ratio;
//                 if (newWidth > maxWidth) {
//                   newWidth = maxWidth;
//                   newHeight = newWidth / ratio;
//                 }
//               }

//               image.setWidth(newWidth).setHeight(newHeight);
//               shopLogoRange.setValue("");
//               Logger.log("Inserted shop logo and resized to: " + newWidth + "x" + newHeight);
//             } else if (shopLogoUrl.trim() !== "") {
//               try {
//                 const imageBlob = UrlFetchApp.fetch(shopLogoUrl).getBlob();
//                 const image = tempSheet.insertImage(imageBlob, shopLogoRange.getColumn(), shopLogoRange.getRow())
//                                       .setAnchorCell(shopLogoRange)
//                                       .setWidth(200)
//                                       .setHeight(100);
//                 shopLogoRange.setValue("");
//                 Logger.log("Inserted shop logo from direct URL.");
//               } catch (urlError) {
//                 shopLogoRange.setValue("");
//                 Logger.log("Could not fetch shop logo from URL. Clearing placeholder.");
//               }
//             } else {
//               shopLogoRange.setValue("");
//               Logger.log("Shop logo URL is empty. Clearing placeholder.");
//             }
//           } catch (logoError) {
//             shopLogoRange.setValue("");
//             Logger.log("Error processing shop logo image: " + logoError.toString() + ". Clearing placeholder.");
//           }
//         } else {
//           shopLogoRange.setValue("");
//           Logger.log("No shop logo URL provided. Clearing placeholder.");
//         }
//       }
//     } catch (finderError) {
//       Logger.log("Error finding Shop Logo placeholder: " + finderError.toString());
//     }

//     // 9. สร้างไฟล์ PDF
//     Logger.log("Generating PDF...");
//     SpreadsheetApp.flush();

//     const spreadsheetId = ss.getId();
//     const pdfExportUrl = 'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/export?format=pdf'
//              + '&size=A4'
//              + '&portrait=true'
//              + '&fitw=true'
//              + '&top_margin=0.5'
//              + '&bottom_margin=0.5'
//              + '&left_margin=0.5'
//              + '&right_margin=0.5'
//              + '&sheetnames=false&printtitle=false'
//              + '&pagenumbers=false'
//              + '&gridlines=false'
//              + '&fzr=false'
//              + '&gid=' + tempSheet.getSheetId();

//     const response = UrlFetchApp.fetch(pdfExportUrl, {
//       headers: {
//         Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
//       },
//       muteHttpExceptions: true
//     });

//     const responseCode = response.getResponseCode();
//     if (responseCode !== 200) {
//       Logger.log("Failed to fetch PDF. Response code: " + responseCode + ". URL: " + pdfExportUrl);
//       throw new Error("Failed to fetch PDF. Response code: " + responseCode);
//     }

//     const blob = response.getBlob();
//     if (!blob || blob.getContentType() !== 'application/pdf') {
//       Logger.log("Failed to generate PDF blob or invalid content type. ContentType received: " + (blob ? blob.getContentType() : 'null blob'));
//       throw new Error("Failed to generate PDF blob or invalid content type.");
//     }

//     // 10. บันทึกไฟล์ PDF
//     const languageName = getLanguageName(language);
//     const templateTypeName = getTemplateTypeName(templateName);
//     const dateStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd_HH-mm");
//     const pdfFileName = `สัญญาเช่าเปล่า_${templateTypeName}_${languageName}_${dateStr}.pdf`;

//     const pdfFile = folder.createFile(blob.setName(pdfFileName));
//     Logger.log("PDF saved: " + pdfFile.getUrl());

//     // 11. ตั้งค่าการแชร์
//     pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

//     // 12. ลบแผ่นงาน temp
//     Logger.log("Deleting temp sheet: " + tempSheetName);
//     ss.deleteSheet(tempSheet);
//     tempSheet = null;

//     // 13. ส่งคืนผลลัพธ์สำเร็จ
//     return {
//       success: true,
//       pdfUrl: pdfFile.getUrl(),
//       message: "สร้างสัญญาเช่าเปล่าสำเร็จ"
//     };

//   } catch (e) {
//     Logger.log("Error generating blank contract: " + e.toString() + (e.stack ? "\nStack: " + e.stack : ""));

//     // ลบแผ่นงาน temp หากมี
//     try {
//       if (tempSheet) {
//         const ss = SpreadsheetApp.openById(sheetID);
//         const checkSheet = ss.getSheetByName(tempSheet.getName());
//         if (checkSheet) {
//           Logger.log("Cleaning up temp sheet: " + tempSheet.getName());
//           ss.deleteSheet(checkSheet);
//         }
//       } else {
//         const ss = SpreadsheetApp.openById(sheetID);
//         const tempSheetNameToDelete = tempSheetBaseName + refNumber;
//         const checkSheet = ss.getSheetByName(tempSheetNameToDelete);
//         if (checkSheet) {
//           Logger.log("Cleaning up temp sheet by name: " + tempSheetNameToDelete);
//           ss.deleteSheet(checkSheet);
//         }
//       }
//     } catch (cleanupError) {
//       Logger.log("Error during cleanup: " + cleanupError.toString());
//     }

//     return { success: false, message: "เกิดข้อผิดพลาดในการสร้างสัญญาเช่าเปล่า: " + e.message };
//   }
// }






/**
 * สร้างไฟล์ PDF สัญญาเช่าเปล่าสำหรับกรอกเอง
 * (เวอร์ชันแก้ไข: เพิ่มการจัดการซ่อนแถวสำหรับค่าที่เป็นศูนย์)
 * @param {string} refNumber - หมายเลขอ้างอิงสำหรับตั้งชื่อไฟล์
 * @param {string} templateName - ชื่อแผ่นงานเทมเพลต
 * @param {string} language - รหัสภาษา
 * @param {string} sheetID - ID ของ Google Sheet
 * @return {Object} ผลลัพธ์การสร้างสัญญา
 */
function generateBlankContract(refNumber, templateName, language, sheetID) {
  let tempSheet = null; // ประกาศไว้นอก try เพื่อใช้ใน catch ได้
  const tempSheetBaseName = "temp_blank_"; // ชื่อพื้นฐานของ temp sheet

  try {
    Logger.log("Generating blank contract with reference " + refNumber + " using template " + templateName + " in language " + language);

    // 1. เชื่อมต่อกับ Sheet และดึง Config
    const ss = SpreadsheetApp.openById(sheetID);
    const configSheet = ss.getSheetByName("ตั้งค่าระบบ");
    if (!configSheet) {
      return { success: false, message: "ไม่พบแผ่นงาน 'ตั้งค่าระบบ'" };
    }

    // --- อ่านค่า Config ---
    let rootFolderId = null;
    let bankName = "";
    let accountNumber = "";
    let accountName = "";
    let promptpayNumber = "";
    let qrCodeMethod = "auto"; // เปลี่ยนจาก useUploadedQRCode
    let qrCodeUrl = "";
    let companyName = "";
    let shopLogoUrl = "";

    const configData = configSheet.getDataRange().getValues();
    for (let i = 0; i < configData.length; i++) {
      const key = configData[i][0];
      const value = configData[i][1];
      switch (key) {
        case "IDโฟลเดอร์สัญญาเช่า": rootFolderId = value; break;
        case "ชื่อธนาคาร": bankName = value || ""; break;
        case "หมายเลขบัญชีธนาคาร": accountNumber = value || ""; break;
        case "ชื่อบัญชี": accountName = value || ""; break;
        case "หมายเลขพร้อมเพย์": promptpayNumber = value || ""; break;
        case "วิธีการใช้QRCode": qrCodeMethod = value || "auto"; break; // เปลี่ยนใหม่
        case "URLรูปQRCode": qrCodeUrl = value || ""; break;
        case "ชื่อบริษัท": companyName = value || ""; break;
        case "URLรูปโลโก้ร้าน": shopLogoUrl = value || ""; break;
      }
    }

    if (!rootFolderId) {
      return { success: false, message: "ไม่พบค่า 'IDโฟลเดอร์สัญญาเช่า' ในแผ่นงานตั้งค่าระบบ" };
    }

    // 2. ดึงข้อมูลคำแปล
    const translationsResult = getContractTranslations(language, sheetID);
    if (!translationsResult.success) {
      return { success: false, message: "ไม่สามารถดึงข้อมูลแปลได้: " + translationsResult.message };
    }
    const translationsMap = translationsResult.data || {};

    // 3. สร้างโฟลเดอร์เก็บไฟล์
    const folderName = "สัญญาเปล่า";
    const folder = createOrGetFolder(folderName, rootFolderId);
    if (!folder) {
      return { success: false, message: "ไม่สามารถสร้างโฟลเดอร์สำหรับเก็บสัญญาเช่าได้" };
    }

    // 4. สร้าง Placeholder Map สำหรับแทนที่
    const placeholderMap = {};

    // แทนที่ค่าจาก Config
    placeholderMap["{{ACCOUNT_BANKNAME}}"] = bankName;
    placeholderMap["{{ACCOUNT_NUMBER}}"] = accountNumber;
    placeholderMap["{{ACCOUNT_NAME}}"] = accountName;
    placeholderMap["{{COMPANY_NAME}}"] = companyName;

    // แทนที่คำแปล [[...]] (กลุ่มที่ 2)
    for (const key in translationsMap) {
      if (!key.startsWith("[FUELTYPE_") && !key.startsWith("[ZONE") && !key.includes("_label")) {
        placeholderMap[key] = String(translationsMap[key] || "");
      }
    }

    // (กลุ่มที่ 3) เตรียมแทนที่คำแปลกรณีพิเศษ
    placeholderMap["{{FUELTYPE}}"] = "";
    placeholderMap["{{USE_ZONE}}"] = "";
    placeholderMap["[[EXTRA_HOURS_INFO]]"] = ""; // ไม่แสดงข้อมูลนี้ในสัญญาเปล่า

    // =======================================================================
    // ⭐⭐ START: (กลุ่มที่ 4) รายการที่ "ต้องซ่อนได้" (3-Part Placeholders) ⭐⭐
    // =======================================================================
    // ในสัญญาเปล่า เราจะลบ Placeholder เหล่านี้ทิ้งไปเลย
    placeholderMap["{{ADDITIONAL_FEE_LABEL}}"] = "";
    placeholderMap["{{ADDITIONAL_FEE_VALUE}}"] = "";
    placeholderMap["{{ADDITIONAL_FEE_UNIT}}"] = "";

    placeholderMap["{{OVERTIME_FEE_LABEL}}"] = "";
    placeholderMap["{{OVERTIME_FEE_VALUE}}"] = "";
    placeholderMap["{{OVERTIME_FEE_UNIT}}"] = "";

    placeholderMap["{{INSURANCE_FEE_LABEL}}"] = "";
    placeholderMap["{{INSURANCE_FEE_VALUE}}"] = "";
    placeholderMap["{{INSURANCE_FEE_UNIT}}"] = "";

    placeholderMap["{{CARSEAT_FEE_LABEL}}"] = "";
    placeholderMap["{{CARSEAT_FEE_VALUE}}"] = "";
    placeholderMap["{{CARSEAT_FEE_UNIT}}"] = "";
    // =======================================================================
    // ⭐⭐ END: สิ้นสุดส่วนที่เพิ่มเข้ามาใหม่ ⭐⭐
    // =======================================================================

    // 5. คัดลอกแผ่นงานเทมเพลต
    const templateSheet = ss.getSheetByName(templateName);
    if (!templateSheet) {
      return { success: false, message: "ไม่พบแผ่นงานเทมเพลต '" + templateName + "'" };
    }

    const tempSheetName = tempSheetBaseName + refNumber;
    tempSheet = ss.getSheetByName(tempSheetName);
    if (tempSheet) {
      ss.deleteSheet(tempSheet);
    }
    tempSheet = templateSheet.copyTo(ss).setName(tempSheetName);
    SpreadsheetApp.flush();

    // 6. ทำการแทนที่ข้อความทั้งหมด
    const targetRange = tempSheet.getDataRange();
    const targetData = targetRange.getValues();
    const regex = /(\{\{.+?\}\}|\[\[.+?\]\])/g;
    let replacementMade = false;

    Logger.log("Starting replacements in memory...");
    for (let r = 0; r < targetData.length; r++) {
      for (let c = 0; c < targetData[r].length; c++) {
        let cellValue = targetData[r][c];
        if (typeof cellValue === 'string' && (cellValue.includes('{{') || cellValue.includes('[['))) {
          let originalCellValue = cellValue;
          targetData[r][c] = cellValue.replace(regex, (match) => {
            // ถ้าเป็น Placeholder ที่มีค่าใน Map
            if (placeholderMap.hasOwnProperty(match)) {
              return placeholderMap[match];
            }
            // ถ้าเป็น Placeholder ทั่วไปที่ต้องการแทนที่ด้วยค่าว่าง (ยกเว้น QRCODE และ SHOP_LOGO)
            else if (match.includes('{{') && match !== "{{QRCODE}}" && match !== "{{SHOP_LOGO}}") {
              return "";
            }
            // กรณีอื่นๆ คืนค่าเดิม
            return match;
          });
          if (targetData[r][c] !== originalCellValue) {
            replacementMade = true;
          }
        }
      }
    }

    if (replacementMade) {
      Logger.log("Writing modified data back to sheet: " + tempSheetName);
      targetRange.setValues(targetData);
      SpreadsheetApp.flush();
      Logger.log("Finished writing data.");
    } else {
      Logger.log("No replacements were made in the data array.");
    }

    // 7. จัดการ QR Code (แก้ไขใหม่ - รองรับ 3 ตัวเลือก)
    Logger.log("Handling QR Code...");
    const qrCodePlaceholder = "{{QRCODE}}";
    try {
      const qrCodeFinder = tempSheet.createTextFinder(qrCodePlaceholder);
      const qrCodeRanges = qrCodeFinder.findAll();

      if (qrCodeRanges && qrCodeRanges.length > 0) {
        Logger.log("Found " + qrCodeRanges.length + " instance(s) of '" + qrCodePlaceholder + "'. Processing first one at " + qrCodeRanges[0].getA1Notation());
        const qrCodeRange = qrCodeRanges[0];

        // ตรวจสอบค่า qrCodeMethod
        Logger.log("QR Code method: " + qrCodeMethod);

        if (qrCodeMethod === "none") {
          // กรณีไม่ใช้ QR Code - ลบ placeholder ทิ้งเลย
          qrCodeRange.setValue("");
          Logger.log("QR Code method set to 'none'. Removed placeholder without replacement.");

        } else if (qrCodeMethod === "manual") {
          // กรณีใช้รูป QR Code ที่อัปโหลด
          if (qrCodeUrl) {
            try {
              const fileIdMatch = qrCodeUrl.match(/\/d\/([^\/]+)/);
              if (fileIdMatch && fileIdMatch[1]) {
                const fileId = fileIdMatch[1];
                const imageBlob = UrlFetchApp.fetch("https://drive.google.com/uc?export=download&id=" + fileId).getBlob();

                tempSheet.insertImage(imageBlob, qrCodeRange.getColumn(), qrCodeRange.getRow())
                  .setAnchorCell(qrCodeRange)
                  .setAnchorCellXOffset(5)
                  .setAnchorCellYOffset(5)
                  .setWidth(200)
                  .setHeight(200);
                qrCodeRange.setValue("");
                Logger.log("Inserted uploaded QR Code from URL (manual method).");
              } else {
                qrCodeRange.setValue("");
                Logger.log("Could not extract File ID from QR Code URL. Clearing placeholder.");
              }
            } catch (qrError) {
              qrCodeRange.setValue("");
              Logger.log("Error processing uploaded QR code image: " + qrError.toString() + ". Clearing placeholder.");
            }
          } else {
            qrCodeRange.setValue("");
            Logger.log("Manual QR Code method selected but no QR Code URL provided. Clearing placeholder.");
          }

        } else if (qrCodeMethod === "auto") {
          // กรณีสร้าง QR Code อัตโนมัติ - สำหรับสัญญาเปล่าไม่มียอดเงิน ให้ใช้ยอด 0 หรือไม่แสดง
          if (promptpayNumber) {
            try {
              // สำหรับสัญญาเปล่า ใช้ยอดเงิน 0 หรืออาจจะไม่แสดง QR Code เลย
              const amount = 0; // ยอดเงิน 0 สำหรับสัญญาเปล่า
              const qrCodeImageUrl = generatePromtPay(promptpayNumber, amount);

              if (qrCodeImageUrl) {
                const imageBlob = UrlFetchApp.fetch(qrCodeImageUrl).getBlob();
                tempSheet.insertImage(imageBlob, qrCodeRange.getColumn(), qrCodeRange.getRow())
                  .setAnchorCell(qrCodeRange)
                  .setAnchorCellXOffset(5)
                  .setAnchorCellYOffset(5)
                  .setWidth(200)
                  .setHeight(200);
                qrCodeRange.setValue("");
                Logger.log("Generated and inserted PromptPay QR Code with amount 0 (auto method for blank contract).");
              } else {
                qrCodeRange.setValue("");
                Logger.log("Failed to generate PromptPay QR code URL. Clearing placeholder.");
              }
            } catch (qrError) {
              qrCodeRange.setValue("");
              Logger.log("Error generating PromptPay QR code: " + qrError.toString() + ". Clearing placeholder.");
            }
          } else {
            qrCodeRange.setValue("");
            Logger.log("Auto QR Code method selected but no PromptPay number provided. Clearing placeholder.");
          }
        } else {
          // กรณีค่าไม่ถูกต้อง - ลบ placeholder
          qrCodeRange.setValue("");
          Logger.log("Invalid QR Code method: " + qrCodeMethod + ". Clearing placeholder.");
        }
      }
    } catch (finderError) {
      Logger.log("Error finding QR Code placeholder: " + finderError.toString());
    }

    // 8. จัดการโลโก้ร้าน
    Logger.log("Handling Shop Logo...");
    const shopLogoPlaceholder = "{{SHOP_LOGO}}";
    try {
      const shopLogoFinder = tempSheet.createTextFinder(shopLogoPlaceholder);
      const shopLogoRanges = shopLogoFinder.findAll();

      if (shopLogoRanges && shopLogoRanges.length > 0) {
        Logger.log("Found " + shopLogoRanges.length + " instance(s) of '" + shopLogoPlaceholder + "'. Processing first one at " + shopLogoRanges[0].getA1Notation());
        const shopLogoRange = shopLogoRanges[0];

        if (shopLogoUrl) {
          try {
            const fileIdMatch = shopLogoUrl.match(/\/d\/([^\/]+)/);
            if (fileIdMatch && fileIdMatch[1]) {
              const fileId = fileIdMatch[1];
              const imageBlob = UrlFetchApp.fetch("https://drive.google.com/uc?export=download&id=" + fileId).getBlob();

              // กำหนดขนาดสูงสุด
              const maxWidth = 250;
              const maxHeight = 120;

              // แทรกรูปภาพ
              const image = tempSheet.insertImage(imageBlob, shopLogoRange.getColumn(), shopLogoRange.getRow())
                .setAnchorCell(shopLogoRange)
                .setAnchorCellXOffset(10)
                .setAnchorCellYOffset(10);

              // ปรับขนาดรูปภาพให้เหมาะสม
              const originalWidth = image.getWidth();
              const originalHeight = image.getHeight();
              const ratio = originalWidth / originalHeight;

              let newWidth, newHeight;
              if (ratio >= 1) {
                newWidth = Math.min(originalWidth, maxWidth);
                newHeight = newWidth / ratio;
                if (newHeight > maxHeight) {
                  newHeight = maxHeight;
                  newWidth = newHeight * ratio;
                }
              } else {
                newHeight = Math.min(originalHeight, maxHeight);
                newWidth = newHeight * ratio;
                if (newWidth > maxWidth) {
                  newWidth = maxWidth;
                  newHeight = newWidth / ratio;
                }
              }

              image.setWidth(newWidth).setHeight(newHeight);
              shopLogoRange.setValue("");
              Logger.log("Inserted shop logo and resized to: " + newWidth + "x" + newHeight);
            } else if (shopLogoUrl.trim() !== "") {
              try {
                const imageBlob = UrlFetchApp.fetch(shopLogoUrl).getBlob();
                const image = tempSheet.insertImage(imageBlob, shopLogoRange.getColumn(), shopLogoRange.getRow())
                  .setAnchorCell(shopLogoRange)
                  .setWidth(200)
                  .setHeight(100);
                shopLogoRange.setValue("");
                Logger.log("Inserted shop logo from direct URL.");
              } catch (urlError) {
                shopLogoRange.setValue("");
                Logger.log("Could not fetch shop logo from URL. Clearing placeholder.");
              }
            } else {
              shopLogoRange.setValue("");
              Logger.log("Shop logo URL is empty. Clearing placeholder.");
            }
          } catch (logoError) {
            shopLogoRange.setValue("");
            Logger.log("Error processing shop logo image: " + logoError.toString() + ". Clearing placeholder.");
          }
        } else {
          shopLogoRange.setValue("");
          Logger.log("No shop logo URL provided. Clearing placeholder.");
        }
      }
    } catch (finderError) {
      Logger.log("Error finding Shop Logo placeholder: " + finderError.toString());
    }

    // 9. สร้างไฟล์ PDF
    Logger.log("Generating PDF...");
    SpreadsheetApp.flush();

    const spreadsheetId = ss.getId();
    const pdfExportUrl = 'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/export?format=pdf'
      + '&size=A4'
      + '&portrait=true'
      + '&fitw=true'
      + '&top_margin=0.5'
      + '&bottom_margin=0.5'
      + '&left_margin=0.5'
      + '&right_margin=0.5'
      + '&sheetnames=false&printtitle=false'
      + '&pagenumbers=false'
      + '&gridlines=false'
      + '&fzr=false'
      + '&gid=' + tempSheet.getSheetId();

    const response = UrlFetchApp.fetch(pdfExportUrl, {
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
      },
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      Logger.log("Failed to fetch PDF. Response code: " + responseCode + ". URL: " + pdfExportUrl);
      throw new Error("Failed to fetch PDF. Response code: " + responseCode);
    }

    const blob = response.getBlob();
    if (!blob || blob.getContentType() !== 'application/pdf') {
      Logger.log("Failed to generate PDF blob or invalid content type. ContentType received: " + (blob ? blob.getContentType() : 'null blob'));
      throw new Error("Failed to generate PDF blob or invalid content type.");
    }

    // 10. บันทึกไฟล์ PDF
    const languageName = getLanguageName(language);
    const templateTypeName = getTemplateTypeName(templateName);
    const dateStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd_HH-mm");
    const pdfFileName = `สัญญาเช่าเปล่า_${templateTypeName}_${languageName}_${dateStr}.pdf`;

    const pdfFile = folder.createFile(blob.setName(pdfFileName));
    Logger.log("PDF saved: " + pdfFile.getUrl());

    // 11. ตั้งค่าการแชร์
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // 12. ลบแผ่นงาน temp
    Logger.log("Deleting temp sheet: " + tempSheetName);
    ss.deleteSheet(tempSheet);
    tempSheet = null;

    // 13. ส่งคืนผลลัพธ์สำเร็จ
    return {
      success: true,
      pdfUrl: pdfFile.getUrl(),
      message: "สร้างสัญญาเช่าเปล่าสำเร็จ"
    };

  } catch (e) {
    Logger.log("Error generating blank contract: " + e.toString() + (e.stack ? "\nStack: " + e.stack : ""));

    // ลบแผ่นงาน temp หากมี
    try {
      if (tempSheet) {
        const ss = SpreadsheetApp.openById(sheetID);
        const checkSheet = ss.getSheetByName(tempSheet.getName());
        if (checkSheet) {
          Logger.log("Cleaning up temp sheet: " + tempSheet.getName());
          ss.deleteSheet(checkSheet);
        }
      } else {
        const ss = SpreadsheetApp.openById(sheetID);
        const tempSheetNameToDelete = tempSheetBaseName + refNumber;
        const checkSheet = ss.getSheetByName(tempSheetNameToDelete);
        if (checkSheet) {
          Logger.log("Cleaning up temp sheet by name: " + tempSheetNameToDelete);
          ss.deleteSheet(checkSheet);
        }
      }
    } catch (cleanupError) {
      Logger.log("Error during cleanup: " + cleanupError.toString());
    }

    return { success: false, message: "เกิดข้อผิดพลาดในการสร้างสัญญาเช่าเปล่า: " + e.message };
  }
}













/**
 * แปลงรหัสภาษาเป็นชื่อภาษา
 */
function getLanguageName(langCode) {
  const langMap = {
    'th': 'ไทย',
    'en': 'อังกฤษ',
    'zh-CN': 'จีน-ย่อ',
    'zh-TW': 'จีน-เต็ม',
    'ko': 'เกาหลี',
    'lo': 'ลาว',
    'my': 'พม่า',
    'vi': 'เวียดนาม',
    'ru': 'รัสเซีย',
    'ms': 'มาเลย์',
    'id': 'อินโดนีเซีย',
    'ja': 'ญี่ปุ่น',
    'he': 'ฮิบรู',
    'fr': 'ฝรั่งเศส',
    'tr': 'ตุรกี',
    'es': 'สเปน',
    'it': 'อิตาลี',
    'de': 'เยอรมัน'
  };

  return langMap[langCode] || langCode;
}

/**
 * แปลงชื่อแผ่นงานเทมเพลตเป็นชื่อประเภทสัญญา
 */
function getTemplateTypeName(templateName) {
  const templateMap = {
    'Template_สัญญาเช่า_รถยนต์': 'รถยนต์',
    'Template_สัญญาเช่า_รถยนต์ไฟฟ้า': 'รถยนต์ไฟฟ้า',
    'Template_สัญญาเช่า_รถจักรยานยนต์': 'รถจักรยานยนต์',
    'Template_สัญญาเช่า_รถจักรยานยนต์ไฟฟ้า': 'รถจักรยานยนต์ไฟฟ้า'
  };

  return templateMap[templateName] || templateName;
}





/**
 * Creates a PDF of the daily schedule
 * @param {string} dateStr - The formatted date string (e.g., "3 พฤษภาคม 2568")
 * @param {Array} scheduleItems - Array of schedule items for the day
 * @param {number} pickupCount - Number of pickups scheduled
 * @param {number} returnCount - Number of returns scheduled
 * @param {string} sheetID - The ID of the spreadsheet
 * @return {string} The URL of the generated PDF
 */
function createDailyScheduleToPDF(dateStr, scheduleItems, pickupCount, returnCount, sheetID) {
  let tempSheet = null;
  const tempSheetBaseName = "tmp_ตารางประจำวัน_";

  try {
    // Open the spreadsheet
    const ss = SpreadsheetApp.openById(sheetID);

    // Get configuration from the settings sheet
    const configSheet = ss.getSheetByName("ตั้งค่าระบบ");
    if (!configSheet) {
      throw new Error("ไม่พบแผ่นงาน 'ตั้งค่าระบบ'");
    }

    // Variables for settings
    let companyName = "บริษัท เช่ารถ จำกัด";
    let rootFolderId = null;

    // Get data from the settings sheet
    const configData = configSheet.getDataRange().getValues();
    for (let i = 0; i < configData.length; i++) {
      const key = configData[i][0];
      const value = configData[i][1];

      if (key === "ชื่อบริษัท") {
        companyName = value || companyName;
      }

      if (key === "IDโฟลเดอร์หลัก") {
        rootFolderId = value;
      }
    }

    // Check for "รายการจองรถ_PDF" folder
    let pdfFolder;

    if (rootFolderId) {
      try {
        const rootFolder = DriveApp.getFolderById(rootFolderId);
        const foldersWithName = rootFolder.getFoldersByName("รายการจองรถ_PDF");

        if (foldersWithName.hasNext()) {
          pdfFolder = foldersWithName.next();
        } else {
          // Create new folder in the root folder
          pdfFolder = rootFolder.createFolder("รายการจองรถ_PDF");
        }
      } catch (e) {
        Logger.log("ไม่สามารถเข้าถึงโฟลเดอร์หลักได้: " + e.message);
        // If there's an error finding the root folder, search or create at the root level
        const foldersWithName = DriveApp.getFoldersByName("รายการจองรถ_PDF");

        if (foldersWithName.hasNext()) {
          pdfFolder = foldersWithName.next();
        } else {
          pdfFolder = DriveApp.createFolder("รายการจองรถ_PDF");
        }
      }
    } else {
      // If there's no rootFolderId, search or create at the root level
      const foldersWithName = DriveApp.getFoldersByName("รายการจองรถ_PDF");

      if (foldersWithName.hasNext()) {
        pdfFolder = foldersWithName.next();
      } else {
        pdfFolder = DriveApp.createFolder("รายการจองรถ_PDF");
      }
    }

    // Create a new sheet for the schedule
    const tempSheetName = tempSheetBaseName + new Date().getTime();
    tempSheet = ss.getSheetByName(tempSheetName);
    if (tempSheet) {
      ss.deleteSheet(tempSheet);
    }
    tempSheet = ss.insertSheet(tempSheetName);

    // Set up the basic layout
    tempSheet.getRange(1, 1, 1, 5).merge().setValue(`ตารางรับส่งรถประจำวันที่ ${dateStr}`);
    tempSheet.getRange(2, 1, 1, 5).merge().setValue(companyName);
    tempSheet.getRange(3, 1, 1, 5).merge().setValue(`วันที่พิมพ์: ${Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy")}`);

    // Summary section
    tempSheet.getRange(5, 1, 1, 2).merge().setValue("สรุปรายการประจำวัน");
    tempSheet.getRange(6, 1).setValue("การรับรถ:");
    tempSheet.getRange(6, 2).setValue(pickupCount + " รายการ");
    tempSheet.getRange(7, 1).setValue("การส่งคืนรถ:");
    tempSheet.getRange(7, 2).setValue(returnCount + " รายการ");
    tempSheet.getRange(8, 1).setValue("รวมทั้งหมด:");
    tempSheet.getRange(8, 2).setValue(scheduleItems.length + " รายการ");

    // Schedule header
    tempSheet.getRange(10, 1, 1, 5).setValues([["เวลา", "ประเภท", "รถ", "ชื่อลูกค้า / เบอร์โทร", "สถานที่"]]);

    // Add schedule items
    if (!scheduleItems || scheduleItems.length === 0) {
      tempSheet.getRange(11, 1, 1, 5).merge().setValue(`ไม่พบรายการรับส่งรถในวันที่ ${dateStr}`);
    } else {
      // Add schedule items
      for (let i = 0; i < scheduleItems.length; i++) {
        const item = scheduleItems[i];
        const rowIndex = 11 + i;

        // Prepare row data
        tempSheet.getRange(rowIndex, 1).setValue(item.เวลา || '-');
        tempSheet.getRange(rowIndex, 2).setValue(item.ประเภท || '-');
        tempSheet.getRange(rowIndex, 3).setValue(item.รถ || '-');

        // Combine customer name and phone
        const customerInfo = `${item.ชื่อลูกค้า || '-'}\n'${item.เบอร์โทรศัพท์ || '-'}`;
        tempSheet.getRange(rowIndex, 4).setValue(customerInfo);

        // Set location based on type
        const location = item.ประเภท === 'รับรถ' ? (item.สถานที่รับรถ || '-') : (item.สถานที่คืนรถ || '-');
        tempSheet.getRange(rowIndex, 5).setValue(location);
      }
    }

    // Format the table
    // Header formatting
    tempSheet.getRange(1, 1, 1, 5)
      .setFontSize(16)
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setBackground("#ffffff");

    tempSheet.getRange(2, 1, 1, 5)
      .setFontSize(14)
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setBackground("#ffffff");

    tempSheet.getRange(3, 1, 1, 5)
      .setFontSize(11)
      .setHorizontalAlignment("right")
      .setVerticalAlignment("middle")
      .setBackground("#ffffff")
      .setFontColor("#666666");

    // Summary section formatting
    tempSheet.getRange(5, 1, 1, 2)
      .setFontWeight("bold")
      .setFontSize(14)
      .setHorizontalAlignment("left")
      .setBackground("#f8f9fa");

    tempSheet.getRange(6, 1, 3, 2)
      .setVerticalAlignment("middle")
      .setBorder(true, true, true, true, true, true, "#cccccc", SpreadsheetApp.BorderStyle.SOLID);

    // Green background for pickup count
    tempSheet.getRange(6, 2)
      .setBackground("#e6f4ea")
      .setFontWeight("bold")
      .setHorizontalAlignment("center");

    // Orange background for return count
    tempSheet.getRange(7, 2)
      .setBackground("#fef0e6")
      .setFontWeight("bold")
      .setHorizontalAlignment("center");

    // Gray background for total count
    tempSheet.getRange(8, 2)
      .setBackground("#f1f3f4")
      .setFontWeight("bold")
      .setHorizontalAlignment("center");

    // Schedule header formatting
    tempSheet.getRange(10, 1, 1, 5)
      .setFontWeight("bold")
      .setFontSize(12)
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setBackground("#f0f0f0")
      .setBorder(true, true, true, true, true, true, "#888888", SpreadsheetApp.BorderStyle.SOLID);

    // Set column widths
    tempSheet.setColumnWidth(1, 80);  // Time
    tempSheet.setColumnWidth(2, 100); // Type
    tempSheet.setColumnWidth(3, 180); // Car
    tempSheet.setColumnWidth(4, 200); // Customer
    tempSheet.setColumnWidth(5, 250); // Location

    // Format data rows
    if (scheduleItems && scheduleItems.length > 0) {
      const dataRange = tempSheet.getRange(11, 1, scheduleItems.length, 5);
      dataRange
        .setVerticalAlignment("middle")
        .setBorder(true, true, true, true, true, true, "#cccccc", SpreadsheetApp.BorderStyle.SOLID);

      // Alternate row colors and format based on type
      for (let i = 0; i < scheduleItems.length; i++) {
        const item = scheduleItems[i];
        const rowIndex = 11 + i;
        const rowRange = tempSheet.getRange(rowIndex, 1, 1, 5);

        // Base row formatting
        if (i % 2 === 0) { // Even rows
          rowRange.setBackground("#ffffff");
        } else { // Odd rows
          rowRange.setBackground("#f8f8f8");
        }

        // Format based on type
        if (item.ประเภท === 'รับรถ') {
          tempSheet.getRange(rowIndex, 2).setBackground("#e6f4ea").setFontWeight("bold");
        } else if (item.ประเภท === 'ส่งคืนรถ') {
          tempSheet.getRange(rowIndex, 2).setBackground("#fef0e6").setFontWeight("bold");
        }

        // Center time and type columns
        tempSheet.getRange(rowIndex, 1, 1, 2).setHorizontalAlignment("center");

        // Left align text in other columns
        tempSheet.getRange(rowIndex, 3, 1, 3).setHorizontalAlignment("left");

        // Wrap text in customer info and location
        tempSheet.getRange(rowIndex, 4, 1, 2).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
      }
    }

    // Add thick outside border
    tempSheet.getRange(1, 1, scheduleItems ? scheduleItems.length + 10 : 11, 5)
      .setBorder(true, true, true, true, null, null, "#000000", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

    // Add divider between header and data
    tempSheet.getRange(10, 1, 1, 5)
      .setBorder(null, null, true, null, null, null, "#000000", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

    // Set row heights
    tempSheet.setRowHeight(1, 30); // Report header
    tempSheet.setRowHeight(10, 25); // Table header

    // Hide gridlines
    tempSheet.setHiddenGridlines(true);

    // Set print range
    const printRange = tempSheet.getRange(1, 1, scheduleItems ? scheduleItems.length + 10 : 11, 5);
    tempSheet.setActiveRange(printRange);

    // Flush all changes
    SpreadsheetApp.flush();

    // Generate PDF
    const spreadsheetId = ss.getId();
    // PDF export URL - portrait orientation for the daily schedule
    const pdfExportUrl = 'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/export?format=pdf'
      + '&size=7' // A4 size
      + '&portrait=true' // Portrait orientation
      + '&fitw=true' // Fit to width
      + '&top_margin=0.2' // Top margin (inches)
      + '&bottom_margin=0.2' // Bottom margin
      + '&left_margin=0.2' // Left margin
      + '&right_margin=0.2' // Right margin
      + '&sheetnames=false&printtitle=false' // Don't show sheet name
      + '&pagenumbers=true' // Show page numbers
      + '&gridlines=false' // Don't show gridlines
      + '&fzr=false' // Don't repeat frozen rows
      + '&gid=' + tempSheet.getSheetId(); // Export only this sheet

    // Fetch PDF
    const response = UrlFetchApp.fetch(pdfExportUrl, {
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
      },
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      Logger.log("Failed to fetch PDF. Response code: " + responseCode + ". URL: " + pdfExportUrl);
      throw new Error("Failed to fetch PDF. Response code: " + responseCode);
    }

    const blob = response.getBlob();
    if (!blob || blob.getContentType() !== 'application/pdf') {
      Logger.log("Failed to generate PDF blob or invalid content type. ContentType received: " + (blob ? blob.getContentType() : 'null blob'));
      throw new Error("Failed to generate PDF blob or invalid content type.");
    }

    // Save PDF file to folder
    // Format date for file name
    const today = new Date();
    const dayStr = today.getDate().toString().padStart(2, '0');
    const monthStr = (today.getMonth() + 1).toString().padStart(2, '0');
    const yearStr = today.getFullYear().toString();

    const pdfFileName = `ตารางรับส่งรถ_${dayStr}${monthStr}${yearStr}_${dateStr.replace(/\s+/g, '_')}.pdf`;
    const pdfFile = pdfFolder.createFile(blob.setName(pdfFileName));

    // Set sharing permissions
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Delete temp sheet
    ss.deleteSheet(tempSheet);
    tempSheet = null;

    // Return PDF URL
    return pdfFile.getUrl();

  } catch (error) {
    Logger.log("เกิดข้อผิดพลาดในการสร้าง PDF: " + error.message);

    // Cleanup: delete temp sheet if it exists
    try {
      if (tempSheet) {
        const ss = SpreadsheetApp.openById(sheetID);
        ss.deleteSheet(tempSheet);
      }
    } catch (cleanupError) {
      Logger.log("Error during cleanup: " + cleanupError.toString());
    }

    throw new Error("เกิดข้อผิดพลาดในการสร้าง PDF: " + error.message);
  }
}











function createBookingListToPDF(bookingList, month, year, sheetID, selectedColumns) {
  let tempSheet = null; // ประกาศไว้นอก try เพื่อใช้ใน catch ได้
  const tempSheetBaseName = "tmp_รายการจอง_"; // ชื่อพื้นฐานของ temp sheet

  try {
    // เปิด Spreadsheet ที่มีอยู่แล้ว
    const ss = SpreadsheetApp.openById(sheetID);

    // ดึงข้อมูลจากแผ่นงานตั้งค่าระบบโดยตรง
    const configSheet = ss.getSheetByName("ตั้งค่าระบบ");
    if (!configSheet) {
      return { success: false, message: "ไม่พบแผ่นงาน 'ตั้งค่าระบบ'" };
    }

    // ตัวแปรสำหรับเก็บข้อมูลการตั้งค่า
    let companyName = "บริษัท เช่ารถ จำกัด";
    let rootFolderId = null;

    // ดึงข้อมูลจากแผ่นงานตั้งค่าระบบ
    const configData = configSheet.getDataRange().getValues();
    for (let i = 0; i < configData.length; i++) {
      const key = configData[i][0];
      const value = configData[i][1];

      if (key === "ชื่อบริษัท") {
        companyName = value || companyName;
      }

      if (key === "IDโฟลเดอร์หลัก") {
        rootFolderId = value;
      }
    }

    // ตรวจสอบโฟลเดอร์ "รายการจองรถ_PDF"
    let pdfFolder;

    if (rootFolderId) {
      try {
        const rootFolder = DriveApp.getFolderById(rootFolderId);
        const foldersWithName = rootFolder.getFoldersByName("รายการจองรถ_PDF");

        if (foldersWithName.hasNext()) {
          pdfFolder = foldersWithName.next();
        } else {
          // สร้างโฟลเดอร์ใหม่ในโฟลเดอร์หลัก
          pdfFolder = rootFolder.createFolder("รายการจองรถ_PDF");
        }
      } catch (e) {
        Logger.log("ไม่สามารถเข้าถึงโฟลเดอร์หลักได้: " + e.message);
        // ถ้ามีข้อผิดพลาดในการหาโฟลเดอร์หลัก ให้ค้นหาหรือสร้างในระดับรากแทน
        const foldersWithName = DriveApp.getFoldersByName("รายการจองรถ_PDF");

        if (foldersWithName.hasNext()) {
          pdfFolder = foldersWithName.next();
        } else {
          pdfFolder = DriveApp.createFolder("รายการจองรถ_PDF");
        }
      }
    } else {
      // ถ้าไม่มี rootFolderId ให้ค้นหาหรือสร้างในระดับรากแทน
      const foldersWithName = DriveApp.getFoldersByName("รายการจองรถ_PDF");

      if (foldersWithName.hasNext()) {
        pdfFolder = foldersWithName.next();
      } else {
        pdfFolder = DriveApp.createFolder("รายการจองรถ_PDF");
      }
    }

    // สร้างชีทใหม่สำหรับข้อมูลการจอง
    const tempSheetName = tempSheetBaseName + new Date().getTime();
    tempSheet = ss.getSheetByName(tempSheetName);
    if (tempSheet) {
      ss.deleteSheet(tempSheet);
    }
    tempSheet = ss.insertSheet(tempSheetName);

    // ถ้าไม่มีการเลือกคอลัมน์ ใช้ค่าเริ่มต้น (ทุกคอลัมน์)
    const columnMapping = {
      bookingNo: 'หมายเลขจอง',
      carName: 'รถที่จอง',
      pickupDate: 'วันที่รับรถ',
      pickupTime: 'เวลารับรถ',
      pickupLocation: 'สถานที่รับรถ',
      returnDate: 'วันที่คืนรถ',
      returnTime: 'เวลาคืนรถ',
      returnLocation: 'สถานที่คืนรถ',
      customerName: 'ชื่อลูกค้า',
      customerPhone: 'เบอร์ติดต่อ'
    };

    let headers = [];
    let columnKeys = [];

    // ถ้าไม่มีการส่งค่า selectedColumns หรือมีค่าว่าง ให้ใช้ทุกคอลัมน์
    if (!selectedColumns || selectedColumns.length === 0) {
      headers = Object.values(columnMapping);
      columnKeys = Object.keys(columnMapping);
    } else {
      // ใช้เฉพาะคอลัมน์ที่เลือก
      selectedColumns.forEach(col => {
        headers.push(col.label);
        columnKeys.push(col.key);
      });
    }

    // จำนวนคอลัมน์ที่จะแสดง
    const numColumns = headers.length;

    // ค่าความกว้างพื้นฐานของแต่ละคอลัมน์
    const baseColumnWidthMapping = {
      bookingNo: 100,      // หมายเลขจอง
      carName: 120,        // รถที่จอง (จะถูกปรับเป็น 2 เท่า = 240)
      pickupDate: 100,     // วันที่รับรถ
      pickupTime: 80,      // เวลารับรถ
      pickupLocation: 130, // สถานที่รับรถ
      returnDate: 100,     // วันที่คืนรถ
      returnTime: 80,      // เวลาคืนรถ
      returnLocation: 130, // สถานที่คืนรถ
      customerName: 120,   // ชื่อลูกค้า
      customerPhone: 100   // เบอร์ติดต่อ
    };

    // คำนวณความกว้างทั้งหมดที่คาดหวังสำหรับ A4 แนวนอน (landscape) ประมาณ 1060 พิกเซล
    const targetTotalWidth = 1060;

    // คำนวณความกว้างพื้นฐานของคอลัมน์ที่เลือก (ยังไม่รวมการปรับขนาด)
    let baseWidthSum = 0;
    let carNameSelected = false;

    for (const key of columnKeys) {
      if (key === 'carName') {
        // เพิ่มความกว้างเป็น 2 เท่าสำหรับ carName
        baseWidthSum += baseColumnWidthMapping[key] * 2;
        carNameSelected = true;
      } else {
        baseWidthSum += baseColumnWidthMapping[key];
      }
    }

    // คำนวณสัดส่วนการปรับขนาด (scale factor)
    const scaleFactor = targetTotalWidth / baseWidthSum;

    // สร้าง columnWidthMapping ที่ปรับขนาดแล้ว
    const columnWidthMapping = {};
    for (const key of Object.keys(baseColumnWidthMapping)) {
      if (key === 'carName') {
        // รถที่จอง: ปรับเป็น 2 เท่าของค่าพื้นฐานก่อน แล้วค่อยคูณด้วย scaleFactor
        columnWidthMapping[key] = Math.round((baseColumnWidthMapping[key] * 2) * scaleFactor);
      } else {
        columnWidthMapping[key] = Math.round(baseColumnWidthMapping[key] * scaleFactor);
      }
    }

    // ตั้งค่าความกว้างคอลัมน์เฉพาะที่เลือก
    for (let i = 0; i < columnKeys.length; i++) {
      tempSheet.setColumnWidth(i + 1, columnWidthMapping[columnKeys[i]]);
    }

    // บันทึก log ข้อมูลการปรับขนาดเพื่อการตรวจสอบ
    Logger.log(`จำนวนคอลัมน์ที่เลือก: ${columnKeys.length}, ความกว้างพื้นฐานรวม: ${baseWidthSum}, scaleFactor: ${scaleFactor.toFixed(2)}`);
    Logger.log(`ความกว้างคอลัมน์หลังปรับขนาด: ${JSON.stringify(columnWidthMapping)}`);


    // เพิ่มหัวตาราง
    tempSheet.getRange(1, 1, 1, numColumns).merge().setValue(`รายการจองรถประจำเดือน ${month} ${year}`);
    tempSheet.getRange(2, 1, 1, numColumns).merge().setValue(companyName);
    tempSheet.getRange(3, 1, 1, numColumns).merge().setValue(`วันที่พิมพ์: ${Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy")}`);

    // เพิ่มหัวคอลัมน์
    tempSheet.getRange(5, 1, 1, numColumns).setValues([headers]);

    // ตรวจสอบข้อมูลการจอง
    if (!bookingList || bookingList.length === 0) {
      tempSheet.getRange(6, 1, 1, numColumns).merge().setValue(`ไม่พบข้อมูลการจองรถในเดือน ${month} ${year}`);
    } else {
      // เตรียมข้อมูลสำหรับการเรียงลำดับ
      let processedBookings = [];

      // หาเลขเดือนและปีจากชื่อเดือนและปีที่รับเข้ามา
      const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
      const monthIndex = monthNames.indexOf(month);
      const targetMonth = monthIndex + 1; // เดือนเป็นตัวเลข (1-12)
      const targetYear = parseInt(year); // ปีเป็นตัวเลข

      // เตรียมข้อมูลวันที่สำหรับการเรียงลำดับ
      bookingList.forEach(booking => {
        // แปลงวันที่จาก dd/MM/yyyy เป็น Date object
        let pickupDateParts, returnDateParts;
        let pickupDate, returnDate;

        if (booking.pickupDate && booking.pickupDate.includes('/')) {
          pickupDateParts = booking.pickupDate.split('/');
          if (pickupDateParts.length === 3) {
            // สร้าง Date object (เดือนใน Date เริ่มจาก 0)
            pickupDate = new Date(
              parseInt(pickupDateParts[2]),
              parseInt(pickupDateParts[1]) - 1,
              parseInt(pickupDateParts[0])
            );
          }
        }

        if (booking.returnDate && booking.returnDate.includes('/')) {
          returnDateParts = booking.returnDate.split('/');
          if (returnDateParts.length === 3) {
            // สร้าง Date object (เดือนใน Date เริ่มจาก 0)
            returnDate = new Date(
              parseInt(returnDateParts[2]),
              parseInt(returnDateParts[1]) - 1,
              parseInt(returnDateParts[0])
            );
          }
        }

        // เช็คว่าวันที่รับรถหรือวันที่คืนรถตรงกับเดือนที่ต้องการหรือไม่
        if (pickupDate || returnDate) {
          const pickupMonth = pickupDate ? pickupDate.getMonth() + 1 : null;
          const pickupYear = pickupDate ? pickupDate.getFullYear() : null;
          const returnMonth = returnDate ? returnDate.getMonth() + 1 : null;
          const returnYear = returnDate ? returnDate.getFullYear() : null;

          // ถ้าวันที่รับรถหรือวันที่คืนรถอยู่ในเดือนที่ต้องการ ให้เพิ่มในรายการ
          if ((pickupMonth === targetMonth && pickupYear === targetYear) ||
            (returnMonth === targetMonth && returnYear === targetYear)) {

            // เพิ่มค่าวันที่เป็นตัวเลขเพื่อใช้เรียงลำดับ
            let bookingDay = 32; // ค่าเริ่มต้นสูงกว่าวันในเดือน

            // ถ้าวันที่รับรถอยู่ในเดือนที่ต้องการ ใช้วันที่รับรถในการเรียงลำดับ
            if (pickupMonth === targetMonth && pickupYear === targetYear) {
              bookingDay = pickupDate.getDate();
            }
            // ถ้าวันที่คืนรถอยู่ในเดือนที่ต้องการและวันที่รับรถไม่ได้อยู่ในเดือนนี้ ใช้วันที่คืนรถในการเรียงลำดับ
            else if (returnMonth === targetMonth && returnYear === targetYear) {
              bookingDay = returnDate.getDate();
            }

            // เพิ่มข้อมูลในรายการพร้อมค่าสำหรับการเรียงลำดับ
            processedBookings.push({
              booking: booking,
              sortDay: bookingDay
            });
          }
        }
      });

      // เรียงลำดับตามวันที่
      processedBookings.sort((a, b) => a.sortDay - b.sortDay);

      // เพิ่มข้อมูลการจองที่เรียงลำดับแล้ว
      for (let i = 0; i < processedBookings.length; i++) {
        const booking = processedBookings[i].booking;

        // สร้างข้อมูลแถวตามคอลัมน์ที่เลือก
        const rowData = [];
        for (const key of columnKeys) {
          if (key === 'customerPhone') {
            // เพิ่ม ' นำหน้าเพื่อบังคับให้เป็นข้อความ
            rowData.push("'" + (booking[key] || '-'));
          } else {
            rowData.push(booking[key] || '-');
          }
        }

        tempSheet.getRange(6 + i, 1, 1, numColumns).setValues([rowData]);
      }

      // อัปเดตจำนวนแถวข้อมูลสำหรับการจัดรูปแบบ
      bookingList = processedBookings.map(item => item.booking);
    }

    // จัดรูปแบบตาราง
    // จัดรูปแบบส่วนหัว
    tempSheet.getRange(1, 1, 1, numColumns)
      .setFontSize(16)
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setBackground("#ffffff");

    tempSheet.getRange(2, 1, 1, numColumns)
      .setFontSize(14)
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setBackground("#ffffff");

    tempSheet.getRange(3, 1, 1, numColumns)
      .setFontSize(11)
      .setHorizontalAlignment("right")
      .setVerticalAlignment("middle")
      .setBackground("#ffffff")
      .setFontColor("#666666");

    // จัดรูปแบบหัวตาราง - ใช้เส้นขอบแทนพื้นหลังสีเข้ม
    tempSheet.getRange(5, 1, 1, numColumns)
      .setFontWeight("bold")
      .setFontSize(12)
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setBackground("#f0f0f0")  // สีเทาอ่อนมาก ประหยัดหมึก
      .setBorder(true, true, true, true, true, true, "#888888", SpreadsheetApp.BorderStyle.SOLID);

    // จัดรูปแบบแถวข้อมูล
    const dataRange = tempSheet.getRange(6, 1, Math.max(1, bookingList ? bookingList.length : 1), numColumns);
    dataRange
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setBorder(true, true, true, true, true, true, "#cccccc", SpreadsheetApp.BorderStyle.SOLID);

    // ใส่สีสลับแถวแบบประหยัดหมึก
    if (bookingList && bookingList.length > 0) {
      for (let i = 0; i < bookingList.length; i++) {
        if (i % 2 === 0) { // แถวคี่
          tempSheet.getRange(6 + i, 1, 1, numColumns).setBackground("#ffffff");
        } else { // แถวคู่
          tempSheet.getRange(6 + i, 1, 1, numColumns).setBackground("#f8f8f8"); // สีเทาอ่อนมากๆ แทบจะขาว
        }

        // ทำให้หมายเลขจองและข้อมูลสำคัญเด่นชัดด้วยตัวหนาแทนการใช้สี
        const bookingNoIndex = columnKeys.indexOf('bookingNo');
        const customerNameIndex = columnKeys.indexOf('customerName');

        if (bookingNoIndex !== -1) {
          tempSheet.getRange(6 + i, bookingNoIndex + 1).setFontWeight("bold"); // หมายเลขจอง
        }
        if (customerNameIndex !== -1) {
          tempSheet.getRange(6 + i, customerNameIndex + 1).setFontWeight("bold"); // ชื่อลูกค้า
        }
      }
    }

    // เพิ่มเส้นขอบด้านนอกแบบหนา
    tempSheet.getRange(1, 1, bookingList ? bookingList.length + 5 : 6, numColumns)
      .setBorder(true, true, true, true, null, null, "#000000", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

    // เพิ่มเส้นแบ่งระหว่างส่วนหัวและข้อมูล
    tempSheet.getRange(5, 1, 1, numColumns)
      .setBorder(null, null, true, null, null, null, "#000000", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

    // ปรับความสูงของแถวให้พอดี
    tempSheet.setRowHeight(1, 30); // หัวรายงาน
    tempSheet.setRowHeight(5, 25); // หัวตาราง

    // ปรับการตั้งค่าการพิมพ์เพื่อให้แน่ใจว่าทุกคอลัมน์แสดงบนหน้าเดียว
    tempSheet.setHiddenGridlines(true);

    // กำหนดขอบเขตการพิมพ์
    const printRange = tempSheet.getRange(1, 1, bookingList ? bookingList.length + 5 : 6, numColumns);
    tempSheet.setActiveRange(printRange);

    // ทำให้แน่ใจว่าการเปลี่ยนแปลงทั้งหมดถูกบันทึก
    SpreadsheetApp.flush();

    // สร้าง PDF โดยใช้วิธีเดียวกับ generateRentalContract
    const spreadsheetId = ss.getId();
    // ตั้งค่า Export URL - แก้ไขเป็นแนวนอน (landscape) เพื่อให้พอดีกับตาราง
    const pdfExportUrl = 'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/export?format=pdf'
      + '&size=7' // A4 size
      + '&portrait=false' // แนวนอน (landscape)
      + '&fitw=true' // Fit to width
      + '&top_margin=0.2' // ขอบบน (inches)
      + '&bottom_margin=0.2' // ขอบล่าง
      + '&left_margin=0.2' // ขอบซ้าย
      + '&right_margin=0.2' // ขอบขวา
      + '&sheetnames=false&printtitle=false' // ไม่แสดงชื่อชีท
      + '&pagenumbers=false' // ไม่แสดงเลขหน้า
      + '&gridlines=false' // ไม่แสดงเส้นตาราง
      + '&fzr=false' // ไม่ทำซ้ำแถวที่ถูก freeze
      + '&gid=' + tempSheet.getSheetId(); // ส่งออกเฉพาะชีทนี้

    // ดึง PDF
    const response = UrlFetchApp.fetch(pdfExportUrl, {
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
      },
      muteHttpExceptions: true // ป้องกันสคริปต์หยุดเมื่อเกิดข้อผิดพลาด
    });

    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      Logger.log("Failed to fetch PDF. Response code: " + responseCode + ". URL: " + pdfExportUrl);
      throw new Error("Failed to fetch PDF. Response code: " + responseCode);
    }

    const blob = response.getBlob();
    if (!blob || blob.getContentType() !== 'application/pdf') {
      Logger.log("Failed to generate PDF blob or invalid content type. ContentType received: " + (blob ? blob.getContentType() : 'null blob'));
      throw new Error("Failed to generate PDF blob or invalid content type.");
    }

    // บันทึกไฟล์ PDF ในโฟลเดอร์
    // ใส่จำนวนคอลัมน์ที่เลือกในชื่อไฟล์เพื่อให้ผู้ใช้ทราบว่าเลือกกี่คอลัมน์
    const pdfFileName = `รายการจองรถ_${month}_${year}.pdf`;
    const pdfFile = pdfFolder.createFile(blob.setName(pdfFileName));

    // ตั้งค่าการแชร์ (ถ้าต้องการ)
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // ลบชีทชั่วคราว
    ss.deleteSheet(tempSheet);
    tempSheet = null;

    // ส่งคืน URL ของไฟล์ PDF
    return pdfFile.getUrl();

  } catch (error) {
    Logger.log("เกิดข้อผิดพลาดในการสร้าง PDF: " + error.message);

    // Cleanup: ลบแผ่นงาน temp ถ้ายังอยู่
    try {
      if (tempSheet) {
        const ss = SpreadsheetApp.openById(sheetID);
        ss.deleteSheet(tempSheet);
      }
    } catch (cleanupError) {
      Logger.log("Error during cleanup: " + cleanupError.toString());
    }

    throw new Error("เกิดข้อผิดพลาดในการสร้าง PDF: " + error.message);
  }
}






//// จัดการปฏิทิน

function deleteCalendarEvent(eventId, calendarId, sheetID) {
  console.log(`🗑️ [deleteCalendarEvent] เริ่มลบกิจกรรม: ${eventId} จากปฏิทิน: ${calendarId}`);

  // ตรวจสอบค่า input
  if (!eventId || !calendarId) {
    console.log("⚠️ [deleteCalendarEvent] ข้อมูล eventId หรือ calendarId ไม่ครบถ้วน");
    return {
      success: false,
      message: "ข้อมูล eventId หรือ calendarId ไม่ครบถ้วน"
    };
  }

  try {
    // เข้าถึงปฏิทิน
    const calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) {
      console.log(`❌ [deleteCalendarEvent] ไม่พบปฏิทิน: ${calendarId}`);
      return {
        success: false,
        message: `ไม่พบปฏิทิน: ${calendarId}`
      };
    }

    // ทำความสะอาด eventId (ลบ @calendar.google.com ถ้ามี)
    const actualEventId = eventId.toString().split('@')[0];
    console.log(`🔍 [deleteCalendarEvent] กำลังค้นหา eventId: ${actualEventId}`);

    // ค้นหากิจกรรม
    const event = calendar.getEventById(actualEventId);

    if (event) {
      const eventTitle = event.getTitle();
      console.log(`📅 [deleteCalendarEvent] พบกิจกรรม: "${eventTitle}"`);

      // ลบกิจกรรม
      event.deleteEvent();
      console.log(`✅ [deleteCalendarEvent] ลบกิจกรรมสำเร็จ: "${eventTitle}"`);

      // อัพเดตข้อมูลในแผ่นงาน - ล้างข้อมูลกิจกรรมปฏิทินออก
      try {
        const ss = SpreadsheetApp.openById(sheetID);
        const rentalSheet = ss.getSheetByName("รายการเช่า");

        if (rentalSheet) {
          const data = rentalSheet.getDataRange().getValues();
          const headers = data[0];

          const bookingNumberIndex = headers.indexOf("หมายเลขการจอง");
          const calendarEventIdIndex = headers.indexOf("IDกิจกรรมปฏิทิน");
          const calendarIdIndex = headers.indexOf("IDปฏิทิน");
          const calendarLinkIndex = headers.indexOf("ลิงก์ปฏิทิน");

          // ค้นหาแถวที่มี eventId ตรงกัน
          for (let i = 1; i < data.length; i++) {
            if (data[i][calendarEventIdIndex] === eventId || data[i][calendarEventIdIndex] === actualEventId) {
              // ล้างข้อมูลกิจกรรมปฏิทิน
              if (calendarEventIdIndex !== -1) rentalSheet.getRange(i + 1, calendarEventIdIndex + 1).setValue('');
              if (calendarIdIndex !== -1) rentalSheet.getRange(i + 1, calendarIdIndex + 1).setValue('');
              if (calendarLinkIndex !== -1) rentalSheet.getRange(i + 1, calendarLinkIndex + 1).setValue('');

              console.log(`🧹 [deleteCalendarEvent] ล้างข้อมูลกิจกรรมปฏิทินในแผ่นงาน แถว ${i + 1}`);
              break;
            }
          }
        }
      } catch (sheetError) {
        console.error("⚠️ [deleteCalendarEvent] ไม่สามารถอัพเดตแผ่นงานได้:", sheetError);
        // ไม่ return error เพราะกิจกรรมลบสำเร็จแล้ว
      }

      return {
        success: true,
        message: `ลบกิจกรรม "${eventTitle}" สำเร็จ`
      };
    } else {
      console.log(`⚠️ [deleteCalendarEvent] ไม่พบกิจกรรม: ${actualEventId}`);
      return {
        success: true,
        message: `ไม่พบกิจกรรม ${actualEventId} (อาจถูกลบไปแล้ว)`
      };
    }
  } catch (error) {
    console.error(`❌ [deleteCalendarEvent] ลบกิจกรรมไม่สำเร็จ: ${eventId}`, error);
    return {
      success: false,
      message: `ลบกิจกรรมไม่สำเร็จ: ${error.message}`
    };
  }
}




function updateCalendarEvent(rentalData, eventId, calendarId, sheetID) {
  console.log(`🔄 [updateCalendarEvent] เริ่มอัพเดตกิจกรรม: ${eventId}`);

  // ตรวจสอบข้อมูล input
  if (!eventId || !calendarId || eventId.trim() === '' || calendarId.trim() === '') {
    console.log("ℹ️ [updateCalendarEvent] ไม่มี eventId หรือ calendarId - สร้างกิจกรรมใหม่");
    return createCalendarEventForRental(rentalData, sheetID);
  }

  try {
    // เข้าถึงปฏิทิน
    const calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) {
      console.log(`❌ [updateCalendarEvent] ไม่พบปฏิทิน: ${calendarId} - สร้างกิจกรรมใหม่`);
      return createCalendarEventForRental(rentalData, sheetID);
    }

    // ค้นหากิจกรรม
    const actualEventId = eventId.split('@')[0];
    const event = calendar.getEventById(actualEventId);

    if (!event) {
      console.log(`❌ [updateCalendarEvent] ไม่พบกิจกรรม: ${actualEventId} - สร้างกิจกรรมใหม่`);
      return createCalendarEventForRental(rentalData, sheetID);
    }

    console.log(`✅ [updateCalendarEvent] พบกิจกรรมเดิม - ดำเนินการอัพเดต`);

    const ss = SpreadsheetApp.openById(sheetID);
    const carSheet = ss.getSheetByName("รายชื่อรถ");
    // สร้าง DateTime objects
    const startDate = new Date(rentalData.วันที่เช่า);
    const startTime = rentalData.เวลารับรถ.split(":");
    startDate.setHours(parseInt(startTime[0]), parseInt(startTime[1]), 0);
    const endDate = new Date(rentalData.วันที่คืน);
    const endTime = rentalData.เวลาคืนรถ.split(":");
    endDate.setHours(parseInt(endTime[0]), parseInt(endTime[1]), 0);

    // อัพเดตกิจกรรม
    const title = `(${rentalData.หมายเลขการจอง}) ${rentalData.รถ}`;
    let description = `<div style="line-height: 1.4;">
      <h4 style="margin: 8px 0;">👤 ${rentalData.ชื่อลูกค้า}</h4>
      <div style="margin: 3px 0;">📞 ${rentalData.เบอร์โทรศัพท์}</div>
      <div style="margin: 10px 0;"></div>
      <div style="margin: 3px 0;">📆 วันที่เช่า: ${new Date(rentalData.วันที่เช่า).toLocaleDateString('th-TH')}</div>
      <div style="margin: 3px 0;">🕒 เวลารับรถ: ${rentalData.เวลารับรถ}</div>
      <div style="margin: 3px 0;">📍 สถานที่รับรถ:</div>
      <div style="margin: 3px 0 3px 20px;"><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rentalData.สถานที่รับรถ)}" target="_blank">${rentalData.สถานที่รับรถ}</a></div>
      <div style="margin: 10px 0;"></div>
      <div style="margin: 3px 0;">📆 วันที่คืน: ${new Date(rentalData.วันที่คืน).toLocaleDateString('th-TH')}</div>
      <div style="margin: 3px 0;">🕒 เวลาคืนรถ: ${rentalData.เวลาคืนรถ}</div>
      <div style="margin: 3px 0;">📍 สถานที่คืนรถ:</div>
      <div style="margin: 3px 0 3px 20px;"><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rentalData.สถานที่คืนรถ)}" target="_blank">${rentalData.สถานที่คืนรถ}</a></div>
      <div style="margin: 10px 0;"></div>
      <div style="margin: 3px 0;">💰 ค่าเช่ารวมทั้งหมด: ${rentalData.ค่าเช่ารวมทั้งหมด} บาท</div>`;

    // สร้างข้อความหมายเหตุรวม (หมายเหตุ + คาร์ซีท + ประกันเสริม)
    let notesSection = '';

    // เพิ่มหมายเหตุทั่วไป (ถ้ามี)
    if (rentalData.หมายเหตุ) {
      notesSection += rentalData.หมายเหตุ;
    }

    // เพิ่มข้อมูลคาร์ซีท (ถ้ามี)
    if (rentalData.ต้องการคาร์ซีท) {
      if (notesSection) notesSection += '\n';
      if (rentalData.คาร์ซีทมีค่าบริการ === true || rentalData.คาร์ซีทมีค่าบริการ === 'true' || rentalData.คาร์ซีทมีค่าบริการ === 'TRUE') {
        const carSeatFee = parseFloat(rentalData.ค่าคาร์ซีท) || 0;
        notesSection += `🍼 คาร์ซีท: มี (ค่าบริการ ${carSeatFee.toLocaleString()} บาท)`;
      } else {
        notesSection += `🍼 คาร์ซีท: มี (ไม่มีค่าบริการ)`;
      }
    }

    // เพิ่มข้อมูลประกันเสริม (ถ้ามี)
    if (rentalData.ต้องการประกันเสริม) {
      if (notesSection) notesSection += '\n';
      const days = parseFloat(rentalData.จำนวนวันประกันเสริม) || 0;
      const pricePerDay = parseFloat(rentalData.ราคาประกันเสริมต่อวัน) || 0;
      const totalInsurance = parseFloat(rentalData.ค่าประกันเสริมรวม) || 0;
      notesSection += `🛡️ ประกันเสริม: มี (${days} วัน × ${pricePerDay.toLocaleString()} บาท = ${totalInsurance.toLocaleString()} บาท)`;
    }

    // แสดงส่วนหมายเหตุรวม (ถ้ามี)
    if (notesSection) {
      description += `
      <div style="margin: 10px 0;"></div>
      <div style="margin: 3px 0;">📌 หมายเหตุ</div>
      <div style="margin: 3px 0 3px 20px;">${notesSection.replace(/\n/g, '<br>')}</div>`;
    }

    // เพิ่มลิงก์สัญญาเช่า (ถ้ามี)
    if (rentalData.ลิงก์สัญญาเช่า) {
      description += `
      <div style="margin: 10px 0;"></div>
      <div style="margin: 3px 0;">📝 ลิงก์สัญญาเช่า</div>
      <div style="margin: 3px 0 3px 20px;"><a href="${rentalData.ลิงก์สัญญาเช่า}" target="_blank">ดูสัญญาเช่า</a></div>`;
    }

    description += `</div>`; // ปิด div หลัก

    event.setTitle(title);
    event.setTime(startDate, endDate);
    event.setDescription(description);
    event.setLocation(rentalData.สถานที่รับรถ);

    // ดึงข้อมูลสีปฏิทินจากแผ่นงานรายชื่อรถ
    let eventColor = CalendarApp.EventColor.BLUE; // ค่าเริ่มต้นเป็นสีฟ้า

    // ดึงข้อมูลจากแผ่นงานรายชื่อรถ
    const carData = carSheet.getDataRange().getValues();
    const headers = carData[0];

    // หาคอลัมน์ที่เก็บข้อมูลทะเบียนรถและสีปฏิทิน
    const licensePlateIndex = headers.indexOf("ทะเบียน");
    const carColorIndex = headers.indexOf("สีปฏิทิน");
    if (licensePlateIndex !== -1 && carColorIndex !== -1 && rentalData.ทะเบียนรถ) {
      // ค้นหารถในแผ่นงานรายชื่อรถตามทะเบียน
      for (let i = 1; i < carData.length; i++) {
        // ตรวจสอบว่าทะเบียนรถตรงกันหรือไม่
        if (carData[i][licensePlateIndex] === rentalData.ทะเบียนรถ ||
          carData[i][licensePlateIndex].includes(rentalData.ทะเบียนรถ) ||
          rentalData.ทะเบียนรถ.includes(carData[i][licensePlateIndex])) {

          // ถ้าพบรถที่ตรงกัน ให้ดึงค่าสีปฏิทิน
          const colorName = carData[i][carColorIndex];
          if (colorName) {
            Logger.log("พบรถทะเบียน: " + rentalData.ทะเบียนรถ + " กำหนดสีปฏิทินเป็น: " + colorName);
            // แปลงชื่อสีเป็นค่าสีในปฏิทิน
            switch (colorName) {
              case "PALE_BLUE": eventColor = CalendarApp.EventColor.PALE_BLUE; break;
              case "PALE_GREEN": eventColor = CalendarApp.EventColor.PALE_GREEN; break;
              case "MAUVE": eventColor = CalendarApp.EventColor.MAUVE; break;
              case "PALE_RED": eventColor = CalendarApp.EventColor.PALE_RED; break;
              case "YELLOW": eventColor = CalendarApp.EventColor.YELLOW; break;
              case "ORANGE": eventColor = CalendarApp.EventColor.ORANGE; break;
              case "CYAN": eventColor = CalendarApp.EventColor.CYAN; break;
              case "GRAY": eventColor = CalendarApp.EventColor.GRAY; break;
              case "BLUE": eventColor = CalendarApp.EventColor.BLUE; break;
              case "GREEN": eventColor = CalendarApp.EventColor.GREEN; break;
              case "RED": eventColor = CalendarApp.EventColor.RED; break;
              default: eventColor = CalendarApp.EventColor.BLUE;
            }
            break;
          }
        }
      }
    } else {
      Logger.log("ไม่พบคอลัมน์ทะเบียนหรือสีปฏิทิน หรือไม่มีข้อมูลทะเบียนรถในรายการเช่า");
    }

    // อัพเดตสี
    event.setColor(eventColor);

    // สร้าง URL สำหรับกิจกรรม
    const eventUrl = "https://www.google.com/calendar/event?eid=" +
      Utilities.base64Encode(actualEventId + " " + calendarId).replace(/\=/g, '');

    return {
      success: true,
      eventId: actualEventId,
      eventUrl: eventUrl,
      calendarId: calendarId,
      message: "อัพเดตกิจกรรมในปฏิทินสำเร็จ"
    };
  } catch (error) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการอัพเดตกิจกรรมในปฏิทิน: " + error.toString()
    };
  }
}





function createCalendarEventForRental(rentalData, sheetID) {
  // ตรวจสอบว่ามี ID ปฏิทินในแผ่นตั้งค่าระบบหรือไม่
  const ss = SpreadsheetApp.openById(sheetID);
  const settingSheet = ss.getSheetByName("ตั้งค่าระบบ");
  const carSheet = ss.getSheetByName("รายชื่อรถ");

  // ค้นหาคีย์ "IDปฏิทิน" ในแผ่นตั้งค่า
  const settingsData = settingSheet.getDataRange().getValues();
  let calendarId = null;
  for (let i = 0; i < settingsData.length; i++) {
    if (settingsData[i][0] === "IDปฏิทิน") {
      calendarId = settingsData[i][1];
      break;
    }
  }

  // ถ้าไม่มี ID ปฏิทิน ให้ออกจากฟังก์ชัน
  if (!calendarId) {
    return { success: false, message: "ไม่พบ ID ปฏิทินในการตั้งค่าระบบ" };
  }

  try {
    // เข้าถึงปฏิทินด้วย ID
    const calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) {
      return { success: false, message: "ไม่สามารถเข้าถึงปฏิทินได้ กรุณาตรวจสอบ ID ปฏิทิน" };
    }

    // สร้าง DateTime objects สำหรับวันเวลาเริ่มต้นและสิ้นสุด
    const startDate = new Date(rentalData.วันที่เช่า);
    const startTime = rentalData.เวลารับรถ.split(":");
    startDate.setHours(parseInt(startTime[0]), parseInt(startTime[1]), 0);

    const endDate = new Date(rentalData.วันที่คืน);
    const endTime = rentalData.เวลาคืนรถ.split(":");
    endDate.setHours(parseInt(endTime[0]), parseInt(endTime[1]), 0);
    const title = `(${rentalData.หมายเลขการจอง}) ${rentalData.รถ}`;

    let description = `<div style="line-height: 1.4;">
      <h4 style="margin: 8px 0;">👤 ${rentalData.ชื่อลูกค้า}</h4>
      <div style="margin: 3px 0;">📞 ${rentalData.เบอร์โทรศัพท์}</div>
      <div style="margin: 10px 0;"></div>
      <div style="margin: 3px 0;">📆 วันที่เช่า: ${new Date(rentalData.วันที่เช่า).toLocaleDateString('th-TH')}</div>
      <div style="margin: 3px 0;">🕒 เวลารับรถ: ${rentalData.เวลารับรถ}</div>
      <div style="margin: 3px 0;">📍 สถานที่รับรถ:</div>
      <div style="margin: 3px 0 3px 20px;"><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rentalData.สถานที่รับรถ)}" target="_blank">${rentalData.สถานที่รับรถ}</a></div>
      <div style="margin: 10px 0;"></div>
      <div style="margin: 3px 0;">📆 วันที่คืน: ${new Date(rentalData.วันที่คืน).toLocaleDateString('th-TH')}</div>
      <div style="margin: 3px 0;">🕒 เวลาคืนรถ: ${rentalData.เวลาคืนรถ}</div>
      <div style="margin: 3px 0;">📍 สถานที่คืนรถ:</div>
      <div style="margin: 3px 0 3px 20px;"><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rentalData.สถานที่คืนรถ)}" target="_blank">${rentalData.สถานที่คืนรถ}</a></div>
      <div style="margin: 10px 0;"></div>
      <div style="margin: 3px 0;">💰 ค่าเช่ารวมทั้งหมด: ${rentalData.ค่าเช่ารวมทั้งหมด} บาท</div>`;

    // สร้างข้อความหมายเหตุรวม (หมายเหตุ + คาร์ซีท + ประกันเสริม)
    let notesSection = '';

    // เพิ่มหมายเหตุทั่วไป (ถ้ามี)
    if (rentalData.หมายเหตุ) {
      notesSection += rentalData.หมายเหตุ;
    }

    // เพิ่มข้อมูลคาร์ซีท (ถ้ามี)
    if (rentalData.ต้องการคาร์ซีท) {
      if (notesSection) notesSection += '\n';
      if (rentalData.คาร์ซีทมีค่าบริการ === true || rentalData.คาร์ซีทมีค่าบริการ === 'true' || rentalData.คาร์ซีทมีค่าบริการ === 'TRUE') {
        const carSeatFee = parseFloat(rentalData.ค่าคาร์ซีท) || 0;
        notesSection += `🍼 คาร์ซีท: มี (ค่าบริการ ${carSeatFee.toLocaleString()} บาท)`;
      } else {
        notesSection += `🍼 คาร์ซีท: มี (ไม่มีค่าบริการ)`;
      }
    }

    // เพิ่มข้อมูลประกันเสริม (ถ้ามี)
    if (rentalData.ต้องการประกันเสริม) {
      if (notesSection) notesSection += '\n';
      const days = parseFloat(rentalData.จำนวนวันประกันเสริม) || 0;
      const pricePerDay = parseFloat(rentalData.ราคาประกันเสริมต่อวัน) || 0;
      const totalInsurance = parseFloat(rentalData.ค่าประกันเสริมรวม) || 0;
      notesSection += `🛡️ ประกันเสริม: มี (${days} วัน × ${pricePerDay.toLocaleString()} บาท = ${totalInsurance.toLocaleString()} บาท)`;
    }

    // แสดงส่วนหมายเหตุรวม (ถ้ามี)
    if (notesSection) {
      description += `
      <div style="margin: 10px 0;"></div>
      <div style="margin: 3px 0;">📌 หมายเหตุ</div>
      <div style="margin: 3px 0 3px 20px;">${notesSection.replace(/\n/g, '<br>')}</div>`;
    }

    // เพิ่มลิงก์สัญญาเช่า (ถ้ามี)
    if (rentalData.ลิงก์สัญญาเช่า) {
      description += `
      <div style="margin: 10px 0;"></div>
      <div style="margin: 3px 0;">📝 ลิงก์สัญญาเช่า</div>
      <div style="margin: 3px 0 3px 20px;"><a href="${rentalData.ลิงก์สัญญาเช่า}" target="_blank">ดูสัญญาเช่า</a></div>`;
    }

    description += `</div>`; // ปิด div หลัก

    // สร้างกิจกรรมในปฏิทิน
    const event = calendar.createEvent(title, startDate, endDate, {
      description: description,
      location: rentalData.สถานที่รับรถ
    });
    // ดึงข้อมูลสีปฏิทินจากแผ่นงานรายชื่อรถ
    let eventColor = CalendarApp.EventColor.BLUE; // ค่าเริ่มต้นเป็นสีฟ้า

    // ดึงข้อมูลจากแผ่นงานรายชื่อรถ
    const carData = carSheet.getDataRange().getValues();
    const headers = carData[0];

    // หาคอลัมน์ที่เก็บข้อมูลทะเบียนรถและสีปฏิทิน
    const licensePlateIndex = headers.indexOf("ทะเบียน");
    const carColorIndex = headers.indexOf("สีปฏิทิน");
    if (licensePlateIndex !== -1 && carColorIndex !== -1 && rentalData.ทะเบียนรถ) {
      // ค้นหารถในแผ่นงานรายชื่อรถตามทะเบียน
      for (let i = 1; i < carData.length; i++) {
        // ตรวจสอบว่าทะเบียนรถตรงกันหรือไม่
        if (carData[i][licensePlateIndex] === rentalData.ทะเบียนรถ ||
          carData[i][licensePlateIndex].includes(rentalData.ทะเบียนรถ) ||
          rentalData.ทะเบียนรถ.includes(carData[i][licensePlateIndex])) {

          // ถ้าพบรถที่ตรงกัน ให้ดึงค่าสีปฏิทิน
          const colorName = carData[i][carColorIndex];
          if (colorName) {
            Logger.log("พบรถทะเบียน: " + rentalData.ทะเบียนรถ + " กำหนดสีปฏิทินเป็น: " + colorName);
            // แปลงชื่อสีเป็นค่าสีในปฏิทิน
            switch (colorName) {
              case "PALE_BLUE":
                eventColor = CalendarApp.EventColor.PALE_BLUE;
                break;
              case "PALE_GREEN":
                eventColor = CalendarApp.EventColor.PALE_GREEN;
                break;
              case "MAUVE":
                eventColor = CalendarApp.EventColor.MAUVE;
                break;
              case "PALE_RED":
                eventColor = CalendarApp.EventColor.PALE_RED;
                break;
              case "YELLOW":
                eventColor = CalendarApp.EventColor.YELLOW;
                break;
              case "ORANGE":
                eventColor = CalendarApp.EventColor.ORANGE;
                break;
              case "CYAN":
                eventColor = CalendarApp.EventColor.CYAN;
                break;
              case "GRAY":
                eventColor = CalendarApp.EventColor.GRAY;
                break;
              case "BLUE":
                eventColor = CalendarApp.EventColor.BLUE;
                break;
              case "GREEN":
                eventColor = CalendarApp.EventColor.GREEN;
                break;
              case "RED":
                eventColor = CalendarApp.EventColor.RED;
                break;
              default:
                eventColor = CalendarApp.EventColor.BLUE; // ค่าเริ่มต้นถ้าไม่พบสี
            }
            break; // หยุดการค้นหาเมื่อพบรถที่ตรงกัน
          }
        }
      }
    } else {
      Logger.log("ไม่พบคอลัมน์ทะเบียนหรือสีปฏิทิน หรือไม่มีข้อมูลทะเบียนรถในรายการเช่า");
    }

    // ตั้งค่าสีของกิจกรรม
    event.setColor(eventColor);

    // ================== ✅ จุดแก้ไขสำคัญ ✅ ==================
    const eventId = event.getId();
    const actualEventId = eventId.split('@')[0]; // <<< แยกเอาเฉพาะ ID ที่ถูกต้อง

    // สร้าง URL สำหรับกิจกรรม
    const eventUrl = "https://www.google.com/calendar/event?eid=" +
      Utilities.base64Encode(actualEventId + " " + calendarId).replace(/\=/g, '');

    return {
      success: true,
      eventId: actualEventId, // <<< ส่ง ID ที่ถูกต้องกลับไป
      eventUrl: eventUrl,
      calendarId: calendarId,
      message: "สร้างกิจกรรมในปฏิทินสำเร็จ"
    };
    // =======================================================

  } catch (error) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างกิจกรรมในปฏิทิน: " + error.toString()
    };
  }
}





















function updateRentalCalendarInfo(bookingNumber, eventUrl, eventId, calendarId, sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);
  const sheet = ss.getSheetByName(RENTAL_SHEET);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const bookingNumberIndex = headers.indexOf("หมายเลขการจอง");
  const calendarLinkIndex = headers.indexOf("ลิงก์ปฏิทิน");
  const calendarEventIdIndex = headers.indexOf("IDกิจกรรมปฏิทิน");
  const calendarIdIndex = headers.indexOf("IDปฏิทิน");

  // เพิ่มคอลัมน์ถ้ายังไม่มี
  let updatedHeaders = headers;

  if (calendarLinkIndex === -1) {
    sheet.insertColumnAfter(sheet.getLastColumn());
    sheet.getRange(1, sheet.getLastColumn()).setValue("ลิงก์ปฏิทิน");
    updatedHeaders.push("ลิงก์ปฏิทิน");
  }

  if (calendarEventIdIndex === -1) {
    sheet.insertColumnAfter(sheet.getLastColumn());
    sheet.getRange(1, sheet.getLastColumn()).setValue("IDกิจกรรมปฏิทิน");
    updatedHeaders.push("IDกิจกรรมปฏิทิน");
  }

  if (calendarIdIndex === -1) {
    sheet.insertColumnAfter(sheet.getLastColumn());
    sheet.getRange(1, sheet.getLastColumn()).setValue("IDปฏิทิน");
    updatedHeaders.push("IDปฏิทิน");
  }

  // ค้นหาแถวที่มีหมายเลขการจองตรงกัน
  let rentalRowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][bookingNumberIndex] === bookingNumber) {
      rentalRowIndex = i + 1; // +1 เพราะ index เริ่มจาก 0 แต่แถวเริ่มจาก 1
      break;
    }
  }

  // ถ้าไม่พบรายการเช่า
  if (rentalRowIndex === -1) {
    return { success: false, message: "ไม่พบรายการเช่าที่มีหมายเลขการจองนี้" };
  }

  // อัพเดตข้อมูลปฏิทิน
  const updatedCalendarLinkIndex = calendarLinkIndex === -1 ? updatedHeaders.indexOf("ลิงก์ปฏิทิน") : calendarLinkIndex;
  const updatedCalendarEventIdIndex = calendarEventIdIndex === -1 ? updatedHeaders.indexOf("IDกิจกรรมปฏิทิน") : calendarEventIdIndex;
  const updatedCalendarIdIndex = calendarIdIndex === -1 ? updatedHeaders.indexOf("IDปฏิทิน") : calendarIdIndex;

  sheet.getRange(rentalRowIndex, updatedCalendarLinkIndex + 1).setValue(eventUrl);
  sheet.getRange(rentalRowIndex, updatedCalendarEventIdIndex + 1).setValue(eventId);
  sheet.getRange(rentalRowIndex, updatedCalendarIdIndex + 1).setValue(calendarId); // สำคัญ! ต้องมีบรรทัดนี้

  Logger.log("บันทึกข้อมูลปฏิทินสำเร็จ - " +
    "calendarUrl: " + eventUrl +
    ", eventId: " + eventId +
    ", calendarId: " + calendarId);

  return { success: true, message: "อัพเดตข้อมูลปฏิทินสำเร็จ" };
}











/**
 * ฟังก์ชันตรวจสอบว่ามีคีย์ "IDปฏิทิน" ในแผ่นตั้งค่าหรือไม่
 */
function checkCalendarIdKeyExists() {
  const sheetID = '1qLubMynT8kMnb4gBt9xBayD-BHrfHN08jRZNDqwPiAA'; // แทนที่ด้วย ID ของ Sheet ของคุณ

  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const settingSheet = ss.getSheetByName("ตั้งค่าระบบ");

    if (!settingSheet) {
      Logger.log("ไม่พบแผ่น 'ตั้งค่าระบบ'");
      return false;
    }

    // ดึงข้อมูลทั้งหมดจากแผ่นตั้งค่า
    const settingsData = settingSheet.getDataRange().getValues();

    // แสดงข้อมูลทั้งหมดในแผ่นตั้งค่า
    Logger.log("รายการคีย์ในแผ่นตั้งค่า:");
    for (let i = 0; i < settingsData.length; i++) {
      Logger.log(`คีย์: "${settingsData[i][0]}", ค่า: "${settingsData[i][1]}"`);
    }

    // ตรวจสอบว่ามีคีย์ "IDปฏิทิน" หรือไม่
    let found = false;
    for (let i = 0; i < settingsData.length; i++) {
      if (settingsData[i][0] === "IDปฏิทิน") {
        Logger.log(`พบคีย์ "IDปฏิทิน" ในแถวที่ ${i + 1} ค่าคือ: "${settingsData[i][1]}"`);
        found = true;
        break;
      }
    }

    if (!found) {
      Logger.log("ไม่พบคีย์ 'IDปฏิทิน' ในแผ่นตั้งค่า");
    }

    return found;

  } catch (error) {
    Logger.log("เกิดข้อผิดพลาด: " + error.toString());
    return false;
  }
}





/**
 * ฟังก์ชันทดสอบการเข้าถึงปฏิทิน
 */
function testCalendarAccess() {
  const sheetID = '1qLubMynT8kMnb4gBt9xBayD-BHrfHN08jRZNDqwPiAA';

  // ดึงค่า ID ปฏิทิน
  const result = getCalendarId(sheetID);

  if (!result.success) {
    Logger.log("ไม่สามารถดึงค่า ID ปฏิทินได้: " + result.message);
    return false;
  }

  try {
    // ทดสอบเข้าถึงปฏิทิน
    const calendar = CalendarApp.getCalendarById(result.calendarId);

    if (!calendar) {
      Logger.log("ไม่สามารถเข้าถึงปฏิทินได้");
      return false;
    }

    // แสดงข้อมูลปฏิทิน
    Logger.log("สามารถเข้าถึงปฏิทินได้สำเร็จ");
    Logger.log("ชื่อปฏิทิน: " + calendar.getName());
    Logger.log("คำอธิบายปฏิทิน: " + calendar.getDescription());

    // ทดสอบดูกิจกรรมในปฏิทิน
    const now = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(now.getDate() + 7);

    const events = calendar.getEvents(now, oneWeekLater);
    Logger.log("จำนวนกิจกรรมในช่วง 7 วันข้างหน้า: " + events.length);

    return true;

  } catch (error) {
    Logger.log("เกิดข้อผิดพลาดในการเข้าถึงปฏิทิน: " + error.toString());
    return false;
  }
}



/**
 * ฟังก์ชันสำหรับดึงค่า ID ปฏิทินจากแผ่นตั้งค่าระบบ
 * @param {string} sheetID - ID ของ Google Spreadsheet
 * @return {object} - ผลลัพธ์การดึงข้อมูล ID ปฏิทิน
 */
function getCalendarId(sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const settingSheet = ss.getSheetByName("ตั้งค่าระบบ");

    if (!settingSheet) {
      return {
        success: false,
        message: "ไม่พบแผ่น 'ตั้งค่าระบบ' กรุณาตรวจสอบชื่อแผ่นงาน"
      };
    }

    // ค้นหาคีย์ "IDปฏิทิน" ในแผ่นตั้งค่า
    const settingsData = settingSheet.getDataRange().getValues();
    let calendarId = null;

    for (let i = 0; i < settingsData.length; i++) {
      if (settingsData[i][0] === "IDปฏิทิน") {
        calendarId = settingsData[i][1];
        break;
      }
    }

    // ถ้าไม่พบ ID ปฏิทิน
    if (!calendarId) {
      return {
        success: false,
        message: "ไม่พบค่า 'IDปฏิทิน' ในแผ่นตั้งค่าระบบ กรุณาเพิ่มค่านี้ในแผ่นตั้งค่า"
      };
    }

    return {
      success: true,
      calendarId: calendarId,
      message: "ดึงค่า ID ปฏิทินสำเร็จ"
    };
  } catch (error) {
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงค่า ID ปฏิทิน: " + error.toString()
    };
  }
}




// เพิ่มไว้ใกล้ๆ กับฟังก์ชันอื่นๆ ใน Code.gs

/**
 * ฟังก์ชันหลักสำหรับดึงและประมวลผลข้อมูลทั้งหมดสำหรับหน้า Summary
 * @param {string} sheetID - ID ของ Google Sheet
 * @returns {object} ออบเจ็กต์ที่ประกอบด้วยข้อมูลทั้งหมดที่ประมวลผลแล้ว
 */
/**
 * ฟังก์ชันหลักสำหรับดึงและประมวลผลข้อมูลทั้งหมดสำหรับหน้า Summary
 * @param {string} sheetID - ID ของ Google Sheet
 * @returns {object} ออบเจ็กต์ที่ประกอบด้วยข้อมูลทั้งหมดที่ประมวลผลแล้ว
 */


// =============================================================================
// 🧪 ฟังก์ชัน getSummaryData_Original (เวอร์ชันดั้งเดิมสำหรับทดสอบ)
// =============================================================================
function getSummaryData_Original(sheetID) {
  const startTime = new Date(); // เริ่มจับเวลา
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ดึงข้อมูลทั้งหมดจากชีต
    const allRentals = getSheetDataAsObjects_(sheetID, RENTAL_SHEET);
    const allCars = getSheetDataAsObjects_(sheetID, CARS_SHEET);
    const allScheduleItems = getSheetDataAsObjects_(sheetID, SCHEDULE_SHEET);
    const allMaintenance = getSheetDataAsObjects_(sheetID, MAINTENANCE_SHEET);

    // ประมวลผลข้อมูล (เหมือนโค้ดเดิมของคุณทุกประการ)
    const totalCars = allCars.length;
    const carsRentedTodayIds = new Set();
    const todayActiveRentals = allRentals.filter(rental => {
      if (!rental.วันที่เช่า || !rental.วันที่คืน) return false;
      const startDate = new Date(rental.วันที่เช่า);
      const endDate = new Date(rental.วันที่คืน);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      const isActive = startDate <= today && today <= endDate;
      if (isActive && rental.ทะเบียนรถ) {
        carsRentedTodayIds.add(String(rental.ทะเบียนรถ).trim());
      }
      return isActive;
    });
    const inProgressCount = todayActiveRentals.length;
    const availableCarsToday = allCars.filter(car => {
      const isReady = car.สถานะ === CAR_STATUS_READY;
      const isRented = carsRentedTodayIds.has(String(car.ทะเบียน).trim());
      return isReady && !isRented;
    });
    const availableCarsCount = availableCarsToday.length;
    const todayStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd");
    const todayPickups = [];
    const todayReturns = [];
    allScheduleItems.forEach(item => {
      if (!item.วันที่) return;
      const itemDateStr = Utilities.formatDate(new Date(item.วันที่), "Asia/Bangkok", "yyyy-MM-dd");
      if (itemDateStr === todayStr) {
        const enrichedItem = { ...item };
        const rentalMatch = allRentals.find(r => r.หมายเลขการจอง === item.หมายเลขการจอง);
        if (rentalMatch) {
          enrichedItem.เบอร์โทรศัพท์ = rentalMatch.เบอร์โทรศัพท์ || '';
          enrichedItem['สถานที่คืนรถ'] = rentalMatch['สถานที่คืนรถ'] || '';
          enrichedItem['สถานที่รับรถ'] = rentalMatch['สถานที่รับรถ'] || '';
          enrichedItem.ชื่อลูกค้า = rentalMatch.ชื่อลูกค้า || '';
        }
        if (item.ประเภท === 'รับรถ') {
          todayPickups.push(enrichedItem);
        } else if (item.ประเภท === 'ส่งคืนรถ') {
          todayReturns.push(enrichedItem);
        }
      }
    });
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    const upcomingMaintenance = allMaintenance.filter(item => {
      if (!item.วันที่แจ้งเตือน || item.สถานะ !== 'Active') return false;
      const maintenanceDate = new Date(item.วันที่แจ้งเตือน);
      return maintenanceDate >= today && maintenanceDate <= nextWeek;
    });
    const bookingForecast = getBookingForecastData(sheetID);

    // ส่งข้อมูลกลับทั้งหมด (แบบไม่ลดขนาด)
    const summaryData = {
      rentalStats: { availableCars: availableCarsCount, totalCars: totalCars, todayPickups: todayPickups.length, todayReturns: todayReturns.length, inProgress: inProgressCount },
      availableCarsToday: availableCarsToday,
      todayActiveRentals: todayActiveRentals.sort((a, b) => new Date(a.วันที่คืน) - new Date(b.วันที่คืน)),
      todayPickups: todayPickups.sort((a, b) => String(a.เวลา).localeCompare(String(b.เวลา))),
      todayReturns: todayReturns.sort((a, b) => String(a.เวลา).localeCompare(String(b.เวลา))),
      upcomingMaintenance: upcomingMaintenance,
      bookingForecast: bookingForecast
    };

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    Logger.log(`[Original] getSummaryData_Original ใช้เวลาประมวลผล: ${duration} ms`);

    return summaryData;
  } catch (e) {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    Logger.log(`[Original] getSummaryData_Original เกิดข้อผิดพลาดใน ${duration} ms: ${e.message}`);
    return {};
  }
}

/**
 * คำนวณข้อมูลการจอง 7 วันข้างหน้า สำหรับกราฟภาพรวมการจอง
 * @param {string} sheetID - ไอดีของ Google Sheet
 * @returns {Array} - array ของ {date, count} สำหรับ 7 วัน
 */
function getBookingForecastData(sheetID) {
  try {
    const timeZone = Session.getScriptTimeZone();
    const allRentals = getSheetDataAsObjects_(sheetID, RENTAL_SHEET);
    const forecast = [];

    // สร้างชื่อเดือนย่อภาษาไทย
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

    // วนลูป 7 วันข้างหน้า (วันนี้ + 6 วัน)
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() + i);
      checkDate.setHours(0, 0, 0, 0);

      // นับจำนวนรถที่ถูกจองในวันนี้
      let count = 0;
      allRentals.forEach(rental => {
        if (!rental.วันที่เช่า || !rental.วันที่คืน || !rental.สถานะ) return;

        const startDate = new Date(rental.วันที่เช่า);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(rental.วันที่คืน);
        endDate.setHours(0, 0, 0, 0);
        const status = rental.สถานะ.toString().trim();

        // ถ้าวันที่ตรวจสอบอยู่ในช่วงการเช่า และสถานะไม่ใช่ยกเลิก/คืนรถแล้ว
        if (checkDate >= startDate && checkDate <= endDate && status !== 'ยกเลิก' && status !== 'คืนรถแล้ว') {
          count++;
        }
      });

      // สร้างชื่อวันที่แบบสั้น เช่น "1 ม.ค." "2 ม.ค."
      const day = checkDate.getDate();
      const month = thaiMonths[checkDate.getMonth()];
      const dateLabel = day + ' ' + month;

      forecast.push({
        date: dateLabel,
        count: count
      });
    }

    return forecast;
  } catch (e) {
    Logger.log('เกิดข้อผิดพลาดใน getBookingForecastData: ' + e.message);
    return [];
  }
}





/**
 * ดึงและประมวลผลข้อมูลทั้งหมดสำหรับหน้า Summary พร้อมข้อมูลใบเสร็จที่อัปเดตแล้ว
 * @param {string} sheetID - ไอดีของ Google Sheet
 * @returns {object} - ออบเจ็กต์ข้อมูลทั้งหมดที่ประมวลผลแล้ว
 */
function getSummaryData(sheetID) {
  try {
    const timeZone = Session.getScriptTimeZone();
    const today = new Date();
    const todayStr = Utilities.formatDate(today, timeZone, "yyyy-MM-dd");
    const normalizedToday = new Date(todayStr);

    const allRentals = getSheetDataAsObjects_(sheetID, RENTAL_SHEET);
    const allVehicles = getSheetDataAsObjects_(sheetID, CARS_SHEET);
    const allScheduleItems = getSheetDataAsObjects_(sheetID, SCHEDULE_SHEET);
    const allMaintenance = getSheetDataAsObjects_(sheetID, MAINTENANCE_SHEET);
    const rentalMap = new Map(allRentals.map(r => [r.หมายเลขการจอง, r]));

    const todayActiveRentals = [];
    const busyCarsToday = new Set();
    const pendingVehicleStats = { total: 0, todayPickup: 0, tomorrowPickup: 0, urgent: 0 };

    allRentals.forEach(rental => {
      if (!rental.วันที่เช่า || !rental.วันที่คืน || !rental.สถานะ) return;

      const startDate = new Date(rental.วันที่เช่า);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(rental.วันที่คืน);
      endDate.setHours(0, 0, 0, 0);
      const rentalStatus = rental.สถานะ.toString().trim();

      if (startDate <= normalizedToday && endDate >= normalizedToday && rentalStatus !== 'ยกเลิก' && rentalStatus !== 'คืนรถแล้ว') {
        todayActiveRentals.push(rental);
        if (rental.ทะเบียนรถ) busyCarsToday.add(rental.ทะเบียนรถ.toString().trim());
      }

      if (rentalStatus === 'รอหารถ') {
        const pickupDate = new Date(rental.วันที่เช่า);
        pickupDate.setHours(0, 0, 0, 0);
        if (pickupDate >= normalizedToday) {
          pendingVehicleStats.total++;
          const diffDays = Math.ceil((pickupDate - normalizedToday) / (1000 * 60 * 60 * 24));
          if (diffDays === 0) pendingVehicleStats.todayPickup++;
          if (diffDays === 1) pendingVehicleStats.tomorrowPickup++;
          if (diffDays <= 2) pendingVehicleStats.urgent++;
        }
      }
    });

    const todayPickups = [];
    const todayReturns = [];

    allScheduleItems.forEach(item => {
      if (!item || !item.วันที่ || !item.หมายเลขการจอง) return;

      const itemDateStr = Utilities.formatDate(new Date(item.วันที่), timeZone, "yyyy-MM-dd");

      if (itemDateStr === todayStr) {
        const rentalInfo = rentalMap.get(item.หมายเลขการจอง) || {};

        const cleanInfo = {
          หมายเลขการจอง: item.หมายเลขการจอง,
          ประเภท: item.ประเภท,
          เวลา: item.เวลา || '',
          ชื่อลูกค้า: rentalInfo.ชื่อลูกค้า || '',
          รถ: rentalInfo.รถ || '',
          ทะเบียนรถ: rentalInfo.ทะเบียนรถ || '',
          เบอร์โทรศัพท์: rentalInfo.เบอร์โทรศัพท์ || '',
          สถานะ: rentalInfo.สถานะ || '',
          สถานที่รับรถ: rentalInfo.สถานที่รับรถ || '',
          สถานที่คืนรถ: rentalInfo.สถานที่คืนรถ || '',
          // << แก้ไข: เปลี่ยนมาใช้ ReceiptInfo
          ReceiptInfo: rentalInfo.ReceiptInfo || '{}',
          // เพิ่มข้อมูลคาร์ซีทและประกันเสริมสำหรับแสดง badge ใน timeline
          ต้องการคาร์ซีท: rentalInfo.ต้องการคาร์ซีท || false,
          ต้องการประกันเสริม: rentalInfo.ต้องการประกันเสริม || false
        };

        if (item.ประเภท === 'รับรถ') {
          todayPickups.push(cleanInfo);
        } else if (item.ประเภท === 'ส่งคืนรถ') {
          todayReturns.push(cleanInfo);
        }
      }
    });

    const availableCarsToday = allVehicles.filter(car => car.ทะเบียน && !busyCarsToday.has(car.ทะเบียน.toString().trim()));

    const nextWeek = new Date();
    nextWeek.setDate(normalizedToday.getDate() + 7);
    const upcomingMaintenance = allMaintenance.filter(item => {
      if (!item.วันที่แจ้งเตือน || item.สถานะ !== 'Active' || item.ทำรายการแล้ว) return false;
      const maintenanceDate = new Date(item.วันที่แจ้งเตือน);
      return maintenanceDate >= normalizedToday && maintenanceDate <= nextWeek;
    });

    const rentalStats = {
      totalCars: allVehicles.length,
      availableCars: availableCarsToday.length,
      inProgress: busyCarsToday.size,
      todayPickups: todayPickups.length,
      todayReturns: todayReturns.length,
    };

    // คำนวณสถิติการใช้งานรถในเดือนนี้
    const carUsageStats = calculateCarUsageStatsBackend_(allVehicles, allRentals, today);

    const summaryData = {
      rentalStats: rentalStats,
      availableCarsToday: availableCarsToday.map(car => ({ ยี่ห้อ: car.ยี่ห้อ || '', รุ่น: car.รุ่น || '', ทะเบียน: car.ทะเบียน || '', สี: car.สี || '', ราคาเช่าต่อวัน: car.ราคาเช่าต่อวัน || 0, ประเภท: car.ประเภท || '' })),
      todayActiveRentals: todayActiveRentals.map(rental => ({
        รถ: rental.รถ || '',
        ทะเบียนรถ: rental.ทะเบียนรถ || '',
        ชื่อลูกค้า: rental.ชื่อลูกค้า || '',
        หมายเลขการจอง: rental.หมายเลขการจอง || '',
        วันที่เช่า: rental.วันที่เช่า ? new Date(rental.วันที่เช่า).toISOString() : '',
        วันที่คืน: rental.วันที่คืน ? new Date(rental.วันที่คืน).toISOString() : '',
        สถานะ: rental.สถานะ || '',
        สถานที่คืนรถ: rental.สถานที่คืนรถ || '',
        // << แก้ไข: เปลี่ยนมาใช้ ReceiptInfo
        ReceiptInfo: rental.ReceiptInfo || '{}'
      })).sort((a, b) => new Date(a.วันที่คืน) - new Date(b.วันที่คืน)),
      todayPickups: todayPickups.sort((a, b) => String(a.เวลา).localeCompare(String(b.เวลา))),
      todayReturns: todayReturns.sort((a, b) => String(a.เวลา).localeCompare(String(b.เวลา))),
      upcomingMaintenance: upcomingMaintenance.map(item => ({ id: item.id || '', รถ: item.รถ || '', ประเภทการแจ้งเตือน: item.ประเภทการแจ้งเตือน || '', รูปแบบการแจ้งเตือน: item.รูปแบบการแจ้งเตือน || '', วันที่แจ้งเตือน: item.วันที่แจ้งเตือน ? new Date(item.วันที่แจ้งเตือน).toISOString() : '', ระยะทางเป้าหมาย: item.ระยะทางเป้าหมาย || 0, ระยะทางปัจจุบัน: item.ระยะทางปัจจุบัน || 0, ทำรายการแล้ว: item.ทำรายการแล้ว || false })),
      bookingForecast: getBookingForecastData(sheetID),
      pendingVehicleStats: pendingVehicleStats,
      carUsageStats: carUsageStats  // เพิ่มสถิติการใช้งานรถ
    };

    const cache = CacheService.getScriptCache();
    cache.put(`summary_v2_${sheetID}`, JSON.stringify(summaryData), 1800);

    return summaryData;

  } catch (e) {
    Logger.log(`Error in getSummaryData for sheetID ${sheetID}: ${e.toString()} ${e.stack}`);
    return { isError: true, errorMessage: `Server-side error: ${e.message}` };
  }
}








/**
 * คำนวณสถิติการใช้งานรถในเดือนปัจจุบัน
 * @param {Array} vehicles - ข้อมูลรถทั้งหมด
 * @param {Array} rentals - ข้อมูลการเช่าทั้งหมด
 * @param {Date} today - วันที่ปัจจุบัน
 * @returns {Array} - สถิติการใช้งานแต่ละคัน
 */
function calculateCarUsageStatsBackend_(vehicles, rentals, today) {
  try {
    if (!vehicles || !Array.isArray(vehicles) || vehicles.length === 0) {
      return [];
    }

    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    const stats = [];

    vehicles.forEach(car => {
      const licensePlate = car.ทะเบียน || '';
      const brand = car.ยี่ห้อ || '';
      const model = car.รุ่น || '';

      if (!licensePlate) return;

      const displayName = [brand, model, licensePlate].filter(x => x).join(' ');

      // ใช้ Set เพื่อเก็บวันที่ที่เช่าจริง (ไม่ซ้ำกัน)
      const rentalDates = new Set();

      if (rentals && Array.isArray(rentals)) {
        rentals.forEach(rental => {
          const rentalCarName = rental.รถ || rental.ทะเบียนรถ || '';
          const rentalStatus = (rental.สถานะ || '').toString().trim();

          // ตรวจสอบว่าเป็นรถคันนี้และไม่ถูกยกเลิก
          if ((rentalCarName.includes(licensePlate) || licensePlate.includes(rentalCarName)) &&
            rentalStatus !== 'ยกเลิก') {

            try {
              const startDate = new Date(rental.วันที่เช่า);
              const endDate = new Date(rental.วันที่คืน);

              if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;

              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(0, 0, 0, 0);

              // คำนวณเฉพาะวันที่อยู่ในเดือนปัจจุบัน
              const monthStart = new Date(currentYear, currentMonth - 1, 1);
              monthStart.setHours(0, 0, 0, 0);
              const monthEnd = new Date(currentYear, currentMonth - 1, daysInMonth);
              monthEnd.setHours(0, 0, 0, 0);

              const effectiveStart = startDate < monthStart ? monthStart : startDate;
              const effectiveEnd = endDate > monthEnd ? monthEnd : endDate;

              if (effectiveStart <= effectiveEnd && effectiveStart <= monthEnd && effectiveEnd >= monthStart) {
                // เพิ่มแต่ละวันเข้า Set (ไม่ซ้ำกัน)
                const currentDate = new Date(effectiveStart);
                while (currentDate <= effectiveEnd) {
                  rentalDates.add(currentDate.toISOString().split('T')[0]); // เก็บเป็น "YYYY-MM-DD"
                  currentDate.setDate(currentDate.getDate() + 1);
                }
              }
            } catch (e) {
              Logger.log('Error calculating rental days for ' + licensePlate + ': ' + e.message);
            }
          }
        });
      }

      const rentalDays = rentalDates.size; // จำนวนวันที่ไม่ซ้ำกัน
      const availableDays = Math.max(0, daysInMonth - rentalDays);
      stats.push({
        name: displayName,
        rentalDays: rentalDays,
        availableDays: availableDays
      });
    });

    // เรียงตามจำนวนวันเช่ามากไปน้อย
    stats.sort((a, b) => b.rentalDays - a.rentalDays);

    return stats;
  } catch (e) {
    Logger.log('Error in calculateCarUsageStatsBackend_: ' + e.message);
    return [];
  }
}

function formatDateToString_(date, timezone) {
  if (!date || !(date instanceof Date)) return null;
  return Utilities.formatDate(date, timezone, 'yyyy-MM-dd');
}



// =============================================================================
// ⚙️ ฟังก์ชันสำหรับล้างแคชของ Summary
// =============================================================================
/**
 * ล้าง cache ของ summary data เมื่อมีการเปลี่ยนแปลงข้อมูล
 * @param {string} sheetID - ID ของ Google Sheet
 */
function clearSummaryCache(sheetID) {
  try {
    const cache = CacheService.getScriptCache();
    cache.remove(`summary_v2_${sheetID}`);
    Logger.log(`Cleared summary cache for sheetID: ${sheetID}`);
    return { success: true };
  } catch (e) {
    Logger.log(`Error clearing summary cache: ${e.message}`);
    return { success: false, error: e.message };
  }
}

/**
 * ล้าง cache ของ summary สำหรับ Debug
 */
function clearSummaryCacheDebug() {
  // ❗️❗️ ใส่ Sheet ID ของร้านค้าที่คุณต้องการล้างแคช
  const sheetID = "1_0GA0ufpL8Wo3NzHondwsMd-_FMI5Tsd-88w_9e62Hw";

  if (sheetID === "YOUR_SHEET_ID_HERE") {
    Logger.log("กรุณาเปลี่ยน YOUR_SHEET_ID_HERE เป็น Sheet ID จริงของคุณในฟังก์ชัน clearSummaryCacheDebug");
    return;
  }

  const cache = CacheService.getScriptCache();
  const cacheKey = `summary_v2_${sheetID}`; // ต้องเป็น Key เดียวกับที่ใช้ใน getSummaryData

  cache.remove(cacheKey); // สั่งลบแคช

  Logger.log(`✅ แคชสำหรับ Key: "${cacheKey}" ถูกล้างเรียบร้อยแล้ว`);
}




function clearSummaryCacheForTenant(sheetID) {
  // หากไม่ได้รับ sheetID ให้จบการทำงาน
  if (!sheetID) {
    Logger.log('[Cache Invalidation] ERROR: ไม่ได้รับ sheetID');
    return;
  }

  const funcName = 'clearSummaryCacheForTenant';

  try {
    const scriptCache = CacheService.getScriptCache();

    if (!scriptCache) {
      Logger.log(`[${funcName}] ❌ FATAL: ไม่สามารถดึง CacheService object ได้`);
      return;
    }

    // 1. ล้างแคชของ "หน้าแรก" (Summary)
    const summaryCacheKey = `summary_v2_${sheetID}`;
    scriptCache.remove(summaryCacheKey);
    Logger.log(`[${funcName}] ✅ ล้างแคช Summary สำหรับ ${sheetID} สำเร็จ`);

    // 2. ล้างแคชของ "ไทม์ไลน์" (Schedule Summary)
    const scheduleSummaryCacheKey = `schedule_summary_v1_${sheetID}`;
    scriptCache.remove(scheduleSummaryCacheKey);
    Logger.log(`[${funcName}] ✅ ล้างแคช Timeline (Schedule Summary) สำหรับ ${sheetID} สำเร็จ`);

    // 3. ล้างแคชของ "ตารางรับ-ส่งรถ" (Schedule Page)
    const today = new Date();
    const keysToRemove = [];
    const scriptTimezone = Session.getScriptTimeZone();

    // --- 💡💡💡 ส่วนที่แก้ไข 💡💡💡 ---
    // เปลี่ยน Loop ให้ล้างแคชย้อนหลัง 30 วัน และล่วงหน้า 90 วัน
    for (let i = -30; i < 90; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i); // การบวกด้วยค่า i ที่ติดลบ จะทำให้วันที่ย้อนหลังได้

      const dateString = Utilities.formatDate(targetDate, scriptTimezone, 'yyyy-MM-dd');

      const scheduleCacheKey = `schedule_v1_${sheetID}_${dateString}`;
      keysToRemove.push(scheduleCacheKey);
    }

    // ถ้ามี key ที่ต้องลบ ให้สั่งลบทั้งหมดในครั้งเดียว
    if (keysToRemove.length > 0) {
      scriptCache.removeAll(keysToRemove);
      Logger.log(`[${funcName}] ✅ พยายามล้างแคช Schedule จำนวน ${keysToRemove.length} keys สำหรับ ${sheetID}`);
    }

  } catch (e) {
    Logger.log(`[${funcName}] ❌ ERROR: ${e.message}`);
    Logger.log(`[${funcName}] ❌ ERROR Stack: ${e.stack}`);
  }
}



/**
 * ดึงข้อมูลจากชีตและแปลงเป็น Array of Objects
 * (แก้ไข: ไม่แปลงวันที่เป็น ISO String เพื่อป้องกัน Timezone shift)
 */
function getSheetDataAsObjects_(sheetID, sheetName) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];

    const values = sheet.getDataRange().getValues();
    if (values.length < 2) return [];

    const headers = values[0].map(h => String(h).trim());
    const data = [];

    for (let i = 1; i < values.length; i++) {
      const obj = {};
      if (values[i].every(cell => cell === "")) continue;

      headers.forEach((header, index) => {
        let value = values[i][index];

        // --- 💡 ส่วนที่แก้ไข ---
        // ตรวจสอบคอลัมน์ที่เป็นเวลา และแปลง Format ให้เป็น HH:mm
        if (header === 'เวลารับรถ' || header === 'เวลาคืนรถ' || header === 'เวลา') {
          obj[header] = formatToHHMM_(value);
        }
        // สำหรับคอลัมน์อื่นๆ ทั้งหมด (รวมถึงวันที่) ให้ใช้ค่าดิบจากชีตโดยตรง
        // เราจะไม่แปลงเป็น toISOString() อีกต่อไป
        else {
          obj[header] = value;
        }
      });
      data.push(obj);
    }
    return data;
  } catch (e) {
    Logger.log(`Error reading sheet "${sheetName}": ${e.message}`);
    return [];
  }
}

// โค้ดสำหรับทดสอบ (คงไว้เหมือนเดิม)
function testgetSummaryData() {
  // ใส่ Sheet ID ที่ต้องการทดสอบ
  const sheetID = "1RjRI5kY4QKxVIU4iZWi65rIc_H7JDpwBrZLnTrznYuQ";

  const result = getSummaryData(sheetID);
  Logger.log("ผลลัพธ์จาก getSummaryData:");
  Logger.log(JSON.stringify(result, null, 2));
}




function getNewRentalBasicData(sheetID) {
  try {
    // 1. ดึงข้อมูลการตั้งค่าระบบเท่านั้น (ไม่โหลดรถ)
    const configData = getSystemConfig(sheetID);

    // 2. สร้างหมายเลขการจอง
    const newBookingNumber = generateBookingNumber(sheetID);

    // 3. รวบรวมข้อมูลพื้นฐานแล้วส่งกลับ
    return {
      success: true,
      config: configData.config || {},
      bookingNumber: newBookingNumber
    };

  } catch (e) {
    Logger.log("Error in getNewRentalBasicData: " + e.message);
    return { success: false, message: e.message };
  }
}

// ฟังก์ชันเดิมยังคงไว้สำหรับกรณีอื่นที่อาจต้องใช้
function getNewRentalPageData(sheetID) {
  try {
    // 1. ดึงข้อมูลรถทั้งหมด
    const carsData = getAllCars(sheetID);

    // 2. ดึงข้อมูลการตั้งค่าระบบ
    const configData = getSystemConfig(sheetID);

    // 3. สร้างหมายเลขการจอง
    const newBookingNumber = generateBookingNumber(sheetID);

    // 4. รวบรวมข้อมูลทั้งหมดแล้วส่งกลับ
    return {
      success: true,
      cars: carsData.data || [],
      config: configData.config || {},
      bookingNumber: newBookingNumber
    };

  } catch (e) {
    Logger.log("Error in getNewRentalPageData: " + e.message);
    return { success: false, message: e.message };
  }
}




// =============================================================================
// 3. แก้ไขฟังก์ชัน deleteRental() - เพิ่มการลบรายจ่ายค่าคอมมิชชั่น
// =============================================================================

/**
 * (ฉบับสมบูรณ์) ลบรายการเช่า, ตารางรับส่ง, ข้อมูลการเงิน และอัปเดตประวัติลูกค้า
 * @param {number} rowIndex - หมายเลขแถวที่จะลบ (ส่งมาจาก Frontend)
 * @param {string} sheetID - ID ของ Google Sheet
 */
function deleteRental(rowIndex, sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);
  const rentalSheet = ss.getSheetByName(RENTAL_SHEET);
  const scheduleSheet = ss.getSheetByName(SCHEDULE_SHEET);

  try {
    // --- ขั้นตอนที่ 1: อ่านข้อมูลสำคัญจากแถวที่จะลบ "ก่อน" ทำการลบจริง ---
    const headers = rentalSheet.getRange(1, 1, 1, rentalSheet.getLastColumn()).getValues()[0];
    const rowToDeleteData = rentalSheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];

    const bookingNumberIndex = headers.indexOf("หมายเลขการจอง");
    const idCardIndex = headers.indexOf("เลขบัตรประชาชน");
    const phoneIndex = headers.indexOf("เบอร์โทรศัพท์");

    const bookingNumber = rowToDeleteData[bookingNumberIndex];
    const customerIdentifier = rowToDeleteData[idCardIndex] || rowToDeleteData[phoneIndex];

    if (!bookingNumber) {
      return { success: false, message: "ไม่พบหมายเลขการจองในแถวที่จะลบ" };
    }
    Logger.log(`[deleteRental] เตรียมลบ Booking: ${bookingNumber}`);

    // --- ขั้นตอนที่ 2: ลบข้อมูลที่เกี่ยวข้องทั้งหมด ---

    // 2.1) ลบรายการเช่าหลัก
    rentalSheet.deleteRow(rowIndex);
    Logger.log(`[deleteRental] ลบแถว ${rowIndex} จาก 'รายการเช่า' สำเร็จ`);

    // 2.2) ลบรายการในตารางรับส่งรถ
    if (scheduleSheet) {
      const scheduleData = scheduleSheet.getDataRange().getValues();
      const scheduleBookingNumberIndex = scheduleData[0].indexOf("หมายเลขการจอง");
      if (scheduleBookingNumberIndex !== -1) {
        for (let i = scheduleData.length - 1; i > 0; i--) {
          if (scheduleData[i][scheduleBookingNumberIndex] === bookingNumber) {
            scheduleSheet.deleteRow(i + 1);
            Logger.log(`[deleteRental] ลบแถว ${i + 1} จาก 'ตารางรับส่งรถ' สำเร็จ`);
          }
        }
      }
    }

    // 2.3) ลบรายการทางการเงิน
    deleteFinancialRecordsForBooking(sheetID, bookingNumber);
    clearSummaryCacheForTenant(sheetID);

    // --- ขั้นตอนที่ 3: อัปเดตประวัติลูกค้า (Logic ใหม่) ---
    if (customerIdentifier) {
      updateCustomerHistoryManager({
        sheetID: sheetID,
        mode: 'DELETE',
        bookingNumberToDelete: bookingNumber,
        customerIdentifier: customerIdentifier
      });
    }

    return { success: true, message: "ลบข้อมูลการเช่าทั้งหมดสำเร็จ" };
  } catch (e) {
    Logger.log(`[deleteRental] ❌ เกิดข้อผิดพลาด: ${e.toString()}`);
    return { success: false, message: `เกิดข้อผิดพลาดในการลบรายการ: ${e.toString()}` };
  }
}




function addNewRental(rentalData, sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(RENTAL_SHEET);

    // --- 💡💡💡 ส่วนที่แก้ไข: จัดการคอลัมน์ใบเสร็จอัตโนมัติ 💡💡💡 ---
    let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const columnsToDelete = ["VATInfo", "WHTInfo"];
    let columnsWereDeleted = false;

    // 1. ลบคอลัมน์เก่า (วนลูปจากหลังมาหน้าเพื่อป้องกัน index เพี้ยน)
    for (let i = headers.length - 1; i >= 0; i--) {
      if (columnsToDelete.includes(headers[i])) {
        sheet.deleteColumn(i + 1); // i + 1 เพราะ index ของคอลัมน์เริ่มที่ 1
        columnsWereDeleted = true;
      }
    }

    // 2. ถ้ามีการลบเกิดขึ้น, ให้อ่าน headers ใหม่อีกครั้ง
    if (columnsWereDeleted) {
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }

    // 3. เช็คและสร้างคอลัมน์ "ReceiptInfo" ถ้ายังไม่มี
    if (!headers.includes("ReceiptInfo")) {
      sheet.insertColumnAfter(headers.length); // เพิ่มคอลัมน์ต่อท้าย
      const newHeaderCell = sheet.getRange(1, headers.length + 1);
      newHeaderCell.setValue("ReceiptInfo");
      newHeaderCell.setFontWeight("bold");
      headers.push("ReceiptInfo"); // อัปเดต headers ในตัวแปรทันทีเพื่อให้ .map() ทำงานถูกต้อง
    }

    // 4. Migration: เช็คและสร้างคอลัมน์สำหรับค่าล่วงเวลา
    const overtimeColumns = ["ค่าเช่าพื้นฐาน", "ค่าล่วงเวลา", "ชั่วโมงล่วงเวลา"];
    overtimeColumns.forEach(columnName => {
      if (!headers.includes(columnName)) {
        sheet.insertColumnAfter(headers.length);
        const newHeaderCell = sheet.getRange(1, headers.length + 1);
        newHeaderCell.setValue(columnName);
        newHeaderCell.setFontWeight("bold");
        headers.push(columnName);
        Logger.log(`Migration: เพิ่มคอลัมน์ '${columnName}' ลงในชีตรายการเช่า`);
      }
    });
    // --- สิ้นสุดส่วนจัดการคอลัมน์ ---


    // --- 2. สร้างโฟลเดอร์สำหรับเก็บไฟล์ (เหมือนเดิม) ---
    const config = getSystemConfig(sheetID).config;
    const rootFolderId = config.IDโฟลเดอร์สัญญาเช่า;
    if (!rootFolderId) {
      return { success: false, message: "ไม่พบการตั้งค่า IDโฟลเดอร์สัญญาเช่า" };
    }
    const bookingFolder = createOrGetFolder(rentalData.หมายเลขการจอง, rootFolderId);

    // --- 3. อัปโหลดรูปภาพและเก็บ File ID (เหมือนเดิม) ---
    const imageFileIds = {};
    if (rentalData.images) {
      const fieldNameMapping = {
        idCard: "รูปบัตรประชาชน",
        drivingLicense: "รูปใบขับขี่",
        doc1: "รูปเอกสารเพิ่มเติม1",
        doc2: "รูปเอกสารเพิ่มเติม2",
        doc3: "รูปเอกสารเพิ่มเติม3"
      };

      for (const key in rentalData.images) {
        const imageData = rentalData.images[key];
        if (imageData) {
          const fieldName = fieldNameMapping[key] || key;
          const bookingId = rentalData.หมายเลขการจอง;
          const originalName = imageData.name;
          const extension = originalName.includes('.') ? originalName.split('.').pop() : 'jpg';
          const newFileName = `${fieldName}_${bookingId}.${extension}`;

          const uploadResult = uploadImageAndGetFileId(imageData, newFileName, bookingFolder.getId());
          if (uploadResult.success) {
            imageFileIds[key] = uploadResult.fileId;
          } else {
            Logger.log(`อัปโหลดรูป ${key} ไม่สำเร็จ: ${uploadResult.message}`);
          }
        }
      }
    }

    // --- 4. เตรียมข้อมูลสำหรับบันทึกลง Sheet (เวอร์ชันปรับปรุง) ---
    const newRow = headers.map(header => {
      switch (header) {
        case "รูปบัตรประชาชน":
          return imageFileIds.idCard || "";
        case "รูปใบขับขี่":
          return imageFileIds.drivingLicense || "";
        case "ส่วนลด":
          return rentalData.ส่วนลด || 0;
        case "รูปเอกสารเพิ่มเติม1":
          return imageFileIds.doc1 || "";
        case "รูปเอกสารเพิ่มเติม2":
          return imageFileIds.doc2 || "";
        case "รูปเอกสารเพิ่มเติม3":
          return imageFileIds.doc3 || "";

        // --- ส่วนที่จัดการข้อมูลใบเสร็จแบบใหม่ ---
        case "ReceiptInfo":
          const receiptData = {
            wantsCashBill: rentalData.wantsCashBill || false,
            wantsTaxInvoice: rentalData.wantsTaxInvoice || false,
            wantsWHT: rentalData.wantsWHT || false,
            whtPercentage: rentalData.whtPercentage || 5,
            whtAmount: rentalData.whtAmount || 0,
            whtBaseAmount: rentalData.whtBaseAmount || 0,
            // เพิ่มข้อมูล VAT สำหรับใบกำกับภาษี
            taxInvoiceAmountExVAT: rentalData.taxInvoiceAmountExVAT || 0,
            taxInvoiceVATAmount: rentalData.taxInvoiceVATAmount || 0,
            taxInvoiceTotal: rentalData.taxInvoiceTotal || 0,
            // เพิ่ม VAT/WHT options สำหรับแต่ละบริการ
            additionalServiceIncludeVAT: rentalData.additionalServiceIncludeVAT !== false,
            additionalServiceIncludeWHT: rentalData.additionalServiceIncludeWHT !== false,
            carSeatIncludeVAT: rentalData.carSeatIncludeVAT !== false,
            carSeatIncludeWHT: rentalData.carSeatIncludeWHT !== false,
            insuranceIncludeVAT: rentalData.insuranceIncludeVAT === true,
            insuranceIncludeWHT: rentalData.insuranceIncludeWHT === true
          };
          return JSON.stringify(receiptData);

        case "เบอร์โทรศัพท์":
          const phone = rentalData[header] || "";
          if (phone && phone.toString().trim() !== "") {
            let phoneStr = phone.toString();
            if (!phoneStr.startsWith("'")) {
              phoneStr = "'" + phoneStr;
            }
            return phoneStr;
          }
          return "";

        // --- แมปชื่อคอลัมน์ค่าคอมมิชชั่น ---
        case "รูปแบบค่าคอมมิชชั่น":
          // Frontend ส่งมาเป็น "ค่าคอมมิชชั่นที่เลือก" แต่ชีทเป็น "รูปแบบค่าคอมมิชชั่น"
          return rentalData.ค่าคอมมิชชั่นที่เลือก || rentalData.รูปแบบค่าคอมมิชชั่น || "";

        default:
          // ใช้ hasOwnProperty เพื่อความปลอดภัยในการเช็ค key
          return rentalData.hasOwnProperty(header) ? rentalData[header] : "";
      }
    });

    // --- 5. บันทึกข้อมูลและจัดการฟอร์แมต ---
    const newRowIndex = sheet.getLastRow() + 1;
    sheet.appendRow(newRow);

    setupColumnFormatting(sheet, headers, newRowIndex, rentalData);
    setupPhoneNumberColumn(sheetID);
    addOrUpdateFinancialRecordWithCommission(sheetID, rentalData.หมายเลขการจอง, rentalData, 'add');

    updateCustomerHistoryManager({
      sheetID: sheetID,
      mode: 'ADD',
      rentalData: rentalData
    });

    // --- 6. อัปเดตแคชอัตโนมัติ (เหมือนเดิม) ---
    Logger.log(`[Cache] เริ่มกระบวนการอัปเดตแคชอัตโนมัติสำหรับ Sheet ID: ${sheetID}`);
    SpreadsheetApp.flush();
    clearSummaryCacheForTenant(sheetID);
    getSummaryData(sheetID);
    getTodayScheduleFromCache(sheetID);
    Logger.log(`[Cache] สร้างแคชใหม่อัตโนมัติสำหรับ Sheet ID: ${sheetID} สำเร็จ`);

    return { success: true, message: "เพิ่มรายการเช่าใหม่สำเร็จ" };

  } catch (e) {
    Logger.log(e);
    const errorMessage = e.stack ? e.stack : e.toString();
    return { success: false, message: "เกิดข้อผิดพลาดในการเพิ่มรายการเช่า: " + errorMessage };
  }
}





// =============================================================================
// ปรับปรุงฟังก์ชัน setupPhoneNumberColumn() ให้ครอบคลุมมากขึ้น ✅
// =============================================================================

function setupPhoneNumberColumn(sheetID) {
  const ss = SpreadsheetApp.openById(sheetID);
  const sheet = ss.getSheetByName(RENTAL_SHEET);

  // ตรวจสอบว่ามีหัวข้อตารางหรือไม่
  if (sheet.getLastRow() === 0) {
    return;
  }

  // ค้นหาคอลัมน์เบอร์โทรศัพท์
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const phoneNumberIndex = headers.indexOf("เบอร์โทรศัพท์");

  if (phoneNumberIndex !== -1) {
    const column = phoneNumberIndex + 1; // เริ่มจาก 1
    const lastRow = sheet.getLastRow();

    if (lastRow > 1) {
      // ✅ ตั้งค่าฟอร์แมตคอลัมน์ให้เป็น Plain Text ทั้งคอลัมน์
      sheet.getRange(1, column, lastRow, 1).setNumberFormat('@');

      // ✅ แก้ไขข้อมูลที่มีอยู่แล้วโดยเพิ่ม ' หน้าเบอร์ที่ไม่มี
      const phoneData = sheet.getRange(2, column, lastRow - 1, 1).getValues();
      const updatedPhoneData = [];
      let hasChanges = false;

      for (let i = 0; i < phoneData.length; i++) {
        let phoneNumber = phoneData[i][0];

        if (phoneNumber && phoneNumber.toString().trim() !== "") {
          const originalPhone = phoneNumber.toString();
          let newPhone = originalPhone;

          // ถ้าเลขไม่ได้ขึ้นต้นด้วย ' และขึ้นต้นด้วย 0
          if (!originalPhone.startsWith("'") && originalPhone.startsWith("0") && originalPhone.match(/^0\d{8,9}$/)) {
            newPhone = "'" + originalPhone;
            hasChanges = true;
          }
          // ถ้าเป็นตัวเลขที่น่าจะเป็นเบอร์โทรศัพท์ที่เลข 0 หายไป (เช่น เลข 8-9 หลัก)
          else if (!originalPhone.startsWith("'") && originalPhone.match(/^\d{8,9}$/)) {
            newPhone = "'0" + originalPhone;
            hasChanges = true;
          }
          // ถ้าเป็นเบอร์โทรศัพท์ 10 หลักที่ไม่มี '
          else if (!originalPhone.startsWith("'") && originalPhone.match(/^\d{10}$/)) {
            newPhone = "'" + originalPhone;
            hasChanges = true;
          }

          updatedPhoneData.push([newPhone]);
        } else {
          updatedPhoneData.push([phoneNumber]);
        }
      }

      // ✅ อัพเดตข้อมูลที่แก้ไขแล้วเฉพาะเมื่อมีการเปลี่ยนแปลง
      if (hasChanges && updatedPhoneData.length > 0) {
        sheet.getRange(2, column, updatedPhoneData.length, 1).setValues(updatedPhoneData);
        Logger.log(`แก้ไขเบอร์โทรศัพท์ใน ${updatedPhoneData.length} แถว`);
      }
    }
  }
}

// =============================================================================
// ปรับปรุงฟังก์ชัน setupColumnFormatting() ✅
// =============================================================================

function setupColumnFormatting(sheet, headers, rowIndex, rentalData) {
  // ตั้งค่าคอลัมน์เบอร์โทรศัพท์และทะเบียนรถให้เป็นข้อความ
  const phoneNumberIndex = headers.indexOf("เบอร์โทรศัพท์");
  if (phoneNumberIndex !== -1) {
    sheet.getRange(rowIndex, phoneNumberIndex + 1).setNumberFormat('@');
  }

  const licensePlateIndex = headers.indexOf("ทะเบียนรถ");
  if (licensePlateIndex !== -1) {
    sheet.getRange(rowIndex, licensePlateIndex + 1).setNumberFormat('@');
  }

  const regNoIndex = headers.indexOf("ทะเบียน");
  if (regNoIndex !== -1) {
    sheet.getRange(rowIndex, regNoIndex + 1).setNumberFormat('@');
  }

  // ตั้งค่ารูปแบบของคอลัมน์ตัวเลขและวันที่
  const moneyColumns = ["ราคา", "ค่าเช่ารวมทั้งหมด", "ค่ามัดจำคิวรถ", "เงินประกันความเสียหาย",
    "ค่าบริการเพิ่มเติม", "รวมยอดชำระวันรับรถ", "ค่าคอมมิชชั่น"];
  const dateColumns = ["วันที่เช่า", "วันที่คืน"];

  // ตั้งค่ารูปแบบตัวเลขเงิน
  for (const column of moneyColumns) {
    const colIndex = headers.indexOf(column);
    if (colIndex !== -1) {
      sheet.getRange(rowIndex, colIndex + 1).setNumberFormat('#,##0.00');
    }
  }

  // ตั้งค่ารูปแบบวันที่
  for (const column of dateColumns) {
    const colIndex = headers.indexOf(column);
    if (colIndex !== -1 && rentalData[column]) {
      sheet.getRange(rowIndex, colIndex + 1).setNumberFormat('yyyy-mm-dd');
    }
  }
}




// function deleteRentalCompletely(bookingNumber, sheetID) {
//   console.log("🔄 [deleteRentalCompletely] เริ่มต้นการลบรายการเช่าทั้งหมด (Sheets + Drive)");
//   console.log("📝 [deleteRentalCompletely] Parameters:", {
//     bookingNumber: bookingNumber,
//     sheetID: sheetID
//   });

//   try {
//     // ================== ส่วนที่ 1: ลบข้อมูลใน Google Sheets ==================
//     console.log("📊 [deleteRentalCompletely] === เริ่มลบข้อมูลใน Google Sheets ===");

//     const ss = SpreadsheetApp.openById(sheetID);
//     const rentalSheet = ss.getSheetByName(RENTAL_SHEET);
//     const scheduleSheet = ss.getSheetByName(SCHEDULE_SHEET);

//     // ✅ ส่วนของการลบข้อมูลการเงิน (ฉบับสมบูรณ์)
//     let financialDeleteResult;
//     try {
//       const financialSheet = ss.getSheetByName(FINANCIAL_SHEET);
//       if (!financialSheet) {
//         console.log("ℹ️ [deleteRentalCompletely] ไม่พบแผ่นงานการเงิน - ข้ามการลบ");
//         financialDeleteResult = { success: true, message: "ไม่พบแผ่นงานการเงิน", recordsDeleted: 0, sheetName: FINANCIAL_SHEET || "N/A" };
//       } else if (financialSheet.getLastRow() <= 1) {
//         console.log("ℹ️ [deleteRentalCompletely] แผ่นงานการเงินว่างเปล่า");
//         financialDeleteResult = { success: true, message: "แผ่นงานการเงินว่างเปล่า", recordsDeleted: 0, sheetName: FINANCIAL_SHEET };
//       } else {
//         const financialData = financialSheet.getDataRange().getValues();
//         const financialHeaders = financialData[0];
//         const financialBookingNumberIndex = financialHeaders.indexOf("หมายเลขการจอง");

//         if (financialBookingNumberIndex !== -1) {
//           let financialRowsDeleted = 0;
//           for (let i = financialData.length - 1; i > 0; i--) {
//             if (financialData[i][financialBookingNumberIndex] === bookingNumber) {
//               financialSheet.deleteRow(i + 1);
//               financialRowsDeleted++;
//             }
//           }
//           console.log(`💰 [deleteRentalCompletely] ลบรายการการเงิน: ${financialRowsDeleted} รายการ`);
//           financialDeleteResult = { success: true, message: `ลบรายการการเงิน ${financialRowsDeleted} รายการ`, recordsDeleted: financialRowsDeleted, sheetName: FINANCIAL_SHEET };
//         } else {
//           console.error("❌ [deleteRentalCompletely] ไม่พบคอลัมน์ 'หมายเลขการจอง' ในแผ่นงานการเงิน");
//           financialDeleteResult = { success: false, message: "ไม่พบคอลัมน์ 'หมายเลขการจอง' ในแผ่นงานการเงิน", recordsDeleted: 0, sheetName: FINANCIAL_SHEET };
//         }
//       }
//     } catch (financialError) {
//       console.error("❌ [deleteRentalCompletely] Error during financial deletion:", financialError);
//       financialDeleteResult = { success: false, message: `เกิดข้อผิดพลาด: ${financialError.message}`, recordsDeleted: 0, sheetName: FINANCIAL_SHEET || "N/A" };
//     }

//     // ลบรายการจากตารางรายการเช่า
//     console.log("🏠 [deleteRentalCompletely] เริ่มลบรายการจากตารางรายการเช่า...");
//     let rentalRowsDeleted = 0;
//     let eventsToDelete = [];
//     if (rentalSheet) {
//       const rentalData = rentalSheet.getDataRange().getValues();
//       const rentalHeaders = rentalData[0];
//       const rentalBookingNumberIndex = rentalHeaders.indexOf("หมายเลขการจอง");
//       const calendarEventIdIndex = rentalHeaders.indexOf("IDกิจกรรมปฏิทิน");
//       const calendarIdIndex = rentalHeaders.indexOf("IDปฏิทิน");

//       if (rentalBookingNumberIndex !== -1) {
//         for (let i = rentalData.length - 1; i > 0; i--) {
//           if (rentalData[i][rentalBookingNumberIndex] === bookingNumber) {
//             if (calendarEventIdIndex !== -1 && calendarIdIndex !== -1 && rentalData[i][calendarEventIdIndex] && rentalData[i][calendarIdIndex]) {
//               eventsToDelete.push({ eventId: rentalData[i][calendarEventIdIndex], calendarId: rentalData[i][calendarIdIndex] });
//             }
//             rentalSheet.deleteRow(i + 1);
//             rentalRowsDeleted++;
//           }
//         }
//         console.log(`📊 [deleteRentalCompletely] ลบรายการเช่า: ${rentalRowsDeleted} รายการ`);
//       }
//     }

//     // ลบรายการจากตารางรับส่งรถ
//     console.log("🚗 [deleteRentalCompletely] เริ่มลบรายการจากตารางรับส่งรถ...");
//     let scheduleRowsDeleted = 0;
//     if (scheduleSheet && scheduleSheet.getLastRow() > 1) {
//       const scheduleData = scheduleSheet.getDataRange().getValues();
//       const scheduleHeaders = scheduleData[0];
//       const scheduleBookingNumberIndex = scheduleHeaders.indexOf("หมายเลขการจอง");
//       if (scheduleBookingNumberIndex !== -1) {
//         for (let i = scheduleData.length - 1; i > 0; i--) {
//           if (scheduleData[i][scheduleBookingNumberIndex] === bookingNumber) {
//             scheduleSheet.deleteRow(i + 1);
//             scheduleRowsDeleted++;
//           }
//         }
//       }
//     }
//     console.log(`📊 [deleteRentalCompletely] ลบรายการตารางรับส่งรถ: ${scheduleRowsDeleted} รายการ`);

//     // ================== ลบกิจกรรมจาก Google Calendar ==================
//     console.log("📅 [deleteRentalCompletely] === เริ่มลบกิจกรรมจาก Google Calendar ===");
//     let calendarDeleteResults = [];
//     if (eventsToDelete.length > 0) {
//       for (const item of eventsToDelete) {
//         const { eventId, calendarId } = item;
//         try {
//           const calendar = CalendarApp.getCalendarById(calendarId);
//           if (!calendar) throw new Error(`ไม่พบปฏิทิน ID: ${calendarId}`);

//           const actualEventId = eventId.toString().split('@')[0];
//           const event = calendar.getEventById(actualEventId);

//           if (event) {
//             const eventTitle = event.getTitle();
//             event.deleteEvent();
//             console.log(`✅ [deleteRentalCompletely] ลบกิจกรรมสำเร็จ: ${eventTitle}`);
//             calendarDeleteResults.push({ success: true, message: `ลบกิจกรรม "${eventTitle}" สำเร็จ` });
//           } else {
//              console.log(`⚠️ [deleteRentalCompletely] ไม่พบกิจกรรม: ${eventId}`);
//              calendarDeleteResults.push({ success: true, message: `ไม่พบกิจกรรม ${eventId} (อาจถูกลบไปแล้ว)` });
//           }
//         } catch (calendarError) {
//           console.error(`❌ [deleteRentalCompletely] ลบกิจกรรมไม่สำเร็จ: ${eventId}`, calendarError);
//           calendarDeleteResults.push({ success: false, message: `ลบกิจกรรมไม่สำเร็จ: ${calendarError.message}` });
//         }
//       }
//     }
//      const successfulCalendarDeletes = calendarDeleteResults.filter(r => r.success).length;
//      console.log(`📅 [deleteRentalCompletely] สรุปการลบกิจกรรมปฏิทิน: สำเร็จ ${successfulCalendarDeletes}/${eventsToDelete.length}`);


//     // ================== ลบข้อมูลใน Google Drive ==================
//     console.log("📁 [deleteRentalCompletely] === เริ่มลบข้อมูลใน Google Drive ===");
//     let driveDeleteResult;
//     try {
//         const config = getSystemConfig(sheetID);
//         if (config && config.config && config.config.IDโฟลเดอร์สัญญาเช่า) {
//             const rootFolder = DriveApp.getFolderById(config.config.IDโฟลเดอร์สัญญาเช่า);
//             const folderIterator = rootFolder.getFoldersByName(bookingNumber);
//             if (folderIterator.hasNext()) {
//                 const folder = folderIterator.next();
//                 let filesCount = 0;
//                 const fileIterator = folder.getFiles();
//                 while(fileIterator.hasNext()){
//                     fileIterator.next();
//                     filesCount++;
//                 }
//                 folder.setTrashed(true);
//                 driveDeleteResult = { success: true, message: `ลบโฟลเดอร์และไฟล์ ${filesCount} ไฟล์สำเร็จ`, filesDeleted: filesCount, foldersDeleted: 1 };
//             } else {
//                 driveDeleteResult = { success: true, message: "ไม่พบโฟลเดอร์ใน Drive", filesDeleted: 0, foldersDeleted: 0 };
//             }
//         } else {
//            driveDeleteResult = { success: true, message: "ไม่ได้ตั้งค่าโฟลเดอร์ Drive", filesDeleted: 0, foldersDeleted: 0 };
//         }
//     } catch (driveError) {
//         console.error("❌ [deleteRentalCompletely] เกิดข้อผิดพลาดในการลบข้อมูลใน Drive:", driveError);
//         driveDeleteResult = { success: false, message: "เกิดข้อผิดพลาดในการลบข้อมูลใน Drive", filesDeleted: 0, foldersDeleted: 0 };
//     }


//     // ================== ล้าง Cache และสรุปผล ==================
//     console.log("🧹 [deleteRentalCompletely] ล้าง Summary Cache...");
//     try {
//       clearSummaryCacheForTenant(sheetID);
//       console.log("✅ [deleteRentalCompletely] ล้าง Cache สำเร็จ");
//     } catch (cacheError) {
//       console.error("❌ [deleteRentalCompletely] เกิดข้อผิดพลาดในการล้าง Cache:", cacheError);
//     }

//     // สร้างข้อความสรุปที่สมบูรณ์
//     const overallMessage = `ลบข้อมูลการจอง ${bookingNumber} เสร็จสิ้น`;

//     console.log("✅ [deleteRentalCompletely] การลบรายการเช่าทั้งหมดเสร็จสิ้น");

//     // ส่งข้อมูลกลับไปหน้าเว็บ
//     return {
//       success: true,
//       message: overallMessage,
//       details: {
//         bookingNumber: bookingNumber,
//         financial: {
//           success: financialDeleteResult.success,
//           message: financialDeleteResult.message,
//           recordsDeleted: financialDeleteResult.recordsDeleted
//         },
//         sheets: {
//           success: true,
//           message: `ลบรายการเช่า ${rentalRowsDeleted} แถว และตารางรับส่ง ${scheduleRowsDeleted} แถว`,
//           rentalRowsDeleted: rentalRowsDeleted,
//           scheduleRowsDeleted: scheduleRowsDeleted,
//         },
//         calendar: {
//           success: successfulCalendarDeletes === eventsToDelete.length,
//           message: `ลบกิจกรรมปฏิทิน ${successfulCalendarDeletes}/${eventsToDelete.length} กิจกรรม`,
//           eventsFound: eventsToDelete.length,
//           successfulDeletes: successfulCalendarDeletes,
//         },
//         drive: {
//           success: driveDeleteResult.success,
//           message: driveDeleteResult.message,
//           filesDeleted: driveDeleteResult.filesDeleted,
//           foldersDeleted: driveDeleteResult.foldersDeleted
//         }
//       }
//     };

//   } catch (e) {
//     console.error("💥 [deleteRentalCompletely] เกิดข้อผิดพลาดร้ายแรง:", e);
//     return {
//       success: false,
//       message: "เกิดข้อผิดพลาดในการลบรายการทั้งหมด: " + e.toString(),
//       error: {
//         message: e.message,
//         stack: e.stack
//       }
//     };
//   }
// }










// function deleteRentalByBookingNumber(bookingNumber, sheetID) {
//   console.log("🔄 [deleteRentalByBookingNumber] เริ่มต้นการลบรายการเช่า");
//   console.log("📝 [deleteRentalByBookingNumber] Parameters:", {
//     bookingNumber: bookingNumber,
//     sheetID: sheetID
//   });

//   try {
//     const ss = SpreadsheetApp.openById(sheetID);
//     console.log("📊 [deleteRentalByBookingNumber] เปิด Spreadsheet สำเร็จ");

//     const rentalSheet = ss.getSheetByName(RENTAL_SHEET);
//     const scheduleSheet = ss.getSheetByName(SCHEDULE_SHEET);

//     console.log("📋 [deleteRentalByBookingNumber] ชื่อ Sheet:", {
//       rentalSheet: RENTAL_SHEET,
//       scheduleSheet: SCHEDULE_SHEET
//     });

//     console.log("📊 [deleteRentalByBookingNumber] สถานะ Sheets:", {
//       rentalSheetExists: !!rentalSheet,
//       scheduleSheetExists: !!scheduleSheet,
//       rentalSheetRows: rentalSheet ? rentalSheet.getLastRow() : 0,
//       scheduleSheetRows: scheduleSheet ? scheduleSheet.getLastRow() : 0
//     });

//     // ✅ ลบรายการทางการเงิน (รวมค่าคอมมิชชั่น) ก่อนลบรายการเช่า
//     console.log("💰 [deleteRentalByBookingNumber] เริ่มลบรายการทางการเงิน...");
//     try {
//       const financialDeleteResult = deleteFinancialRecordsForBooking(sheetID, bookingNumber);
//       console.log("💰 [deleteRentalByBookingNumber] ผลลัพธ์การลบรายการทางการเงิน:", financialDeleteResult);
//     } catch (financialError) {
//       console.error("❌ [deleteRentalByBookingNumber] เกิดข้อผิดพลาดในการลบรายการทางการเงิน:", financialError);
//     }

//     // ลบรายการจากตารางรายการเช่า
//     console.log("🏠 [deleteRentalByBookingNumber] เริ่มลบรายการจากตารางรายการเช่า...");
//     let rentalRowsDeleted = 0;

//     if (!rentalSheet) {
//       console.error("❌ [deleteRentalByBookingNumber] ไม่พบ Rental Sheet");
//       throw new Error("ไม่พบตารางรายการเช่า");
//     }

//     const rentalData = rentalSheet.getDataRange().getValues();
//     const rentalHeaders = rentalData[0];
//     const rentalBookingNumberIndex = rentalHeaders.indexOf("หมายเลขการจอง");

//     console.log("📊 [deleteRentalByBookingNumber] ข้อมูลตารางรายการเช่า:", {
//       totalRows: rentalData.length,
//       headers: rentalHeaders,
//       bookingNumberColumnIndex: rentalBookingNumberIndex
//     });

//     if (rentalBookingNumberIndex !== -1) {
//       console.log("🔍 [deleteRentalByBookingNumber] เริ่มค้นหาและลบรายการที่ตรงกัน...");

//       for (let i = rentalData.length - 1; i > 0; i--) {
//         const currentBookingNumber = rentalData[i][rentalBookingNumberIndex];

//         if (i <= 5) { // Log เฉพาะ 5 แถวแรก เพื่อไม่ให้ log เยอะเกินไป
//           console.log(`🔍 [deleteRentalByBookingNumber] ตรวจสอบแถวที่ ${i + 1}:`, {
//             currentBookingNumber: currentBookingNumber,
//             targetBookingNumber: bookingNumber,
//             isMatch: currentBookingNumber === bookingNumber
//           });
//         }

//         if (rentalData[i][rentalBookingNumberIndex] === bookingNumber) {
//           console.log(`✂️ [deleteRentalByBookingNumber] พบรายการที่ตรงกัน - ลบแถวที่ ${i + 1}`);
//           rentalSheet.deleteRow(i + 1);
//           rentalRowsDeleted++;
//         }
//       }

//       console.log(`📊 [deleteRentalByBookingNumber] ลบรายการเช่าเสร็จสิ้น: ${rentalRowsDeleted} รายการ`);
//     } else {
//       console.error("❌ [deleteRentalByBookingNumber] ไม่พบคอลัมน์ 'หมายเลขการจอง' ในตารางรายการเช่า");
//     }

//     // ลบรายการจากตารางรับส่งรถ
//     console.log("🚗 [deleteRentalByBookingNumber] เริ่มลบรายการจากตารางรับส่งรถ...");
//     let scheduleRowsDeleted = 0;

//     if (!scheduleSheet) {
//       console.warn("⚠️ [deleteRentalByBookingNumber] ไม่พบ Schedule Sheet");
//     } else if (scheduleSheet.getLastRow() > 1) {
//       const scheduleData = scheduleSheet.getDataRange().getValues();
//       const scheduleHeaders = scheduleData[0];
//       const scheduleBookingNumberIndex = scheduleHeaders.indexOf("หมายเลขการจอง");

//       console.log("📊 [deleteRentalByBookingNumber] ข้อมูลตารางรับส่งรถ:", {
//         totalRows: scheduleData.length,
//         headers: scheduleHeaders,
//         bookingNumberColumnIndex: scheduleBookingNumberIndex
//       });

//       if (scheduleBookingNumberIndex !== -1) {
//         console.log("🔍 [deleteRentalByBookingNumber] เริ่มค้นหาและลบรายการในตารางรับส่งรถ...");

//         for (let i = scheduleData.length - 1; i > 0; i--) {
//           const currentBookingNumber = scheduleData[i][scheduleBookingNumberIndex];

//           if (i <= 5) { // Log เฉพาะ 5 แถวแรก
//             console.log(`🔍 [deleteRentalByBookingNumber] ตรวจสอบแถวที่ ${i + 1} (Schedule):`, {
//               currentBookingNumber: currentBookingNumber,
//               targetBookingNumber: bookingNumber,
//               isMatch: currentBookingNumber === bookingNumber,
//               rowType: scheduleData[i][scheduleHeaders.indexOf("ประเภท")] || "N/A"
//             });
//           }

//           if (scheduleData[i][scheduleBookingNumberIndex] === bookingNumber) {
//             const rowType = scheduleData[i][scheduleHeaders.indexOf("ประเภท")] || "ไม่ระบุ";
//             console.log(`✂️ [deleteRentalByBookingNumber] พบรายการที่ตรงกัน - ลบแถวที่ ${i + 1} (${rowType})`);
//             scheduleSheet.deleteRow(i + 1);
//             scheduleRowsDeleted++;
//           }
//         }

//         console.log(`📊 [deleteRentalByBookingNumber] ลบรายการตารางรับส่งรถเสร็จสิ้น: ${scheduleRowsDeleted} รายการ`);
//       } else {
//         console.error("❌ [deleteRentalByBookingNumber] ไม่พบคอลัมน์ 'หมายเลขการจอง' ในตารางรับส่งรถ");
//       }
//     } else {
//       console.log("ℹ️ [deleteRentalByBookingNumber] ตารางรับส่งรถว่างเปล่า - ข้ามขั้นตอนการลบ");
//     }

//     // ล้าง Cache
//     console.log("🧹 [deleteRentalByBookingNumber] ล้าง Summary Cache...");
//     try {
//       clearSummaryCacheForTenant(sheetID);
//       console.log("✅ [deleteRentalByBookingNumber] ล้าง Cache สำเร็จ");
//     } catch (cacheError) {
//       console.error("❌ [deleteRentalByBookingNumber] เกิดข้อผิดพลาดในการล้าง Cache:", cacheError);
//     }

//     const successMessage = `ลบรายการเช่า ${rentalRowsDeleted} รายการ และลบรายการในตารางรับส่งรถ ${scheduleRowsDeleted} รายการ พร้อมลบรายการทางการเงินทั้งหมด`;

//     console.log("✅ [deleteRentalByBookingNumber] การลบรายการเช่าเสร็จสิ้น");
//     console.log("📊 [deleteRentalByBookingNumber] สรุปผลลัพธ์:", {
//       rentalRowsDeleted: rentalRowsDeleted,
//       scheduleRowsDeleted: scheduleRowsDeleted,
//       message: successMessage
//     });

//     return { 
//       success: true, 
//       message: successMessage,
//       details: {
//         rentalRowsDeleted: rentalRowsDeleted,
//         scheduleRowsDeleted: scheduleRowsDeleted,
//         bookingNumber: bookingNumber
//       }
//     };

//   } catch (e) {
//     console.error("💥 [deleteRentalByBookingNumber] เกิดข้อผิดพลาดร้ายแรง:", e);
//     console.error("📍 [deleteRentalByBookingNumber] Error Details:", {
//       message: e.message,
//       stack: e.stack,
//       toString: e.toString()
//     });
//     console.error("📝 [deleteRentalByBookingNumber] Parameters ที่ทำให้เกิด Error:", {
//       bookingNumber: bookingNumber,
//       sheetID: sheetID
//     });

//     return { 
//       success: false, 
//       message: "เกิดข้อผิดพลาดในการลบรายการ: " + e.toString(),
//       error: {
//         message: e.message,
//         stack: e.stack
//       }
//     };
//   }
// }



/**
 * (ฉบับสมบูรณ์) ลบรายการเช่าด้วยหมายเลขการจอง และอัปเดตประวัติลูกค้า
 * @param {string} bookingNumber - หมายเลขการจองที่จะลบ
 * @param {string} sheetID - ID ของ Google Sheet
 */
function deleteRentalByBookingNumber(bookingNumber, sheetID) {
  console.log("🔄 [deleteRentalByBookingNumber] เริ่มต้นการลบรายการเช่า");
  console.log("📝 [deleteRentalByBookingNumber] Parameters:", {
    bookingNumber: bookingNumber,
    sheetID: sheetID
  });

  try {
    const ss = SpreadsheetApp.openById(sheetID);
    console.log("📊 [deleteRentalByBookingNumber] เปิด Spreadsheet สำเร็จ");

    const rentalSheet = ss.getSheetByName(RENTAL_SHEET);
    const scheduleSheet = ss.getSheetByName(SCHEDULE_SHEET);

    console.log("📋 [deleteRentalByBookingNumber] ชื่อ Sheet:", {
      rentalSheet: RENTAL_SHEET,
      scheduleSheet: SCHEDULE_SHEET
    });

    console.log("📊 [deleteRentalByBookingNumber] สถานะ Sheets:", {
      rentalSheetExists: !!rentalSheet,
      scheduleSheetExists: !!scheduleSheet,
      rentalSheetRows: rentalSheet ? rentalSheet.getLastRow() : 0,
      scheduleSheetRows: scheduleSheet ? scheduleSheet.getLastRow() : 0
    });

    // ✅ ลบรายการทางการเงิน (รวมค่าคอมมิชชั่น) ก่อนลบรายการเช่า
    console.log("💰 [deleteRentalByBookingNumber] เริ่มลบรายการทางการเงิน...");
    try {
      const financialDeleteResult = deleteFinancialRecordsForBooking(sheetID, bookingNumber);
      console.log("💰 [deleteRentalByBookingNumber] ผลลัพธ์การลบรายการทางการเงิน:", financialDeleteResult);
    } catch (financialError) {
      console.error("❌ [deleteRentalByBookingNumber] เกิดข้อผิดพลาดในการลบรายการทางการเงิน:", financialError);
    }

    // --- ⭐ ส่วนที่ 1: อ่านข้อมูลลูกค้า และ ลบรายการจากตารางรายการเช่า ---
    console.log("🏠 [deleteRentalByBookingNumber] เริ่มลบรายการจากตารางรายการเช่า...");
    let rentalRowsDeleted = 0;
    let customerIdentifier = null; // ⭐ ตัวแปรสำหรับเก็บข้อมูลลูกค้า

    if (!rentalSheet) {
      console.error("❌ [deleteRentalByBookingNumber] ไม่พบ Rental Sheet");
      throw new Error("ไม่พบตารางรายการเช่า");
    }

    const rentalData = rentalSheet.getDataRange().getValues();
    const rentalHeaders = rentalData[0];
    const rentalBookingNumberIndex = rentalHeaders.indexOf("หมายเลขการจอง");
    const idCardIndex = rentalHeaders.indexOf("เลขบัตรประชาชน"); // ⭐ อ่าน Index เพิ่ม
    const phoneIndex = rentalHeaders.indexOf("เบอร์โทรศัพท์");   // ⭐ อ่าน Index เพิ่ม

    console.log("📊 [deleteRentalByBookingNumber] ข้อมูลตารางรายการเช่า:", {
      totalRows: rentalData.length,
      headers: rentalHeaders,
      bookingNumberColumnIndex: rentalBookingNumberIndex
    });

    if (rentalBookingNumberIndex !== -1) {
      console.log("🔍 [deleteRentalByBookingNumber] เริ่มค้นหาและลบรายการที่ตรงกัน...");

      for (let i = rentalData.length - 1; i > 0; i--) {
        if (rentalData[i][rentalBookingNumberIndex] === bookingNumber) {
          // ⭐ อ่านข้อมูลลูกค้า "ก่อน" ที่จะลบแถว
          if (!customerIdentifier) { // เก็บข้อมูลแค่ครั้งแรกที่เจอ
            customerIdentifier = rentalData[i][idCardIndex] || rentalData[i][phoneIndex];
          }

          console.log(`✂️ [deleteRentalByBookingNumber] พบรายการที่ตรงกัน - ลบแถวที่ ${i + 1}`);
          rentalSheet.deleteRow(i + 1);
          rentalRowsDeleted++;
        }
      }

      console.log(`📊 [deleteRentalByBookingNumber] ลบรายการเช่าเสร็จสิ้น: ${rentalRowsDeleted} รายการ`);
    } else {
      console.error("❌ [deleteRentalByBookingNumber] ไม่พบคอลัมน์ 'หมายเลขการจอง' ในตารางรายการเช่า");
    }

    // --- ⭐ ส่วนที่ 2: อัปเดตประวัติลูกค้า (Logic ใหม่) ---
    if (customerIdentifier) {
      updateCustomerHistoryManager({
        sheetID: sheetID,
        mode: 'DELETE',
        bookingNumberToDelete: bookingNumber,
        customerIdentifier: customerIdentifier
      });
      console.log(`👤 [deleteRentalByBookingNumber] อัปเดตประวัติลูกค้าสำเร็จ`);
    }

    // --- ส่วนที่ 3: ลบรายการจากตารางรับส่งรถ (โค้ดเดิม) ---
    console.log("🚗 [deleteRentalByBookingNumber] เริ่มลบรายการจากตารางรับส่งรถ...");
    let scheduleRowsDeleted = 0;

    if (!scheduleSheet) {
      console.warn("⚠️ [deleteRentalByBookingNumber] ไม่พบ Schedule Sheet");
    } else if (scheduleSheet.getLastRow() > 1) {
      const scheduleData = scheduleSheet.getDataRange().getValues();
      const scheduleHeaders = scheduleData[0];
      const scheduleBookingNumberIndex = scheduleHeaders.indexOf("หมายเลขการจอง");

      console.log("📊 [deleteRentalByBookingNumber] ข้อมูลตารางรับส่งรถ:", {
        totalRows: scheduleData.length,
        headers: scheduleHeaders,
        bookingNumberColumnIndex: scheduleBookingNumberIndex
      });

      if (scheduleBookingNumberIndex !== -1) {
        console.log("🔍 [deleteRentalByBookingNumber] เริ่มค้นหาและลบรายการในตารางรับส่งรถ...");

        for (let i = scheduleData.length - 1; i > 0; i--) {
          if (scheduleData[i][scheduleBookingNumberIndex] === bookingNumber) {
            const rowType = scheduleData[i][scheduleHeaders.indexOf("ประเภท")] || "ไม่ระบุ";
            console.log(`✂️ [deleteRentalByBookingNumber] พบรายการที่ตรงกัน - ลบแถวที่ ${i + 1} (${rowType})`);
            scheduleSheet.deleteRow(i + 1);
            scheduleRowsDeleted++;
          }
        }

        console.log(`📊 [deleteRentalByBookingNumber] ลบรายการตารางรับส่งรถเสร็จสิ้น: ${scheduleRowsDeleted} รายการ`);
      } else {
        console.error("❌ [deleteRentalByBookingNumber] ไม่พบคอลัมน์ 'หมายเลขการจอง' ในตารางรับส่งรถ");
      }
    } else {
      console.log("ℹ️ [deleteRentalByBookingNumber] ตารางรับส่งรถว่างเปล่า - ข้ามขั้นตอนการลบ");
    }

    // --- ส่วนที่ 4: ล้าง Cache และส่งผลลัพธ์ (โค้ดเดิม) ---
    console.log("🧹 [deleteRentalByBookingNumber] ล้าง Summary Cache...");
    try {
      clearSummaryCacheForTenant(sheetID);
      console.log("✅ [deleteRentalByBookingNumber] ล้าง Cache สำเร็จ");
    } catch (cacheError) {
      console.error("❌ [deleteRentalByBookingNumber] เกิดข้อผิดพลาดในการล้าง Cache:", cacheError);
    }

    const successMessage = `ลบรายการเช่า ${rentalRowsDeleted} รายการ และลบรายการในตารางรับส่งรถ ${scheduleRowsDeleted} รายการ พร้อมลบรายการทางการเงินทั้งหมด`;

    console.log("✅ [deleteRentalByBookingNumber] การลบรายการเช่าเสร็จสิ้น");
    console.log("📊 [deleteRentalByBookingNumber] สรุปผลลัพธ์:", {
      rentalRowsDeleted: rentalRowsDeleted,
      scheduleRowsDeleted: scheduleRowsDeleted,
      message: successMessage
    });

    return {
      success: true,
      message: successMessage,
      details: {
        rentalRowsDeleted: rentalRowsDeleted,
        scheduleRowsDeleted: scheduleRowsDeleted,
        bookingNumber: bookingNumber
      }
    };

  } catch (e) {
    console.error("💥 [deleteRentalByBookingNumber] เกิดข้อผิดพลาดร้ายแรง:", e);
    console.error("📍 [deleteRentalByBookingNumber] Error Details:", {
      message: e.message,
      stack: e.stack,
      toString: e.toString()
    });
    console.error("📝 [deleteRentalByBookingNumber] Parameters ที่ทำให้เกิด Error:", {
      bookingNumber: bookingNumber,
      sheetID: sheetID
    });

    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการลบรายการ: " + e.toString(),
      error: {
        message: e.message,
        stack: e.stack
      }
    };
  }
}



/**
 * (ฉบับสมบูรณ์ V.2) ลบข้อมูลการเช่าแบบถอนรากถอนโคน (Sheets, Calendar, Drive) 
 * และอัปเดตประวัติลูกค้า พร้อมแก้ไข Error Handling
 * @param {string} bookingNumber - หมายเลขการจองที่จะลบ
 * @param {string} sheetID - ID ของ Google Sheet
 */
function deleteRentalCompletely(bookingNumber, sheetID) {
  console.log("🔄 [deleteRentalCompletely] เริ่มต้นการลบรายการเช่าทั้งหมด (Sheets + Drive)");
  console.log("📝 [deleteRentalCompletely] Parameters:", {
    bookingNumber: bookingNumber,
    sheetID: sheetID
  });

  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const rentalSheet = ss.getSheetByName(RENTAL_SHEET);
    const scheduleSheet = ss.getSheetByName(SCHEDULE_SHEET);

    // --- ⭐ ขั้นตอนที่ 1: อ่านข้อมูลสำคัญทั้งหมด "ก่อน" ทำการลบ ---
    let customerIdentifier = null;
    let eventsToDelete = [];
    if (rentalSheet) {
      const rentalData = rentalSheet.getDataRange().getValues();
      const rentalHeaders = rentalData[0];
      const rentalBookingNumberIndex = rentalHeaders.indexOf("หมายเลขการจอง");
      const idCardIndex = rentalHeaders.indexOf("เลขบัตรประชาชน");
      const phoneIndex = rentalHeaders.indexOf("เบอร์โทรศัพท์");
      const calendarEventIdIndex = rentalHeaders.indexOf("IDกิจกรรมปฏิทิน");
      const calendarIdIndex = rentalHeaders.indexOf("IDปฏิทิน");

      // วนลูปเพื่อหาข้อมูลลูกค้าและ Event ที่จะลบ
      for (let i = rentalData.length - 1; i > 0; i--) {
        if (rentalData[i][rentalBookingNumberIndex] === bookingNumber) {
          // อ่านข้อมูลลูกค้า (เก็บแค่ครั้งแรกที่เจอ)
          if (!customerIdentifier) {
            customerIdentifier = rentalData[i][idCardIndex] || rentalData[i][phoneIndex];
          }
          // เก็บข้อมูล Event ที่จะลบ
          if (calendarEventIdIndex !== -1 && calendarIdIndex !== -1 && rentalData[i][calendarEventIdIndex] && rentalData[i][calendarIdIndex]) {
            eventsToDelete.push({ eventId: rentalData[i][calendarEventIdIndex], calendarId: rentalData[i][calendarIdIndex] });
          }
        }
      }
    }

    // --- ⭐ ขั้นตอนที่ 2: อัปเดตประวัติลูกค้า ---
    if (customerIdentifier) {
      updateCustomerHistoryManager({
        sheetID: sheetID,
        mode: 'DELETE',
        bookingNumberToDelete: bookingNumber,
        customerIdentifier: customerIdentifier
      });
      console.log(`👤 [deleteCompletely] อัปเดตประวัติลูกค้าสำเร็จ`);
    }

    // --- ขั้นตอนที่ 3: ลบข้อมูลที่เชื่อมโยงทั้งหมด ---

    // 3.1) ลบข้อมูลการเงิน
    // ⭐ แก้ไข: ตรวจสอบผลลัพธ์ที่ได้จากฟังก์ชันย่อย
    let financialDeleteResult = deleteFinancialRecordsForBooking(sheetID, bookingNumber);
    if (financialDeleteResult === undefined || financialDeleteResult === null) {
      // ถ้าไม่ได้ผลลัพธ์กลับมา ให้สร้างผลลัพธ์เริ่มต้นเอง
      financialDeleteResult = { success: true, message: "ดำเนินการลบข้อมูลการเงินแล้ว (ไม่ได้รับผลลัพธ์)", recordsDeleted: 'N/A' };
    }

    // (ส่วนที่เหลือของโค้ดเหมือนเดิมทุกประการ)
    // 3.2) ลบรายการจากตารางรายการเช่า
    console.log("🏠 [deleteRentalCompletely] เริ่มลบรายการจากตารางรายการเช่า...");
    let rentalRowsDeleted = 0;
    if (rentalSheet) {
      const rentalData = rentalSheet.getDataRange().getValues();
      const rentalHeaders = rentalData[0];
      const rentalBookingNumberIndex = rentalHeaders.indexOf("หมายเลขการจอง");
      if (rentalBookingNumberIndex !== -1) {
        for (let i = rentalData.length - 1; i > 0; i--) {
          if (rentalData[i][rentalBookingNumberIndex] === bookingNumber) {
            rentalSheet.deleteRow(i + 1);
            rentalRowsDeleted++;
          }
        }
        console.log(`📊 [deleteRentalCompletely] ลบรายการเช่า: ${rentalRowsDeleted} รายการ`);
      }
    }

    // 3.3) ลบรายการจากตารางรับส่งรถ
    console.log("🚗 [deleteRentalCompletely] เริ่มลบรายการจากตารางรับส่งรถ...");
    let scheduleRowsDeleted = 0;
    if (scheduleSheet && scheduleSheet.getLastRow() > 1) {
      const scheduleData = scheduleSheet.getDataRange().getValues();
      const scheduleHeaders = scheduleData[0];
      const scheduleBookingNumberIndex = scheduleHeaders.indexOf("หมายเลขการจอง");
      if (scheduleBookingNumberIndex !== -1) {
        for (let i = scheduleData.length - 1; i > 0; i--) {
          if (scheduleData[i][scheduleBookingNumberIndex] === bookingNumber) {
            scheduleSheet.deleteRow(i + 1);
            scheduleRowsDeleted++;
          }
        }
      }
    }
    console.log(`📊 [deleteRentalCompletely] ลบรายการตารางรับส่งรถ: ${scheduleRowsDeleted} รายการ`);

    // 3.4) ลบกิจกรรมจาก Google Calendar
    console.log("📅 [deleteRentalCompletely] === เริ่มลบกิจกรรมจาก Google Calendar ===");
    let calendarDeleteResults = [];
    if (eventsToDelete.length > 0) {
      for (const item of eventsToDelete) {
        const { eventId, calendarId } = item;
        try {
          const calendar = CalendarApp.getCalendarById(calendarId);
          if (!calendar) throw new Error(`ไม่พบปฏิทิน ID: ${calendarId}`);

          const actualEventId = eventId.toString().split('@')[0];
          const event = calendar.getEventById(actualEventId);

          if (event) {
            const eventTitle = event.getTitle();
            event.deleteEvent();
            console.log(`✅ [deleteRentalCompletely] ลบกิจกรรมสำเร็จ: ${eventTitle}`);
            calendarDeleteResults.push({ success: true, message: `ลบกิจกรรม "${eventTitle}" สำเร็จ` });
          } else {
            console.log(`⚠️ [deleteRentalCompletely] ไม่พบกิจกรรม: ${eventId}`);
            calendarDeleteResults.push({ success: true, message: `ไม่พบกิจกรรม ${eventId} (อาจถูกลบไปแล้ว)` });
          }
        } catch (calendarError) {
          console.error(`❌ [deleteRentalCompletely] ลบกิจกรรมไม่สำเร็จ: ${eventId}`, calendarError);
          calendarDeleteResults.push({ success: false, message: `ลบกิจกรรมไม่สำเร็จ: ${calendarError.message}` });
        }
      }
    }
    const successfulCalendarDeletes = calendarDeleteResults.filter(r => r.success).length;
    console.log(`📅 [deleteRentalCompletely] สรุปการลบกิจกรรมปฏิทิน: สำเร็จ ${successfulCalendarDeletes}/${eventsToDelete.length}`);

    // 3.5) ลบข้อมูลใน Google Drive
    console.log("📁 [deleteRentalCompletely] === เริ่มลบข้อมูลใน Google Drive ===");
    let driveDeleteResult;
    try {
      const config = getSystemConfig(sheetID);
      if (config && config.config && config.config.IDโฟลเดอร์สัญญาเช่า) {
        const rootFolder = DriveApp.getFolderById(config.config.IDโฟลเดอร์สัญญาเช่า);
        const folderIterator = rootFolder.getFoldersByName(bookingNumber);
        if (folderIterator.hasNext()) {
          const folder = folderIterator.next();
          let filesCount = 0;
          const fileIterator = folder.getFiles();
          while (fileIterator.hasNext()) {
            fileIterator.next();
            filesCount++;
          }
          folder.setTrashed(true);
          driveDeleteResult = { success: true, message: `ลบโฟลเดอร์และไฟล์ ${filesCount} ไฟล์สำเร็จ`, filesDeleted: filesCount, foldersDeleted: 1 };
        } else {
          driveDeleteResult = { success: true, message: "ไม่พบโฟลเดอร์ใน Drive", filesDeleted: 0, foldersDeleted: 0 };
        }
      } else {
        driveDeleteResult = { success: true, message: "ไม่ได้ตั้งค่าโฟลเดอร์ Drive", filesDeleted: 0, foldersDeleted: 0 };
      }
    } catch (driveError) {
      console.error("❌ [deleteRentalCompletely] เกิดข้อผิดพลาดในการลบข้อมูลใน Drive:", driveError);
      driveDeleteResult = { success: false, message: "เกิดข้อผิดพลาดในการลบข้อมูลใน Drive", filesDeleted: 0, foldersDeleted: 0 };
    }

    // --- ขั้นตอนสุดท้าย: ล้าง Cache และสรุปผล ---
    console.log("🧹 [deleteRentalCompletely] ล้าง Summary Cache...");
    clearSummaryCacheForTenant(sheetID);

    return {
      success: true,
      message: `ลบข้อมูลการจอง ${bookingNumber} เสร็จสิ้น`,
      details: {
        bookingNumber: bookingNumber,
        financial: {
          success: financialDeleteResult.success,
          message: financialDeleteResult.message,
          recordsDeleted: financialDeleteResult.recordsDeleted
        },
        sheets: {
          success: true,
          message: `ลบรายการเช่า ${rentalRowsDeleted} แถว และตารางรับส่ง ${scheduleRowsDeleted} แถว`,
          rentalRowsDeleted: rentalRowsDeleted,
          scheduleRowsDeleted: scheduleRowsDeleted,
        },
        calendar: {
          success: successfulCalendarDeletes === eventsToDelete.length,
          message: `ลบกิจกรรมปฏิทิน ${successfulCalendarDeletes}/${eventsToDelete.length} กิจกรรม`,
          eventsFound: eventsToDelete.length,
          successfulDeletes: successfulCalendarDeletes,
        },
        drive: {
          success: driveDeleteResult.success,
          message: driveDeleteResult.message,
          filesDeleted: driveDeleteResult.filesDeleted,
          foldersDeleted: driveDeleteResult.foldersDeleted
        }
      }
    };

  } catch (e) {
    console.error("💥 [deleteRentalCompletely] เกิดข้อผิดพลาดร้ายแรง:", e);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการลบรายการทั้งหมด: " + e.toString(),
      error: {
        message: e.message,
        stack: e.stack
      }
    };
  }
}



// =============================================================================
// 5. ฟังก์ชันใหม่: addOrUpdateFinancialRecordWithCommission()
// =============================================================================

function addOrUpdateFinancialRecordWithCommission(sheetID, bookingNumber, rentalData, action) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    let sheet = ss.getSheetByName(FINANCIAL_SHEET);

    if (!sheet) {
      sheet = ss.insertSheet(FINANCIAL_SHEET);
      sheet.appendRow(['วันที่', 'ประเภท', 'รายการ', 'จำนวนเงิน', 'หมายเลขการจอง', 'รถที่เกี่ยวข้อง', 'หมายเหตุ']);
    }

    const data = sheet.getDataRange().getValues();
    const bookingNumberCol = 4; // คอลัมน์ E สำหรับ หมายเลขการจอง

    // 1. ลบรายการเก่าที่ตรงกับ bookingNumber
    for (let i = data.length - 1; i > 0; i--) {
      if (data[i][bookingNumberCol] === bookingNumber) {
        sheet.deleteRow(i + 1);
      }
    }

    // 2. ถ้าเป็นการ add หรือ update ให้เพิ่มรายการใหม่
    if (action === 'add' || action === 'update') {
      if (!rentalData) return;

      // เพิ่มรายรับค่าเช่า
      const incomeRow = [
        new Date(rentalData.วันที่เช่า), // วันที่
        'รายรับ', // ประเภท
        `ค่าเช่า #${bookingNumber}`, // รายการ
        parseFloat(rentalData.ค่าเช่ารวมทั้งหมด) || 0, // จำนวนเงิน
        bookingNumber, // หมายเลขการจอง
        rentalData.รถ, // รถที่เกี่ยวข้อง
        'บันทึกอัตโนมัติจากระบบ' // หมายเหตุ
      ];
      sheet.appendRow(incomeRow);

      // ✅ เพิ่มรายจ่ายค่าคอมมิชชั่น (ถ้ามี)
      const commissionAmount = parseFloat(rentalData.ค่าคอมมิชชั่น) || 0;
      if (commissionAmount > 0) {
        const commissionRow = [
          new Date(rentalData.วันที่เช่า), // วันที่
          'รายจ่าย', // ประเภท
          `ค่าคอมมิชชั่น #${bookingNumber}`, // รายการ
          commissionAmount, // จำนวนเงิน
          bookingNumber, // หมายเลขการจอง
          rentalData.รถ, // รถที่เกี่ยวข้อง
          `คอมมิชชั่น: ${rentalData.ค่าคอมมิชชั่นที่เลือก || 'ไม่ระบุ'}` // หมายเหตุ
        ];
        sheet.appendRow(commissionRow);
      }
    }

  } catch (e) {
    Logger.log(`Error in addOrUpdateFinancialRecordWithCommission: ${e.message}`);
  }
}

// =============================================================================
// 6. ฟังก์ชันใหม่: deleteFinancialRecordsForBooking()
// =============================================================================

function deleteFinancialRecordsForBooking(sheetID, bookingNumber) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(FINANCIAL_SHEET);

    if (!sheet || sheet.getLastRow() < 2) {
      return;
    }

    const data = sheet.getDataRange().getValues();
    const bookingNumberCol = 4; // คอลัมน์ E สำหรับ หมายเลขการจอง

    // ลบทุกรายการที่เกี่ยวข้องกับหมายเลขการจองนี้ (ทั้งรายรับและรายจ่าย)
    for (let i = data.length - 1; i > 0; i--) {
      if (data[i][bookingNumberCol] === bookingNumber) {
        sheet.deleteRow(i + 1);
      }
    }

  } catch (e) {
    Logger.log(`Error in deleteFinancialRecordsForBooking: ${e.message}`);
  }
}

// =============================================================================
// 7. ฟังก์ชันช่วย: setupColumnFormatting()
// =============================================================================


// =============================================================================
// 8. อัพเดตฟังก์ชัน addOrUpdateFinancialRecord() เดิมให้เรียกใช้ฟังก์ชันใหม่
// =============================================================================

function addOrUpdateFinancialRecord(sheetID, bookingNumber, rentalData, action) {
  // ✅ เรียกใช้ฟังก์ชันใหม่ที่รองรับค่าคอมมิชชั่น
  addOrUpdateFinancialRecordWithCommission(sheetID, bookingNumber, rentalData, action);
}





function loadCarCategories(sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const settingsSheet = ss.getSheetByName("ตั้งค่าระบบ");

    if (!settingsSheet) {
      return {
        success: false,
        message: "ไม่พบแผ่นงาน 'ตั้งค่าระบบ' กรุณาสร้างแผ่นงานนี้ก่อน"
      };
    }

    // ค้นหาข้อมูลประเภทรถ
    const data = settingsSheet.getDataRange().getValues();
    let carCategoriesData = null;

    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === "ประเภทรถ") {
        carCategoriesData = data[i][1];
        break;
      }
    }

    // ถ้าไม่พบข้อมูล ให้สร้างค่าเริ่มต้น
    if (!carCategoriesData) {
      const defaultCategories = ["รถของร้าน", "รถ Partner", "รถหุ้นส่วน"];
      const result = saveCarCategories(sheetID, defaultCategories);

      if (result.success) {
        return {
          success: true,
          data: defaultCategories,
          message: "สร้างประเภทรถเริ่มต้นสำเร็จ"
        };
      } else {
        return result;
      }
    }

    // แปลง JSON string กลับเป็น Array
    try {
      const categories = JSON.parse(carCategoriesData);
      return {
        success: true,
        data: Array.isArray(categories) ? categories : [],
        message: "โหลดประเภทรถสำเร็จ"
      };
    } catch (parseError) {
      Logger.log("Error parsing car categories JSON: " + parseError.toString());

      // ถ้า parse ไม่ได้ ให้สร้างข้อมูลใหม่
      const defaultCategories = ["รถของร้าน", "รถ Partner", "รถหุ้นส่วน"];
      const result = saveCarCategories(sheetID, defaultCategories);

      if (result.success) {
        return {
          success: true,
          data: defaultCategories,
          message: "สร้างประเภทรถใหม่สำเร็จ (ข้อมูลเดิมเสียหาย)"
        };
      } else {
        return result;
      }
    }

  } catch (error) {
    Logger.log("Error in loadCarCategories: " + error.toString());
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการโหลดประเภทรถ: " + error.message
    };
  }
}

/**
 * บันทึกรายการประเภทรถลงแผ่นงาน "ตั้งค่าระบบ"
 * @param {string} sheetID - ID ของ Google Sheet
 * @param {Array} categories - Array ของประเภทรถ
 * @returns {object} ผลลัพธ์การบันทึก
 */
function saveCarCategories(sheetID, categories) {
  try {
    // ตรวจสอบข้อมูลที่ส่งมา
    if (!Array.isArray(categories)) {
      return {
        success: false,
        message: "ข้อมูลประเภทรถต้องเป็น Array"
      };
    }

    // กรองข้อมูลเพื่อให้แน่ใจว่าไม่มีค่าว่าง
    const cleanCategories = categories
      .filter(cat => typeof cat === 'string' && cat.trim() !== '')
      .map(cat => cat.trim());

    // ตรวจสอบว่ามีข้อมูลหลังจากกรองแล้ว
    if (cleanCategories.length === 0) {
      return {
        success: false,
        message: "ต้องมีประเภทรถอย่างน้อย 1 ประเภท"
      };
    }

    const ss = SpreadsheetApp.openById(sheetID);
    let settingsSheet = ss.getSheetByName("ตั้งค่าระบบ");

    // ถ้าไม่มีแผ่นงาน ตั้งค่าระบบ ให้สร้างใหม่
    if (!settingsSheet) {
      settingsSheet = ss.insertSheet("ตั้งค่าระบบ");
      // สร้างหัวตาราง
      settingsSheet.getRange(1, 1, 1, 2).setValues([["คีย์", "ค่า"]]);
      settingsSheet.getRange(1, 1, 1, 2).setFontWeight("bold");
    }

    const data = settingsSheet.getDataRange().getValues();
    let foundRow = -1;

    // ค้นหาแถวที่มี "ประเภทรถ"
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === "ประเภทรถ") {
        foundRow = i + 1; // +1 เพราะ getRange เริ่มจาก 1
        break;
      }
    }

    // แปลงข้อมูลเป็น JSON string
    const jsonData = JSON.stringify(cleanCategories);

    if (foundRow > 0) {
      // อัปเดตข้อมูลที่มีอยู่
      settingsSheet.getRange(foundRow, 2).setValue(jsonData);
    } else {
      // เพิ่มข้อมูลใหม่
      const lastRow = settingsSheet.getLastRow();
      settingsSheet.getRange(lastRow + 1, 1, 1, 2).setValues([["ประเภทรถ", jsonData]]);
    }

    Logger.log("Car categories saved successfully: " + jsonData);

    return {
      success: true,
      message: `บันทึกประเภทรถสำเร็จ (${cleanCategories.length} ประเภท)`,
      data: cleanCategories
    };

  } catch (error) {
    Logger.log("Error in saveCarCategories: " + error.toString());
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการบันทึกประเภทรถ: " + error.message
    };
  }
}

/**
 * เพิ่มประเภทรถใหม่
 * @param {string} sheetID - ID ของ Google Sheet
 * @param {string} newCategory - ประเภทรถใหม่
 * @returns {object} ผลลัพธ์การเพิ่ม
 */
function addCarCategory(sheetID, newCategory) {
  try {
    if (!newCategory || typeof newCategory !== 'string' || newCategory.trim() === '') {
      return {
        success: false,
        message: "กรุณากรอกชื่อประเภทรถ"
      };
    }

    const trimmedCategory = newCategory.trim();

    // โหลดประเภทรถที่มีอยู่
    const loadResult = loadCarCategories(sheetID);
    if (!loadResult.success) {
      return loadResult;
    }

    const currentCategories = loadResult.data || [];

    // ตรวจสอบว่าประเภทนี้มีอยู่แล้วหรือไม่ (case-insensitive)
    const exists = currentCategories.some(cat =>
      cat.toLowerCase() === trimmedCategory.toLowerCase()
    );

    if (exists) {
      return {
        success: false,
        message: "ประเภทรถนี้มีอยู่แล้ว"
      };
    }

    // เพิ่มประเภทใหม่
    const updatedCategories = [...currentCategories, trimmedCategory];

    // บันทึกข้อมูลที่อัปเดต
    return saveCarCategories(sheetID, updatedCategories);

  } catch (error) {
    Logger.log("Error in addCarCategory: " + error.toString());
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการเพิ่มประเภทรถ: " + error.message
    };
  }
}

/**
 * ลบประเภทรถ
 * @param {string} sheetID - ID ของ Google Sheet
 * @param {string} categoryToRemove - ประเภทรถที่ต้องการลบ
 * @returns {object} ผลลัพธ์การลบ
 */
function removeCarCategory(sheetID, categoryToRemove) {
  try {
    if (!categoryToRemove || typeof categoryToRemove !== 'string' || categoryToRemove.trim() === '') {
      return {
        success: false,
        message: "กรุณาระบุประเภทรถที่ต้องการลบ"
      };
    }

    // โหลดประเภทรถที่มีอยู่
    const loadResult = loadCarCategories(sheetID);
    if (!loadResult.success) {
      return loadResult;
    }

    const currentCategories = loadResult.data || [];
    const trimmedCategory = categoryToRemove.trim();

    // ค้นหาและลบประเภทที่ตรงกัน
    const updatedCategories = currentCategories.filter(cat =>
      cat.toLowerCase() !== trimmedCategory.toLowerCase()
    );

    // ตรวจสอบว่าลบได้หรือไม่
    if (updatedCategories.length === currentCategories.length) {
      return {
        success: false,
        message: "ไม่พบประเภทรถที่ต้องการลบ"
      };
    }

    // ตรวจสอบว่ายังเหลือประเภทรถอย่างน้อย 1 ประเภท
    if (updatedCategories.length === 0) {
      return {
        success: false,
        message: "ไม่สามารถลบประเภทรถทั้งหมดได้ ต้องเหลืออย่างน้อย 1 ประเภท"
      };
    }

    // บันทึกข้อมูลที่อัปเดต
    const saveResult = saveCarCategories(sheetID, updatedCategories);

    if (saveResult.success) {
      return {
        success: true,
        message: `ลบประเภทรถ "${trimmedCategory}" สำเร็จ`,
        data: updatedCategories
      };
    } else {
      return saveResult;
    }

  } catch (error) {
    Logger.log("Error in removeCarCategory: " + error.toString());
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการลบประเภทรถ: " + error.message
    };
  }
}

// =============================================================================
// ฟังก์ชันสร้างรหัสรถอัตโนมัติ
// =============================================================================

/**
 * สร้างรหัสรถอัตโนมัติ
 * @param {string} sheetID - ID ของ Google Sheet
 * @returns {string} รหัสรถที่สร้างขึ้น
 */
function generateCarCode(sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(CARS_SHEET);

    if (!sheet) {
      return "CAR001"; // ถ้าไม่มีแผ่นงานรถ ให้เริ่มจาก CAR001
    }

    const lastRow = sheet.getLastRow();

    // ถ้าไม่มีข้อมูล (มีแค่หัวตาราง) ให้เริ่มจาก CAR001
    if (lastRow <= 1) {
      return "CAR001";
    }

    // ตรวจสอบว่ามีคอลัมน์รหัสรถหรือไม่
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const carCodeIndex = headers.indexOf("รหัสรถ");

    if (carCodeIndex === -1) {
      // ถ้าไม่มีคอลัมน์รหัสรถ ให้สร้างจากจำนวนแถว
      const nextNumber = lastRow; // lastRow - 1 (header) + 1 (next) = lastRow
      return `CAR${nextNumber.toString().padStart(3, '0')}`;
    }

    // ถ้ามีคอลัมน์รหัสรถ ให้หาเลขที่ใหญ่ที่สุด
    const carCodeData = sheet.getRange(2, carCodeIndex + 1, lastRow - 1, 1).getValues();
    let maxNumber = 0;

    carCodeData.forEach(row => {
      const carCode = row[0];
      if (carCode && typeof carCode === 'string') {
        // แยกเลขจากรหัสรถ (เช่น CAR001 -> 001)
        const match = carCode.match(/CAR(\d+)/);
        if (match) {
          const number = parseInt(match[1], 10);
          if (number > maxNumber) {
            maxNumber = number;
          }
        }
      }
    });

    const nextNumber = maxNumber + 1;
    return `CAR${nextNumber.toString().padStart(3, '0')}`;

  } catch (error) {
    Logger.log("Error in generateCarCode: " + error.toString());
    // ถ้าเกิดข้อผิดพลาด ให้สร้างรหัสจากเวลาปัจจุบัน
    const timestamp = new Date().getTime().toString().slice(-3);
    return `CAR${timestamp}`;
  }
}

// =============================================================================
// ฟังก์ชันเพิ่มรถใหม่พร้อมรหัสรถอัตโนมัติ
// =============================================================================

/**
 * เพิ่มรถใหม่พร้อมสร้างรหัสรถอัตโนมัติ
 * @param {object} carData - ข้อมูลรถ
 * @param {string} sheetID - ID ของ Google Sheet
 * @returns {object} ผลลัพธ์การเพิ่มรถ
 */
function addNewCarWithCode(carData, sheetID) {
  try {
    Logger.log("Adding new car with auto-generated code: " + JSON.stringify(carData));

    const ss = SpreadsheetApp.openById(sheetID);
    let sheet = ss.getSheetByName(CARS_SHEET);

    // สร้างแผ่นงานรถถ้ายังไม่มี
    if (!sheet) {
      sheet = ss.insertSheet(CARS_SHEET);
      const headers = [
        "รหัสรถ", "ประเภทรถ", "ยี่ห้อ", "รุ่น", "ทะเบียน", "พื้นที่การใช้งาน",
        "สี", "ค่าประกันความเสียหาย", "ประเภท", "ราคาเช่าต่อวัน", "สถานะ",
        "ชนิดเชื้อเพลิง", "ค่าล่วงเวลาต่อชั่วโมง", "ค่ามัดจำคิวรถ", "รูปแบบค่าคอมมิชชั่น"
      ];
      sheet.appendRow(headers);
    }

    // ตรวจสอบและเพิ่มคอลัมน์ที่จำเป็น
    let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // เพิ่มคอลัมน์รหัสรถถ้ายังไม่มี
    if (!headers.includes("รหัสรถ")) {
      sheet.insertColumnBefore(1);
      sheet.getRange(1, 1).setValue("รหัสรถ");
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }

    // เพิ่มคอลัมน์ประเภทรถถ้ายังไม่มี
    if (!headers.includes("ประเภทรถ")) {
      const insertPosition = headers.indexOf("รหัสรถ") + 2; // หลังจากรหัสรถ
      sheet.insertColumnAfter(insertPosition - 1);
      sheet.getRange(1, insertPosition).setValue("ประเภทรถ");
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }

    // เพิ่มคอลัมน์ค่าล่วงเวลาต่อชั่วโมงถ้ายังไม่มี
    if (!headers.includes("ค่าล่วงเวลาต่อชั่วโมง")) {
      sheet.insertColumnAfter(headers.length);
      sheet.getRange(1, headers.length + 1).setValue("ค่าล่วงเวลาต่อชั่วโมง");
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }

    // เพิ่มคอลัมน์ค่ามัดจำคิวรถถ้ายังไม่มี
    if (!headers.includes("ค่ามัดจำคิวรถ")) {
      sheet.insertColumnAfter(headers.length);
      sheet.getRange(1, headers.length + 1).setValue("ค่ามัดจำคิวรถ");
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }

    // สร้างรหัสรถอัตโนมัติ
    const carCode = generateCarCode(sheetID);
    carData.รหัสรถ = carCode;

    // เตรียมข้อมูลสำหรับบันทึก
    const newRow = [];
    for (let i = 0; i < headers.length; i++) {
      newRow.push(carData[headers[i]] || "");
    }

    // บันทึกข้อมูล
    sheet.appendRow(newRow);

    // Format ทะเบียนเป็นข้อความ
    const regNoCol = headers.indexOf("ทะเบียน") + 1;
    if (regNoCol > 0) {
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow, regNoCol).setNumberFormat('@STRING@');
    }

    clearSummaryCacheForTenant(sheetID);
    Logger.log("Car added successfully with code: " + carCode);

    return {
      success: true,
      message: "เพิ่มรถใหม่สำเร็จ",
      carCode: carCode
    };

  } catch (error) {
    Logger.log("Error in addNewCarWithCode: " + error.toString());
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการเพิ่มข้อมูลรถ: " + error.message
    };
  }
}


/////////////////////////////////////ถ่ายรูป

// ส่วนที่ 6: Backend Google Apps Script
// เพิ่มใน code.gs



/**
 * สร้างหรือหาโฟลเดอร์สำหรับเก็บรูปภาพการรับส่งรถ
 */
function createOrGetBookingFolder(bookingNumber, parentFolderId) {
  try {
    const parentFolder = DriveApp.getFolderById(parentFolderId);

    // ตรวจสอบว่ามีโฟลเดอร์ชื่อนี้อยู่แล้วหรือไม่
    const existingFolders = parentFolder.getFoldersByName(bookingNumber);

    if (existingFolders.hasNext()) {
      return existingFolders.next();
    } else {
      return parentFolder.createFolder(bookingNumber);
    }
  } catch (e) {
    Logger.log("Error creating/getting booking folder: " + e.toString());
    return null;
  }
}

/**
 * อัปโหลดรูปภาพการรับส่งรถไป Google Drive
 */
function uploadHandoverPhoto(base64Data, photoType, bookingNumber, handoverType, folderId) {
  try {
    // สร้างชื่อไฟล์
    const timestamp = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyyMMdd_HHmmss");
    const photoTypeMap = {
      customer: "ลูกค้าคู่กับรถ",
      speedometer: "เรือนไมล์",
      front: "ด้านหน้า",
      back: "ด้านหลัง",
      left: "ด้านซ้าย",
      right: "ด้านขวา"
    };

    const photoTypeThai = photoTypeMap[photoType] || photoType;
    const fileName = `${bookingNumber}_${handoverType}_${photoTypeThai}_${timestamp}.jpg`;

    // แปลง base64 เป็น Blob
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      'image/jpeg',
      fileName
    );

    // อัปโหลดไฟล์เข้า Google Drive
    const folder = DriveApp.getFolderById(folderId);
    const file = folder.createFile(blob);

    // ตั้งค่าสิทธิ์การเข้าถึง
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileUrl = file.getUrl();

    return {
      success: true,
      fileUrl: fileUrl,
      fileId: file.getId(),
      fileName: fileName
    };

  } catch (e) {
    Logger.log("Error uploading handover photo: " + e.toString());
    return {
      success: false,
      message: e.toString()
    };
  }
}





function saveVehicleHandover(handoverRecord, sheetID) {
  const startTime = new Date();
  Logger.log("🚀 [" + startTime.toISOString() + "] เริ่มการบันทึก saveVehicleHandover พร้อมลายเซ็น");
  Logger.log("📋 handoverRecord keys: " + JSON.stringify(Object.keys(handoverRecord)));
  Logger.log("📊 sheetID: " + sheetID);

  // === เพิ่ม DEBUG สำหรับลายเซ็น ===
  Logger.log("🔍 [DEBUG] ข้อมูลลายเซ็นที่ได้รับ:");
  Logger.log("  - ประเภท: " + handoverRecord.ประเภท);
  Logger.log("  - termsAccepted: " + handoverRecord.termsAccepted);
  Logger.log("  - signatureData: " + (handoverRecord.signatureData ? "มีข้อมูล" : "ไม่มีข้อมูล"));
  Logger.log("  - existingSignature: " + (handoverRecord.existingSignature ? "มีข้อมูล" : "ไม่มีข้อมูล"));
  Logger.log("  - oldSignatureFileId: " + (handoverRecord.oldSignatureFileId ? "มีข้อมูล" : "ไม่มีข้อมูล"));

  try {
    // 1. ตรวจสอบข้อมูลอินพุต
    if (!handoverRecord || !sheetID) {
      return { success: false, message: "ข้อมูลไม่ครบถ้วน (handoverRecord หรือ sheetID)" };
    }

    const requiredFields = ['หมายเลขการจอง', 'รถ', 'ประเภท', 'เลขไมล์', 'username'];
    for (const field of requiredFields) {
      if (handoverRecord[field] === undefined) {
        return { success: false, message: "ข้อมูลไม่ครบถ้วน: ขาด " + field };
      }
    }

    Logger.log("✅ การตรวจสอบข้อมูลอินพุตเสร็จสิ้น");

    // 2. เตรียมการเชื่อมต่อ Google Sheet และดึง Config 
    const ss = SpreadsheetApp.openById(sheetID);
    const configSheet = ss.getSheetByName("ตั้งค่าระบบ");
    let contractFolderId = null;

    if (configSheet) {
      const configData = configSheet.getDataRange().getValues();
      for (let i = 0; i < configData.length; i++) {
        if (configData[i][0] === "IDโฟลเดอร์สัญญาเช่า") {
          contractFolderId = configData[i][1];
          break;
        }
      }
    }

    if (!contractFolderId) {
      return { success: false, message: "ไม่พบค่า 'IDโฟลเดอร์สัญญาเช่า' ในการตั้งค่าระบบ" };
    }

    Logger.log("✅ ตรวจสอบโฟลเดอร์ Google Drive สำเร็จ: " + contractFolderId);

    // 3. สร้างหรือหาโฟลเดอร์สำหรับการจองนี้
    const bookingFolder = createOrGetBookingFolder(handoverRecord.หมายเลขการจอง, contractFolderId);
    if (!bookingFolder) {
      return { success: false, message: "ไม่สามารถสร้างโฟลเดอร์สำหรับเก็บไฟล์ได้" };
    }

    Logger.log("✅ เตรียมโฟลเดอร์เก็บไฟล์สำเร็จ: " + bookingFolder.getId());

    // 4. ลบไฟล์เก่าหากมีการอัปโหลดใหม่
    if (handoverRecord.oldPhotoFileIds) {
      const photosToUpload = handoverRecord.photos || {};
      for (const [photoType, newPhotoData] of Object.entries(photosToUpload)) {
        if (newPhotoData && handoverRecord.oldPhotoFileIds[photoType]) {
          try {
            const oldFile = DriveApp.getFileById(handoverRecord.oldPhotoFileIds[photoType]);
            oldFile.setTrashed(true);
            Logger.log("🗑️ ลบไฟล์รูปเก่าสำเร็จ: " + photoType);
          } catch (e) {
            Logger.log("⚠️ ไม่สามารถลบไฟล์รูปเก่าได้: " + photoType + " - " + e.toString());
          }
        }
      }
    }

    // 5. อัปโหลดรูปภาพใหม่
    const photoUrls = {};
    const photoFileIds = {};

    if (handoverRecord.photos) {
      for (const [photoType, photoData] of Object.entries(handoverRecord.photos)) {
        if (photoData) {
          Logger.log("📸 กำลังอัปโหลดรูป: " + photoType);
          const photoBase64 = photoData.replace(/^data:image\/[a-z]+;base64,/, '');
          const uploadResult = uploadHandoverPhoto(
            photoBase64,
            photoType,
            handoverRecord.หมายเลขการจอง,
            handoverRecord.ประเภท,
            bookingFolder.getId()
          );

          if (uploadResult.success) {
            photoUrls[photoType] = uploadResult.fileUrl;
            photoFileIds[photoType] = uploadResult.fileId;
            Logger.log("✅ อัปโหลดรูป " + photoType + " สำเร็จ");
          } else {
            Logger.log("❌ อัปโหลดรูป " + photoType + " ไม่สำเร็จ: " + uploadResult.message);
          }
        }
      }
    }

    // 6. จัดการลายเซ็น (ปรับปรุงใหม่)
    let signatureUrl = '';
    let signatureFileId = '';

    Logger.log("🔍 [SIGNATURE] เริ่มการประมวลผลลายเซ็น...");
    Logger.log("  - ประเภท: " + handoverRecord.ประเภท);
    Logger.log("  - เข้าเงื่อนไข รับรถ: " + (handoverRecord.ประเภท === 'รับรถ'));

    // เปลี่ยนเงื่อนไข: ประมวลผลลายเซ็นทุกประเภท (ไม่เฉพาะรับรถ)
    // ลบไฟล์ลายเซ็นเดิมหากมีการเซ็นใหม่
    if (handoverRecord.signatureData && handoverRecord.oldSignatureFileId) {
      try {
        const oldSignatureFile = DriveApp.getFileById(handoverRecord.oldSignatureFileId);
        oldSignatureFile.setTrashed(true);
        Logger.log("🗑️ ลบไฟล์ลายเซ็นเก่าสำเร็จ");
      } catch (e) {
        Logger.log("⚠️ ไม่สามารถลบไฟล์ลายเซ็นเก่าได้: " + e.toString());
      }
    }

    // อัปโหลดลายเซ็นใหม่หากมี
    if (handoverRecord.signatureData) {
      Logger.log("✍️ กำลังอัปโหลดลายเซ็นใหม่");
      const signatureBase64 = handoverRecord.signatureData.replace(/^data:image\/[a-z]+;base64,/, '');
      const signatureResult = uploadSignature(
        signatureBase64,
        handoverRecord.หมายเลขการจอง,
        handoverRecord.ประเภท,
        bookingFolder.getId()
      );

      if (signatureResult.success) {
        signatureUrl = signatureResult.fileUrl;
        signatureFileId = signatureResult.fileId;
        Logger.log("✅ อัปโหลดลายเซ็นสำเร็จ: " + signatureUrl);
      } else {
        Logger.log("❌ อัปโหลดลายเซ็นไม่สำเร็จ: " + signatureResult.message);
      }
    } else if (handoverRecord.existingSignature) {
      // ใช้ลายเซ็นเดิม
      signatureUrl = handoverRecord.existingSignature;
      signatureFileId = handoverRecord.oldSignatureFileId || '';
      Logger.log("📋 ใช้ลายเซ็นเดิม: " + signatureUrl);
    } else {
      Logger.log("ℹ️ ไม่มีข้อมูลลายเซ็น");
    }

    Logger.log("✅ การอัปโหลดไฟล์เสร็จสิ้น");

    // 7. เตรียมข้อมูลสำหรับบันทึกลง Sheet
    let handoverSheet = ss.getSheetByName("บันทึกรับรถคืนรถ");
    if (!handoverSheet) {
      handoverSheet = ss.insertSheet("บันทึกรับรถคืนรถ");
      const headers = [
        "หมายเลขการจอง", "รหัสรถ", "รถ", "วันเวลารับรถ", "ตำแหน่งGPSรับรถ",
        "รูปลูกค้าคู่กับรถ", "รูปเรือนไมล์", "รูปรถด้านหน้า", "รูปรถด้านหลัง",
        "รูปรถด้านซ้าย", "รูปรถด้านขวา", "ลายเซ็นผู้เช่า", "ยืนยันเงื่อนไข",
        "เลขไมล์", "ประเภท", "วันเวลาบันทึก", "ผู้บันทึก"
      ];
      handoverSheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
    }

    const headers = handoverSheet.getRange(1, 1, 1, handoverSheet.getLastColumn()).getValues()[0];
    const newRow = headers.map(header => {
      switch (header) {
        case "หมายเลขการจอง":
          return handoverRecord.หมายเลขการจอง;
        case "รหัสรถ":
          const rentalData = getRentalByBookingNumber(handoverRecord.หมายเลขการจอง, sheetID);
          return (rentalData.data || {}).ทะเบียนรถ || '';
        case "รถ":
          return handoverRecord.รถ;
        case "วันเวลารับรถ":
          return new Date();
        case "ตำแหน่งGPSรับรถ":
          return handoverRecord.gpsLocation || "ไม่สามารถระบุตำแหน่ง";
        case "รูปลูกค้าคู่กับรถ":
          return photoUrls.customer || handoverRecord.existingPhotos?.customer || '';
        case "รูปเรือนไมล์":
          return photoUrls.speedometer || handoverRecord.existingPhotos?.speedometer || '';
        case "รูปรถด้านหน้า":
          return photoUrls.front || handoverRecord.existingPhotos?.front || '';
        case "รูปรถด้านหลัง":
          return photoUrls.back || handoverRecord.existingPhotos?.back || '';
        case "รูปรถด้านซ้าย":
          return photoUrls.left || handoverRecord.existingPhotos?.left || '';
        case "รูปรถด้านขวา":
          return photoUrls.right || handoverRecord.existingPhotos?.right || '';
        case "ลายเซ็นผู้เช่า":
          Logger.log("🔍 [SHEET] กำลังบันทึกลายเซ็น: " + signatureUrl);
          return signatureUrl;
        case "ยืนยันเงื่อนไข":
          const termsStatus = handoverRecord.termsAccepted ? 'ยืนยัน' : '';
          Logger.log("🔍 [SHEET] กำลังบันทึกยืนยันเงื่อนไข: " + termsStatus);
          return termsStatus;
        case "เลขไมล์":
          return handoverRecord.เลขไมล์;
        case "ประเภท":
          return handoverRecord.ประเภท;
        case "วันเวลาบันทึก":
          return new Date();
        case "ผู้บันทึก":
          return handoverRecord.username;
        default:
          return "";
      }
    });

    // === เพิ่ม DEBUG สำหรับ newRow ===
    Logger.log("🔍 [DEBUG] ข้อมูลที่จะบันทึกลง Sheet:");
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] === "ลายเซ็นผู้เช่า" || headers[i] === "ยืนยันเงื่อนไข") {
        Logger.log("  - " + headers[i] + ": " + newRow[i]);
      }
    }

    // 8. บันทึกข้อมูล (ค้นหาและอัปเดตถ้ามี หรือเพิ่มใหม่ถ้าไม่มี)
    const dataRange = handoverSheet.getDataRange();
    const values = dataRange.getValues();
    let recordUpdated = false;

    for (let i = 1; i < values.length; i++) {
      if (values[i][headers.indexOf("หมายเลขการจอง")] === handoverRecord.หมายเลขการจอง &&
        values[i][headers.indexOf("ประเภท")] === handoverRecord.ประเภท) {
        handoverSheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
        recordUpdated = true;
        Logger.log(`✅ อัปเดตข้อมูลแถวที่ ${i + 1} สำเร็จ`);
        break;
      }
    }

    if (!recordUpdated) {
      handoverSheet.appendRow(newRow);
      Logger.log("✅ เพิ่มข้อมูลใหม่สำเร็จ");
    }

    const endTime = new Date();
    const processingTime = endTime.getTime() - startTime.getTime();
    Logger.log("🎉 [" + endTime.toISOString() + "] บันทึกข้อมูลสำเร็จใน " + processingTime + " ms");

    return {
      success: true,
      message: "บันทึกข้อมูลการรับส่งรถสำเร็จ",
      photoUrls: photoUrls,
      signatureUrl: signatureUrl,
      processingTime: processingTime
    };

  } catch (e) {
    Logger.log("💥 เกิดข้อผิดพลาดร้ายแรงใน saveVehicleHandover:", e.stack);
    return {
      success: false,
      message: "เกิดข้อผิดพลาด: " + e.message
    };
  }
}




function getHandoverRecord(bookingNumber, handoverType, sheetID) {
  Logger.log("🔍 เริ่มค้นหาข้อมูลการรับส่งรถ: " + bookingNumber + " ประเภท: " + handoverType);
  Logger.log("📊 sheetID: " + sheetID);

  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName("บันทึกรับรถคืนรถ");

    if (!sheet) {
      Logger.log("ℹ️ ไม่พบแผ่นงาน 'บันทึกรับรถคืนรถ' - ยังไม่มีข้อมูล");
      return { success: true, data: null };
    }

    const data = sheet.getDataRange().getValues();
    Logger.log("📋 จำนวนแถวทั้งหมด: " + data.length);

    if (data.length <= 1) {
      Logger.log("ℹ️ แผ่นงานมีแค่หัวข้อ - ยังไม่มีข้อมูล");
      return { success: true, data: null };
    }

    const headers = data[0];
    Logger.log("📝 Headers ที่พบ: " + JSON.stringify(headers));

    const bookingNoIndex = headers.indexOf("หมายเลขการจอง");
    const typeIndex = headers.indexOf("ประเภท");

    Logger.log("📍 ตำแหน่งคอลัมน์:");
    Logger.log("  - หมายเลขการจอง: " + bookingNoIndex);
    Logger.log("  - ประเภท: " + typeIndex);

    if (bookingNoIndex === -1 || typeIndex === -1) {
      Logger.log("❌ ไม่พบคอลัมน์ที่จำเป็น");
      return {
        success: false,
        message: "ไม่พบหัวข้อคอลัมน์ที่จำเป็นในชีต 'บันทึกรับรถคืนรถ'"
      };
    }

    // แสดงข้อมูลทั้งหมดเพื่อ debug
    Logger.log("🔍 ข้อมูลทั้งหมดในชีต:");
    for (let i = 1; i < data.length; i++) {
      const rowBookingNo = data[i][bookingNoIndex];
      const rowType = data[i][typeIndex];
      Logger.log(`  แถว ${i + 1}: หมายเลขการจอง="${rowBookingNo}", ประเภท="${rowType}"`);
    }

    // ค้นหาจากแถวล่างสุดขึ้นมา เพื่อให้ได้ข้อมูลล่าสุด
    for (let i = data.length - 1; i > 0; i--) {
      const currentBookingNo = data[i][bookingNoIndex];
      const currentType = data[i][typeIndex];

      Logger.log(`🔍 ตรวจสอบแถว ${i + 1}: "${currentBookingNo}" vs "${bookingNumber}", "${currentType}" vs "${handoverType}"`);

      // เปรียบเทียบแบบ string เพื่อป้องกันปัญหา type
      if (String(currentBookingNo).trim() === String(bookingNumber).trim() &&
        String(currentType).trim() === String(handoverType).trim()) {

        Logger.log("✅ พบข้อมูลที่แถว " + (i + 1));

        // สร้าง object ข้อมูลที่พบ
        const recordData = {};
        for (let j = 0; j < headers.length; j++) {
          recordData[headers[j]] = data[i][j];
        }

        Logger.log("📋 ข้อมูลที่พบ:");
        Logger.log("  - เลขไมล์: " + recordData['เลขไมล์']);
        Logger.log("  - ผู้บันทึก: " + recordData['ผู้บันทึก']);
        Logger.log("  - ลายเซ็นผู้เช่า: " + (recordData['ลายเซ็นผู้เช่า'] ? "มี" : "ไม่มี"));
        Logger.log("  - ยืนยันเงื่อนไข: " + recordData['ยืนยันเงื่อนไข']);

        // สร้างข้อมูลใหม่ที่ clean (ไม่มี Date objects หรือ complex data)
        const cleanData = {};

        // คัดลอกข้อมูลทีละฟิลด์ และแปลงเป็น primitive types
        try {
          cleanData.หมายเลขการจอง = String(recordData['หมายเลขการจอง'] || '');
          cleanData.รถ = String(recordData['รถ'] || '');
          cleanData.ประเภท = String(recordData['ประเภท'] || '');
          cleanData.เลขไมล์ = String(recordData['เลขไมล์'] || '');
          cleanData.ผู้บันทึก = String(recordData['ผู้บันทึก'] || '');

          // รูปภาพ
          cleanData['รูปลูกค้าคู่กับรถ'] = String(recordData['รูปลูกค้าคู่กับรถ'] || '');
          cleanData['รูปเรือนไมล์'] = String(recordData['รูปเรือนไมล์'] || '');
          cleanData['รูปรถด้านหน้า'] = String(recordData['รูปรถด้านหน้า'] || '');
          cleanData['รูปรถด้านหลัง'] = String(recordData['รูปรถด้านหลัง'] || '');
          cleanData['รูปรถด้านซ้าย'] = String(recordData['รูปรถด้านซ้าย'] || '');
          cleanData['รูปรถด้านขวา'] = String(recordData['รูปรถด้านขวา'] || '');

          // ลายเซ็น
          cleanData['ลายเซ็นผู้เช่า'] = String(recordData['ลายเซ็นผู้เช่า'] || '');
          cleanData['ยืนยันเงื่อนไข'] = (recordData['ยืนยันเงื่อนไข'] === 'ยืนยัน');

          // File IDs สำหรับลบไฟล์เก่า
          cleanData.photoIds = {
            customer: '',
            speedometer: '',
            front: '',
            back: '',
            left: '',
            right: ''
          };

          // ดึง signature file ID จาก URL
          const signatureUrl = String(recordData['ลายเซ็นผู้เช่า'] || '');
          if (signatureUrl.includes('drive.google.com')) {
            const match = signatureUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
            cleanData.signatureFileId = match ? match[1] : '';
            Logger.log("  - signature file ID: " + cleanData.signatureFileId);
          } else {
            cleanData.signatureFileId = '';
          }

          // ดึง photo file IDs จาก URLs
          const photoTypes = ['customer', 'speedometer', 'front', 'back', 'left', 'right'];
          const photoColumns = ['รูปลูกค้าคู่กับรถ', 'รูปเรือนไมล์', 'รูปรถด้านหน้า', 'รูปรถด้านหลัง', 'รูปรถด้านซ้าย', 'รูปรถด้านขวา'];

          for (let k = 0; k < photoTypes.length; k++) {
            const photoUrl = String(recordData[photoColumns[k]] || '');
            if (photoUrl.includes('drive.google.com')) {
              const match = photoUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
              if (match) {
                cleanData.photoIds[photoTypes[k]] = match[1];
              }
            }
          }

        } catch (e) {
          Logger.log("❌ เกิดข้อผิดพลาดในการสร้าง cleanData: " + e.toString());
          return { success: false, message: "ไม่สามารถประมวลผลข้อมูลได้" };
        }

        Logger.log("🧹 สร้าง cleanData สำเร็จ");
        Logger.log("📋 cleanData keys: " + Object.keys(cleanData).join(', '));

        // สร้าง response object
        const response = {
          success: true,
          data: cleanData
        };

        // ทดสอบ JSON serialization ก่อน return
        try {
          const testJson = JSON.stringify(response);
          Logger.log("✅ JSON serialization สำเร็จ (ขนาด: " + testJson.length + " characters)");
        } catch (e) {
          Logger.log("❌ JSON serialization ล้มเหลว: " + e.toString());
          return { success: false, message: "ข้อมูลไม่สามารถแปลงเป็น JSON ได้" };
        }

        Logger.log("🚀 Return response object");
        return response;
      }
    }

    Logger.log("❌ ไม่พบข้อมูลการรับส่งรถสำหรับ: " + bookingNumber + " ประเภท: " + handoverType);
    return { success: true, data: null };

  } catch (e) {
    Logger.log("💥 เกิดข้อผิดพลาดใน getHandoverRecord: " + e.toString());
    Logger.log("💥 Stack trace: " + e.stack);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการค้นหาข้อมูล: " + e.toString()
    };
  }
}







/**
 * อัปโหลดลายเซ็นไป Google Drive
 * @param {string} base64Data ข้อมูล base64 ของลายเซ็น
 * @param {string} bookingNumber หมายเลขการจอง
 * @param {string} handoverType ประเภทการรับส่งรถ
 * @param {string} folderId ID ของโฟลเดอร์ใน Google Drive
 * @returns {Object} ผลลัพธ์การอัปโหลด
 */
function uploadSignature(base64Data, bookingNumber, handoverType, folderId) {
  try {
    const timestamp = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyyMMdd_HHmmss");
    const fileName = `${bookingNumber}_${handoverType}_ลายเซ็น_${timestamp}.png`;

    Logger.log("✍️ กำลังอัปโหลดลายเซ็น: " + fileName);

    // แปลง base64 เป็น Blob
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      'image/png',
      fileName
    );

    // อัปโหลดไฟล์เข้า Google Drive
    const folder = DriveApp.getFolderById(folderId);
    const file = folder.createFile(blob);

    // ตั้งค่าสิทธิ์การเข้าถึง
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileUrl = file.getUrl();
    const fileId = file.getId();

    Logger.log("✅ อัปโหลดลายเซ็นสำเร็จ: " + fileUrl);

    return {
      success: true,
      fileUrl: fileUrl,
      fileId: fileId,
      fileName: fileName
    };

  } catch (e) {
    Logger.log("❌ เกิดข้อผิดพลาดในการอัปโหลดลายเซ็น: " + e.toString());
    return {
      success: false,
      message: "ไม่สามารถอัปโหลดลายเซ็นได้: " + e.toString()
    };
  }
}



/**
 * ดึงลิงก์สัญญาเช่าจากหมายเลขการจอง
 * @param {string} bookingNumber หมายเลขการจอง
 * @param {string} sheetID รหัสชีท
 * @returns {object} ผลลัพธ์ที่มี contractUrl
 */
function getRentalContractUrl(bookingNumber, sheetID) {
  try {
    // ดึงข้อมูลการจองจากฐานข้อมูล
    const rentalData = getRentalByBookingNumber(bookingNumber, sheetID);

    if (!rentalData.success) {
      return {
        success: false,
        message: "ไม่พบข้อมูลการจอง"
      };
    }

    // ตรวจสอบว่ามีลิงก์สัญญาเช่าหรือไม่
    const contractUrl = rentalData.data.ลิงก์สัญญาเช่า || rentalData.data['ลิงก์สัญญาเช่า'];

    if (contractUrl && contractUrl.trim() !== '') {
      return {
        success: true,
        contractUrl: contractUrl,
        message: "พบไฟล์สัญญาเช่า"
      };
    } else {
      return {
        success: false,
        message: "ไม่พบลิงก์สัญญาเช่าในฐานข้อมูล"
      };
    }

  } catch (error) {
    Logger.log("Error in getRentalContractUrl: " + error.toString());
    return {
      success: false,
      message: "เกิดข้อผิดพลาด: " + error.toString()
    };
  }
}








// ฟังก์ชันใหม่สำหรับตรวจสอบระบบ
function checkHandoverSystem(sheetID) {
  Logger.log("🔍 เริ่มการตรวจสอบระบบ...");

  const checks = {
    sheetConnection: false,
    configSheet: false,
    rentalSheet: false,
    handoverSheet: false,
    driveFolder: false,
    systemConfig: {}
  };

  try {
    // ตรวจสอบการเชื่อมต่อ Sheet
    const ss = SpreadsheetApp.openById(sheetID);
    checks.sheetConnection = true;
    Logger.log("✅ เชื่อมต่อ Google Sheet สำเร็จ");

    // ตรวจสอบแผ่นงานต่างๆ
    const configSheet = ss.getSheetByName("ตั้งค่าระบบ");
    checks.configSheet = !!configSheet;
    Logger.log(checks.configSheet ? "✅ พบแผ่นงาน 'ตั้งค่าระบบ'" : "❌ ไม่พบแผ่นงาน 'ตั้งค่าระบบ'");

    const rentalSheet = ss.getSheetByName("รายการเช่า");
    checks.rentalSheet = !!rentalSheet;
    Logger.log(checks.rentalSheet ? "✅ พบแผ่นงาน 'รายการเช่า'" : "❌ ไม่พบแผ่นงาน 'รายการเช่า'");

    const handoverSheet = ss.getSheetByName("บันทึกรับรถคืนรถ");
    checks.handoverSheet = !!handoverSheet;
    Logger.log(checks.handoverSheet ? "✅ พบแผ่นงาน 'บันทึกรับรถคืนรถ'" : "⚠️ ไม่พบแผ่นงาน 'บันทึกรับรถคืนรถ' (จะสร้างอัตโนมัติ)");

    // ตรวจสอบการตั้งค่าระบบ
    if (configSheet) {
      const configData = configSheet.getDataRange().getValues();
      for (let i = 0; i < configData.length; i++) {
        const key = configData[i][0];
        const value = configData[i][1];
        if (key) {
          checks.systemConfig[key] = value;
        }
      }

      const folderId = checks.systemConfig["IDโฟลเดอร์สัญญาเช่า"];
      if (folderId) {
        try {
          const folder = DriveApp.getFolderById(folderId);
          checks.driveFolder = true;
          Logger.log("✅ พบโฟลเดอร์ Drive: " + folder.getName());
        } catch (e) {
          Logger.log("❌ ไม่สามารถเข้าถึงโฟลเดอร์ Drive ได้: " + e.toString());
        }
      }
    }

    Logger.log("📋 สรุปการตรวจสอบระบบ:");
    Logger.log(JSON.stringify(checks, null, 2));

    return { success: true, checks: checks };

  } catch (e) {
    Logger.log("💥 เกิดข้อผิดพลาดในการตรวจสอบระบบ: " + e.toString());
    return { success: false, message: e.toString(), checks: checks };
  }
}

// ฟังก์ชันทดสอบระบบ
function testHandoverSystem() {
  const sheetID = "1qLubMynT8kMnb4gBt9xBayD-BHrfHN08jRZNDqwPiAA";

  const testData = {
    หมายเลขการจอง: "TEST001",
    รถ: "Toyota Camry (กข-1234)",
    ประเภท: "รับรถ",
    เลขไมล์: "15000",
    photos: {
      customer: "dummy_base64_data...",
      speedometer: "dummy_base64_data...",
      front: "dummy_base64_data...",
      back: "dummy_base64_data...",
      left: "dummy_base64_data...",
      right: "dummy_base64_data..."
    }
  };

  const result = saveVehicleHandover(testData, sheetID);
  Logger.log("🎯 ผลการทดสอบ: " + JSON.stringify(result, null, 2));

  return result;
}






/**
 * ฟังก์ชันช่วยดึง File ID จาก Google Drive URL
 */
function extractFileIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]{25,})/);
  return match ? match[1] : null;
}



/**
 * ดึงข้อมูลตารางรับส่งรถทั้งหมดที่เกี่ยวข้องกับหมายเลขการจองเดียว
 * @param {string} bookingNumber - หมายเลขการจองที่ต้องการค้นหา
 * @param {string} sheetID - ID ของ Google Sheet
 * @returns {object} ผลลัพธ์พร้อมข้อมูลการรับและคืนรถ
 */
function getScheduleByBookingNumber(bookingNumber, sheetID) {
  try {
    if (!bookingNumber) {
      return { success: false, message: 'กรุณาระบุหมายเลขการจอง' };
    }

    const ss = SpreadsheetApp.openById(sheetID);
    const scheduleSheet = ss.getSheetByName(SCHEDULE_SHEET);
    const rentalSheet = ss.getSheetByName(RENTAL_SHEET);

    if (!scheduleSheet || !rentalSheet) {
      return { success: false, message: 'ไม่พบชีต SCHEDULE_SHEET หรือ RENTAL_SHEET' };
    }

    // สร้าง Map ข้อมูลลูกค้าเพื่อนำไปใช้ (เหมือนเดิม)
    const rentalValues = rentalSheet.getDataRange().getValues();
    const rentalHeaders = rentalValues[0];
    const rentalBookingNoIndex = rentalHeaders.indexOf("หมายเลขการจอง");
    const rentalPhoneIndex = rentalHeaders.indexOf("เบอร์โทรศัพท์");
    const rentalPickupLocationIndex = rentalHeaders.indexOf("สถานที่รับรถ");
    const rentalReturnLocationIndex = rentalHeaders.indexOf("สถานที่คืนรถ");
    const rentalDetailsMap = new Map();
    for (let i = 1; i < rentalValues.length; i++) {
      const row = rentalValues[i];
      const bn = row[rentalBookingNoIndex];
      if (bn) {
        rentalDetailsMap.set(bn, {
          เบอร์โทรศัพท์: row[rentalPhoneIndex] || "",
          สถานที่รับรถ: row[rentalPickupLocationIndex] || "",
          สถานที่คืนรถ: row[rentalReturnLocationIndex] || ""
        });
      }
    }

    // ค้นหาในชีต "ตารางรับส่งรถ"
    const scheduleValues = scheduleSheet.getDataRange().getValues();
    const scheduleHeaders = scheduleValues[0];
    const scheduleBookingNoIndex = scheduleHeaders.indexOf("หมายเลขการจอง");

    const pickups = [];
    const returns = [];

    for (let i = 1; i < scheduleValues.length; i++) {
      const scheduleRow = scheduleValues[i];

      // ตรวจสอบว่าหมายเลขการจองตรงกันหรือไม่
      if (scheduleRow[scheduleBookingNoIndex] === bookingNumber) {
        const schedule = {};
        scheduleHeaders.forEach((header, j) => {
          if (header === 'เวลา') {
            schedule[header] = formatToHHMM_(scheduleRow[j]);
          } else if (scheduleRow[j] instanceof Date) {
            schedule[header] = scheduleRow[j].toISOString();
          } else {
            schedule[header] = scheduleRow[j];
          }
        });

        const matchingRentalDetails = rentalDetailsMap.get(bookingNumber);
        if (matchingRentalDetails) {
          schedule.เบอร์โทรศัพท์ = matchingRentalDetails.เบอร์โทรศัพท์;
          schedule.สถานที่รับรถ = matchingRentalDetails.สถานที่รับรถ;
          schedule.สถานที่คืนรถ = matchingRentalDetails.สถานที่คืนรถ;
        }

        schedule.id = `schedule_${i}`;

        if (schedule['ประเภท'] === 'รับรถ') {
          pickups.push(schedule);
        } else if (schedule['ประเภท'] === 'ส่งคืนรถ') {
          returns.push(schedule);
        }
      }
    }

    // ตรวจสอบว่าพบข้อมูลหรือไม่
    if (pickups.length === 0 && returns.length === 0) {
      return { success: false, message: 'ไม่พบข้อมูลการจองนี้ในตารางรับส่งรถ' };
    }

    return {
      success: true,
      data: {
        pickups: pickups,
        returns: returns
      }
    };
  } catch (e) {
    Logger.log(`Error in getScheduleByBookingNumber: ${e.message} \n ${e.stack}`);
    return { success: false, message: e.message };
  }
}



/**
 * ฟังก์ชันดึงรายการจองที่รอหารถ - เวอร์ชันข้อมูลจำเป็นเท่านั้น
 * @param {string} sheetID - ID ของ Google Sheet
 * @returns {Object} - ผลลัพธ์และรายการจองที่รอหารถ (ข้อมูลสำคัญเท่านั้น)
 */
/**
 * ฟังก์ชันดึงรายการจองที่รอหารถ - แก้ไขปัญหา timezone
 */
function getPendingVehicleBookings(sheetID) {
  try {
    Logger.log("===== STARTING getPendingVehicleBookings() =====");

    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(RENTAL_SHEET);

    if (!sheet) {
      throw new Error("ไม่พบแผ่นงานรายการเช่า");
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    Logger.log("Today for comparison:", today.toDateString());

    const pendingBookings = [];

    // วนลูปตรวจสอบแต่ละแถว
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowData = {};

      // สร้าง object จาก headers
      headers.forEach((header, index) => {
        rowData[header] = row[index];
      });

      // ตรวจสอบเงื่อนไข: สถานะ = "รอหารถ" และวันรับรถ >= วันปัจจุบัน
      if (rowData['สถานะ'] === 'รอหารถ') {
        const pickupDate = new Date(rowData['วันที่เช่า']);
        pickupDate.setHours(0, 0, 0, 0);

        if (pickupDate >= today) {
          // คำนวณจำนวนวันสำหรับใช้ฝั่ง client
          const diffTime = pickupDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          Logger.log(`Processing booking ${rowData['หมายเลขการจอง']}: 
            Pickup: ${pickupDate.toDateString()}, 
            Days until: ${diffDays}`);

          // ส่งข้อมูลโดยใช้ local date format และเพิ่ม diffDays
          const essentialData = {
            rowIndex: i + 1,
            หมายเลขการจอง: rowData['หมายเลขการจอง'] || '',
            ชื่อลูกค้า: rowData['ชื่อลูกค้า'] || '',
            เบอร์โทรศัพท์: rowData['เบอร์โทรศัพท์'] || '',
            รถ: rowData['รถ'] || '',
            ทะเบียนรถ: rowData['ทะเบียนรถ'] || '',

            // ใช้วิธีที่ปลอดภัยกว่าในการส่งวันที่
            วันที่เช่า: rowData['วันที่เช่า'] ? pickupDate.toLocaleDateString('th-TH') : '',
            วันที่คืน: rowData['วันที่คืน'] ?
              new Date(rowData['วันที่คืน']).toLocaleDateString('th-TH') : '',

            // เพิ่มข้อมูลวันที่ในรูปแบบ ISO สำหรับการคำนวณ
            วันที่เช่าISO: rowData['วันที่เช่า'] ? pickupDate.toISOString() : '',
            วันที่คืนISO: rowData['วันที่คืน'] ? new Date(rowData['วันที่คืน']).toISOString() : '',

            // เพิ่มจำนวนวันที่คำนวณแล้ว
            จำนวนวันที่เหลือ: diffDays,

            เวลารับรถ: rowData['เวลารับรถ'] instanceof Date ?
              rowData['เวลารับรถ'].toTimeString().slice(0, 5) :
              (rowData['เวลารับรถ'] || ''),
            เวลาคืนรถ: rowData['เวลาคืนรถ'] instanceof Date ?
              rowData['เวลาคืนรถ'].toTimeString().slice(0, 5) :
              (rowData['เวลาคืนรถ'] || ''),
            สถานที่รับรถ: rowData['สถานที่รับรถ'] || '',
            สถานที่คืนรถ: rowData['สถานที่คืนรถ'] || '',
            ราคา: rowData['ราคา'] || 0,
            ค่าเช่ารวมทั้งหมด: rowData['ค่าเช่ารวมทั้งหมด'] || 0,
            รวมยอดชำระวันรับรถ: rowData['รวมยอดชำระวันรับรถ'] || 0,
            สถานะ: rowData['สถานะ'] || '',
            หมายเหตุ: rowData['หมายเหตุ'] || '',
            ช่องทางการจอง: rowData['ช่องทางการจอง'] || '',
            ลิงก์สัญญาเช่า: rowData['ลิงก์สัญญาเช่า'] || '',

            // เพิ่มสถานะความเร่งด่วน
            สถานะความเร่งด่วน: diffDays === 0 ? 'วันนี้' :
              diffDays === 1 ? 'พรุ่งนี้' :
                diffDays <= 2 ? 'เร่งด่วน' : 'ปกติ'
          };

          pendingBookings.push(essentialData);
        }
      }
    }

    // เรียงตามวันที่เช่า (วันที่ใกล้ที่สุดก่อน)
    pendingBookings.sort((a, b) => {
      return a.จำนวนวันที่เหลือ - b.จำนวนวันที่เหลือ;
    });

    Logger.log(`Found ${pendingBookings.length} pending vehicle bookings`);
    Logger.log("===== ENDING getPendingVehicleBookings() =====");

    return {
      success: true,
      count: pendingBookings.length,
      bookings: pendingBookings
    };

  } catch (error) {
    Logger.log(`Error in getPendingVehicleBookings: ${error.toString()}`);
    return {
      success: false,
      message: error.toString(),
      count: 0,
      bookings: []
    };
  }
}



function getPendingVehicleStats(sheetID) {
  try {
    console.log("===== STARTING getPendingVehicleStats() =====");

    const result = getPendingVehicleBookings(sheetID);

    if (!result.success) {
      return {
        success: false,
        message: result.message,
        stats: { total: 0, todayPickup: 0, tomorrowPickup: 0, urgent: 0, upcoming: 0 }
      };
    }

    console.log("📊 Processing bookings from getPendingVehicleBookings...");

    // คำนวณสถิติจากข้อมูลที่ได้รับ (ใช้ข้อมูลที่คำนวณมาแล้ว)
    const stats = {
      total: result.count,
      todayPickup: 0,
      tomorrowPickup: 0,
      urgent: 0, // รับรถภายใน 2 วัน
      upcoming: 0 // รับรถมากกว่า 2 วัน
    };

    result.bookings.forEach((booking, index) => {
      console.log(`📋 Booking ${index + 1}: ${booking.หมายเลขการจอง}, Status: ${booking.สถานะความเร่งด่วน}, Days left: ${booking.จำนวนวันที่เหลือ}`);

      // ใช้ข้อมูลที่คำนวณมาแล้วแทนการคำนวณใหม่
      const daysLeft = booking.จำนวนวันที่เหลือ;

      if (daysLeft === 0) {
        stats.todayPickup++;
        console.log("   ✅ Today pickup");
      } else if (daysLeft === 1) {
        stats.tomorrowPickup++;
        console.log("   ✅ Tomorrow pickup");
      }

      if (daysLeft <= 2) {
        stats.urgent++;
        console.log("   🚨 Urgent");
      } else {
        stats.upcoming++;
        console.log("   📅 Upcoming");
      }
    });

    console.log("📊 Final stats:", JSON.stringify(stats));
    console.log("===== ENDING getPendingVehicleStats() =====");

    return {
      success: true,
      stats: stats
    };

  } catch (error) {
    console.log("💥 Error in getPendingVehicleStats:", error.toString());

    const errorResult = {
      success: false,
      message: error.toString(),
      stats: { total: 0, todayPickup: 0, tomorrowPickup: 0, urgent: 0, upcoming: 0 }
    };

    return errorResult;
  }
}


//////////////////ฟังก์ชั่นจัดการรถรอจัดคิว

/**
 * =======================================
 * Google Apps Script - ระบบระบุรถครบชุด
 * สำหรับระบบจัดการร้านเช่ารถ
 * =======================================
 */

// ===================================
// 1. ฟังก์ชันหลักของระบบ
// ===================================

/**
 * ฟังก์ชันหลักสำหรับการระบุรถและสร้างสัญญาเช่าใหม่
 * @param {Object} completeData - ข้อมูลการจองที่มีข้อมูลรถใหม่
 * @param {string} language - ภาษาสัญญา ('th' หรือ 'en') จากการเลือกของผู้ใช้
 * @param {string} sheetID - รหัสชีท
 * @returns {Object} ผลลัพธ์การดำเนินการ
 */
function assignVehicleAndCreateContract(completeData, language, sheetID) {
  console.log("🚀 [assignVehicleAndCreateContract] เริ่มต้นกระบวนการระบุรถ");
  console.log("📝 [assignVehicleAndCreateContract] ข้อมูล:", JSON.stringify(completeData, null, 2));
  console.log("🌐 [assignVehicleAndCreateContract] ภาษาที่เลือก:", language);

  try {
    // 1. ตรวจสอบข้อมูลที่จำเป็น
    if (!completeData || !completeData.หมายเลขการจอง) {
      throw new Error("ไม่พบข้อมูลการจองหรือหมายเลขการจอง");
    }

    if (!completeData.รถ || !completeData.ทะเบียนรถ || !completeData.รายได้สุทธิ) {
      throw new Error("ข้อมูลรถไม่ครบถ้วน");
    }

    // ✅ ตรวจสอบและกำหนดค่าภาษาเริ่มต้น
    const contractLanguage = language || 'th'; // ใช้ภาษาที่ผู้ใช้เลือก หรือ 'th' เป็นค่าเริ่มต้น
    console.log("🌐 [assignVehicleAndCreateContract] ภาษาสัญญาที่จะใช้:", contractLanguage);

    console.log("✅ [assignVehicleAndCreateContract] ตรวจสอบข้อมูลเสร็จสิ้น");

    // 2. อัพเดตข้อมูลการจองในชีท
    console.log("📋 [assignVehicleAndCreateContract] กำลังอัพเดตข้อมูลการจอง...");
    const updateResult = updateRentalRecord(completeData, sheetID);
    if (!updateResult.success) {
      throw new Error("ไม่สามารถอัพเดตข้อมูลการจองได้: " + updateResult.message);
    }
    console.log("✅ [assignVehicleAndCreateContract] อัพเดตข้อมูลการจองเสร็จสิ้น");

    // 3. ลบสัญญาเดิม (ถ้ามี)
    if (completeData.ลิงก์สัญญาเช่า) {
      console.log("🗑️ [assignVehicleAndCreateContract] กำลังลบสัญญาเดิม...");
      const deleteResult = deleteRentalContract(completeData.หมายเลขการจอง, sheetID);
      if (deleteResult.success) {
        console.log("✅ [assignVehicleAndCreateContract] ลบสัญญาเดิมเสร็จสิ้น");
      } else {
        console.log("⚠️ [assignVehicleAndCreateContract] ไม่สามารถลบสัญญาเดิมได้:", deleteResult.message);
      }
    }

    // 4. สร้างสัญญาเช่าใหม่ (ใช้ภาษาที่ผู้ใช้เลือก)
    console.log(`📄 [assignVehicleAndCreateContract] กำลังสร้างสัญญาเช่าใหม่ (ภาษา: ${contractLanguage})...`);
    // ✅ แก้ไขโดยส่ง completeData.หมายเลขการจอง ซึ่งเป็น String เข้าไปโดยตรง
    const contractResult = generateRentalContract(completeData.หมายเลขการจอง, contractLanguage, sheetID);
    if (!contractResult.success) {
      throw new Error("ไม่สามารถสร้างสัญญาเช่าได้: " + contractResult.message);
    }
    console.log("✅ [assignVehicleAndCreateContract] สร้างสัญญาเช่าเสร็จสิ้น");

    // 5. อัพเดตลิงก์สัญญาเช่าในชีท
    if (contractResult.fileUrl) {
      console.log("🔗 [assignVehicleAndCreateContract] กำลังอัพเดตลิงก์สัญญา...");
      const updatedDataWithContract = { ...completeData, ลิงก์สัญญาเช่า: contractResult.fileUrl };
      updateRentalRecord(updatedDataWithContract, sheetID);
      console.log("✅ [assignVehicleAndCreateContract] อัพเดตลิงก์สัญญาเสร็จสิ้น");
    }

    // 6. อัพเดตปฏิทิน
    console.log("📅 [assignVehicleAndCreateContract] กำลังอัพเดตปฏิทิน...");
    const calendarResult = updateCalendarEventForAssignedVehicle(completeData, sheetID);
    if (!calendarResult.success) {
      console.log("⚠️ [assignVehicleAndCreateContract] ไม่สามารถอัพเดตปฏิทินได้:", calendarResult.message);
    } else {
      console.log("✅ [assignVehicleAndCreateContract] อัพเดตปฏิทินเสร็จสิ้น");
    }

    // 7. อัพเดตชีต "รายรับรายจ่าย"
    console.log("💰 [assignVehicleAndCreateContract] กำลังอัพเดตรายรับรายจ่าย...");
    const incomeResult = updateIncomeExpenseSheet(completeData, sheetID);
    if (!incomeResult.success) {
      console.log("⚠️ [assignVehicleAndCreateContract] ไม่สามารถอัพเดตรายรับรายจ่ายได้:", incomeResult.message);
    } else {
      console.log("✅ [assignVehicleAndCreateContract] อัพเดตรายรับรายจ่ายเสร็จสิ้น");
    }

    // 8. อัพเดตชีต "ตารางรับส่งรถ"
    console.log("📅 [assignVehicleAndCreateContract] กำลังอัพเดตตารางรับส่งรถ...");
    const scheduleResult = updateDeliveryScheduleSheetImproved(completeData, sheetID);
    if (!scheduleResult.success) {
      console.log("⚠️ [assignVehicleAndCreateContract] ไม่สามารถอัพเดตตารางรับส่งรถได้:", scheduleResult.message);
    } else {
      console.log("✅ [assignVehicleAndCreateContract] อัพเดตตารางรับส่งรถเสร็จสิ้น");
    }

    // 9. อัพเดตสถิติรายการรอหารถ
    console.log("🧹 [assignVehicleAndCreateContract] กำลังล้างแคชข้อมูลสรุป...");
    clearSummaryCacheForTenant(sheetID);

    console.log("🎉 [assignVehicleAndCreateContract] กระบวนการระบุรถสำเร็จทั้งหมด!");

    return {
      success: true,
      message: "ระบุรถและสร้างสัญญาเช่าเสร็จสิ้น",
      contractUrl: contractResult.fileUrl || null,
      bookingNumber: completeData.หมายเลขการจอง,
      contractLanguage: contractLanguage // ✅ ส่งภาษาที่ใช้กลับไปด้วย
    };

  } catch (error) {
    console.error("❌ [assignVehicleAndCreateContract] Error:", error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * ฟังก์ชันตรวจสอบว่าการจองนี้เป็นรายการรอหารถหรือไม่
 * @param {Object} bookingData - ข้อมูลการจอง
 * @returns {boolean} true ถ้าเป็นรายการรอหารถ
 */
function isPendingVehicleBooking(bookingData) {
  // ตรวจสอบแค่สถานะ "รอหารถ" เท่านั้น
  return bookingData.สถานะ === 'รอหารถ';
}

// ===================================
// 2. ฟังก์ชันจัดการชีท "รายการเช่า"
// ===================================

/**
 * อัพเดตข้อมูลการจองในชีท
 * @param {Object} updatedData - ข้อมูลที่จะอัพเดต
 * @param {string} sheetID - รหัสชีท
 * @returns {Object} ผลลัพธ์การอัพเดต
 */
function updateRentalRecord(updatedData, sheetID) {
  console.log("📝 [updateRentalRecord] เริ่มต้นการอัพเดตข้อมูล");

  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName("รายการเช่า");

    if (!sheet) {
      throw new Error("ไม่พบแผ่นงาน 'รายการเช่า'");
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // หาแถวที่ตรงกับหมายเลขการจอง
    const bookingNumberIndex = headers.indexOf("หมายเลขการจอง");
    if (bookingNumberIndex === -1) {
      throw new Error("ไม่พบคอลัมน์ 'หมายเลขการจอง'");
    }

    let targetRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][bookingNumberIndex] === updatedData.หมายเลขการจอง) {
        targetRowIndex = i;
        break;
      }
    }

    if (targetRowIndex === -1) {
      throw new Error(`ไม่พบการจองหมายเลข: ${updatedData.หมายเลขการจอง}`);
    }

    // อัพเดตข้อมูลในแต่ละคอลัมน์
    const fieldsToUpdate = [
      'รถ', 'ทะเบียนรถ', 'รายได้สุทธิ', 'วิธีการส่งรถ', 'วิธีการรับคืน',
      'หมายเหตุเพิ่มเติม', 'สถานะ', 'วันที่ระบุรถ', 'ลิงก์สัญญาเช่า'
    ];

    fieldsToUpdate.forEach(field => {
      const columnIndex = headers.indexOf(field);
      if (columnIndex !== -1 && updatedData[field] !== undefined) {
        sheet.getRange(targetRowIndex + 1, columnIndex + 1).setValue(updatedData[field]);
        console.log(`📝 [updateRentalRecord] อัพเดต ${field}: ${updatedData[field]}`);
      }
    });

    console.log("✅ [updateRentalRecord] อัพเดตข้อมูลเสร็จสิ้น");
    return { success: true, message: "อัพเดตข้อมูลสำเร็จ" };

  } catch (error) {
    console.error("❌ [updateRentalRecord] Error:", error.toString());
    return { success: false, message: error.toString() };
  }
}

// ===================================
// 3. ฟังก์ชันจัดการชีท "รายรับรายจ่าย"
// ===================================

/**
 * อัพเดตชีต "รายรับรายจ่าย" สำหรับการระบุรถ (เวอร์ชันใหม่)
 * - ลบข้อมูลเดิมที่มีหมายเลขการจองตรงกัน
 * - เพิ่มข้อมูลใหม่ตามรูปแบบที่กำหนด
 * @param {Object} rentalData - ข้อมูลการจอง
 * @param {string} sheetID - รหัสชีท
 * @returns {Object} ผลลัพธ์การอัพเดต
 */
function updateIncomeExpenseSheet(rentalData, sheetID) {
  console.log("💰 [updateIncomeExpenseSheet] เริ่มต้นการอัพเดตรายรับรายจ่าย (วิธีใหม่)");
  console.log("📝 [updateIncomeExpenseSheet] หมายเลขการจอง:", rentalData.หมายเลขการจอง);

  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName("รายรับรายจ่าย");

    if (!sheet) {
      console.log("⚠️ [updateIncomeExpenseSheet] ไม่พบแผ่นงาน 'รายรับรายจ่าย'");
      return { success: false, message: "ไม่พบแผ่นงาน 'รายรับรายจ่าย'" };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // หาคอลัมน์หมายเลขการจอง
    const bookingNumberIndex = headers.indexOf("หมายเลขการจอง");

    if (bookingNumberIndex === -1) {
      throw new Error("ไม่พบคอลัมน์ 'หมายเลขการจอง' ในชีตรายรับรายจ่าย");
    }

    console.log("🔍 [updateIncomeExpenseSheet] กำลังค้นหาและลบข้อมูลเดิม...");

    // 1. ค้นหาและลบแถวเดิมที่มีหมายเลขการจองตรงกัน
    const rowsToDelete = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][bookingNumberIndex] === rentalData.หมายเลขการจอง) {
        rowsToDelete.push(i + 1); // เก็บหมายเลขแถว (1-indexed)
        console.log(`🗑️ [updateIncomeExpenseSheet] พบแถวที่ต้องลบ: ${i + 1}`);
      }
    }

    // ลบแถวจากล่างไปบน (เพื่อไม่ให้ index เปลี่ยน)
    for (let i = rowsToDelete.length - 1; i >= 0; i--) {
      sheet.deleteRow(rowsToDelete[i]);
      console.log(`✅ [updateIncomeExpenseSheet] ลบแถว ${rowsToDelete[i]} แล้ว`);
    }

    console.log(`🗑️ [updateIncomeExpenseSheet] ลบข้อมูลเดิม ${rowsToDelete.length} แถวเสร็จสิ้น`);

    // 2. เตรียมข้อมูลใหม่ตามรูปแบบที่กำหนด
    console.log("📝 [updateIncomeExpenseSheet] กำลังเพิ่มข้อมูลใหม่...");

    const newRowData = createIncomeExpenseRowData(headers, rentalData);

    // 3. เพิ่มแถวใหม่ในชีตรายรับรายจ่าย
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, 1, newRowData.length).setValues([newRowData]);

    console.log("✅ [updateIncomeExpenseSheet] เพิ่มข้อมูลใหม่เสร็จสิ้น");
    console.log("🎉 [updateIncomeExpenseSheet] อัพเดตรายรับรายจ่ายเสร็จสิ้น");

    return { success: true, message: "อัพเดตรายรับรายจ่ายสำเร็จ" };

  } catch (error) {
    console.error("❌ [updateIncomeExpenseSheet] Error:", error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * สร้างข้อมูลแถวสำหรับชีตรายรับรายจ่าย
 * @param {Array} headers - หัวตาราง
 * @param {Object} rentalData - ข้อมูลการจอง
 * @returns {Array} ข้อมูลแถว
 */
function createIncomeExpenseRowData(headers, rentalData) {
  const rowData = [];

  // ✅ ใช้ ISO format ที่ส่งมาจาก Frontend
  const entryDate = rentalData.วันที่เช่าISO ?
    new Date(rentalData.วันที่เช่าISO) :
    new Date();

  const entryType = "รายรับ";
  const entryDescription = `ค่าคอม #${rentalData.หมายเลขการจอง}`;
  const amount = rentalData.รายได้สุทธิ || 0;
  const bookingNumber = rentalData.หมายเลขการจอง;
  const relatedVehicle = rentalData.รถ || "";
  const notes = `บันทึกอัตโนมัติจากระบบ - รถ: ${rentalData.รถ || 'ไม่ระบุ'}`;

  // สร้างข้อมูลตามหัวตาราง
  for (let j = 0; j < headers.length; j++) {
    const headerName = headers[j];

    switch (headerName) {
      case "วันที่":
      case "วัน":
        rowData.push(entryDate); // จะได้ 2025-06-29
        break;

      case "ประเภท":
        rowData.push(entryType);
        break;

      case "รายการ":
        rowData.push(entryDescription);
        break;

      case "จำนวนเงิน":
      case "จำนวน":
      case "เงิน":
        rowData.push(amount);
        break;

      case "หมายเลขการจอง":
        rowData.push(bookingNumber);
        break;

      case "รถที่เกี่ยวข้อง":
      case "รถ":
        rowData.push(relatedVehicle);
        break;

      case "หมายเหตุ":
        rowData.push(notes);
        break;

      default:
        rowData.push("");
        break;
    }
  }

  console.log("💰 [createIncomeExpenseRowData] ข้อมูลที่จะเพิ่ม:", {
    วันที่: entryDate.toISOString().split('T')[0], // 2025-06-29
    ประเภท: entryType,
    รายการ: entryDescription,
    จำนวนเงิน: amount,
    หมายเลขการจอง: bookingNumber
  });

  return rowData;
}

// ===================================
// 4. ฟังก์ชันจัดการชีท "ตารางรับส่งรถ"
// ===================================

/**
 * ฟังก์ชันปรับปรุงตารางรับส่งรถสำหรับการระบุรถ (ชื่อใหม่ - ไม่ซ้ำกับระบบเดิม)
 * - ลบข้อมูลเดิมที่มีหมายเลขการจองตรงกัน
 * - เพิ่มข้อมูลใหม่พร้อมหมายเหตุวิธีการส่ง/รับ
 * @param {Object} rentalData - ข้อมูลการจองที่ระบุรถแล้ว
 * @param {string} sheetID - รหัสชีท
 */
function updateScheduleBookingForAssignedVehicle(rentalData, sheetID) {
  Logger.log("📅 [updateScheduleBookingForAssignedVehicle] เริ่มต้นการอัพเดตตารางรับส่งรถ");

  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName("ตารางรับส่งรถ");

    if (!sheet) {
      return { success: false, message: "ไม่พบแผ่นงาน 'ตารางรับส่งรถ'" };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // หาคอลัมน์หมายเลขการจอง
    const bookingNumberIndex = headers.indexOf("หมายเลขการจอง");
    if (bookingNumberIndex === -1) {
      throw new Error("ไม่พบคอลัมน์ 'หมายเลขการจอง' ในตารางรับส่งรถ");
    }

    // ลบข้อมูลเดิม
    Logger.log("🗑️ [updateScheduleBookingForAssignedVehicle] กำลังลบข้อมูลเดิม...");
    const rowsToDelete = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][bookingNumberIndex] === rentalData.หมายเลขการจอง) {
        rowsToDelete.push(i + 1);
      }
    }

    // ลบจากล่างขึ้นบน
    for (let i = rowsToDelete.length - 1; i >= 0; i--) {
      sheet.deleteRow(rowsToDelete[i]);
    }

    Logger.log(`🗑️ [updateScheduleBookingForAssignedVehicle] ลบข้อมูลเดิม ${rowsToDelete.length} แถว`);

    // ✅ Debug ข้อมูลที่ได้รับ
    Logger.log("📅 [updateScheduleBookingForAssignedVehicle] Raw data:");
    Logger.log({
      วันที่เช่าISO: rentalData.วันที่เช่าISO,
      วันที่คืนISO: rentalData.วันที่คืนISO,
      วันที่เช่า: rentalData.วันที่เช่า,
      วันที่คืน: rentalData.วันที่คืน
    });

    // ✅ ใช้ ISO format ที่ส่งมาจาก Frontend
    const pickupDate = rentalData.วันที่เช่าISO ?
      new Date(rentalData.วันที่เช่าISO) :
      new Date();

    const returnDate = rentalData.วันที่คืนISO ?
      new Date(rentalData.วันที่คืนISO) :
      new Date();

    Logger.log("📅 [updateScheduleBookingForAssignedVehicle] Processed dates:");
    Logger.log({
      pickupDate: pickupDate.toISOString(),
      returnDate: returnDate.toISOString(),
      pickupDateFormatted: pickupDate.toISOString().split('T')[0],
      returnDateFormatted: returnDate.toISOString().split('T')[0]
    });

    // สร้างข้อมูลใหม่
    Logger.log("📝 [updateScheduleBookingForAssignedVehicle] กำลังเพิ่มข้อมูลใหม่...");

    // แถวรับรถ - ใช้วันที่เช่า
    const pickupRowData = createScheduleRowData(
      headers,
      rentalData,
      'รับรถ',
      pickupDate, // ส่ง Date object ที่ถูกต้อง
      rentalData.สถานที่รับรถ
    );

    // แถวคืนรถ - ใช้วันที่คืน
    const returnRowData = createScheduleRowData(
      headers,
      rentalData,
      'ส่งคืนรถ',
      returnDate, // ส่ง Date object ที่ถูกต้อง  
      rentalData.สถานที่คืนรถ
    );

    // เพิ่มข้อมูลใหม่
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, 1, pickupRowData.length).setValues([pickupRowData]);
    sheet.getRange(lastRow + 2, 1, 1, returnRowData.length).setValues([returnRowData]);

    // ✅ หาคอลัมน์วันที่และ format ให้เป็น yyyy-mm-dd
    const dateColumnIndex = headers.indexOf("วันที่");
    if (dateColumnIndex !== -1) {
      sheet.getRange(lastRow + 1, dateColumnIndex + 1).setNumberFormat('yyyy-mm-dd');
      sheet.getRange(lastRow + 2, dateColumnIndex + 1).setNumberFormat('yyyy-mm-dd');
      Logger.log("✅ [updateScheduleBookingForAssignedVehicle] ตั้งค่า date format เป็น yyyy-mm-dd");
    }

    Logger.log("✅ [updateScheduleBookingForAssignedVehicle] เพิ่มข้อมูลใหม่ 2 แถวเสร็จสิ้น");

    return {
      success: true,
      message: "อัพเดตตารางรับส่งรถสำเร็จ",
      details: {
        pickupDate: pickupDate.toISOString().split('T')[0],
        returnDate: returnDate.toISOString().split('T')[0],
        pickupLocation: rentalData.สถานที่รับรถ,
        returnLocation: rentalData.สถานที่คืนรถ
      }
    };

  } catch (error) {
    Logger.log("❌ [updateScheduleBookingForAssignedVehicle] Error: " + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * สร้างข้อมูลแถวสำหรับตารางรับส่งรถ
 * @param {Array} headers - หัวตาราง
 * @param {Object} rentalData - ข้อมูลการจอง
 * @param {string} type - ประเภท ('รับรถ' หรือ 'คืนรถ')
 * @param {string} methodNote - หมายเหตุวิธีการ
 * @returns {Array} ข้อมูลแถว
 */
function createScheduleRowData(headers, rentalData, type, eventDate, location) {
  const rowData = [];

  // ✅ ใช้ eventDate ที่ส่งเข้ามาโดยตรง
  const scheduleDate = eventDate;

  let timeField;
  if (type === 'รับรถ') {
    timeField = rentalData.เวลารับรถ || "";
  } else {
    timeField = rentalData.เวลาคืนรถ || "";
  }

  const combinedNote = [
    rentalData.หมายเหตุเพิ่มเติม || "",
    type === 'รับรถ' ? `ส่ง: ${rentalData.วิธีการส่งรถ || ''}` : `รับ: ${rentalData.วิธีการรับคืน || ''}`
  ].filter(note => note.trim()).join(" | ");

  // สร้างข้อมูลตามหัวตาราง
  for (let j = 0; j < headers.length; j++) {
    const headerName = headers[j];

    switch (headerName) {
      case "วันที่":
      case "วัน":
        // ✅ ใช้ eventDate ที่ส่งเข้ามา
        rowData.push(scheduleDate);
        break;

      case "เวลา":
        rowData.push(timeField);
        break;

      case "หมายเลขการจอง":
        rowData.push(rentalData.หมายเลขการจอง);
        break;

      case "ชื่อลูกค้า":
        rowData.push(rentalData.ชื่อลูกค้า || "");
        break;

      case "รถ":
        rowData.push(rentalData.รถ || "");
        break;

      case "จุดรับ":
      case "จุดส่ง":
      case "สถานที่":
      case "ที่อยู่":
        rowData.push(location || "");
        break;

      case "ประเภท":
        rowData.push(type);
        break;

      case "หมายเหตุ":
        rowData.push(combinedNote);
        break;

      case "เบอร์โทรศัพท์":
        const phoneNumber = rentalData.เบอร์โทรศัพท์ || "";
        if (phoneNumber && !phoneNumber.toString().startsWith("'")) {
          rowData.push("'" + phoneNumber);
        } else {
          rowData.push(phoneNumber);
        }
        break;

      case "สถานะ":
        rowData.push("จอง");
        break;

      case "ราคา":
      case "ค่าเช่า":
        rowData.push(rentalData.ค่าเช่ารวมทั้งหมด || "");
        break;

      case "รายได้สุทธิ":
        rowData.push(rentalData.รายได้สุทธิ || "");
        break;

      case "วิธีการส่งรถ":
        if (type === 'รับรถ') {
          rowData.push(rentalData.วิธีการส่งรถ || "");
        } else {
          rowData.push("");
        }
        break;

      case "วิธีการรับคืน":
        if (type === 'คืนรถ') {
          rowData.push(rentalData.วิธีการรับคืน || "");
        } else {
          rowData.push("");
        }
        break;

      default:
        rowData.push("");
        break;
    }
  }

  // ✅ ใช้ Logger.log แทน console.log
  Logger.log(`📅 [createScheduleRowData] ข้อมูล${type}ที่จะเพิ่ม:`);
  Logger.log({
    วันที่: scheduleDate.toISOString().split('T')[0],
    เวลา: timeField,
    ประเภท: type,
    หมายเลขการจอง: rentalData.หมายเลขการจอง,
    รถ: rentalData.รถ,
    สถานที่: location,
    eventDateReceived: eventDate.toISOString()
  });

  return rowData;
}

/**
 * ฟังก์ชันเรียกใช้สำหรับระบบระบุรถ
 * @param {Object} rentalData - ข้อมูลการจองที่ระบุรถแล้ว
 * @param {string} sheetID - รหัสชีท
 */
function updateDeliveryScheduleSheetImproved(rentalData, sheetID) {
  console.log("📅 [updateDeliveryScheduleSheetImproved] เริ่มต้นการอัพเดตตารางรับส่งรถ");

  const result = updateScheduleBookingForAssignedVehicle(rentalData, sheetID);

  if (result.success) {
    console.log("✅ [updateDeliveryScheduleSheetImproved] อัพเดตตารางรับส่งรถสำเร็จ");
  } else {
    console.error("❌ [updateDeliveryScheduleSheetImproved] อัพเดตตารางรับส่งรถไม่สำเร็จ:", result.message);
  }

  return result;
}

// ===================================
// 5. ฟังก์ชันจัดการปฏิทิน
// ===================================

/**
 * อัพเดตปฏิทินสำหรับรถที่ระบุใหม่
 * @param {Object} rentalData - ข้อมูลการจอง
 * @param {string} sheetID - รหัสชีท
 * @returns {Object} ผลลัพธ์การอัพเดต
 */
function updateCalendarEventForAssignedVehicle(rentalData, sheetID) {
  console.log("📅 [updateCalendarEventForAssignedVehicle] เริ่มต้นการอัพเดตปฏิทิน");

  try {
    // ดึงการตั้งค่าระบบ
    const config = getSystemConfig(sheetID);
    if (!config || !config.config) {
      console.log("⚠️ [updateCalendarEventForAssignedVehicle] ไม่พบการตั้งค่าปฏิทิน");
      return { success: false, message: "ไม่พบการตั้งค่าปฏิทิน" };
    }

    const calendarId = config.config.GoogleCalendarID;
    if (!calendarId) {
      console.log("⚠️ [updateCalendarEventForAssignedVehicle] ไม่พบรหัสปฏิทิน");
      return { success: false, message: "ไม่พบรหัสปฏิทิน" };
    }

    // เข้าถึงปฏิทิน
    const calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) {
      throw new Error("ไม่สามารถเข้าถึงปฏิทินได้");
    }

    // ค้นหาและอัพเดตกิจกรรมที่มีอยู่
    const startDate = new Date(rentalData.วันที่เช่า);
    const endDate = new Date(rentalData.วันที่คืน);
    endDate.setDate(endDate.getDate() + 1); // ขยายวันสิ้นสุดการค้นหา

    const events = calendar.getEvents(startDate, endDate);

    // ค้นหากิจกรรมที่ตรงกับหมายเลขการจอง
    let targetEvent = null;
    for (const event of events) {
      const title = event.getTitle();
      if (title.includes(`(${rentalData.หมายเลขการจอง})`)) {
        targetEvent = event;
        break;
      }
    }

    if (targetEvent) {
      // อัพเดตกิจกรรมที่มีอยู่
      const newTitle = `(${rentalData.หมายเลขการจอง}) ${rentalData.รถ}`;
      const newDescription = generateEventDescription(rentalData);

      targetEvent.setTitle(newTitle);
      targetEvent.setDescription(newDescription);

      console.log("✅ [updateCalendarEventForAssignedVehicle] อัพเดตกิจกรรมเสร็จสิ้น");
    } else {
      // สร้างกิจกรรมใหม่ถ้าไม่พบ
      console.log("📝 [updateCalendarEventForAssignedVehicle] ไม่พบกิจกรรม สร้างใหม่");
      const createResult = createCalendarEventForRental(rentalData, sheetID);
      return createResult;
    }

    return { success: true, message: "อัพเดตปฏิทินสำเร็จ" };

  } catch (error) {
    console.error("❌ [updateCalendarEventForAssignedVehicle] Error:", error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * สร้างคำอธิบายสำหรับกิจกรรมในปฏิทิน
 * @param {Object} rentalData - ข้อมูลการจอง
 * @returns {string} คำอธิบายกิจกรรม
 */
function generateEventDescription(rentalData) {
  let description = `<div style="line-height: 1.4;">
<h4 style="margin: 8px 0;">👤 ${rentalData.ชื่อลูกค้า}</h4>
<div style="margin: 3px 0;">📞 ${rentalData.เบอร์โทรศัพท์}</div>
<div style="margin: 3px 0;">🚗 ${rentalData.รถ}</div>
<div style="margin: 3px 0;">🔢 ${rentalData.ทะเบียนรถ || 'ไม่ระบุ'}</div>
<div style="margin: 10px 0;"></div>
<div style="margin: 3px 0;">📆 วันที่เช่า: ${new Date(rentalData.วันที่เช่า).toLocaleDateString('th-TH')}</div>
<div style="margin: 3px 0;">🕒 เวลารับรถ: ${rentalData.เวลารับรถ}</div>
<div style="margin: 3px 0;">📍 สถานที่รับรถ:</div>
<div style="margin: 3px 0 3px 20px;"><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rentalData.สถานที่รับรถ)}" target="_blank">${rentalData.สถานที่รับรถ}</a></div>
<div style="margin: 3px 0;">🚚 วิธีการส่งรถ: ${rentalData.วิธีการส่งรถ || 'ไม่ระบุ'}</div>
<div style="margin: 10px 0;"></div>
<div style="margin: 3px 0;">📆 วันที่คืน: ${new Date(rentalData.วันที่คืน).toLocaleDateString('th-TH')}</div>
<div style="margin: 3px 0;">🕒 เวลาคืนรถ: ${rentalData.เวลาคืนรถ}</div>
<div style="margin: 3px 0;">📍 สถานที่คืนรถ:</div>
<div style="margin: 3px 0 3px 20px;"><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rentalData.สถานที่คืนรถ)}" target="_blank">${rentalData.สถานที่คืนรถ}</a></div>
<div style="margin: 3px 0;">🔄 วิธีการรับคืน: ${rentalData.วิธีการรับคืน || 'ไม่ระบุ'}</div>
<div style="margin: 10px 0;"></div>
<div style="margin: 3px 0;">💰 ค่าเช่ารวมทั้งหมด: ${rentalData.ค่าเช่ารวมทั้งหมด} บาท</div>
<div style="margin: 3px 0;">💸 รายได้สุทธิ: ${rentalData.รายได้สุทธิ || 0} บาท</div>`;

  // สร้างข้อความหมายเหตุรวม (หมายเหตุ + หมายเหตุเพิ่มเติม + คาร์ซีท + ประกันเสริม)
  let notesSection = '';

  // เพิ่มหมายเหตุทั่วไป (ถ้ามี)
  if (rentalData.หมายเหตุ) {
    notesSection += rentalData.หมายเหตุ;
  }

  // เพิ่มหมายเหตุเพิ่มเติม (ถ้ามี)
  if (rentalData.หมายเหตุเพิ่มเติม) {
    if (notesSection) notesSection += '\n';
    notesSection += rentalData.หมายเหตุเพิ่มเติม;
  }

  // เพิ่มข้อมูลคาร์ซีท (ถ้ามี)
  if (rentalData.ต้องการคาร์ซีท) {
    if (notesSection) notesSection += '\n';
    if (rentalData.คาร์ซีทมีค่าบริการ === true || rentalData.คาร์ซีทมีค่าบริการ === 'true' || rentalData.คาร์ซีทมีค่าบริการ === 'TRUE') {
      const carSeatFee = parseFloat(rentalData.ค่าคาร์ซีท) || 0;
      notesSection += `🍼 คาร์ซีท: มี (ค่าบริการ ${carSeatFee.toLocaleString()} บาท)`;
    } else {
      notesSection += `🍼 คาร์ซีท: มี (ไม่มีค่าบริการ)`;
    }
  }

  // เพิ่มข้อมูลประกันเสริม (ถ้ามี)
  if (rentalData.ต้องการประกันเสริม) {
    if (notesSection) notesSection += '\n';
    const days = parseFloat(rentalData.จำนวนวันประกันเสริม) || 0;
    const pricePerDay = parseFloat(rentalData.ราคาประกันเสริมต่อวัน) || 0;
    const totalInsurance = parseFloat(rentalData.ค่าประกันเสริมรวม) || 0;
    notesSection += `🛡️ ประกันเสริม: มี (${days} วัน × ${pricePerDay.toLocaleString()} บาท = ${totalInsurance.toLocaleString()} บาท)`;
  }

  // แสดงส่วนหมายเหตุรวม (ถ้ามี)
  if (notesSection) {
    description += `
<div style="margin: 10px 0;"></div>
<div style="margin: 3px 0;">📌 หมายเหตุ</div>
<div style="margin: 3px 0 3px 20px;">${notesSection.replace(/\n/g, '<br>')}</div>`;
  }

  // เพิ่มลิงก์สัญญาเช่า (ถ้ามี)
  if (rentalData.ลิงก์สัญญาเช่า) {
    description += `
<div style="margin: 10px 0;"></div>
<div style="margin: 3px 0;">📝 ลิงก์สัญญาเช่า</div>
<div style="margin: 3px 0 3px 20px;"><a href="${rentalData.ลิงก์สัญญาเช่า}" target="_blank">ดูสัญญาเช่า</a></div>`;
  }

  description += `</div>`; // ปิด div หลัก

  return description;
}

// ===================================
// 6. ฟังก์ชันจัดการสถิติ
// ===================================

/**
 * อัพเดตสถิติรายการรอหารถ
 * @param {string} sheetID - รหัสชีท
 */
function updatePendingVehicleStats(sheetID) {
  console.log("📊 [updatePendingVehicleStats] อัพเดตสถิติรายการรอหารถ");

  try {
    // เรียกใช้ฟังก์ชันคำนวณสถิติใหม่
    const stats = getPendingVehicleStats(sheetID);
    console.log("📊 [updatePendingVehicleStats] สถิติใหม่:", JSON.stringify(stats, null, 2));

    return { success: true, stats: stats };

  } catch (error) {
    console.error("❌ [updatePendingVehicleStats] Error:", error.toString());
    return { success: false, message: error.toString() };
  }
}

// ===================================
// 7. ฟังก์ชันเสริม
// ===================================

/**
 * ฟังก์ชันสำหรับล็อกการดำเนินการ
 * @param {string} message - ข้อความล็อก
 * @param {string} level - ระดับล็อก (INFO, WARN, ERROR)
 */
function logAssignVehicleActivity(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] [AssignVehicle] ${message}`;

  console.log(logMessage);

  // อาจจะเพิ่มการบันทึกล็อกในชีทแยก (ถ้าต้องการ)
  // logToSheet(logMessage, sheetID);
}

// ===================================
// 8. ฟังก์ชันทดสอบ
// ===================================

/**
 * ฟังก์ชันทดสอบระบบทั้งหมด
 * @param {string} sheetID - รหัสชีท
 * @param {string} testLanguage - ภาษาสำหรับทดสอบ ('th' หรือ 'en')
 */
function testAssignVehicleSystem(sheetID, testLanguage = 'th') {
  console.log("🧪 [testAssignVehicleSystem] เริ่มต้นการทดสอบระบบ");
  console.log("🌐 [testAssignVehicleSystem] ทดสอบด้วยภาษา:", testLanguage);

  const testData = {
    หมายเลขการจอง: 'TEST001',
    ชื่อลูกค้า: 'ทดสอบ ระบบ',
    เบอร์โทรศัพท์: '081-111-1111',
    รถ: 'Toyota Vios สีขาว 2023',
    ทะเบียนรถ: 'ทส 9999 กรุงเทพฯ',
    วันที่เช่า: '2025-07-01',
    วันที่คืน: '2025-07-03',
    เวลารับรถ: '09:00',
    เวลาคืนรถ: '18:00',
    ค่าเช่ารวมทั้งหมด: 2400,
    รายได้สุทธิ: 2000,
    วิธีการส่งรถ: 'ส่งเอง',
    วิธีการรับคืน: 'รับคืนเอง',
    สถานที่รับรถ: 'สนามบินสุวรรณภูมิ',
    สถานที่คืนรถ: 'สนามบินสุวรรณภูมิ',
    หมายเหตุเพิ่มเติม: 'ทดสอบระบบระบุรถ',
    สถานะ: 'จอง',
    วันที่ระบุรถ: new Date().toISOString()
  };

  // ✅ ส่งภาษาที่ต้องการทดสอบไปด้วย
  const result = assignVehicleAndCreateContract(testData, testLanguage, sheetID);
  console.log("🧪 [testAssignVehicleSystem] ผลการทดสอบ:", JSON.stringify(result, null, 2));

  return result;
}

/**
 * ฟังก์ชันทดสอบการใช้ภาษาต่างๆ
 * @param {string} sheetID - รหัสชีท  
 */
function testLanguageSelection(sheetID) {
  console.log("🧪 [testLanguageSelection] เริ่มต้นการทดสอบการเลือกภาษา");

  // ทดสอบภาษาไทย
  console.log("🇹🇭 ทดสอบภาษาไทย...");
  const thResult = testAssignVehicleSystem(sheetID, 'th');

  // ทดสอบภาษาอังกฤษ
  console.log("🇺🇸 ทดสอบภาษาอังกฤษ...");
  const enResult = testAssignVehicleSystem(sheetID, 'en');

  // ทดสอบกรณีไม่ส่งภาษา (ควรใช้ค่าเริ่มต้น)
  console.log("🌐 ทดสอบไม่ส่งภาษา (ควรใช้ค่าเริ่มต้น)...");
  const defaultResult = assignVehicleAndCreateContract({
    หมายเลขการจอง: 'TEST_DEFAULT',
    รถ: 'Test Car',
    ทะเบียนรถ: 'TEST 999',
    รายได้สุทธิ: 1000,
    วิธีการส่งรถ: 'ส่งเอง',
    วิธีการรับคืน: 'รับคืนเอง',
    สถานะ: 'จอง'
  }, null, sheetID); // ส่ง null เป็นภาษา

  const testResults = {
    thai: { language: 'th', success: thResult.success, contractLanguage: thResult.contractLanguage },
    english: { language: 'en', success: enResult.success, contractLanguage: enResult.contractLanguage },
    default: { language: 'default(null)', success: defaultResult.success, contractLanguage: defaultResult.contractLanguage }
  };

  console.log("🧪 [testLanguageSelection] สรุปผลการทดสอบภาษา:", JSON.stringify(testResults, null, 2));

  return testResults;
}

/**
 * ฟังก์ชันทดสอบการอัพเดตรายรับรายจ่าย
 */
function testUpdateIncomeExpenseSheet() {
  const testData = {
    หมายเลขการจอง: 'KP000019',
    ชื่อลูกค้า: 'ทดสอบ ระบบ',
    เบอร์โทรศัพท์: '081-111-1111',
    รถ: 'Toyota Vios สีขาว 2023',
    ทะเบียนรถ: 'กข 1234 กรุงเทพฯ',
    วันที่เช่า: '2025-06-23',
    วันที่คืน: '2025-06-25',
    ค่าเช่ารวมทั้งหมด: 900,
    รายได้สุทธิ: 700, // รายได้หลังหักค่าคอมมิชชั่น
    วิธีการส่งรถ: 'ส่งเอง',
    วิธีการรับคืน: 'รับคืนเอง'
  };

  const sheetID = 'YOUR_SHEET_ID'; // ใส่รหัสชีทจริง
  const result = updateIncomeExpenseSheet(testData, sheetID);

  console.log("🧪 [testUpdateIncomeExpenseSheet] ผลการทดสอบ:", JSON.stringify(result, null, 2));

  return result;
}

/**
 * ฟังก์ชันทดสอบการอัพเดตตารางรับส่งรถ
 */
function testUpdateScheduleBookingForAssignedVehicle() {
  const testData = {
    หมายเลขการจอง: 'TEST001',
    ชื่อลูกค้า: 'ทดสอบ ระบบ',
    เบอร์โทรศัพท์: '081-111-1111',
    รถ: 'Toyota Vios สีขาว 2023',
    ทะเบียนรถ: 'กข 1234 กรุงเทพฯ',
    วันที่เช่า: '2025-07-01',
    วันที่คืน: '2025-07-03',
    เวลารับรถ: '09:00',
    เวลาคืนรถ: '18:00',
    สถานที่รับรถ: 'สนามบินสุวรรณภูมิ',
    สถานที่คืนรถ: 'สนามบินสุวรรณภูมิ',
    ค่าเช่ารวมทั้งหมด: 2400,
    รายได้สุทธิ: 2000,
    วิธีการส่งรถ: 'ส่งเอง',
    วิธีการรับคืน: 'รับคืนเอง',
    หมายเหตุ: 'ทดสอบระบบ',
    หมายเหตุเพิ่มเติม: 'ระบุรถแล้ว'
  };

  const sheetID = 'YOUR_SHEET_ID'; // ใส่รหัสชีทจริง
  const result = updateScheduleBookingForAssignedVehicle(testData, sheetID);

  console.log("🧪 [testUpdateScheduleBookingForAssignedVehicle] ผลการทดสอบ:", JSON.stringify(result, null, 2));

  return result;
}

/**
 * ฟังก์ชันทดสอบฟังก์ชันเช็ครายการรอหารถ
 */
function testIsPendingVehicleBooking() {
  console.log("🧪 [testIsPendingVehicleBooking] เริ่มต้นการทดสอบ");

  // ทดสอบกรณีต่างๆ
  const testCases = [
    { สถานะ: 'รอหารถ', expected: true },
    { สถานะ: 'จอง', expected: false },
    { สถานะ: 'confirmed', expected: false },
    { สถานะ: '', expected: false },
    { สถานะ: null, expected: false }
  ];

  testCases.forEach((testCase, index) => {
    const result = isPendingVehicleBooking(testCase);
    const status = result === testCase.expected ? '✅ PASS' : '❌ FAIL';
    console.log(`Test ${index + 1}: สถานะ='${testCase.สถานะ}' → ${result} ${status}`);
  });

  console.log("🧪 [testIsPendingVehicleBooking] การทดสอบเสร็จสิ้น");
}

// ===================================
// 9. ฟังก์ชันอรรถประโยชน์
// ===================================

/**
 * ฟังก์ชันเริ่มต้นสำหรับติดตั้งระบบ
 * @param {string} sheetID - รหัสชีท
 */
function initializeAssignVehicleSystem(sheetID) {
  console.log("🚀 [initializeAssignVehicleSystem] เริ่มต้นติดตั้งระบบ");

  try {
    // ทดสอบการเชื่อมต่อชีท
    const ss = SpreadsheetApp.openById(sheetID);
    console.log("✅ เชื่อมต่อชีทสำเร็จ:", ss.getName());

    // ตรวจสอบแผ่นงานที่จำเป็น
    const requiredSheets = ["รายการเช่า", "รายรับรายจ่าย", "ตารางรับส่งรถ"];
    const missingSheets = [];

    requiredSheets.forEach(sheetName => {
      const sheet = ss.getSheetByName(sheetName);
      if (sheet) {
        console.log(`✅ พบแผ่นงาน: ${sheetName}`);
      } else {
        console.log(`❌ ไม่พบแผ่นงาน: ${sheetName}`);
        missingSheets.push(sheetName);
      }
    });

    if (missingSheets.length > 0) {
      throw new Error(`ไม่พบแผ่นงานที่จำเป็น: ${missingSheets.join(', ')}`);
    }

    // ทดสอบฟังก์ชันทั้งหมด
    console.log("🧪 เริ่มทดสอบฟังก์ชัน...");
    testIsPendingVehicleBooking();

    console.log("🎉 ติดตั้งระบบเสร็จสิ้น พร้อมใช้งาน!");
    return { success: true, message: "ติดตั้งระบบสำเร็จ" };

  } catch (error) {
    console.error("❌ [initializeAssignVehicleSystem] Error:", error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * ฟังก์ชันตรวจสอบสุขภาพระบบ
 * @param {string} sheetID - รหัสชีท
 */
function checkAssignVehicleSystemHealth(sheetID) {
  console.log("🔍 [checkAssignVehicleSystemHealth] ตรวจสอบสุขภาพระบบ");

  const healthReport = {
    overall: true,
    checks: [],
    timestamp: new Date().toISOString()
  };

  try {
    // ตรวจสอบการเชื่อมต่อชีท
    const ss = SpreadsheetApp.openById(sheetID);
    healthReport.checks.push({ name: "Sheet Connection", status: "✅ OK", detail: ss.getName() });

    // ตรวจสอบฟังก์ชันที่จำเป็น
    const requiredFunctions = [
      'assignVehicleAndCreateContract',
      'updateRentalRecord',
      'updateIncomeExpenseSheet',
      'updateScheduleBookingForAssignedVehicle', // เปลี่ยนชื่อใหม่
      'isPendingVehicleBooking'
    ];

    requiredFunctions.forEach(funcName => {
      try {
        const func = eval(funcName);
        if (typeof func === 'function') {
          healthReport.checks.push({ name: `Function ${funcName}`, status: "✅ OK", detail: "Available" });
        } else {
          healthReport.checks.push({ name: `Function ${funcName}`, status: "❌ ERROR", detail: "Not a function" });
          healthReport.overall = false;
        }
      } catch (e) {
        healthReport.checks.push({ name: `Function ${funcName}`, status: "❌ ERROR", detail: e.toString() });
        healthReport.overall = false;
      }
    });

    // ตรวจสอบการตั้งค่าระบบ
    try {
      const config = getSystemConfig(sheetID);
      if (config && config.config) {
        healthReport.checks.push({ name: "System Config", status: "✅ OK", detail: "Available" });
      } else {
        healthReport.checks.push({ name: "System Config", status: "⚠️ WARNING", detail: "Config not found or incomplete" });
      }
    } catch (e) {
      healthReport.checks.push({ name: "System Config", status: "❌ ERROR", detail: e.toString() });
    }

  } catch (error) {
    healthReport.checks.push({ name: "Overall System", status: "❌ ERROR", detail: error.toString() });
    healthReport.overall = false;
  }

  console.log("📊 Health Report:", JSON.stringify(healthReport, null, 2));
  return healthReport;
}



/**
 * [UTILITY] ฟังก์ชันสำหรับแก้ไข Event ID ที่ไม่ถูกต้องในชีต "รายการเช่า" ทั้งหมด
 * ให้รันฟังก์ชันนี้เพียงครั้งเดียวหลังจากแก้ไขโค้ดส่วนอื่นแล้ว
 * @param {string} sheetID - ไอดีของ Google Sheet ที่ต้องการแก้ไข
 */
function utility_FixExistingCalendarEventIds(sheetID) {
  // ❗️❗️ ใส่ Sheet ID ของคุณที่นี่ หรือจะส่งเป็น parameter มาก็ได้
  const targetSheetID = sheetID || "1RjRI5kY4QKxVIU4iZWi65rIc_H7JDpwBrZLnTrznYuQ";

  if (targetSheetID === "YOUR_GOOGLE_SHEET_ID") {
    Logger.log("กรุณาระบุ Sheet ID ที่ต้องการแก้ไข");
    return;
  }

  Logger.log(`--- เริ่มแก้ไข Event ID ใน Sheet ID: ${targetSheetID} ---`);

  try {
    const ss = SpreadsheetApp.openById(targetSheetID);
    const sheet = ss.getSheetByName("รายการเช่า");
    if (!sheet) {
      Logger.log("ไม่พบชีต 'รายการเช่า'");
      return;
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const eventIdColIndex = headers.indexOf("IDกิจกรรมปฏิทิน");

    if (eventIdColIndex === -1) {
      Logger.log("ไม่พบคอลัมน์ 'IDกิจกรรมปฏิทิน'");
      return;
    }

    let fixedCount = 0;
    // วนลูปเพื่อตรวจสอบและแก้ไขข้อมูล
    for (let i = 1; i < data.length; i++) {
      const currentId = data[i][eventIdColIndex];

      // ตรวจสอบว่า ID มี @ หรือไม่
      if (typeof currentId === 'string' && currentId.includes('@')) {
        const newId = currentId.split('@')[0];
        // เขียนทับข้อมูลในเซลล์นั้นๆ
        sheet.getRange(i + 1, eventIdColIndex + 1).setValue(newId);
        fixedCount++;
        Logger.log(`แก้ไขแถวที่ ${i + 1}: จาก "${currentId}" เป็น "${newId}"`);
      }
    }

    if (fixedCount > 0) {
      Logger.log(`--- ✅ แก้ไข Event ID ทั้งหมด ${fixedCount} รายการเรียบร้อยแล้ว ---`);
    } else {
      Logger.log("--- ℹ️ ไม่พบ Event ID ที่ต้องแก้ไข ---");
    }

  } catch (e) {
    Logger.log("--- ❌ เกิดข้อผิดพลาด: " + e.toString() + " ---");
  }
}




// =================================================
//            ฟังก์ชันใหม่สำหรับจัดการข้อมูลลูกค้า (CRUD)
// =================================================

function getAllCustomers(sheetID) {
  Logger.log("🚀 [getAllCustomers] เริ่มทำงาน...");
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(CUSTOMERS_SHEET);
    if (!sheet || sheet.getLastRow() < 2) {
      return { success: true, data: [] };
    }

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log(`📊 [getAllCustomers] อ่านข้อมูลลูกค้า ${data.length} รายการ`);

    // --- ⭐ ส่วนสำคัญที่สุด: แปลง Array of Arrays เป็น Array of Objects ---
    const customers = data.map((row, index) => {
      const customerObj = {};
      headers.forEach((header, i) => {
        const cellValue = row[i];
        // ป้องกันปัญหา Date Object
        if (cellValue instanceof Date && !isNaN(cellValue)) {
          customerObj[header] = cellValue.toISOString();
        } else {
          customerObj[header] = cellValue;
        }
      });
      customerObj.rowIndex = index + 2; // เก็บ rowIndex ไว้สำหรับอ้างอิง
      return customerObj;
    });

    Logger.log(`✅ [getAllCustomers] ประมวลผลข้อมูลสำเร็จ ส่งข้อมูลกลับ ${customers.length} รายการ`);
    return { success: true, data: customers };

  } catch (e) {
    Logger.log(`❌ [getAllCustomers] เกิดข้อผิดพลาดร้ายแรง: ${e.toString()}`);
    Logger.log(`   Stack Trace: ${e.stack}`);
    return { success: false, message: e.toString() };
  }
}



/**
 * ล้าง Cache ของหน้า Customers สำหรับ Tenant ที่ระบุ
 */
function clearCustomersCacheForTenant(sheetID) {
  if (!sheetID) return;
  try {
    const cache = CacheService.getScriptCache();
    const cacheKey = `customers_v1_${sheetID}`;
    cache.remove(cacheKey);
    Logger.log(`[Cache Invalidation] ล้างแคช Customers สำหรับ Sheet ID: ${sheetID} สำเร็จ`);
  } catch (e) {
    Logger.log(`[Cache Invalidation] เกิดข้อผิดพลาดในการล้างแคช Customers: ${e.message}`);
  }
}




/**
 * ⭐ (ฟังก์ชันใหม่) ดึงข้อมูลลูกค้ารายละเอียดพร้อมประวัติการเช่าทั้งหมด
 * @param {string} customerId - รหัสลูกค้า
 * @param {string} sheetID - ID ของ Google Sheet
 * @returns {object} ผลลัพธ์พร้อมข้อมูลลูกค้าและประวัติการเช่า
 */
function getCustomerDetailsWithHistory(customerId, sheetID) {
  Logger.log(`[getCustomerDetails] Fetching details for Customer ID: ${customerId}`);
  try {
    const ss = SpreadsheetApp.openById(sheetID);

    // --- 1. ดึงข้อมูลลูกค้า ---
    const customerSheet = ss.getSheetByName(CUSTOMERS_SHEET);
    if (!customerSheet) throw new Error("ไม่พบชีต 'ข้อมูลลูกค้า'");

    const customerData = customerSheet.getDataRange().getValues();
    const customerHeaders = customerData.shift();
    const idColumnIndex = customerHeaders.indexOf("รหัสลูกค้า");

    const customerRow = customerData.find(row => row[idColumnIndex] === customerId);
    if (!customerRow) {
      return { success: false, message: "ไม่พบข้อมูลลูกค้า" };
    }

    const customerDetails = {};
    customerHeaders.forEach((header, i) => {
      const cellValue = customerRow[i];
      // ⭐ เพิ่มการตรวจสอบและแปลง Date Object ที่นี่
      if (cellValue instanceof Date && !isNaN(cellValue)) {
        customerDetails[header] = cellValue.toISOString();
      } else {
        customerDetails[header] = cellValue;
      }
    });
    Logger.log(`[getCustomerDetails] Found customer: ${customerDetails['ชื่อ-นามสกุล']}`);

    // --- 2. ดึงประวัติการเช่า ---
    const rentalHistoryNumbers = (customerDetails['ประวัติการเช่า (หมายเลขการจอง)'] || '')
      .split(',')
      .map(s => s.trim())
      .filter(s => s);

    const rentalHistoryDetails = [];
    if (rentalHistoryNumbers.length > 0) {
      const rentalSheet = ss.getSheetByName(RENTAL_SHEET);
      if (rentalSheet) {
        const rentalData = rentalSheet.getDataRange().getValues();
        const rentalHeaders = rentalData.shift();
        const bookingNoIndex = rentalHeaders.indexOf("หมายเลขการจอง");

        // สร้าง Map เพื่อการค้นหาที่เร็วขึ้น
        const rentalMap = new Map();
        rentalData.forEach(row => {
          const bookingNo = row[bookingNoIndex];
          if (bookingNo) {
            const rentalObj = {};
            rentalHeaders.forEach((header, i) => {
              // แปลง Date object เป็น ISO String ก่อนส่ง
              if (row[i] instanceof Date) {
                rentalObj[header] = row[i].toISOString();
              } else {
                rentalObj[header] = row[i];
              }
            });
            rentalMap.set(bookingNo, rentalObj);
          }
        });

        // ดึงรายละเอียดของแต่ละการจอง
        rentalHistoryNumbers.forEach(bookingNo => {
          if (rentalMap.has(bookingNo)) {
            rentalHistoryDetails.push(rentalMap.get(bookingNo));
          }
        });
        Logger.log(`[getCustomerDetails] Found ${rentalHistoryDetails.length} rental history records.`);
      }
    }

    customerDetails.rentalHistoryDetails = rentalHistoryDetails;

    return { success: true, data: customerDetails };

  } catch (e) {
    Logger.log(`[getCustomerDetails] Error: ${e.toString()}`);
    return { success: false, message: e.toString() };
  }
}





/**
 * เพิ่มลูกค้าใหม่
 */
function addNewCustomer(customerData, sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(CUSTOMERS_SHEET);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // สร้างรหัสลูกค้าใหม่
    const lastRow = sheet.getLastRow();
    const lastId = lastRow > 1 ? sheet.getRange(lastRow, 1).getValue() : 'CUS00000';
    const newIdNumber = parseInt(lastId.replace('CUS', '')) + 1;
    const newCustomerId = `CUS${String(newIdNumber).padStart(5, '0')}`;

    const newRow = headers.map(header => {
      if (header === "รหัสลูกค้า") return newCustomerId;
      if (header === "วันที่สร้าง") return new Date();
      if (header === "เบอร์โทรศัพท์") return `'${customerData[header] || ''}`;
      return customerData[header] || '';
    });

    sheet.appendRow(newRow);
    clearCustomersCacheForTenant(sheetID);
    return { success: true, message: "เพิ่มลูกค้าใหม่สำเร็จ", customerId: newCustomerId };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

/**
 * อัปเดตข้อมูลลูกค้า
 */
function updateCustomer(customerData, sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(CUSTOMERS_SHEET);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    const data = sheet.getDataRange().getValues();
    const idColumnIndex = headers.indexOf("รหัสลูกค้า");

    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][idColumnIndex] === customerData.รหัสลูกค้า) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, message: "ไม่พบข้อมูลลูกค้าที่จะแก้ไข" };
    }

    const newRow = headers.map(header => {
      if (header === "เบอร์โทรศัพท์") return `'${customerData[header] || ''}`;
      return customerData[header] || '';
    });

    sheet.getRange(rowIndex, 1, 1, newRow.length).setValues([newRow]);
    clearCustomersCacheForTenant(sheetID);
    return { success: true, message: "แก้ไขข้อมูลลูกค้าสำเร็จ" };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}


/**
 * ลบข้อมูลลูกค้า (พร้อม Logger สำหรับ Debug ที่ปรับปรุงแล้ว)
 */
function deleteCustomer(customerId, sheetID) {
  Logger.log(`[deleteCustomer] เริ่มกระบวนการลบลูกค้า ID: ${customerId} (Type: ${typeof customerId})`);
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(CUSTOMERS_SHEET);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idColumnIndex = headers.indexOf("รหัสลูกค้า");

    if (idColumnIndex === -1) {
      const errorMsg = "ไม่พบคอลัมน์ 'รหัสลูกค้า' ในชีต";
      Logger.log(`[deleteCustomer] ❌ ${errorMsg}`);
      return { success: false, message: errorMsg };
    }

    let rowIndexToDelete = -1;
    // วนลูปจากล่างขึ้นบน ซึ่งเป็นวิธีที่ปลอดภัยกว่าสำหรับการลบ
    for (let i = data.length - 1; i >= 1; i--) {
      const idInSheet = data[i][idColumnIndex];
      // Logger.log(`[deleteCustomer] -> กำลังตรวจสอบแถวที่ ${i + 1}: ID ในชีตคือ '${idInSheet}' (Type: ${typeof idInSheet})`);

      // ⭐ แก้ไข: แปลงทั้งสองค่าเป็น String และ .trim() เพื่อการเปรียบเทียบที่แม่นยำ
      if (String(idInSheet).trim() === String(customerId).trim()) {
        rowIndexToDelete = i + 1; // rowIndex สำหรับ deleteRow ต้องเป็น 1-based
        Logger.log(`[deleteCustomer] ✅ พบข้อมูล! จะทำการลบแถวที่: ${rowIndexToDelete}`);
        break; // เมื่อเจอแล้วให้ออกจากลูปทันที
      }
    }

    if (rowIndexToDelete === -1) {
      const errorMsg = `ไม่พบข้อมูลลูกค้า ID '${customerId}' ในชีตที่จะลบ`;
      Logger.log(`[deleteCustomer] ⚠️ ${errorMsg}`);
      // ถึงแม้จะหาไม่เจอ ก็อาจจะส่งค่า success กลับไปเพื่อให้หน้าเว็บแสดงผลถูกต้อง
      // แต่ในกรณีนี้ เราต้องการให้รู้ว่ามันลบไม่สำเร็จจริงๆ
      return { success: false, message: errorMsg };
    }

    sheet.deleteRow(rowIndexToDelete);
    clearCustomersCacheForTenant(sheetID);
    Logger.log(`[deleteCustomer] ✅ ลบแถวที่ ${rowIndexToDelete} สำเร็จ`);
    return { success: true, message: "ลบข้อมูลลูกค้าสำเร็จ" };

  } catch (e) {
    Logger.log(`[deleteCustomer] ❌ เกิดข้อผิดพลาดร้ายแรง: ${e.toString()}`);
    Logger.log(`   Stack Trace: ${e.stack}`);
    return { success: false, message: e.toString() };
  }
}




/**
 * (อัปเกรด V.3) จัดการข้อมูลลูกค้าและประวัติการเช่า (ค้นหา, สร้าง, อัปเดต, ลบ)
 * โดยใช้ "เลขบัตรประชาชน" เป็น Primary Key
 */
function updateCustomerHistoryManager(options) {
  const { sheetID, mode, rentalData, oldBookingNumber, bookingNumberToDelete, customerIdentifier } = options;
  Logger.log(`[CustomerManager V.3] Mode: ${mode}`);

  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(CUSTOMERS_SHEET);
    if (!sheet) {
      Logger.log("[CustomerManager] ไม่พบชีต 'ข้อมูลลูกค้า'");
      return;
    }

    const data = sheet.getDataRange().getValues();
    const headers = data.shift(); // นำหัวข้อออก
    const idCardIndex = headers.indexOf("เลขบัตรประชาชน");
    const historyIndex = headers.indexOf("ประวัติการเช่า (หมายเลขการจอง)");

    if (idCardIndex === -1) {
      Logger.log("[CustomerManager] ไม่พบคอลัมน์ 'เลขบัตรประชาชน' ในชีตลูกค้า");
      return;
    }

    let customerRowIndex = -1;

    // --- ⭐ ส่วนแก้ไข: ปรับปรุง Logic การค้นหาให้ใช้เฉพาะเลขบัตรประชาชน ---
    let idCardToFind = null;
    if (mode === 'ADD' || mode === 'UPDATE') {
      idCardToFind = String(rentalData.เลขบัตรประชาชน || '').trim();
    } else if (mode === 'DELETE') {
      // สำหรับการลบ, customerIdentifier ควรจะเป็นเลขบัตรประชาชน
      idCardToFind = String(customerIdentifier || '').trim();
    }

    // ค้นหาลูกค้า (เฉพาะเมื่อมีเลขบัตรประชาชนเท่านั้น)
    if (idCardToFind) {
      for (let i = 0; i < data.length; i++) {
        const idCardInSheet = String(data[i][idCardIndex] || '').trim();
        if (idCardInSheet === idCardToFind) {
          customerRowIndex = i + 2; // +2 เพราะ data ไม่มี header และ index เป็น 0-based
          Logger.log(`[CustomerManager] พบลูกค้าเดิมจาก 'เลขบัตรประชาชน' ที่แถว ${customerRowIndex}`);
          break;
        }
      }
    }
    // --- จบส่วนแก้ไข ---

    // --- ประมวลผลตามโหมด (Logic เดิม แต่ตอนนี้จะทำงานบนฐานของเลขบัตรประชาชน) ---
    if (customerRowIndex !== -1) {
      // -- พบลูกค้าเดิม --
      if (mode === 'ADD' || mode === 'UPDATE') {
        // "เขียนทับ" ข้อมูลโปรไฟล์ลูกค้าด้วยข้อมูลล่าสุดเสมอ
        const updatedRowData = headers.map(header => {
          switch (header) {
            case "รหัสลูกค้า":
            case "วันที่สร้าง":
              return sheet.getRange(customerRowIndex, headers.indexOf(header) + 1).getValue();
            case "ชื่อ-นามสกุล":
              return rentalData.ชื่อลูกค้า;
            case "เบอร์โทรศัพท์":
              return `'${rentalData.เบอร์โทรศัพท์}`;
            case "เลขบัตรประชาชน":
              return rentalData.เลขบัตรประชาชน;
            case "หมายเลขใบขับขี่":
              return rentalData.หมายเลขใบขับขี่;
            case "ที่อยู่":
              return rentalData.ที่อยู่ลูกค้า;
            default:
              return sheet.getRange(customerRowIndex, headers.indexOf(header) + 1).getValue();
          }
        });
        sheet.getRange(customerRowIndex, 1, 1, headers.length).setValues([updatedRowData]);
        Logger.log(`[CustomerManager] อัปเดตข้อมูลโปรไฟล์ลูกค้าสำเร็จ`);
      }

      // จัดการประวัติการเช่า
      const historyCell = sheet.getRange(customerRowIndex, historyIndex + 1);
      let history = (historyCell.getValue() || '').split(',').map(s => s.trim()).filter(Boolean);

      if (mode === 'ADD') {
        if (!history.includes(rentalData.หมายเลขการจอง)) history.push(rentalData.หมายเลขการจอง);
      } else if (mode === 'DELETE') {
        history = history.filter(b => b !== bookingNumberToDelete);
      } else if (mode === 'UPDATE') {
        history = history.filter(b => b !== oldBookingNumber);
        if (!history.includes(rentalData.หมายเลขการจอง)) history.push(rentalData.หมายเลขการจอง);
      }

      historyCell.setValue(history.join(', '));
      Logger.log(`[CustomerManager] อัปเดตประวัติการเช่าสำเร็จ: ${history.join(', ')}`);

    } else if (mode === 'ADD') {
      // -- ไม่พบลูกค้า -> สร้างใหม่ --
      Logger.log("[CustomerManager] ไม่พบลูกค้าเดิม, กำลังสร้างใหม่...");
      const newCustomer = {
        'ชื่อ-นามสกุล': rentalData.ชื่อลูกค้า,
        'เบอร์โทรศัพท์': rentalData.เบอร์โทรศัพท์,
        'เลขบัตรประชาชน': rentalData.เลขบัตรประชาชน,
        'หมายเลขใบขับขี่': rentalData.หมายเลขใบขับขี่,
        'ที่อยู่': rentalData.ที่อยู่ลูกค้า,
        'ประวัติการเช่า (หมายเลขการจอง)': rentalData.หมายเลขการจอง,
        'สถานะ': 'ปกติ'
      };
      addNewCustomer(newCustomer, sheetID);
    }

  } catch (e) {
    Logger.log(`[CustomerManager] ❌ เกิดข้อผิดพลาด: ${e.toString()}`);
  }
}




// =======================================================================
// ⭐ (ฟังก์ชันใหม่) สำหรับหน้า "ปรับปรุงฐานข้อมูล"
// =======================================================================



/**
 * (ฉบับสมบูรณ์ V.4) วิเคราะห์ฐานข้อมูลลูกค้า
 * @param {string} sheetID - ID ของ Google Sheet
 * @returns {object} ผลการวิเคราะห์ (ตรวจสอบลูกค้าตกหล่นจาก "หมายเลขการจอง")
 */
function analyzeCustomerDatabase(sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const customerSheet = ss.getSheetByName(CUSTOMERS_SHEET);
    const rentalSheet = ss.getSheetByName(RENTAL_SHEET);

    // --- ฟังก์ชันช่วยในการแปลงแถวข้อมูล (ป้องกัน Date Object) ---
    const convertRowToObject = (headers, row) => {
      const obj = {};
      headers.forEach((header, i) => {
        const cellValue = row[i];
        obj[header] = (cellValue instanceof Date && !isNaN(cellValue)) ? cellValue.toISOString() : cellValue;
      });
      return obj;
    };

    // --- ส่วนที่ 1: วิเคราะห์ข้อมูลซ้ำซ้อนใน "ข้อมูลลูกค้า" (เหมือนเดิม) ---
    const duplicateCustomers = [];
    if (customerSheet && customerSheet.getLastRow() > 1) {
      // (โค้ดส่วนวิเคราะห์หาข้อมูลซ้ำซ้อนเหมือนเดิมทุกประการ)
    }

    // --- ⭐ ส่วนที่ 2: (แก้ไข) วิเคราะห์หารายการเช่าที่ยังไม่มีใน "ข้อมูลลูกค้า" ---
    const missingCustomers = [];
    if (rentalSheet && customerSheet && rentalSheet.getLastRow() > 1) {

      // 2.1 สร้าง Set ของ "หมายเลขการจอง" ทั้งหมดที่มีอยู่แล้วในประวัติลูกค้า
      const customerData = customerSheet.getDataRange().getValues();
      const customerHeaders = customerData.shift();
      const historyIndex = customerHeaders.indexOf("ประวัติการเช่า (หมายเลขการจอง)");
      const allExistingBookings = new Set();

      customerData.forEach(row => {
        const historyString = row[historyIndex] || '';
        historyString.split(',').map(s => s.trim()).filter(Boolean).forEach(bookingNo => {
          allExistingBookings.add(bookingNo);
        });
      });

      // 2.2 วนลูปใน "รายการเช่า" เพื่อหา booking ที่ยังไม่มีใน Set
      const rentalData = rentalSheet.getDataRange().getValues();
      const rentalHeaders = rentalData.shift();
      const rentalBookingIndex = rentalHeaders.indexOf("หมายเลขการจอง");

      const addedMissingBookings = new Set(); // ป้องกันการแสดงผลซ้ำจาก rental sheet
      rentalData.forEach(row => {
        const bookingNo = String(row[rentalBookingIndex] || '').trim();

        // ถ้าเจอ booking number และยังไม่มีในประวัติของลูกค้าคนไหนเลย -> ถือว่าตกหล่น
        if (bookingNo && !allExistingBookings.has(bookingNo) && !addedMissingBookings.has(bookingNo)) {
          const rentalCustomer = convertRowToObject(rentalHeaders, row);
          missingCustomers.push(rentalCustomer);
          addedMissingBookings.add(bookingNo);
        }
      });
    }

    return { success: true, analysis: { duplicates: duplicateCustomers, missing: missingCustomers } };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}



/**
 * (อัปเกรด) รวมข้อมูลลูกค้าที่ซ้ำซ้อน
 * @param {string} sheetID - ID ของ Google Sheet
 * @param {string} primaryCustomerId - รหัสลูกค้าหลักที่จะเก็บไว้
 * @param {Array<string>} customerIdsToDelete - อาร์เรย์ของรหัสลูกค้าที่จะลบ
 */
function mergeDuplicateCustomers(sheetID, primaryCustomerId, customerIdsToDelete) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(CUSTOMERS_SHEET);

    // ⭐ แก้ไข: อ่านข้อมูลทั้งหมดอีกครั้งเพื่อให้ได้ข้อมูลล่าสุด
    let data = sheet.getDataRange().getValues();
    const headers = data.shift();
    const idColumnIndex = headers.indexOf("รหัสลูกค้า");
    const historyIndex = headers.indexOf("ประวัติการเช่า (หมายเลขการจอง)");

    let primaryCustomerRowIndex = -1;
    const rowsToDelete = [];
    const allHistories = new Set();

    data.forEach((row, index) => {
      const customerId = row[idColumnIndex];
      // รวบรวมประวัติการเช่าจากทุกรายการ (ทั้งที่เก็บไว้และที่จะลบ)
      if (customerId === primaryCustomerId || customerIdsToDelete.includes(customerId)) {
        (row[historyIndex] || '').split(',').map(s => s.trim()).filter(Boolean).forEach(h => allHistories.add(h));
      }
      // หาตำแหน่งของแถวที่จะเก็บและลบ
      if (customerId === primaryCustomerId) {
        primaryCustomerRowIndex = index + 2; // +2 เพราะ data ไม่มี header และ index เป็น 0-based
      } else if (customerIdsToDelete.includes(customerId)) {
        rowsToDelete.push(index + 2);
      }
    });

    if (primaryCustomerRowIndex === -1) {
      return { success: false, message: "ไม่พบข้อมูลลูกค้าหลักที่จะรวม" };
    }

    // 1. อัปเดตประวัติการเช่าของลูกค้าหลัก
    sheet.getRange(primaryCustomerRowIndex, historyIndex + 1).setValue(Array.from(allHistories).join(', '));
    Logger.log(`[mergeCustomers] อัปเดตประวัติของ ${primaryCustomerId} สำเร็จ`);

    // 2. ลบแถวที่ซ้ำซ้อน (ลบจากล่างขึ้นบนเพื่อไม่ให้ index เพี้ยน)
    rowsToDelete.sort((a, b) => b - a).forEach(rowIndex => {
      sheet.deleteRow(rowIndex);
      Logger.log(`[mergeCustomers] ลบแถวที่ ${rowIndex} สำเร็จ`);
    });

    // ⭐ แก้ไข: บังคับให้ Apps Script อัปเดตชีตทันที
    SpreadsheetApp.flush();

    return { success: true, message: "รวมข้อมูลลูกค้าสำเร็จ!" };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}



/**
 * เพิ่มลูกค้าที่ตกหล่นเข้าสู่ฐานข้อมูล
 */
function addMissingCustomersToDatabase(sheetID, missingCustomers) {
  try {
    let addedCount = 0;
    missingCustomers.forEach(customer => {
      const newCustomer = {
        'ชื่อ-นามสกุล': customer.ชื่อลูกค้า,
        'เบอร์โทรศัพท์': customer.เบอร์โทรศัพท์,
        'เลขบัตรประชาชน': customer.เลขบัตรประชาชน,
        'หมายเลขใบขับขี่': customer.หมายเลขใบขับขี่,
        'ที่อยู่': customer.ที่อยู่ลูกค้า,
        'ประวัติการเช่า (หมายเลขการจอง)': customer.หมายเลขการจอง,
        'สถานะ': 'ปกติ'
      };
      const result = addNewCustomer(newCustomer, sheetID);
      if (result.success) {
        addedCount++;
      }
    });
    return { success: true, message: `เพิ่มลูกค้าที่ตกหล่น ${addedCount} รายการสำเร็จ!` };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}





/**
 * ตรวจสอบว่ามีเลขบัตรประชาชนนี้ในฐานข้อมูลลูกค้าแล้วหรือไม่
 * @param {string} sheetID - ID ของ Google Sheet
 * @param {string} idCard - เลขบัตรประชาชนที่ต้องการตรวจสอบ
 * @param {string} currentCustomerId - รหัสลูกค้าปัจจุบัน (กรณีแก้ไข เพื่อไม่ให้เช็คตัวเอง)
 * @returns {object} ผลลัพธ์การตรวจสอบ { isDuplicate: true/false }
 */
function checkDuplicateIdCard(sheetID, idCard, currentCustomerId) {
  try {
    if (!idCard) {
      return { success: true, isDuplicate: false }; // ถ้าไม่มีเลขบัตร ก็ไม่ซ้ำ
    }

    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(CUSTOMERS_SHEET);
    if (!sheet || sheet.getLastRow() < 2) {
      return { success: true, isDuplicate: false };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    const idCardIndex = headers.indexOf("เลขบัตรประชาชน");
    const customerIdIndex = headers.indexOf("รหัสลูกค้า");

    const idCardToFind = String(idCard).trim();

    for (const row of data) {
      const idCardInSheet = String(row[idCardIndex] || '').trim();
      const customerIdInSheet = String(row[customerIdIndex] || '').trim();

      // ถ้าเจอเลขบัตรซ้ำ และไม่ใช่รหัสลูกค้าคนเดียวกันกับที่กำลังแก้ไข
      if (idCardInSheet === idCardToFind && customerIdInSheet !== currentCustomerId) {
        return { success: true, isDuplicate: true, customerId: customerIdInSheet };
      }
    }

    return { success: true, isDuplicate: false };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}





/**
 * (ฉบับยกเครื่องใหม่) วิเคราะห์ภาพรวมลูกค้าทั้งหมดจากฐานข้อมูล
 * @param {string} sheetID - ID ของ Google Sheet
 * @returns {object} ผลการวิเคราะห์ (เริ่มต้นจาก "ข้อมูลลูกค้า" เพื่อความแม่นยำสูงสุด)
 */
function getCustomerOverviewAnalysis(sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const customerSheet = ss.getSheetByName(CUSTOMERS_SHEET);
    const rentalSheet = ss.getSheetByName(RENTAL_SHEET);

    if (!customerSheet || !rentalSheet || customerSheet.getLastRow() < 2 || rentalSheet.getLastRow() < 2) {
      return { success: false, message: "ไม่พบข้อมูลลูกค้าหรือข้อมูลการเช่า" };
    }

    // --- 1. เตรียมข้อมูล ---
    const customerData = customerSheet.getDataRange().getValues();
    const customerHeaders = customerData.shift();
    const customerIdIndex = customerHeaders.indexOf("รหัสลูกค้า");
    const customerNameIndex = customerHeaders.indexOf("ชื่อ-นามสกุล");
    const customerHistoryIndex = customerHeaders.indexOf("ประวัติการเช่า (หมายเลขการจอง)");
    const customerStatusIndex = customerHeaders.indexOf("สถานะ");
    const customerDateIndex = customerHeaders.indexOf("วันที่สร้าง");

    const rentalData = rentalSheet.getDataRange().getValues();
    const rentalHeaders = rentalData.shift();
    const rentalBookingIndex = rentalHeaders.indexOf("หมายเลขการจอง");
    const totalAmountIndex = rentalHeaders.indexOf("ค่าเช่ารวมทั้งหมด");
    const carIndex = rentalHeaders.indexOf("รถ");
    const channelIndex = rentalHeaders.indexOf("ช่องทางการจอง");

    // --- 2. สร้าง "แผนที่" ข้อมูลการเช่าเพื่อการค้นหาที่รวดเร็ว ---
    const rentalDetailsMap = new Map();
    rentalData.forEach(row => {
      const bookingNo = row[rentalBookingIndex];
      if (bookingNo) {
        rentalDetailsMap.set(bookingNo, {
          total: parseFloat(row[totalAmountIndex]) || 0,
          car: row[carIndex],
          channel: row[channelIndex] || "ไม่ระบุ"
        });
      }
    });

    // --- 3. วิเคราะห์จาก "ข้อมูลลูกค้า" เป็นหลัก ---
    const customerAnalysis = customerData.map(row => {
      const historyString = row[customerHistoryIndex] || '';
      const rentalHistory = historyString.split(',').map(s => s.trim()).filter(Boolean);

      let totalSpending = 0;
      rentalHistory.forEach(bookingNo => {
        if (rentalDetailsMap.has(bookingNo)) {
          totalSpending += rentalDetailsMap.get(bookingNo).total;
        }
      });

      return {
        id: row[customerIdIndex],
        name: row[customerNameIndex],
        rentalCount: rentalHistory.length,
        totalSpending: totalSpending,
        status: row[customerStatusIndex],
        createdDate: row[customerDateIndex]
      };
    });

    // --- 4. คำนวณ Key Metrics ---
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalCustomers = customerAnalysis.length;
    const newCustomersThisMonth = customerAnalysis.filter(c => c.createdDate && new Date(c.createdDate) >= firstDayOfMonth).length;
    const blacklistedCustomers = customerAnalysis.filter(c => c.status === 'Blacklist').length;
    const repeatCustomersCount = customerAnalysis.filter(c => c.rentalCount > 1).length;
    const customersWithRentals = customerAnalysis.filter(c => c.rentalCount > 0).length;
    const repeatCustomerRate = customersWithRentals > 0 ? (repeatCustomersCount / customersWithRentals) * 100 : 0;

    // --- 5. จัดอันดับลูกค้าชั้นยอด ---
    const topSpenders = [...customerAnalysis].sort((a, b) => b.totalSpending - a.totalSpending).slice(0, 5)
      .map(c => ({ customerId: c.id, name: c.name, total: c.totalSpending }));

    const topFrequentRenters = [...customerAnalysis].sort((a, b) => b.rentalCount - a.rentalCount).slice(0, 5)
      .map(c => ({ customerId: c.id, name: c.name, count: c.rentalCount }));

    // --- 6. วิเคราะห์เชิงพฤติกรรม ---
    const carPopularity = {};
    const channelPopularity = {};
    rentalDetailsMap.forEach(details => {
      if (details.car) carPopularity[details.car] = (carPopularity[details.car] || 0) + 1;
      if (details.channel) channelPopularity[details.channel] = (channelPopularity[details.channel] || 0) + 1;
    });

    const topCars = Object.entries(carPopularity).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => ({ name, count }));
    const topChannels = Object.entries(channelPopularity).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));

    // --- 7. รวบรวมผลลัพธ์ ---
    const analysis = {
      keyMetrics: {
        totalCustomers, newCustomersThisMonth, blacklistedCustomers,
        repeatCustomerRate: repeatCustomerRate.toFixed(2) + "%",
      },
      topCustomers: { topSpenders, topFrequentRenters },
      behavioralInsights: { topCars, topChannels }
    };

    return { success: true, analysis: analysis };
  } catch (e) {
    Logger.log(`[getCustomerOverviewAnalysis] Error: ${e.toString()}`);
    return { success: false, message: e.toString() };
  }
}






/**
 * ดึงข้อมูลตารางรับส่งรถเฉพาะของวันนี้จาก Cache ของ getSummaryData
 * เพื่อให้หน้า Schedule โหลดได้เร็วขึ้นเมื่อเปิดดูวันปัจจุบัน
 * @param {string} sheetID - ไอดีของ Google Sheet
 * @returns {Object} - ผลลัพธ์พร้อมข้อมูล pickups และ returns ของวันนี้
 */
function getTodayScheduleFromCache(sheetID) {
  const cache = CacheService.getScriptCache();
  const cacheKey = `summary_v2_${sheetID}`; // ใช้ Key เดียวกับ Summary
  const cached = cache.get(cacheKey);

  if (cached) {
    Logger.log("[Cache HIT] พบข้อมูลในแคชของ Summary สำหรับหน้า Schedule");
    const summaryData = JSON.parse(cached);
    // ส่งกลับเฉพาะข้อมูลที่หน้า Schedule ต้องการ
    return {
      success: true,
      data: {
        pickups: summaryData.todayPickups || [],
        returns: summaryData.todayReturns || []
      }
    };
  } else {
    // ถ้าไม่พบ Cache (เช่น เปิดหน้า Schedule เป็นหน้าแรก)
    // ให้เรียก getSummaryData() เพื่อสร้าง Cache และดึงข้อมูลมาใหม่
    Logger.log("[Cache MISS] ไม่พบข้อมูลในแคชของ Summary, กำลังเรียก getSummaryData() ใหม่...");
    try {
      const summaryData = getSummaryData(sheetID); // เรียกฟังก์ชันเดิมเพื่อสร้างแคช
      return {
        success: true,
        data: {
          pickups: summaryData.todayPickups || [],
          returns: summaryData.todayReturns || []
        }
      };
    } catch (e) {
      Logger.log(`เกิดข้อผิดพลาดในการเรียก getSummaryData: ${e.message}`);
      return { success: false, message: e.message };
    }
  }
}


/** ===========================
 *  SUMMARY: รถว่างตลอดช่วง + รถที่จอง 1-2 วัน
 *  ใช้ช่วงเวลาจากผู้ใช้ + PrepTime เหมือน findAvailableCars
 *  ส่งกลับข้อมูลพร้อมจัดกลุ่มตาม "รุ่น"
 *  =========================== */



/****************** DEBUG ******************/
const AVSUM_DEBUG = true;
const AVSUM_MAX_DETAIL = 120;
const AVSUM_TZ = (() => { try { return Session.getScriptTimeZone(); } catch (e) { return 'Asia/Bangkok'; } })();
function avfmt(d) { if (!(d instanceof Date) || isNaN(d)) return String(d); return Utilities.formatDate(d, AVSUM_TZ, "yyyy-MM-dd'T'HH:mm:ss"); }
function avlog(tag, data) { if (!AVSUM_DEBUG) return; try { Logger.log('[AVSUM] ' + tag + ' :: ' + (typeof data === 'string' ? data : JSON.stringify(data))); } catch (e) { Logger.log('[AVSUM] ' + tag + ' :: <unserializable>'); } }

/****************** HELPERS ******************/
function groupCarsByModel_(cars) {
  const map = {};
  (cars || []).forEach(c => { if (!c) return; const m = (c['รุ่น'] != null ? String(c['รุ่น']).trim() : '') || '(ไม่ระบุรุ่น)'; map[m] = (map[m] || 0) + 1; });
  const arr = Object.entries(map).map(([model, count]) => ({ model, count }));
  try { arr.sort((a, b) => a.model.localeCompare(b.model, 'th')); } catch (_) { arr.sort((a, b) => a.model.localeCompare(b.model)); }
  return arr;
}
function parseDateTimeFlexible(dateVal, timeVal) {
  if (dateVal === null || dateVal === undefined || dateVal === '') return null;
  let d;
  if (dateVal instanceof Date) { d = new Date(dateVal.getFullYear(), dateVal.getMonth(), dateVal.getDate(), 0, 0, 0, 0); }
  else if (typeof dateVal === 'number') { d = new Date(Math.round((dateVal - 25569) * 86400 * 1000)); }
  else { const t = new Date(dateVal); if (isNaN(t)) return null; d = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 0, 0, 0, 0); }
  let hh = 0, mm = 0;
  if (timeVal instanceof Date) { hh = timeVal.getHours(); mm = timeVal.getMinutes(); }
  else if (typeof timeVal === 'number') { const mins = Math.round((timeVal % 1) * 24 * 60); hh = Math.floor(mins / 60); mm = mins % 60; }
  else if (typeof timeVal === 'string' && timeVal.trim()) { const m = timeVal.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/); if (m) { hh = +m[1]; mm = +m[2]; } }
  d.setHours(hh, mm, 0, 0); return d;
}
function fmtDate(d) { return d instanceof Date && !isNaN(d) ? Utilities.formatDate(d, AVSUM_TZ, 'yyyy-MM-dd') : ''; }
function fmtTime(d) { return d instanceof Date && !isNaN(d) ? Utilities.formatDate(d, AVSUM_TZ, 'HH:mm') : ''; }
function normalizePlate(s) { return String(s || '').replace(/\s+/g, '').toLowerCase(); }
function pick(v, keys) { for (let i = 0; i < keys.length; i++) { const k = keys[i]; if (v[k] !== undefined && v[k] !== null && String(v[k]).trim() !== '') return v[k]; } return null; }
function slimCar(c) { // คืนเฉพาะฟิลด์ที่หน้าบ้านใช้
  return {
    'รหัสรถ': c['รหัสรถ'], 'ยี่ห้อ': c['ยี่ห้อ'], 'รุ่น': c['รุ่น'], 'ทะเบียน': c['ทะเบียน'],
    'สี': c['สี'], 'ค่าประกันความเสียหาย': c['ค่าประกันความเสียหาย'],
    'ประเภท': c['ประเภท'], 'ราคาเช่าต่อวัน': c['ราคาเช่าต่อวัน']
  };
}
/** จับคู่รถจากรายการเช่า (log เส้นทาง) */
function findCarForRental_Logged(allCars, rental, idx) {
  const plateColRaw = pick(rental, ['ทะเบียนรถ', 'ทะเบียน']);
  const plateCol = normalizePlate(plateColRaw);
  if (plateCol) {
    const byPlate = (allCars || []).find(c => normalizePlate(c['ทะเบียน']) === plateCol);
    if (byPlate) { avlog('MATCH[' + idx + ']', { by: 'plate_col', plate: plateColRaw }); return byPlate; }
  }
  const carStr = String(pick(rental, ['รถ']) || '').trim();
  if (carStr) {
    const m = carStr.match(/\(([^)]+)\)/); const plateInStr = m ? normalizePlate(m[1]) : '';
    if (plateInStr) {
      const byText = (allCars || []).find(c => normalizePlate(c['ทะเบียน']) === plateInStr);
      if (byText) { avlog('MATCH[' + idx + ']', { by: 'plate_in_text', plate: m[1] }); return byText; }
    }
    const byBM = (allCars || []).find(c => carStr.includes(String(c['ยี่ห้อ'] || '').trim()) && carStr.includes(String(c['รุ่น'] || '').trim()));
    if (byBM) { avlog('MATCH[' + idx + ']', { by: 'brand+model' }); return byBM; }
    const byM = (allCars || []).find(c => String(c['รุ่น'] || '') && carStr.includes(String(c['รุ่น']).trim()));
    if (byM) { avlog('MATCH[' + idx + ']', { by: 'model_only' }); return byM; }
  }
  avlog('MATCH[' + idx + ']', { by: 'fail', plateCol: plateColRaw, carStr });
  return null;
}

/****************** MAIN ******************/


function findAvailabilitySummary(pickupDate, pickupTime, returnDate, returnTime, prepTimeMinutes, sheetID) {
  const LOG_PREFIX_AVS = '[findAvSummary DEBUG] ';
  Logger.log(LOG_PREFIX_AVS + '🚀 เริ่มทำงาน (V. soonAvailable)...');
  Logger.log(LOG_PREFIX_AVS + '📥 Parameters: ' + JSON.stringify({ pickupDate, pickupTime, returnDate, returnTime, prepTimeMinutes, sheetID }));
  try {
    if (!pickupDate || !pickupTime || !returnDate || !returnTime) throw new Error('กรุณากรอกข้อมูลวันที่และเวลาให้ครบถ้วน');

    prepTimeMinutes = Number(prepTimeMinutes); if (!isFinite(prepTimeMinutes)) prepTimeMinutes = 0;

    const pickupDT = parseDateTimeFlexible(pickupDate, pickupTime); // วันเวลาที่ user ต้องการรับ
    const returnDT = parseDateTimeFlexible(returnDate, returnTime); // วันเวลาที่ user ต้องการคืน
    Logger.log(LOG_PREFIX_AVS + '⏰ Requested Window: ' + avfmt(pickupDT) + ' - ' + avfmt(returnDT));
    if (!pickupDT || isNaN(pickupDT)) throw new Error('รูปแบบวันที่/เวลารับรถไม่ถูกต้อง');
    if (!returnDT || isNaN(returnDT)) throw new Error('รูปแบบวันที่/เวลาคืนรถไม่ถูกต้อง');
    if (returnDT <= pickupDT) throw new Error('วันที่คืนต้องมากกว่าวันที่รับ');

    // Adjusted window สำหรับเช็ค overlap ทั่วไป
    const adjPickup = new Date(pickupDT.getTime() - prepTimeMinutes * 60 * 1000);
    const adjReturn = new Date(returnDT.getTime() + prepTimeMinutes * 60 * 1000);
    Logger.log(LOG_PREFIX_AVS + '⏰ Adjusted Window (for overlap check): ' + avfmt(adjPickup) + ' - ' + avfmt(adjReturn) + ' (Prep: ' + prepTimeMinutes + ' min)');

    // --- โหลดข้อมูล ---
    const allReadyCars = getAvailableCars(sheetID); // รถทั้งหมดที่สถานะ "พร้อมให้เช่า"
    const rentals = getRentalRecords(sheetID); // รายการเช่าทั้งหมด
    Logger.log(LOG_PREFIX_AVS + '📊 โหลดข้อมูล: Ready Cars=' + (allReadyCars ? allReadyCars.length : 0) + ', Rentals=' + (rentals ? rentals.length : 0));

    // --- 1) รถว่างตลอดช่วง ---
    const freeCarsRaw = (allReadyCars || []).filter((car, i) => {
      try {
        Logger.log(LOG_PREFIX_AVS + '   🔍 [Free] Checking car[' + i + ']: ' + (car ? `${car.ยี่ห้อ} ${car.รุ่น} (${car.ทะเบียน})` : 'INVALID CAR'));
        if (!car || !car.ยี่ห้อ) { // ตรวจสอบข้อมูลรถเบื้องต้น
          Logger.log(LOG_PREFIX_AVS + '      ⚠️ ข้ามรถคันนี้เนื่องจากข้อมูลไม่สมบูรณ์ (อาจไม่มี ยี่ห้อ)');
          return false;
        }
        const isAvail = isCarAvailable(car, rentals, adjPickup, adjReturn, LOG_PREFIX_AVS + '   ');
        Logger.log(LOG_PREFIX_AVS + '      ➡️ [Free] Result: ' + (isAvail ? '✅ Available' : '❌ Not Available'));
        return isAvail;
      } catch (e) {
        Logger.log(LOG_PREFIX_AVS + '      💥 [Free] Error checking car[' + i + ']: ' + e.toString());
        return false;
      }
    });
    const freeCars = freeCarsRaw.map(slimCar);
    const freeByModel = groupCarsByModel_(freeCarsRaw);
    Logger.log(LOG_PREFIX_AVS + '✅ Free Cars Raw Count: ' + freeCarsRaw.length);

    // --- 2) รถที่จอง 1–2 วัน และทับช่วงค้นหา ---
    const MAX_MS_2_DAYS = 2 * 24 * 60 * 60 * 1000;
    const shortRentals = (rentals || []).filter((r, idx) => {
      try {
        const statusStr = String(pick(r, ['สถานะ']) || '').toLowerCase();
        if (/(ยกเลิก|cancel|คืนรถ|ปิดงาน)/.test(statusStr)) return false;
        const din = pick(r, ['วันเข้า', 'วันที่เข้า', 'วันที่เช่า', 'รับรถวันที่', 'วันรับ']);
        const dout = pick(r, ['วันคืน', 'วันที่คืน', 'กำหนดคืน', 'คืนรถวันที่', 'วันส่งคืน']);
        const tin = pick(r, ['เวลารับรถ', 'เวลาเข้า', 'เวลารับ']);
        const tout = pick(r, ['เวลาคืนรถ', 'เวลาออก', 'เวลาคืน']);
        const rStart = parseDateTimeFlexible(din, tin);
        const rEnd = parseDateTimeFlexible(dout, tout);
        if (!(rStart && rEnd && !isNaN(rStart) && !isNaN(rEnd))) return false; // เช็ควันที่ให้ถูกต้องด้วย
        const dur = rEnd.getTime() - rStart.getTime();
        if (!(dur > 0 && dur <= MAX_MS_2_DAYS)) return false;
        const overlaps = (rStart < adjReturn) && (rEnd > adjPickup); // แก้เงื่อนไข overlap ให้แม่นยำขึ้น
        // if(idx<AVSUM_MAX_DETAIL) avlog('FILTER_SHORT['+idx+']',{rStart:avfmt(rStart),rEnd:avfmt(rEnd), overlaps}); // Log เพิ่มเติมถ้าต้องการ
        return overlaps;
      } catch (e) { return false; }
    });
    Logger.log(LOG_PREFIX_AVS + '📊 Short Rentals Found (1-2 days overlap): ' + shortRentals.length);
    const shortBookedRows = [];
    const shortDistinctCarPlates = new Set(); // เก็บทะเบียนรถที่ไม่ซ้ำ
    shortRentals.forEach((r, i) => {
      if (!r) return;
      const car = findCarForRental_Logged(allReadyCars, r, i);
      if (!car || !car.ยี่ห้อ || !car.รุ่น || !car.ทะเบียน) return;

      const din = pick(r, ['วันเข้า', 'วันที่เข้า', 'วันที่เช่า', 'รับรถวันที่', 'วันรับ']);
      const dout = pick(r, ['วันคืน', 'วันที่คืน', 'กำหนดคืน', 'คืนรถวันที่', 'วันส่งคืน']);
      const tin = pick(r, ['เวลารับรถ', 'เวลาเข้า', 'เวลารับ']);
      const tout = pick(r, ['เวลาคืนรถ', 'เวลาออก', 'เวลาคืน']);
      const rs = parseDateTimeFlexible(din, tin);
      const re = parseDateTimeFlexible(dout, tout);
      if (!rs || !re || isNaN(rs) || isNaN(re)) return; // ตรวจสอบวันที่อีกครั้ง

      shortBookedRows.push({
        ...slimCar(car),
        pickup: fmtDate(rs), // ใช้ YYYY-MM-DD เพื่อ consistency ภายใน
        pickupTime: fmtTime(rs),
        return: fmtDate(re), // ใช้ YYYY-MM-DD
        returnTime: fmtTime(re),
        bookingId: pick(r, ['หมายเลขการจอง', 'BookingID', 'รหัสการจอง']) || ''
      });
      shortDistinctCarPlates.add(normalizePlate(car.ทะเบียน)); // เพิ่มทะเบียนรถที่ไม่ซ้ำ
    });
    const shortBookedByModel = groupCarsByModel_(shortBookedRows.filter(car => shortDistinctCarPlates.has(normalizePlate(car.ทะเบียน)))); // จัดกลุ่มจากรถที่ไม่ซ้ำ
    Logger.log(LOG_PREFIX_AVS + '✅ Short Booked Rows Count: ' + shortBookedRows.length + ', Distinct Cars: ' + shortDistinctCarPlates.size);


    // --- 3) รถที่กำลังจะว่าง (คืนวันเดียวกับวันที่รับ) ---
    Logger.log(LOG_PREFIX_AVS + '🔵 Finding Soon Available Cars...');
    const soonAvailableCars = [];
    const pickupDateStr = fmtDate(pickupDT); // วันที่รับรถที่ user ค้นหา (YYYY-MM-DD)
    Logger.log(LOG_PREFIX_AVS + '   Target Return Date: ' + pickupDateStr);

    rentals.forEach((rental, i) => {
      try {
        const statusStr = String(pick(rental, ['สถานะ']) || '').toLowerCase();
        // ข้ามรายการที่ไม่เกี่ยวข้อง หรือ จบไปแล้ว
        if (/(ยกเลิก|cancel|คืนรถแล้ว|ปิดงาน)/.test(statusStr)) return;

        const returnD = pick(rental, ['วันคืน', 'วันที่คืน', 'กำหนดคืน', 'คืนรถวันที่', 'วันส่งคืน']);
        const returnT = pick(rental, ['เวลาคืนรถ', 'เวลาออก', 'เวลาคืน']);
        const rentalReturnDT = parseDateTimeFlexible(returnD, returnT);

        // ตรวจสอบว่าเป็น Date ที่ถูกต้อง และเป็นวันเดียวกับ pickupDateStr หรือไม่
        if (!rentalReturnDT || isNaN(rentalReturnDT) || fmtDate(rentalReturnDT) !== pickupDateStr) {
          return;
        }
        Logger.log(LOG_PREFIX_AVS + `   [Soon] Found potential rental ${rental.หมายเลขการจอง} returning on ${pickupDateStr} at ${fmtTime(rentalReturnDT)}`);

        // หารถคันนี้ใน allReadyCars
        const car = findCarForRental_Logged(allReadyCars, rental, `soon-${i}`);
        if (!car || !car.ยี่ห้อ || !car.รุ่น || !car.ทะเบียน) {
          Logger.log(LOG_PREFIX_AVS + '      ❓ [Soon] Could not find matching car in allReadyCars.');
          return; // ไม่พบรถ หรือข้อมูลรถไม่สมบูรณ์
        }
        Logger.log(LOG_PREFIX_AVS + `      🚗 [Soon] Matched Car: ${car.ยี่ห้อ} ${car.รุ่น} (${car.ทะเบียน})`);


        // เวลาที่รถจะพร้อมใช้งานจริง (เวลาคืน + เวลาเตรียมรถ)
        const carAvailableFromDT = new Date(rentalReturnDT.getTime() + prepTimeMinutes * 60 * 1000);
        Logger.log(LOG_PREFIX_AVS + `      ⏱️ [Soon] Car potentially available from: ${avfmt(carAvailableFromDT)}`);

        // --- เงื่อนไขสำคัญ: รถต้องว่างตั้งแต่ carAvailableFromDT จนถึง adjReturn ---
        // และ เวลาที่รถพร้อมใช้ ต้องไม่เกินเวลาคืนที่ user ต้องการ (adjReturn)
        if (carAvailableFromDT < adjReturn) {
          const isFreeLater = isCarAvailableAfterReturn(car, rentals, carAvailableFromDT, adjReturn, rental.หมายเลขการจอง, LOG_PREFIX_AVS + '      ');
          Logger.log(LOG_PREFIX_AVS + `      ➡️ [Soon] Is free until requested return? ${isFreeLater ? '✅ Yes' : '❌ No'}`);

          if (isFreeLater) {
            soonAvailableCars.push({
              ...slimCar(car),
              actualReturnTime: fmtTime(rentalReturnDT) // เวลาคืนจริงของรถคันนี้
            });
            Logger.log(LOG_PREFIX_AVS + '      ✅ Added to Soon Available list.');
          }
        } else {
          Logger.log(LOG_PREFIX_AVS + '      ⚠️ [Soon] Car available time is after requested return time. Skipping.');
        }

      } catch (e) {
        Logger.log(LOG_PREFIX_AVS + `   💥 [Soon] Error processing rental ${rental.หมายเลขการจอง || i}: ${e.toString()}`);
      }
    });
    const soonAvailableByModel = groupCarsByModel_(soonAvailableCars);
    Logger.log(LOG_PREFIX_AVS + '✅ Soon Available Cars Count: ' + soonAvailableCars.length);


    // --- สร้างผลลัพธ์ ---
    const result = {
      success: true,
      window: {
        pickupDate, pickupTime, returnDate, returnTime,
        prepTimeMinutes,
        adjustedPickupISO: adjPickup.toISOString(),
        adjustedReturnISO: adjReturn.toISOString()
      },
      totals: {
        totalReadyCars: (allReadyCars || []).length,
        freeAllPeriod: freeCars.length,
        shortBookedCount: shortDistinctCarPlates.size, // จำนวนรถที่ไม่ซ้ำ
        soonAvailableCount: soonAvailableCars.length // จำนวนรถที่จะว่าง
      },
      freeByModel,
      shortBookedByModel, // Grouped ของรถที่ไม่ซ้ำ
      soonAvailableByModel, // Grouped ของรถที่จะว่าง
      freeCars,            // array รถว่างตลอดช่วง
      shortBookedCars: shortBookedRows, // array รถจองสั้น (อาจมีรถซ้ำ แต่เวลาต่างกัน)
      soonAvailableCars    // array รถที่จะว่าง
    };

    Logger.log(LOG_PREFIX_AVS + '🏁 ผลลัพธ์สุดท้ายที่จะส่งกลับ:');
    try {
      Logger.log(LOG_PREFIX_AVS + '   Totals: ' + JSON.stringify(result.totals));
      Logger.log(LOG_PREFIX_AVS + '   Free Models: ' + JSON.stringify(result.freeByModel));
      Logger.log(LOG_PREFIX_AVS + '   Short Models: ' + JSON.stringify(result.shortBookedByModel));
      Logger.log(LOG_PREFIX_AVS + '   Soon Models: ' + JSON.stringify(result.soonAvailableByModel)); // Log เพิ่ม
    } catch (e) {
      Logger.log(LOG_PREFIX_AVS + '   (ไม่สามารถ Stringify ผลลัพธ์บางส่วนได้)');
    }
    return result;

  } catch (err) {
    Logger.log(LOG_PREFIX_AVS + '💥 เกิดข้อผิดพลาดใน try block หลัก: ' + err.toString());
    Logger.log(LOG_PREFIX_AVS + '   Stack Trace: ' + err.stack);
    return { success: false, message: 'ไม่สามารถสรุปคิวรถได้: ' + (err && err.message ? err.message : String(err)) };
  }
}







/**
 * ตรวจสอบว่ารถว่างหรือไม่หลังจากถูกคืน ในช่วงเวลาที่กำหนด โดยไม่นับรายการเช่าที่เพิ่งจบไป
 * @param {Object} car - รถที่ต้องการตรวจสอบ
 * @param {Array} rentals - รายการเช่าทั้งหมด
 * @param {Date} checkStartDT - เวลาเริ่มต้นที่ต้องการให้รถว่าง (เวลาคืน + เวลาเตรียมรถ)
 * @param {Date} checkEndDT - เวลาสิ้นสุดที่ต้องการให้รถว่าง (เวลาคืนที่ค้นหา + เวลาเตรียมรถ)
 * @param {string} excludingBookingId - หมายเลขการจองของรายการเช่าที่เพิ่งจบไป (ไม่ต้องเช็คซ้ำ)
 * @param {string} logPrefix - สำหรับ Debug Log
 * @returns {boolean} true ถ้าว่าง, false ถ้าไม่ว่าง
 */
function isCarAvailableAfterReturn(car, rentals, checkStartDT, checkEndDT, excludingBookingId, logPrefix = '') {
  const LOG_PREFIX_ICAAR = logPrefix + '[isCarAvailAfterRet DEBUG] ';
  // *** เพิ่มการตรวจสอบ car object ก่อนใช้งาน ***
  if (!car || !car.ยี่ห้อ || !car.รุ่น || !car.ทะเบียน) {
    Logger.log(LOG_PREFIX_ICAAR + '❌ Invalid car object received. Returning false.');
    return false;
  }
  Logger.log(LOG_PREFIX_ICAAR + `🚗 Checking Car: ${car.ยี่ห้อ} ${car.รุ่น} (${car.ทะเบียน})`);
  Logger.log(LOG_PREFIX_ICAAR + `⏰ Check Window [${avfmt(checkStartDT)}] - [${avfmt(checkEndDT)}]`); // <-- LOG: ช่วงเวลาที่ต้องการให้ว่าง
  Logger.log(LOG_PREFIX_ICAAR + `🚫 Excluding Booking: ${excludingBookingId}`);

  if (checkStartDT >= checkEndDT) {
    Logger.log(LOG_PREFIX_ICAAR + '   ⚠️ Check Start >= Check End. Returning false.');
    return false;
  }

  const carRentals = rentals.filter(rental => {
    if (!rental || !rental.รถ || !rental.หมายเลขการจอง || rental.หมายเลขการจอง === excludingBookingId) return false;
    // *** ปรับปรุง: ตรวจสอบสถานะให้ครอบคลุม "คืนรถแล้ว" ด้วย ***
    const statusLower = (rental.สถานะ || '').toLowerCase();
    if (statusLower.includes("ยกเลิก") || statusLower.includes("cancel") || statusLower.includes("คืนรถแล้ว") || statusLower.includes("ปิดงาน")) return false; // <-- เพิ่ม "คืนรถแล้ว", "ปิดงาน"

    const rentalCarName = rental.รถ.toString();
    const carBrandModel = `${car.ยี่ห้อ} ${car.รุ่น}`;
    const carBrandModelPlate = `${carBrandModel} (${car.ทะเบียน})`;
    return rentalCarName === carBrandModel ||
      rentalCarName === carBrandModelPlate ||
      (rentalCarName.includes(car.ยี่ห้อ) &&
        rentalCarName.includes(car.รุ่น) &&
        rentalCarName.includes(car.ทะเบียน));
  });

  Logger.log(LOG_PREFIX_ICAAR + `   Found ${carRentals.length} other relevant rentals for this car to check against.`); // <-- LOG: จำนวนรายการเช่าอื่นที่ต้องเช็ค

  for (const rental of carRentals) {
    try {
      const rentalPickupDateTime = parseDateTime(rental.วันที่เช่า, rental.เวลารับรถ);
      const rentalReturnDateTime = parseDateTime(rental.วันที่คืน, rental.เวลาคืนรถ);

      if (!rentalPickupDateTime || isNaN(rentalPickupDateTime) || !rentalReturnDateTime || isNaN(rentalReturnDateTime)) {
        Logger.log(LOG_PREFIX_ICAAR + `      ⚠️ Skipping rental ${rental.หมายเลขการจอง} due to invalid date/time.`);
        continue;
      }

      // <-- LOG: รายละเอียดรายการเช่าอื่นที่กำลังตรวจสอบ
      Logger.log(LOG_PREFIX_ICAAR + `      🔄 Checking against rental [${rental.หมายเลขการจอง}] Window: [${avfmt(rentalPickupDateTime)}] - [${avfmt(rentalReturnDateTime)}]`);

      // ตรวจสอบ Overlap: (Rental End > Check Start) AND (Rental Start < Check End)
      const overlap = rentalReturnDateTime > checkStartDT && rentalPickupDateTime < checkEndDT;

      // <-- LOG: ผลการตรวจสอบ Overlap
      Logger.log(LOG_PREFIX_ICAAR + `         Overlap Check with [${avfmt(checkStartDT)}] - [${avfmt(checkEndDT)}]: ${overlap ? '❌ Yes (ชนกัน)' : '✅ No (ไม่ชน)'}`);

      if (overlap) {
        Logger.log(LOG_PREFIX_ICAAR + `   ➡️ Result: ❌ Not Available (Overlap detected with booking ${rental.หมายเลขการจอง})`); // <-- LOG: บอกว่าชนกับ Booking ไหน
        return false;
      }
    } catch (error) {
      Logger.log(LOG_PREFIX_ICAAR + `      💥 Error checking rental ${rental.หมายเลขการจอง}: ${error.toString()}`);
      Logger.log(LOG_PREFIX_ICAAR + `   ➡️ Result: ❌ Not Available (Error during check)`);
      return false;
    }
  }

  Logger.log(LOG_PREFIX_ICAAR + '   ➡️ Result: ✅ Available (No overlaps found in other rentals)');
  return true; // ไม่พบรายการเช่าอื่นที่ชน
}



function fmtDateThai(dateObj) {
  if (!dateObj || isNaN(dateObj)) return '';
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
}






// === ฟังก์ชันหลักที่ Frontend เรียกใช้ ===

function createQuotationPdf(data) {
  return createPdfFromSheetTemplate_({
    templateSheetName: 'quotationTemplate',
    outputSubfolderName: 'ใบเสนอราคา',
    prefixKey: 'รหัสใบเสนอราคา',
    formatKey: 'รูปแบบรหัสใบเสนอราคา',
    defaultPrefix: 'QUO-',
    dataForPlaceholders: data,
    fileNamePrefix: 'ใบเสนอราคา',
    counterKey: 'quotationCounter'
  });
}

function createCashBillPdf(data) {
  return createPdfFromSheetTemplate_({
    templateSheetName: 'cashBillTemplate',
    outputSubfolderName: 'บิลเงินสด',
    prefixKey: 'รหัสบิลเงินสด',
    formatKey: 'รูปแบบรหัสบิลเงินสด',
    defaultPrefix: 'CASH-',
    dataForPlaceholders: data,
    fileNamePrefix: 'บิลเงินสด',
    counterKey: 'cashBillCounter'
  });
}

function createTaxInvoicePdf(data) {
  return createPdfFromSheetTemplate_({
    templateSheetName: 'taxInvoiceTemplate',
    outputSubfolderName: 'ใบกำกับภาษี',
    prefixKey: 'รหัสใบกำกับภาษี',
    formatKey: 'รูปแบบรหัสใบกำกับภาษี',
    defaultPrefix: 'TAX-',
    dataForPlaceholders: data,
    fileNamePrefix: 'ใบกำกับภาษี',
    counterKey: 'taxInvoiceCounter'
  });
}


/**
 * =================================================================
 * HELPER FUNCTIONS (ฟังก์ชันเบื้องหลัง)
 * =================================================================
 */

/**
 * ฟังก์ชันกลางสำหรับสร้างเอกสาร PDF จาก Template ที่เป็น "ชีตย่อย"
 * @param {object} options - ค่าต่างๆ สำหรับการสร้างเอกสาร
 * @returns {object} ผลลัพธ์การทำงานพร้อม URL ของ PDF
 */
function createPdfFromSheetTemplate_(options) {
  let tempSheet = null; // ประกาศไว้นอก try-catch เพื่อใช้ใน finally

  try {
    const {
      templateSheetName,
      outputSubfolderName,
      prefixKey,
      formatKey, // Key สำหรับรูปแบบการรันเลข
      defaultPrefix,
      dataForPlaceholders,
      fileNamePrefix,
      counterKey
    } = options;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetID = ss.getId();

    // 1. ดึงข้อมูลการตั้งค่าทั้งหมด
    const configResult = getSystemConfig(sheetID);
    if (!configResult || !configResult.config) {
      throw new Error("ไม่สามารถโหลดข้อมูลการตั้งค่าระบบได้");
    }
    const config = configResult.config;

    const mainFolderId = config['IDโฟลเดอร์หลัก'];
    const prefix = config[prefixKey] || defaultPrefix;
    const numberFormat = config[formatKey] || 'continuous'; // ดึงรูปแบบการรันเลข

    if (!mainFolderId) {
      throw new Error("ยังไม่ได้ตั้งค่า 'IDโฟลเดอร์หลัก' ในหน้าตั้งค่าระบบ");
    }

    // 2. หาหรือสร้างโฟลเดอร์สำหรับเก็บไฟล์
    const mainFolder = DriveApp.getFolderById(mainFolderId);
    const outputFolder = findOrCreateSubfolder_(mainFolder, outputSubfolderName);

    // 3. หา Template Sheet จาก "ชีตปัจจุบัน"
    const templateSheet = ss.getSheetByName(templateSheetName);
    if (!templateSheet) {
      throw new Error(`ไม่พบ Template Sheet ชื่อ '${templateSheetName}'`);
    }

    // 4. สร้างเลขที่เอกสารใหม่โดยใช้รูปแบบที่กำหนด
    const docNumber = getNextDocNumber_(counterKey, prefix, numberFormat);
    const fileName = `${docNumber} - ${fileNamePrefix} - ${dataForPlaceholders.customerName}`;


    // 5. คัดลอก Template Sheet ที่มีอยู่แล้ว มาสร้างเป็นชีตชั่วคราว
    const tempSheetName = `temp_${fileName}_${new Date().getTime()}`;
    tempSheet = ss.getSheetByName(tempSheetName);
    if (tempSheet) {
      ss.deleteSheet(tempSheet); // ลบชีตชั่วคราวเก่าทิ้งถ้ามี
    }
    tempSheet = templateSheet.copyTo(ss).setName(tempSheetName);
    SpreadsheetApp.flush();


    // 7. แทนที่ Placeholders
    replacePlaceholdersInSheet_(tempSheet, {
      ...dataForPlaceholders,
      doc_number: docNumber,
      issue_date: new Date().toLocaleDateString('th-TH')
    });

    // 8. สร้าง PDF โดยใช้ URL Export (วิธีเดียวกับสัญญาเช่า)
    SpreadsheetApp.flush();
    const pdfExportUrl = `https://docs.google.com/spreadsheets/d/${sheetID}/export?format=pdf&gid=${tempSheet.getSheetId()}&size=a4&portrait=true&fitw=true&gridlines=false`;

    const response = UrlFetchApp.fetch(pdfExportUrl, {
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }
    });

    const pdfBlob = response.getBlob().setName(`${fileName}.pdf`);

    // 9. บันทึก PDF ไปยัง Folder ที่ถูกต้อง
    const pdfFile = outputFolder.createFile(pdfBlob);

    return {
      success: true,
      message: `สร้าง ${fileNamePrefix} สำเร็จ!`,
      docUrl: pdfFile.getUrl()
    };

  } catch (e) {
    Logger.log("Error in createPdfFromSheetTemplate_: " + e.stack);
    return { success: false, message: `เกิดข้อผิดพลาด: ${e.message}` };
  } finally {
    // 10. ลบชีตชั่วคราวทิ้งเสมอ ไม่ว่าจะสำเร็จหรือ error
    try {
      if (tempSheet) {
        SpreadsheetApp.getActiveSpreadsheet().deleteSheet(tempSheet);
      }
    } catch (cleanupError) {
      Logger.log("Error during cleanup of temp sheet: " + cleanupError.toString());
    }
  }
}

/**
 * Helper function: แทนที่ placeholders ในชีต
 */
function replacePlaceholdersInSheet_(sheet, data) {
  const textFinder = sheet.createTextFinder('{{.*?}}');
  const allOccurrences = textFinder.findAll();

  allOccurrences.forEach(range => {
    let text = range.getValue();
    const placeholder = text.match(/{{(.*?)}}/)[1].trim(); // ดึง key ภายใน {{...}}

    if (data.hasOwnProperty(placeholder)) {
      let value = data[placeholder];
      // จัดรูปแบบตัวเลขและวันที่
      if (placeholder.includes('price') && value) {
        value = parseFloat(value).toLocaleString('th-TH');
      }
      if (placeholder.includes('date') && value) {
        value = new Date(value).toLocaleDateString('th-TH');
      }
      range.setValue(text.replace(`{{${placeholder}}}`, value || ''));
    }
  });
}


/**
 * Helper function: หาหรือสร้างโฟลเดอร์ย่อย
 */
function findOrCreateSubfolder_(parentFolder, subfolderName) {
  const folders = parentFolder.getFoldersByName(subfolderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return parentFolder.createFolder(subfolderName);
  }
}

/**
 * Helper function: สร้างเลขที่เอกสาร (รองรับ Format)
 */
function getNextDocNumber_(counterKey, prefix, format) {
  const properties = PropertiesService.getScriptProperties();
  let counter = parseInt(properties.getProperty(counterKey) || '0', 10) + 1;
  properties.setProperty(counterKey, counter.toString());

  const now = new Date();
  const yearBE = now.getFullYear() + 543;
  const month = ('0' + (now.getMonth() + 1)).slice(-2);
  const day = ('0' + now.getDate()).slice(-2);
  const paddedCounter = ('0000' + counter).slice(-4);

  switch (format) {
    case 'ymd': return `${prefix}${yearBE}${month}${day}${paddedCounter}`;
    case 'ym': return `${prefix}${yearBE}${month}${paddedCounter}`;
    case 'y': return `${prefix}${yearBE}${paddedCounter}`;
    case 'continuous':
    default:
      return `${prefix}${yearBE.toString().slice(-2)}${month}-${paddedCounter}`;
  }
}







/**
 * ========================================================================
 * ⭐ ฟังก์ชันใหม่สำหรับจัดการ "แปลข้อความสรุปสัญญาเช่า"
 * ========================================================================
 */



/**
 * ดึงรายการคีย์ทั้งหมดจากชีต "แปลสรุปสัญญาเช่า"
 * @param {string} sheetID - ID ของ Google Sheet
 * @returns {Array} รายการคีย์ทั้งหมด
 */
function getSummaryTranslationKeys(sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(SUMMARY_TRANSLATION_SHEET);
    if (!sheet) {
      Logger.log("ไม่พบชีต '" + SUMMARY_TRANSLATION_SHEET + "'");
      return [];
    }

    // ดึงข้อมูลจากคอลัมน์ A เริ่มจากแถวที่ 2
    const keyRange = sheet.getRange("A2:A");
    const keyValues = keyRange.getValues();

    // กรองเอาเฉพาะค่าที่ไม่ว่างเปล่า
    const keys = keyValues
      .filter(row => row[0] !== "")
      .map(row => row[0]);

    return keys;
  } catch (error) {
    Logger.log("Error in getSummaryTranslationKeys: " + error.toString());
    throw new Error("ไม่สามารถดึงรายการคีย์ได้: " + error.toString());
  }
}

/**
 * ดึงข้อมูลแปลภาษาตามคีย์จากชีต "แปลสรุปสัญญาเช่า"
 * @param {string} key - คีย์ที่ต้องการ
 * @param {string} sheetID - ID ของ Google Sheet
 * @returns {Object} ข้อมูลแปลภาษา
 */
function getSummaryTranslationByKey(key, sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(SUMMARY_TRANSLATION_SHEET);

    if (!sheet) {
      return null;
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0]; // แถวแรกคือ headers (th, en, zh-CN, ...)
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) { // คอลัมน์ 0 คือ key
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) {
      return null;
    }

    const translation = {};
    headers.forEach((langCode, colIndex) => {
      if (colIndex > 0) { // เริ่มจากคอลัมน์ที่ 1 (th) เป็นต้นไป
        translation[langCode] = data[rowIndex][colIndex] || '';
      }
    });

    return translation;
  } catch (error) {
    Logger.log("Error in getSummaryTranslationByKey: " + error.toString());
    throw new Error("ไม่สามารถดึงข้อมูลแปลภาษาได้: " + error.toString());
  }
}

/**
 * อัปเดตข้อมูลแปลภาษาในชีต "แปลสรุปสัญญาเช่า"
 * @param {string} key - คีย์ที่ต้องการอัปเดต
 * @param {Object} translation - ข้อมูลแปลภาษาใหม่
 * @param {string} sheetID - ID ของ Google Sheet
 * @returns {Object} ผลลัพธ์การอัปเดต
 */
function updateSummaryTranslation(key, translation, sheetID) {
  try {
    const ss = SpreadsheetApp.openById(sheetID);
    const sheet = ss.getSheetByName(SUMMARY_TRANSLATION_SHEET);

    if (!sheet) {
      return { success: false, message: "ไม่พบชีต " + SUMMARY_TRANSLATION_SHEET };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        rowIndex = i + 1; // +1 เพราะแถวใน Sheet เริ่มที่ 1 แต่ Array เริ่มที่ 0
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, message: "ไม่พบคีย์ในระบบ" };
    }

    // สร้าง Array ข้อมูลที่จะอัปเดตตามลำดับของ headers
    const valuesToUpdate = [];
    headers.forEach((langCode, colIndex) => {
      if (colIndex > 0) { // ไม่ต้องอัปเดตคอลัมน์ key
        valuesToUpdate.push(translation[langCode] || '');
      }
    });

    // อัปเดตข้อมูลในแถวนั้นๆ เริ่มจากคอลัมน์ที่ 2 (B)
    sheet.getRange(rowIndex, 2, 1, valuesToUpdate.length).setValues([valuesToUpdate]);

    return { success: true, message: "อัปเดตข้อมูลแปลภาษาสำเร็จ" };
  } catch (error) {
    Logger.log("Error in updateSummaryTranslation: " + error.toString());
    return { success: false, message: "ไม่สามารถอัปเดตข้อมูลได้: " + error.toString() };
  }
}

/**
 * สร้างข้อความสรุปรายการเช่า (Server-side version)
 * @param {Object} rentalData - ข้อมูลรายการเช่า
 * @param {string} sheetID - ID ของ Google Sheet
 * @returns {string} ข้อความสรุป
 */
function generateSummary(rentalData, sheetID) {
  try {
    // กำหนดภาษาที่ใช้ - ใช้ภาษาเดียวกับสัญญาเช่า
    const language = rentalData.ภาษาสัญญาเช่า || 'th';

    // ดึง config จากชีต "ตั้งค่าระบบ"
    const ss = SpreadsheetApp.openById(sheetID);
    const configSheet = ss.getSheetByName("ตั้งค่าระบบ");
    if (!configSheet) {
      throw new Error("ไม่พบแผ่นงาน 'ตั้งค่าระบบ'");
    }

    // อ่านค่า config
    let summaryMessageTemplate = "";
    let extraHoursThreshold = 4;
    let bankName = "";
    let accountNumber = "";
    let accountName = "";
    let companyName = "";

    const configData = configSheet.getDataRange().getValues();
    for (let i = 0; i < configData.length; i++) {
      const key = configData[i][0];
      const value = configData[i][1];
      switch (key) {
        case "summaryMessageTemplate": summaryMessageTemplate = value || ""; break;
        case "จำนวนชั่วโมงคิดเพิ่มเป็นหนึ่งวัน": extraHoursThreshold = parseFloat(value) || 4; break;
        case "ชื่อธนาคาร": bankName = value || ""; break;
        case "หมายเลขบัญชีธนาคาร": accountNumber = value || ""; break;
        case "ชื่อบัญชี": accountName = value || ""; break;
        case "ชื่อบริษัท": companyName = value || ""; break;
      }
    }

    // ถ้าไม่มี template ให้ใช้ค่า default
    if (!summaryMessageTemplate) {
      summaryMessageTemplate = getDefaultSummaryTemplate(sheetID);
    }

    let summaryTemplate = summaryMessageTemplate;

    // ฟังก์ชันแปลงวันที่
    const parseDate = (dateString, timeString) => {
      try {
        let dateObj;
        if (dateString.includes('/')) {
          // dd/mm/yyyy format
          const parts = dateString.split('/');
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          let year = parseInt(parts[2], 10);
          if (year < 100) year += 2000;
          dateObj = new Date(year, month, day);
        } else {
          dateObj = new Date(dateString);
        }

        if (timeString && timeString.includes(':')) {
          const timeParts = timeString.split(':');
          const hours = parseInt(timeParts[0], 10);
          const minutes = parseInt(timeParts[1], 10);
          dateObj.setHours(hours, minutes, 0, 0);
        }

        return dateObj;
      } catch (error) {
        Logger.log('Error parsing date: ' + error.toString());
        return null;
      }
    };

    // แปลงวันที่
    const startDate = parseDate(rentalData.วันที่เช่า, rentalData.เวลารับรถ);
    const endDate = parseDate(rentalData.วันที่คืน, rentalData.เวลาคืนรถ);

    if (!startDate || !endDate) {
      Logger.log('Invalid dates in generateSummary');
      return 'Invalid date(s) in rental data';
    }

    // คำนวณความต่างในชั่วโมง
    const diffMs = Math.abs(endDate.getTime() - startDate.getTime());
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = Math.floor(diffHours % 24);

    // ใช้ค่า extraHoursThreshold ที่ดึงมาจาก config ด้านบนแล้ว

    // คำนวณจำนวนวันที่ต้องจ่าย
    let rentalDays = diffDays;
    if (remainingHours > extraHoursThreshold) {
      rentalDays += 1;
    }
    if (rentalDays === 0) rentalDays = 1;

    // สร้างข้อความแสดงระยะเวลาเช่า
    let rentalPeriodText = "";
    const daysText = translateSummaryKey('days', language, sheetID);
    const hoursText = translateSummaryKey('hours', language, sheetID);

    if (remainingHours > extraHoursThreshold) {
      rentalPeriodText = rentalDays + " " + daysText;
    } else {
      rentalPeriodText = diffDays + " " + daysText;
      if (remainingHours > 0) {
        rentalPeriodText += " " + remainingHours + " " + hoursText;
      }
    }

    // ฟังก์ชันจัดรูปแบบวันที่
    const formatDateForSummary = (dateStr) => {
      if (!dateStr) return '-';
      try {
        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear() + (language === 'th' ? 543 : 0);
        return day + '/' + month + '/' + year;
      } catch (e) {
        return dateStr;
      }
    };

    // ฟังก์ชันจัดรูปแบบเงิน
    const formatCurrency = (amount) => {
      if (!amount && amount !== 0) return '-';
      const num = parseFloat(amount);
      return num.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    };

    // สร้างข้อมูลสำหรับแทนที่ placeholder
    const placeholderData = {
      "{{หมายเลขการจอง}}": rentalData.หมายเลขการจอง || "-",
      "{{ชื่อลูกค้า}}": rentalData.ชื่อลูกค้า || "-",
      "{{เบอร์โทรศัพท์}}": rentalData.เบอร์โทรศัพท์ || "-",
      "{{รถ}}": rentalData.รถ || "-",
      "{{ทะเบียนรถ}}": rentalData.ทะเบียนรถ || "-",
      "{{วันที่เช่า}}": formatDateForSummary(rentalData.วันที่เช่า),
      "{{วันที่คืน}}": formatDateForSummary(rentalData.วันที่คืน),
      "{{จำนวนวัน}}": rentalPeriodText,
      "{{เวลารับรถ}}": rentalData.เวลารับรถ || "-",
      "{{เวลาคืนรถ}}": rentalData.เวลาคืนรถ || "-",
      "{{สถานที่รับรถ}}": rentalData.สถานที่รับรถ || "-",
      "{{สถานที่คืนรถ}}": rentalData.สถานที่คืนรถ || "-",
      "{{ราคาต่อวัน}}": formatCurrency(rentalData.ราคา),
      "{{ค่าเช่ารวมทั้งหมด}}": formatCurrency(rentalData.ค่าเช่ารวมทั้งหมด),
      "{{ค่ามัดจำคิวรถ}}": formatCurrency(rentalData.ค่ามัดจำคิวรถ),
      "{{เงินประกันความเสียหาย}}": formatCurrency(rentalData.เงินประกันความเสียหาย),
      "{{ค่าบริการเพิ่มเติม}}": formatCurrency(rentalData.ค่าบริการเพิ่มเติม),
      "{{รวมยอดชำระวันรับรถ}}": formatCurrency(rentalData.รวมยอดชำระวันรับรถ),
      "{{ส่วนลด}}": rentalData.ส่วนลด ? formatCurrency(rentalData.ส่วนลด) : "",
      "{{ลิงก์สัญญาเช่า}}": rentalData.ลิงก์สัญญาเช่า || "-",
      "{{วันที่เวลาปัจจุบัน}}": formatDateForSummary(new Date()),
      "{{ชื่อธนาคาร}}": bankName || "-",
      "{{หมายเลขบัญชีธนาคาร}}": accountNumber || "-",
      "{{ชื่อบัญชี}}": accountName || "-",
      "{{ชื่อบริษัท}}": companyName || "-"
    };

    // คำนวณสูตรค่าเช่า
    const dailyRate = parseFloat(rentalData.ราคา) || 0;
    const baseRentalCost = rentalDays * dailyRate;
    placeholderData["{{สูตรค่าเช่า}}"] = rentalDays + " x " + formatCurrency(dailyRate) + " = " + formatCurrency(baseRentalCost);

    let summaryText = summaryTemplate;

    // แทนที่ translation keys [[key]]
    const translationRegex = /\[\[(.*?)\]\]/g;
    summaryText = summaryText.replace(translationRegex, function (match, key) {
      const translated = translateSummaryKey(key, language, sheetID);

      // กรณีพิเศษสำหรับ extra_hours_info
      if (key === "extra_hours_info") {
        if (remainingHours > 0 && remainingHours > extraHoursThreshold && translated) {
          return translated.replace("{0}", extraHoursThreshold.toString());
        }
        return "";
      }

      return translated || match;
    });

    // แทนที่ placeholders {{key}}
    for (var placeholder in placeholderData) {
      if (placeholderData.hasOwnProperty(placeholder)) {
        summaryText = summaryText.split(placeholder).join(placeholderData[placeholder]);
      }
    }

    return summaryText;

  } catch (error) {
    Logger.log('generateSummary Error: ' + error.toString());
    return 'Unable to generate summary: ' + error.toString();
  }
}

/**
 * ฟังก์ชันช่วยแปลภาษาสำหรับ summary
 */
function translateSummaryKey(key, language, sheetID) {
  try {
    const translation = getSummaryTranslationByKey(key, sheetID);
    if (translation && translation[language]) {
      return translation[language];
    }
    return key; // fallback to key itself
  } catch (error) {
    Logger.log('translateSummaryKey Error: ' + error.toString());
    return key;
  }
}
