/**
 * Google Apps Script – LedgerLink (Multi-Tab Multi-User Architecture)
 * 
 * INSTRUKSI DEPLOY (WAJIB DIIKUTI!):
 * 1. Buka ekstensi Google Apps Script di Google Sheets.
 * 2. Hapus yang lama, paste SELURUH kode baru ini.
 * 3. Simpan (Klik icon disket / Save).
 * 4. Klik "Deploy" > "Manage Deployments".
 * 5. Klik ikon PENSIL (Edit) di deployment aktif.
 * 6. Di bagian VERSION, pilih "New version" (JANGAN BIARKAN VERSI LAMA).
 * 7. Klik Deploy. Selesai!
 */

const INDEX_SHEET = 'INDEX';
const INDEX_HEADERS = ['DAFTAR USER', 'LINK NAVIGASI', 'TERAKHIR AKTIF', 'PASSWORD', 'NAMA', 'PHONE', 'WELCOME_SENT'];
const BUDGETS_SHEET = 'BUDGETS';
const BUDGETS_HEADERS = ['userId', 'budgetId', 'category', 'limit', 'color', 'notes', 'createdAt', 'updatedAt'];

function ensureUserRegistered(userId, password = '', name = '', phone = '') {
  if (!userId) return null;
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let indexSheet = ss.getSheetByName(INDEX_SHEET);
  if (!indexSheet) {
    indexSheet = ss.insertSheet(INDEX_SHEET);
    indexSheet.appendRow(INDEX_HEADERS);
    indexSheet.getRange(1, 1, 1, INDEX_HEADERS.length).setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
  } else {
    const headerRow = indexSheet.getRange(1, 1, 1, INDEX_HEADERS.length).getValues()[0];
    INDEX_HEADERS.forEach((header, index) => {
      if (headerRow[index] !== header) {
        indexSheet.getRange(1, index + 1).setValue(header).setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
      }
    });
  }

  const indexData = indexSheet.getDataRange().getValues();
  let userRowIndex = -1;
  for (let i = 1; i < indexData.length; i++) {
    if (String(indexData[i][0]).toLowerCase() === String(userId).toLowerCase()) {
      userRowIndex = i + 1;
      break;
    }
  }

  let userSheet = ss.getSheetByName(userId);
  let isNewUser = false;
  if (!userSheet) {
    userSheet = ss.insertSheet(userId);
    userSheet.appendRow(['userId', 'item', 'amount', 'category', 'tanggal', 'timestamp']);
    userSheet.getRange('A1:F1').setFontWeight('bold').setBackground('#0f9d58').setFontColor('white');
    isNewUser = true;
  }

  const timestamp = new Date().toLocaleString('id-ID');
  if (userRowIndex === -1) {
    const sheetId = userSheet.getSheetId();
    const linkFormula = `=HYPERLINK("#gid=${sheetId}", "KLIK: Buka Tab")`;
    indexSheet.appendRow([userId, linkFormula, timestamp, password, name, phone, false]);
  } else {
    indexSheet.getRange(userRowIndex, 3).setValue(timestamp);
    if (phone) {
      const phoneCol = INDEX_HEADERS.indexOf('PHONE') + 1;
      if (phoneCol > 0) {
        indexSheet.getRange(userRowIndex, phoneCol).setValue(phone);
      }
    }
  }

  return { userSheet, isNewUser };
}

function ensureBudgetsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(BUDGETS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(BUDGETS_SHEET);
    sheet.appendRow(BUDGETS_HEADERS);
    sheet.getRange(1, 1, 1, BUDGETS_HEADERS.length).setFontWeight('bold').setBackground('#fbbc05').setFontColor('black');
  } else {
    const headerRow = sheet.getRange(1, 1, 1, BUDGETS_HEADERS.length).getValues()[0];
    BUDGETS_HEADERS.forEach((header, index) => {
      if (headerRow[index] !== header) {
        sheet.getRange(1, index + 1).setValue(header).setFontWeight('bold').setBackground('#fbbc05').setFontColor('black');
      }
    });
  }
  return sheet;
}

