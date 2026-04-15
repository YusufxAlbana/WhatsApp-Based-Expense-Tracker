/**
 * Service to handle Google Sheets integration
 */

const GOOGLE_SHEETS_URL = import.meta.env.VITE_GOOGLE_SHEETS_URL;

/**
 * Sends transaction data to Google Sheets via Apps Script
 * @param {Object} data - The transaction data
 * @param {string} data.userId - The unique identifier for the user (e.g., email)
 * @param {string} data.item - Item name
 * @param {number} data.amount - Transaction amount
 * @param {string} data.category - Transaction category
 * @returns {Promise<boolean>} - Success status
 */
export const sendToGoogleSheets = async (data) => {
  try {
    console.log("Sending data to Google Sheets:", data);
    
    // Note: Google Apps Script usually requires 'no-cors' if it returns a redirect 
    // or you might need to handle the response carefully.
    // However, the user provided a standard fetch template.
    
    const response = await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    });

    // With no-cors, the response is opaque, so browser cannot inspect status details.
    // We still treat no network error as likely success because Apps Script will receive the payload.
    if (response.type === 'opaque' || response.ok) {
      console.log('Data dikirim (Opaque/OK). Cek Google Sheets kamu!');
      return true;
    } else {
      console.error('Gagal mengirim data. Status:', response.status);
      return false;
    }
  } catch (error) {
    console.error("Gagal mengirim data ke Sheets:", error);
    throw error;
  }
};

/**
 * Fetches transaction data from Google Sheets using JSONP to bypass CORS.
 * Google Apps Script supports ?callback= for JSONP responses.
 * @param {string} userId - The user's unique identifier
 * @returns {Promise<Array>} - Array of transaction objects
 */
export const getExpensesFromSheets = (userId) => {
  return new Promise((resolve) => {
    const callbackName = `gsCallback_${Date.now()}`
    const url = `${import.meta.env.VITE_GOOGLE_SHEETS_URL}?userId=${encodeURIComponent(userId)}&callback=${callbackName}`

    // Create a global callback that GAS will call
    window[callbackName] = (data) => {
      try {
        const result = Array.isArray(data)
          ? data.map(item => ({ ...item, amount: Number(item.amount) }))
          : []
        resolve(result)
      } catch {
        resolve([])
      } finally {
        // Cleanup
        delete window[callbackName]
        if (script.parentNode) script.parentNode.removeChild(script)
      }
    }

    // Inject script tag
    const script = document.createElement('script')
    script.src = url
    script.onerror = () => {
      console.error('Gagal mengambil data dari Sheets (CORS/network error)')
      delete window[callbackName]
      if (script.parentNode) script.parentNode.removeChild(script)
      resolve([])
    }

    // Timeout safety — if GAS doesn't respond in 10s
    const timeout = setTimeout(() => {
      console.warn('Google Sheets request timeout')
      delete window[callbackName]
      if (script.parentNode) script.parentNode.removeChild(script)
      resolve([])
    }, 10000)

    // Clear timeout when callback fires
    const originalCallback = window[callbackName]
    window[callbackName] = (data) => {
      clearTimeout(timeout)
      originalCallback(data)
    }

    document.head.appendChild(script)
  })
}

export const getBudgetsFromSheets = (userId) => {
  return new Promise((resolve) => {
    const callbackName = `gsBudgetCallback_${Date.now()}`
    const url = `${import.meta.env.VITE_GOOGLE_SHEETS_URL}?userId=${encodeURIComponent(userId)}&action=getBudgets&callback=${callbackName}`

    window[callbackName] = (data) => {
      try {
        const result = Array.isArray(data)
          ? data.map(item => ({
              ...item,
              limit: Number(item.limit || 0),
              amount: Number(item.amount || 0)
            }))
          : []
        resolve(result)
      } catch {
        resolve([])
      } finally {
        delete window[callbackName]
        if (script.parentNode) script.parentNode.removeChild(script)
      }
    }

    const script = document.createElement('script')
    script.src = url
    script.onerror = () => {
      console.error('Gagal mengambil data anggaran dari Sheets (CORS/network error)')
      delete window[callbackName]
      if (script.parentNode) script.parentNode.removeChild(script)
      resolve([])
    }

    const timeout = setTimeout(() => {
      console.warn('Google Sheets budget request timeout')
      delete window[callbackName]
      if (script.parentNode) script.parentNode.removeChild(script)
      resolve([])
    }, 10000)

    const originalCallback = window[callbackName]
    window[callbackName] = (data) => {
      clearTimeout(timeout)
      originalCallback(data)
    }

    document.head.appendChild(script)
  })
}

