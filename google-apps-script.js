/**
 * Google Apps Script – LedgerLink (Separate Budgets Sheet Architecture)
 * 
 * STRUKTUR:
 * - Sheet: INDEX (master user list)
 * - Sheet: {userId} (expenses only)
 * - Sheet: {userId}+BUDGETS (budgets only, per user)
 * 
 * INSTRUKSI DEPLOY:
 * 1. Hapus kode lama, paste SELURUH ini
 * 2. Klik Save
 * 3. Klik Deploy > Manage Deployments
 * 4. Edit deployment, pilih New version
 * 5. Deploy
 */

const INDEX_SHEET = 'INDEX';
const INDEX_HEADERS = ['DAFTAR USER', 'LINK NAVIGASI', 'TERAKHIR AKTIF', 'PASSWORD', 'NAMA', 'PHONE', 'WELCOME_SENT'];
const EXPENSE_HEADERS = ['userId', 'item', 'amount', 'category', 'tanggal', 'timestamp'];
const BUDGET_HEADERS = ['budgetId', 'category', 'limit', 'color', 'notes', 'createdAt', 'updatedAt'];

function getBudgetsSheetName(userId) {
  return userId + '+BUDGETS';
}

function ensureUserRegistered(userId, password = '', name = '', phone = '') {
  if (!userId) return null;
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create INDEX sheet
  let indexSheet = ss.getSheetByName(INDEX_SHEET);
  if (!indexSheet) {
    indexSheet = ss.insertSheet(INDEX_SHEET);
    indexSheet.appendRow(INDEX_HEADERS);
    indexSheet.getRange(1, 1, 1, INDEX_HEADERS.length).setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
  }

  // Find user in INDEX
  const indexData = indexSheet.getDataRange().getValues();
  let userRowIndex = -1;
  for (let i = 1; i < indexData.length; i++) {
    if (String(indexData[i][0]).toLowerCase() === String(userId).toLowerCase()) {
      userRowIndex = i + 1;
      break;
    }
  }

  // Create user sheet (expenses only)
  let userSheet = ss.getSheetByName(userId);
  if (!userSheet) {
    userSheet = ss.insertSheet(userId);
    userSheet.appendRow(EXPENSE_HEADERS);
    userSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#0f9d58').setFontColor('white');
  }

  // Create budgets sheet (separate)
  const budgetsSheetName = getBudgetsSheetName(userId);
  let budgetsSheet = ss.getSheetByName(budgetsSheetName);
  if (!budgetsSheet) {
    budgetsSheet = ss.insertSheet(budgetsSheetName);
    budgetsSheet.appendRow(BUDGET_HEADERS);
    budgetsSheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#fbbc05').setFontColor('black');
  }

  // Add or update user
  const timestamp = new Date().toLocaleString('id-ID');
  if (userRowIndex === -1) {
    const sheetId = userSheet.getSheetId();
    const linkFormula = `=HYPERLINK("#gid=${sheetId}", "KLIK: Buka Tab")`;
    indexSheet.appendRow([userId, linkFormula, timestamp, password, name, phone, false]);
  } else {
    indexSheet.getRange(userRowIndex, 3).setValue(timestamp);
  }

  return { userSheet, budgetsSheet };
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
      const indexSheet = ss.getSheetByName(INDEX_SHEET);
      const indexData = indexSheet ? indexSheet.getDataRange().getValues() : [];
      let foundUser = null;

      for (let i = 1; i < indexData.length; i++) {
        if (String(indexData[i][0]).toLowerCase() === String(userId).toLowerCase()) {
          foundUser = {
            id: indexData[i][0],
            password: indexData[i][3],
            name: indexData[i][4] || indexData[i][0].split('@')[0]
          };
          break;
        }
      }

      if (!foundUser) {
        result = { success: false, error: 'User tidak ditemukan' };
      } else if (String(foundUser.password) !== String(password)) {
        result = { success: false, error: 'Password salah' };
      } else {
        result = { success: true, user: { id: foundUser.id, name: foundUser.name, email: foundUser.id } };
      }
    } else if (action === 'lookupPhone') {
      const phone = params.phone || '';
      const indexSheet = ss.getSheetByName(INDEX_SHEET);
      const indexData = indexSheet ? indexSheet.getDataRange().getValues() : [];
      result = { found: false };

      for (let i = 1; i < indexData.length; i++) {
        if (String(indexData[i][5]).replace(/\D/g, '') === String(phone).replace(/\D/g, '')) {
          result = { found: true, userId: indexData[i][0], name: indexData[i][4] || indexData[i][0].split('@')[0], welcomeSent: String(indexData[i][6]).toLowerCase() === 'true' };
          break;
        }
      }
    } else if (action === 'getBudgets') {
      const budgetsSheetName = getBudgetsSheetName(userId);
      const budgetsSheet = ss.getSheetByName(budgetsSheetName);
      result = [];

      if (budgetsSheet) {
        const data = budgetsSheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] && data[i][0] !== '') {
            const obj = { rowIndex: i + 1 };
            for (let j = 0; j < BUDGET_HEADERS.length; j++) {
              obj[BUDGET_HEADERS[j]] = data[i][j];
            }
            result.push(obj);
          }
        }
      }
    } else if (userId) {
      // Get expenses
      const userSheet = ss.getSheetByName(userId);
      result = [];

      if (userSheet) {
        const data = userSheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] && data[i][0] !== '') {
            const obj = { rowIndex: i + 1 };
            for (let j = 0; j < EXPENSE_HEADERS.length; j++) {
              obj[EXPENSE_HEADERS[j]] = data[i][j];
            }
            result.push(obj);
          }
        }
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

    if (!userId) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'userId required' })).setMimeType(ContentService.MimeType.JSON);
    }

    const { userSheet, budgetsSheet } = ensureUserRegistered(userId, password, name);

    if (action === 'register') {
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'markWelcomeSent') {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const indexSheet = ss.getSheetByName(INDEX_SHEET);
      const indexData = indexSheet ? indexSheet.getDataRange().getValues() : [];

      for (let i = 1; i < indexData.length; i++) {
        if (String(indexData[i][0]).toLowerCase() === String(userId).toLowerCase()) {
          indexSheet.getRange(i + 1, 7).setValue(true);
          return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: false })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'insertBudget') {
      const budgetId = payload.budgetId || `budget-${Date.now()}`;
      budgetsSheet.appendRow([
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
      const data = budgetsSheet.getDataRange().getValues();
      for (let i = 0; i < data.length; i++) {
        if (String(data[i][0]) === String(payload.budgetId)) {
          const rowIndex = i + 1;
          if (payload.category !== undefined) budgetsSheet.getRange(rowIndex, 2).setValue(payload.category);
          if (payload.limit !== undefined) budgetsSheet.getRange(rowIndex, 3).setValue(payload.limit);
          if (payload.color !== undefined) budgetsSheet.getRange(rowIndex, 4).setValue(payload.color);
          if (payload.notes !== undefined) budgetsSheet.getRange(rowIndex, 5).setValue(payload.notes);
          budgetsSheet.getRange(rowIndex, 7).setValue(new Date().toISOString());
          return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: false })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'deleteBudget') {
      const data = budgetsSheet.getDataRange().getValues();
      for (let i = 0; i < data.length; i++) {
        if (String(data[i][0]) === String(payload.budgetId)) {
          budgetsSheet.deleteRow(i + 1);
          return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: false })).setMimeType(ContentService.MimeType.JSON);
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
      if (payload.item !== undefined) userSheet.getRange(rowIndex, 2).setValue(payload.item);
      if (payload.amount !== undefined) userSheet.getRange(rowIndex, 3).setValue(payload.amount);
      if (payload.category !== undefined) userSheet.getRange(rowIndex, 4).setValue(payload.category);
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'delete') {
      userSheet.deleteRow(payload.rowIndex);
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: false })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}
