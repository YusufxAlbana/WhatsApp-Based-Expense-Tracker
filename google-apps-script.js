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

// Fungsi bantuan untuk memastikan tab user dan index ada
function ensureUserRegistered(userId, password = '', name = '') {
  if (!userId) return null;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Cek atau Buat Sheet INDEX
  let indexSheet = ss.getSheetByName(INDEX_SHEET);
  if (!indexSheet) {
    indexSheet = ss.insertSheet(INDEX_SHEET);
    indexSheet.appendRow(['DAFTAR USER', 'LINK NAVIGASI', 'TERAKHIR AKTIF', 'PASSWORD', 'NAMA']);
    indexSheet.getRange('A1:E1').setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
  } else {
    if (indexSheet.getRange('D1').getValue() !== 'PASSWORD') {
      indexSheet.getRange('D1').setValue('PASSWORD').setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
      indexSheet.getRange('E1').setValue('NAMA').setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
    }
  }
  
  const indexData = indexSheet.getDataRange().getValues();
  let userRowIndex = -1;
  for (let i = 1; i < indexData.length; i++) {
    if (String(indexData[i][0]) === String(userId)) {
      userRowIndex = i + 1; // +1 karena getValues() index mulai 0, sheet row mulai 1
      break;
    }
  }

  // 2. Cek atau Buat Sheet Khusus Akun Tersebut
  let userSheet = ss.getSheetByName(userId);
  let isNewUser = false;
  if (!userSheet) {
    userSheet = ss.insertSheet(userId);
    userSheet.appendRow(['userId', 'item', 'amount', 'category', 'tanggal', 'timestamp']);
    userSheet.getRange('A1:F1').setFontWeight('bold').setBackground('#0f9d58').setFontColor('white');
    isNewUser = true;
  }

  // 3. Update INDEX: Daftarkan user atau update waktu aktifnya
  const timestamp = new Date().toLocaleString('id-ID');
  if (userRowIndex === -1) {
    // User benar-benar baru di INDEX, kita generate clickable HYPERLINK
    const sheetId = userSheet.getSheetId();
    const linkFormula = `=HYPERLINK("#gid=${sheetId}", "KLIK: Buka Tab")`;
    indexSheet.appendRow([userId, linkFormula, timestamp, password, name]);
  } else {
    // User lama, perbarui jam Terakhir Aktif
    indexSheet.getRange(userRowIndex, 3).setValue(timestamp);
  }

  return { userSheet, isNewUser };
}

function doGet(e) {
  const params = e.parameter;
  const userId = params.userId;
  const action = params.action;
  const callbackFn = params.callback;

  let result;
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // ── ACTION: LOGIN ──
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
          // INDEX columns: DAFTAR USER | LINK NAVIGASI | TERAKHIR AKTIF | PASSWORD | NAMA
          for (let i = 1; i < indexData.length; i++) {
            if (String(indexData[i][0]).toLowerCase() === String(userId).toLowerCase()) {
              foundUser = {
                id: indexData[i][0],
                password: indexData[i][3], // Kolom D
                name: indexData[i][4] || indexData[i][0].split('@')[0] // Kolom E
              };
              break;
            }
          }

          if (!foundUser) {
            result = { success: false, error: 'Email silakan periksa kembali atau belum terdaftar.' };
          } else if (String(foundUser.password) !== String(password)) {
            result = { success: false, error: 'Password yang dimasukkan salah.' };
          } else {
            result = { success: true, user: { id: foundUser.id, name: foundUser.name, email: foundUser.id } };
          }
        }
      }
    } 
    // ── DEFAULT: AMBIL DATA TRANSAKSI ──
    else {
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
          // Tab user tidak ditemukan
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

    if (!userId) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Silakan sediakan userId' })).setMimeType(ContentService.MimeType.JSON);
    }

    // Pastikan user ada di INDEX dan punya Tab sendiri
    const { userSheet } = ensureUserRegistered(userId, password, name);
    
    // ── REGISTER (Hanya mencatat bahwa akun terdaftar) ──
    if (action === 'register') {
      // Kita HAPUS perintah appendRow agar tab-nya TETAP KOSONG saat user baru daftar.
      // Dengan begitu, sistem tidak akan membaca pesan "Akun Berhasil Terdaftar" sebagai pengeluaran/transaksi.
      
      // Kirim Email Selamat Datang OTOMATIS!
      try {
        const subject = "🎉 Selamat Bergabung di LedgerLink!";
        const body = `Halo ${name || 'Pengguna'},\n\nTerima kasih telah bergabung! Akun LedgerLink Anda dengan email (${userId}) telah berhasil diaktivasi dan dihubungkan secara super-aman dengan Spreadsheet.\n\nMulai hari ini, mari kita catat semua pengeluaran Anda dengan rapi.\n\nSalam pintar,\nTim LedgerLink`;
        MailApp.sendEmail(userId, subject, body);
      } catch (e) {
        // Abaikan jika email invalid atau MailApp dibatasi
      }

      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    // ── INSERT (Data dari Bot/Web) ──
    if (action === 'insert') {
      userSheet.appendRow([
        userId,
        payload.item || '',
        payload.amount || 0,
        payload.category || 'Lainnya',
        payload.tanggal || new Date().toISOString().split('T')[0],
        new Date().toISOString()
      ]);

      // Kirim Email Peringatan Jika Nominal Sangat Besar (>= 1.000.000)
      try {
        if (Number(payload.amount) >= 1000000) {
          const subject = "⚠️ Peringatan Pengeluaran Besar - LedgerLink";
          const body = `Peringatan Otomatis!\n\nKami mendeteksi sebuah pencatatan pengeluaran yang tergolong cukup besar di akun Anda:\n\nItem: ${payload.item}\nJumlah: Rp ${Number(payload.amount).toLocaleString('id-ID')}\nKategori: ${payload.category}\n\nPerhatikan selalu budget bulanan Anda agar keuangan tetap stabil ya!\n\n- LedgerLink System`;
          MailApp.sendEmail(userId, subject, body);
        }
      } catch (e) {
        // Abaikan jika gagal
      }

      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    // ── UPDATE ──
    if (action === 'update') {
      const rowIndex = payload.rowIndex;
      if (!rowIndex) throw new Error("Row index required");
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

    // ── DELETE ──
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
