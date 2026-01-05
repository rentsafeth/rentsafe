// =============================================================================
// Performance Monitoring Utility
// ใช้สำหรับวัดประสิทธิภาพของ function ต่างๆ
// =============================================================================

class PerformanceTimer {
  constructor(functionName) {
    this.functionName = functionName;
    this.startTime = new Date();
    this.checkpoints = [];
    this.logs = [];

    this.log(`🚀 [START] ${functionName}`);
  }

  // เพิ่ม checkpoint สำหรับวัดเวลาแต่ละขั้นตอน
  checkpoint(label) {
    const now = new Date();
    const elapsed = now - this.startTime;
    const lastCheckpoint = this.checkpoints.length > 0
      ? this.checkpoints[this.checkpoints.length - 1]
      : { time: this.startTime };
    const sinceLast = now - lastCheckpoint.time;

    const checkpoint = {
      label: label,
      time: now,
      elapsed: elapsed,
      sinceLast: sinceLast
    };

    this.checkpoints.push(checkpoint);
    this.log(`  ⏱️  [${this.formatTime(elapsed)}] ${label} (+${this.formatTime(sinceLast)}ms)`);

    return checkpoint;
  }

  // จบการวัดเวลาและแสดงสรุป
  end() {
    const endTime = new Date();
    const totalTime = endTime - this.startTime;

    this.log(`✅ [END] ${this.functionName} - Total: ${this.formatTime(totalTime)}`);
    this.log('');
    this.log('📊 Summary:');
    this.log('━'.repeat(60));

    // แสดงสรุปแต่ละ checkpoint
    this.checkpoints.forEach((cp, index) => {
      const percentage = ((cp.sinceLast / totalTime) * 100).toFixed(1);
      this.log(`  ${index + 1}. ${cp.label.padEnd(40)} ${this.formatTime(cp.sinceLast).padStart(8)} (${percentage}%)`);
    });

    this.log('━'.repeat(60));
    this.log(`  TOTAL${' '.repeat(42)} ${this.formatTime(totalTime).padStart(8)} (100%)`);
    this.log('');

    return {
      functionName: this.functionName,
      totalTime: totalTime,
      checkpoints: this.checkpoints,
      logs: this.logs
    };
  }

  // Format เวลาให้อ่านง่าย
  formatTime(ms) {
    if (ms < 1000) {
      return `${ms}ms`;
    } else {
      return `${(ms / 1000).toFixed(2)}s`;
    }
  }

  // เก็บ log
  log(message) {
    Logger.log(message);
    this.logs.push(message);
  }
}


// =============================================================================
// ตัวอย่างการใช้งาน: แทรกใน generateRentalContract
// =============================================================================

