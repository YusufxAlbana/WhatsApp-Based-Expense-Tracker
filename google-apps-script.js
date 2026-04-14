/**
 * Google Apps Script – Expense Tracker
 * 
 * INSTRUKSI DEPLOY:
 * 1. Buka Google Apps Script di spreadsheet kamu
 * 2. Paste SELURUH kode ini, ganti kode lama
 * 3. Klik "Deploy" > "Manage Deployments" > Update deployment
 * 4. Pastikan "Who has access" = "Anyone"
 * 
 * PENTING: Script ini mendukung JSONP (parameter ?callback=) 
 * agar bisa diakses dari browser tanpa error CORS.
 */

const SHEET_NAME = 'Expenses'; // Ganti dengan nama sheet kamu

function doGet(e) {
  const params = e.parameter;
  const userId = params.userId;
  const callbackFn = params.callback; // JSONP callback

  let result;

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      result = { error: 'Sheet tidak ditemukan: ' + SHEET_NAME };
    } else {
      const data = sheet.getDataRange().getValues();
      const headers = data[0]; // Baris pertama = header
      
      // Filter berdasarkan userId (kolom "userId")
      const userIdColIdx = headers.indexOf('userId');
      
      const rows = data.slice(1)
        .filter(row => {
          if (!userId) return true; // Jika tidak ada filter, tampilkan semua
          return userIdColIdx >= 0 && String(row[userIdColIdx]) === String(userId);
        })
        .map((row, index) => {
          const obj = { rowIndex: index + 2 }; // +2 karena header di baris 1, data mulai baris 2
          headers.forEach((header, i) => {
            obj[header] = row[i];
          });
          return obj;
        });

      result = rows;
    }
  } catch (err) {
    result = { error: err.message };
  }

  // ── JSONP support: wrap result in callback function ──
  const jsonString = JSON.stringify(result);
  
  if (callbackFn) {
    // JSONP mode – browser akan eksekusi fungsi ini
    return ContentService
      .createTextOutput(`${callbackFn}(${jsonString})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  
  // Normal JSON mode (untuk penggunaan server-side)
  return ContentService
    .createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: 'Sheet tidak ditemukan' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const action = payload.action;

    // ── INSERT (default – dari WhatsApp Bot) ──
    if (!action || action === 'insert') {
      sheet.appendRow([
        payload.userId || '',
        payload.item || '',
        payload.amount || 0,
        payload.category || 'Lainnya',
        payload.tanggal || new Date().toISOString().split('T')[0],
        new Date().toISOString()
      ]);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── UPDATE ──
    if (action === 'update') {
      const rowIndex = payload.rowIndex;
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      if (payload.item !== undefined) {
        const col = headers.indexOf('item') + 1;
        if (col > 0) sheet.getRange(rowIndex, col).setValue(payload.item);
      }
      if (payload.amount !== undefined) {
        const col = headers.indexOf('amount') + 1;
        if (col > 0) sheet.getRange(rowIndex, col).setValue(payload.amount);
      }
      if (payload.category !== undefined) {
        const col = headers.indexOf('category') + 1;
        if (col > 0) sheet.getRange(rowIndex, col).setValue(payload.category);
      }

      return ContentService
        .createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── DELETE ──
    if (action === 'delete') {
      const rowIndex = payload.rowIndex;
      sheet.deleteRow(rowIndex);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Unknown action: ' + action }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