function doGet(e) {
  const params = e.parameter;
  const userId = params.userId;
  const action = params.action;
  const callbackFn = params.callback;

  let result;
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'login') {
      const password = params.password || '';
      if (!userId || !password) {
        result = { success: false, error: 'Email dan password wajib diisi' };
      } else {
        const indexSheet = ss.getSheetByName(INDEX_SHEET);
        if (!indexSheet) {
          result = { success: false, error: 'Sistem sedang belum tersedia (INDEX belum dibuat)' };
        } else {
          const indexData = indexSheet.getDataRange().getValues();
          let foundUser = null;
          for (let i = 1; i < indexData.length; i++) {
            if (String(indexData[i][0]).toLowerCase() === String(userId).toLowerCase()) {
              foundUser = {
                id: indexData[i][0],
                password: indexData[i][3],
                name: indexData[i][4] || indexData[i][0].split('@')[0],
                phone: indexData[i][5] || ''
              };
              break;
            }
          }

          if (!foundUser) {
            result = { success: false, error: 'Email silakan periksa kembali atau belum terdaftar.' };
          } else if (String(foundUser.password) !== String(password)) {
            result = { success: false, error: 'Password yang dimasukkan salah.' };
          } else {
            result = { success: true, user: { id: foundUser.id, name: foundUser.name, email: foundUser.id, phone: foundUser.phone } };
          }
        }
      }
    } else if (action === 'lookupPhone') {
      const phone = params.phone || '';
      if (!phone) {
        result = { found: false, error: 'Phone parameter is required' };
      } else {
        const indexSheet = ss.getSheetByName(INDEX_SHEET);
        result = { found: false };
        if (indexSheet) {
          const indexData = indexSheet.getDataRange().getValues();
          for (let i = 1; i < indexData.length; i++) {
            if (String(indexData[i][5]).replace(/\D/g, '') === String(phone).replace(/\D/g, '')) {
              result = {
                found: true,
                userId: indexData[i][0],
                name: indexData[i][4] || indexData[i][0].split('@')[0],
                welcomeSent: String(indexData[i][6]).toLowerCase() === 'true'
              };
              break;
            }
          }
        }
      }
    } else if (action === 'getBudgets') {
      const budgetsSheet = ensureBudgetsSheet();
      const budgetData = budgetsSheet.getDataRange().getValues();
      if (budgetData.length > 1) {
        result = budgetData.slice(1).map((row, index) => {
          const obj = { rowIndex: index + 2 };
          BUDGETS_HEADERS.forEach((header, i) => {
            obj[header] = row[i];
          });
          return obj;
        }).filter(row => String(row.userId).toLowerCase() === String(userId).toLowerCase());
      } else {
        result = [];
      }
    } else {
      if (userId) {
        const userSheet = ss.getSheetByName(userId);
        if (userSheet) {
          const data = userSheet.getDataRange().getValues();
          const headers = data[0];
          let rows = [];
          if (data.length > 1) {
            rows = data.slice(1).map((row, index) => {
              const obj = { rowIndex: index + 2 };
              headers.forEach((header, i) => {
                obj[header] = row[i];
              });
              return obj;
            });
          }
          result = rows;
        } else {
          result = [];
        }
      } else {
        result = { error: 'userId tidak disediakan' };
      }
    }
  } catch (err) {
    result = { error: err.message };
  }

  const jsonString = JSON.stringify(result);
  if (callbackFn) {
    return ContentService.createTextOutput(`${callbackFn}(${jsonString})`).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(jsonString).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const userId = payload.userId;
    const action = payload.action || 'insert';
    const password = payload.password || '';
    const name = payload.name || '';
    const phone = payload.phone || '';

    if (!userId) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Silakan sediakan userId' })).setMimeType(ContentService.MimeType.JSON);
    }

    const { userSheet } = ensureUserRegistered(userId, password, name, phone);

    if (action === 'register') {
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'markWelcomeSent') {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const indexSheet = ss.getSheetByName(INDEX_SHEET);
      if (indexSheet) {
        const indexData = indexSheet.getDataRange().getValues();
        for (let i = 1; i < indexData.length; i++) {
          if (String(indexData[i][0]).toLowerCase() === String(userId).toLowerCase()) {
            const welcomeCol = INDEX_HEADERS.indexOf('WELCOME_SENT') + 1;
            if (welcomeCol > 0) {
              indexSheet.getRange(i + 1, welcomeCol).setValue(true);
              return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
            }
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'User not found' })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'insertBudget') {
      const budgetsSheet = ensureBudgetsSheet();
      const budgetId = payload.budgetId || `budget-${new Date().getTime()}`;
      budgetsSheet.appendRow([
        userId,
        budgetId,
        payload.category || '',
        payload.limit || 0,
        payload.color || '#25D366',
        payload.notes || '',
        new Date().toISOString(),
        new Date().toISOString()
      ]);
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'updateBudget') {
      const budgetsSheet = ensureBudgetsSheet();
      const budgetData = budgetsSheet.getDataRange().getValues();
      let updated = false;
      for (let i = 1; i < budgetData.length; i++) {
        if (String(budgetData[i][0]).toLowerCase() === String(userId).toLowerCase() && String(budgetData[i][1]) === String(payload.budgetId)) {
          const headers = BUDGETS_HEADERS;
          const rowIndex = i + 1;
          if (payload.category !== undefined) {
            const col = headers.indexOf('category') + 1;
            budgetsSheet.getRange(rowIndex, col).setValue(payload.category);
          }
          if (payload.limit !== undefined) {
            const col = headers.indexOf('limit') + 1;
            budgetsSheet.getRange(rowIndex, col).setValue(payload.limit);
          }
          if (payload.color !== undefined) {
            const col = headers.indexOf('color') + 1;
            budgetsSheet.getRange(rowIndex, col).setValue(payload.color);
          }
          if (payload.notes !== undefined) {
            const col = headers.indexOf('notes') + 1;
            budgetsSheet.getRange(rowIndex, col).setValue(payload.notes);
          }
          const updatedCol = headers.indexOf('updatedAt') + 1;
          budgetsSheet.getRange(rowIndex, updatedCol).setValue(new Date().toISOString());
          updated = true;
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: updated })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'deleteBudget') {
      const budgetsSheet = ensureBudgetsSheet();
      const budgetData = budgetsSheet.getDataRange().getValues();
      for (let i = 1; i < budgetData.length; i++) {
        if (String(budgetData[i][0]).toLowerCase() === String(userId).toLowerCase() && String(budgetData[i][1]) === String(payload.budgetId)) {
          budgetsSheet.deleteRow(i + 1);
          return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Budget not found' })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'insert') {
      userSheet.appendRow([
        userId,
        payload.item || '',
        payload.amount || 0,
        payload.category || 'Lainnya',
        payload.tanggal || new Date().toISOString().split('T')[0],
        new Date().toISOString()
      ]);
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'update') {
      const rowIndex = payload.rowIndex;
      if (!rowIndex) throw new Error('Row index required');
      const headers = userSheet.getRange(1, 1, 1, userSheet.getLastColumn()).getValues()[0];
      if (payload.item !== undefined) {
        const col = headers.indexOf('item') + 1;
        if (col > 0) userSheet.getRange(rowIndex, col).setValue(payload.item);
      }
      if (payload.amount !== undefined) {
        const col = headers.indexOf('amount') + 1;
        if (col > 0) userSheet.getRange(rowIndex, col).setValue(payload.amount);
      }
      if (payload.category !== undefined) {
        const col = headers.indexOf('category') + 1;
        if (col > 0) userSheet.getRange(rowIndex, col).setValue(payload.category);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'delete') {
      const rowIndex = payload.rowIndex;
      userSheet.deleteRow(rowIndex);
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Unknown action' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}