function generateRentalContract_WithPerformanceMonitoring(bookingNumber, language, sheetID) {
  const perf = new PerformanceTimer('generateRentalContract');

  try {
    // 1. Get rental data
    const rentalData = getRentalByBookingNumber(bookingNumber, sheetID);
    perf.checkpoint('1. getRentalByBookingNumber');

    if (!rentalData.success) {
      return { success: false, message: "ไม่พบข้อมูลรายการเช่า: " + rentalData.message };
    }

    // 2. Get config
    const ss = SpreadsheetApp.openById(sheetID);
    const configSheet = ss.getSheetByName("ตั้งค่าระบบ");
    perf.checkpoint('2. Open Spreadsheet & Config Sheet');

    if (!configSheet) {
      return { success: false, message: "ไม่พบแผ่นงาน 'ตั้งค่าระบบ'" };
    }

    // อ่าน Config
    const configData = configSheet.getDataRange().getValues();
    let rootFolderId = null;
    let extraHoursThreshold = 4;
    let bankName = "", accountNumber = "", accountName = "";
    let promptpayNumber = "", qrCodeMethod = "auto", qrCodeUrl = "";
    let companyName = "", shopLogoUrl = "";

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
        case "วิธีการใช้QRCode": qrCodeMethod = value || "auto"; break;
        case "URLรูปQRCode": qrCodeUrl = value || ""; break;
        case "ชื่อบริษัท": companyName = value || ""; break;
        case "URLรูปโลโก้ร้าน": shopLogoUrl = value || ""; break;
      }
    }
    perf.checkpoint('3. Read & Parse Config Data');

    if (!rootFolderId) {
      return { success: false, message: "ไม่พบค่า 'IDโฟลเดอร์สัญญาเช่า' ในแผ่นงานตั้งค่าระบบ" };
    }

    // 3. Get translations
    const translationsResult = getContractTranslations(language, sheetID);
    perf.checkpoint('4. getContractTranslations');

    if (!translationsResult.success) {
      return { success: false, message: "ไม่สามารถดึงข้อมูลแปลได้: " + translationsResult.message };
    }
    const translationsMap = translationsResult.data || {};

    // 4. Create folder
    const folderName = bookingNumber;
    const folder = createOrGetFolder(folderName, rootFolderId);
    perf.checkpoint('5. createOrGetFolder');

    if (!folder) {
      return { success: false, message: "ไม่สามารถสร้างโฟลเดอร์สำหรับเก็บสัญญาเช่าได้" };
    }

    // 5. หา Template Sheet และ Fuel Type
    const carName = rentalData.data.รถ;
    let templateSheetName = "Template_สัญญาเช่า_รถยนต์";
    let fuelType = "[FUELTYPE_1]";
    let useZone = "[ZONE1]";
    const carListSheet = ss.getSheetByName("รายชื่อรถ");

    if (carListSheet) {
      const carListData = carListSheet.getDataRange().getValues();
      // ... (logic การหารถ - ตัดให้สั้น)
    }
    perf.checkpoint('6. Read Car List & Find Template');

    // 6. คำนวณ Duration
    const rentalDuration = calculateRentalDuration(rentalData.data, extraHoursThreshold, language, sheetID);
    perf.checkpoint('7. calculateRentalDuration');

    const formattedPickupTime = formatTimeOnly(rentalData.data.เวลารับรถ);
    const formattedReturnTime = formatTimeOnly(rentalData.data.เวลาคืนรถ);

    // 7. สร้าง Placeholder Map
    const placeholderMap = {};
    // ... (สร้าง placeholders - ตัดให้สั้น)
    perf.checkpoint('8. Create Placeholder Map');

    // 8. Copy Template Sheet
    const templateSheet = ss.getSheetByName(templateSheetName);
    if (!templateSheet) {
      throw new Error("ไม่พบแผ่นงานเทมเพลต '" + templateSheetName + "'");
    }

    const tempSheetName = "temp_" + bookingNumber;
    let tempSheet = ss.getSheetByName(tempSheetName);
    if (tempSheet) {
      ss.deleteSheet(tempSheet);
    }
    tempSheet = templateSheet.copyTo(ss).setName(tempSheetName);
    SpreadsheetApp.flush();
    perf.checkpoint('9. Copy Template Sheet');

    // 9. แทนที่ Placeholders
    const targetRange = tempSheet.getDataRange();
    const targetData = targetRange.getValues();
    // ... (logic แทนที่ - ตัดให้สั้น)
    perf.checkpoint('10. Replace Placeholders in Memory');

    // 10. จัดการ QR Code
    // ... (logic QR Code - ตัดให้สั้น)
    perf.checkpoint('11. Handle QR Code');

    // 11. จัดการ Shop Logo
    // ... (logic Logo - ตัดให้สั้น)
    perf.checkpoint('12. Handle Shop Logo');

    // 12. สร้าง PDF
    SpreadsheetApp.flush();
    const spreadsheetId = ss.getId();
    const pdfExportUrl = 'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/export?format=pdf'
             + '&size=7&portrait=true&fitw=true'
             + '&top_margin=0.2&bottom_margin=0.2&left_margin=0.2&right_margin=0.2'
             + '&sheetnames=false&printtitle=false&pagenumbers=false&gridlines=false&fzr=false'
             + '&gid=' + tempSheet.getSheetId();

    const response = UrlFetchApp.fetch(pdfExportUrl, {
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    });
    perf.checkpoint('13. Export to PDF (UrlFetchApp)');

    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      throw new Error("Failed to fetch PDF. Response code: " + responseCode);
    }

    const blob = response.getBlob();
    if (!blob || blob.getContentType() !== 'application/pdf') {
      throw new Error("Failed to generate PDF blob or invalid content type.");
    }

    // 13. บันทึกไฟล์ PDF
    const pdfFileName = "สัญญาเช่า_" + bookingNumber + ".pdf";
    const pdfFile = folder.createFile(blob.setName(pdfFileName));
    perf.checkpoint('14. Save PDF to Drive');

    // 14. ตั้งค่าการแชร์
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    perf.checkpoint('15. Set File Sharing');

    // 15. อัพเดตลิงก์สัญญาเช่า
    try {
      updateRentalContract(bookingNumber, pdfFile.getUrl(), sheetID);
      perf.checkpoint('16. updateRentalContract');
    } catch (updateError) {
      Logger.log("Warning: ไม่สามารถอัพเดตลิงก์สัญญาเช่าได้: " + updateError.toString());
    }

    // 16. ลบ temp sheet
    ss.deleteSheet(tempSheet);
    perf.checkpoint('17. Delete Temp Sheet');

    // จบการวัดเวลา
    const perfResult = perf.end();

    return {
      success: true,
      pdfUrl: pdfFile.getUrl(),
      message: "สร้างสัญญาเช่าสำเร็จ",
      performance: perfResult // เพิ่มข้อมูล performance
    };

  } catch (e) {
    Logger.log("Error generating contract: " + e.toString());
    perf.checkpoint('ERROR: ' + e.message);
    perf.end();

    return { success: false, message: "เกิดข้อผิดพลาดในการสร้างสัญญาเช่า: " + e.message };
  }
}