export const saveBudgetToSheets = async (budget) => {
  try {
    const response = await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: budget.budgetId ? 'updateBudget' : 'insertBudget',
        ...budget,
        limit: Number(budget.limit || 0)
      })
    })

    if (response.type === 'opaque' || response.ok) {
      console.log('Budget berhasil disimpan/diupdate di Google Sheets!')
      return true
    }
    return false
  } catch (error) {
    console.error('Gagal mengirim data anggaran ke Sheets:', error)
    throw error
  }
}

export const deleteBudgetInSheets = async ({ userId, budgetId }) => {
  try {
    const response = await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'deleteBudget',
        userId,
        budgetId
      })
    })

    if (response.type === 'opaque' || response.ok) {
      console.log('Budget berhasil dihapus di Google Sheets!')
      return true
    }
    return false
  } catch (error) {
    console.error('Gagal menghapus anggaran di Sheets:', error)
    throw error
  }
}

/**
 * Validates user login via Google Sheets using JSONP
 * @param {string} userId - The user's unique identifier (email)
 * @param {string} password - The user's password
 * @returns {Promise<Object>} - Success status and user data or error message
 */
export const loginUserViaSheets = (userId, password) => {
  return new Promise((resolve) => {
    const callbackName = `gsLoginCallback_${Date.now()}`
    const url = `${import.meta.env.VITE_GOOGLE_SHEETS_URL}?action=login&userId=${encodeURIComponent(userId)}&password=${encodeURIComponent(password)}&callback=${callbackName}`

    window[callbackName] = (data) => {
      try {
        resolve(data)
      } catch {
        resolve({ success: false, error: 'Format respons tidak sesuai dari server' })
      } finally {
        delete window[callbackName]
        if (script.parentNode) script.parentNode.removeChild(script)
      }
    }

    const script = document.createElement('script')
    script.src = url
    script.onerror = () => {
      resolve({ success: false, error: 'Gagal menghubungi server Google Sheets' })
      delete window[callbackName]
      if (script.parentNode) script.parentNode.removeChild(script)
    }

    const timeout = setTimeout(() => {
      resolve({ success: false, error: 'Koneksi lambat (timeout)' })
      delete window[callbackName]
      if (script.parentNode) script.parentNode.removeChild(script)
    }, 10000)

    const originalCallback = window[callbackName]
    window[callbackName] = (data) => {
      clearTimeout(timeout)
      originalCallback(data)
    }

    document.head.appendChild(script)
  })
}

/**
 * Helper to process raw expenses into category-based data for charts
 * @param {Array} expenses - Array of transaction objects
 * @returns {Array} - Aggregated category data
 */
export const getCategoryData = (expenses) => {
  const categories = {};

  expenses.forEach((item) => {
    // Standardize category name (lowercase) to match existing categories if possible
    const catName = item.category || "Lainnya";
    const catKey = catName.toLowerCase();
    
    if (!categories[catKey]) {
      categories[catKey] = {
        name: catName,
        value: 0
      };
    }
    categories[catKey].value += Number(item.amount);
  });

  // Convert object to array for chart compatibility
  // We keep the original casing for the display name
  return Object.values(categories);
};

/**
 * Updates a specific transaction in Google Sheets
 * @param {Object} data - Updated transaction data
 * @param {number} data.rowIndex - The row index in the spreadsheet
 * @param {string} data.userId - The user's unique identifier
 * @param {string} data.item - Updated item name
 * @param {number} data.amount - Updated amount
 * @param {string} data.category - Updated category
 * @returns {Promise<boolean>} - Success status
 */
export const updateExpenseInSheets = async (data) => {
  try {
    const response = await fetch(GOOGLE_SHEETS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify({
        action: "update",
        ...data
      }),
    });

    if (response.type === 'opaque' || response.ok) {
      console.log("Data berhasil di-update di Google Sheets!");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Gagal update data di Sheets:", error);
    throw error;
  }
};

/**
 * Deletes a specific transaction from Google Sheets
 * @param {Object} data - Data to identify the row to delete
 * @param {number} data.rowIndex - The row index in the spreadsheet
 * @param {string} data.userId - The user's unique identifier
 * @returns {Promise<boolean>} - Success status
 */
export const deleteExpenseInSheets = async (data) => {
  try {
    const response = await fetch(GOOGLE_SHEETS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify({
        action: "delete",
        ...data
      }),
    });

    if (response.type === 'opaque' || response.ok) {
      console.log("Data berhasil dihapus dari Google Sheets!");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Gagal hapus data di Sheets:", error);
    throw error;
  }
};