// =============================================================================
// Test Function - วัดประสิทธิภาพ generateRentalContract ตัวจริง
// =============================================================================

function testPerformance_generateRentalContract() {
  // ⚠️ แก้ไขค่าเหล่านี้ก่อนรัน
  const testBookingNumber = "KP00013"; // ⬅️ เปลี่ยนเป็นหมายเลขจริงที่มีในระบบ
  const testLanguage = "th";
  const testSheetID = "1qLubMynT8kMnb4gBt9xBayD-BHrfHN08jRZNDqwPiAA"; // ⬅️ เปลี่ยนเป็น Sheet ID จริง

  Logger.log('='.repeat(80));
  Logger.log('🧪 PERFORMANCE TEST: generateRentalContract (ORIGINAL)');
  Logger.log('='.repeat(80));
  Logger.log('');
  Logger.log(`📝 Test Parameters:`);
  Logger.log(`   - Booking Number: ${testBookingNumber}`);
  Logger.log(`   - Language: ${testLanguage}`);
  Logger.log(`   - Sheet ID: ${testSheetID}`);
  Logger.log('');
  Logger.log('⏳ Starting test...');
  Logger.log('');

  // เริ่มจับเวลา
  const startTime = new Date();
  Logger.log(`🚀 [START] ${startTime.toISOString()}`);
  Logger.log('');

  // เรียก function จริง
  const result = generateRentalContract(
    testBookingNumber,
    testLanguage,
    testSheetID
  );

  // จบการจับเวลา
  const endTime = new Date();
  const totalTime = endTime - startTime;

  Logger.log('');
  Logger.log(`✅ [END] ${endTime.toISOString()}`);
  Logger.log('');
  Logger.log('━'.repeat(80));
  Logger.log(`⏱️  TOTAL TIME: ${(totalTime / 1000).toFixed(2)}s (${totalTime}ms)`);
  Logger.log('━'.repeat(80));

  if (result.success) {
    Logger.log('');
    Logger.log('✅ Test completed successfully!');
    Logger.log(`📄 PDF URL: ${result.pdfUrl}`);
  } else {
    Logger.log('');
    Logger.log('❌ Test failed!');
    Logger.log(`💥 Error: ${result.message}`);
  }

  Logger.log('');
  Logger.log('='.repeat(80));

  return {
    ...result,
    performanceTime: totalTime,
    performanceSeconds: (totalTime / 1000).toFixed(2)
  };
}


// =============================================================================
// Benchmark Function - เปรียบเทียบก่อนและหลัง
// =============================================================================

function benchmarkComparison() {
  // ⚠️ แก้ไขค่าเหล่านี้ก่อนรัน
  const testBookingNumber = "KP00013"; // ⬅️ เปลี่ยนเป็นหมายเลขจริง
  const testLanguage = "th";
  const testSheetID = "1qLubMynT8kMnb4gBt9xBayD-BHrfHN08jRZNDqwPiAA"; // ⬅️ เปลี่ยนเป็น Sheet ID จริง
  const iterations = 3; // จำนวนครั้งที่ต้องการทดสอบ

  Logger.log('='.repeat(80));
  Logger.log('📊 BENCHMARK COMPARISON - generateRentalContract (ORIGINAL)');
  Logger.log('='.repeat(80));
  Logger.log(`Running ${iterations} iterations...`);
  Logger.log('');

  const results = [];

  for (let i = 0; i < iterations; i++) {
    Logger.log(`\n🔄 Iteration ${i + 1}/${iterations}`);
    Logger.log('─'.repeat(80));

    // วัดเวลา
    const startTime = new Date();

    const result = generateRentalContract(
      testBookingNumber,
      testLanguage,
      testSheetID
    );

    const endTime = new Date();
    const totalTime = endTime - startTime;

    if (result.success) {
      results.push(totalTime);
      Logger.log(`✅ Iteration ${i + 1} completed in ${(totalTime / 1000).toFixed(2)}s`);
    } else {
      Logger.log(`❌ Iteration ${i + 1} failed: ${result.message}`);
    }

    // รอสักครู่ระหว่าง iteration
    if (i < iterations - 1) {
      Logger.log(`⏸️  Waiting 2 seconds before next iteration...`);
      Utilities.sleep(2000);
    }
  }

  // คำนวณค่าเฉลี่ย
  if (results.length > 0) {
    const avg = results.reduce((a, b) => a + b, 0) / results.length;
    const min = Math.min(...results);
    const max = Math.max(...results);
    const variance = results.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / results.length;
    const stdDev = Math.sqrt(variance);

    Logger.log('');
    Logger.log('='.repeat(80));
    Logger.log('📈 BENCHMARK RESULTS');
    Logger.log('='.repeat(80));
    Logger.log(`Total Iterations: ${results.length}`);
    Logger.log(`Average Time: ${(avg / 1000).toFixed(2)}s (${avg.toFixed(0)}ms)`);
    Logger.log(`Min Time: ${(min / 1000).toFixed(2)}s (${min.toFixed(0)}ms)`);
    Logger.log(`Max Time: ${(max / 1000).toFixed(2)}s (${max.toFixed(0)}ms)`);
    Logger.log(`Std Deviation: ${(stdDev / 1000).toFixed(2)}s (${stdDev.toFixed(0)}ms)`);
    Logger.log(`All Times: ${results.map(t => (t / 1000).toFixed(2) + 's').join(', ')}`);
    Logger.log('='.repeat(80));

    return {
      iterations: results.length,
      avgMs: avg,
      avgSec: (avg / 1000).toFixed(2),
      minMs: min,
      maxMs: max,
      stdDevMs: stdDev,
      allTimes: results
    };
  } else {
    Logger.log('');
    Logger.log('❌ No successful iterations to analyze');
    Logger.log('='.repeat(80));
    return null;
  }
}
