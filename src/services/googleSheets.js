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
      method: "POST",
      mode: "no-cors", 
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify(data),
    });

    // With no-cors, the response is 'opaque'. 
    // We can't see the status, but if it doesn't throw, it likely reached the script.
    if (response.type === 'opaque' || response.ok) {
      console.log("Data dikirim (Opaque/OK). Cek Google Sheets kamu!");
      return true;
    } else {
      console.error("Gagal mengirim data. Status:", response.status);
      return false;
    }
  } catch (error) {
    console.error("Gagal mengirim data ke Sheets:", error);
    throw error;
  }
};

/**
 * Fetches transaction data from Google Sheets filtered by userId
 * @param {string} userId - The user's unique identifier
 * @returns {Promise<Array>} - Array of transaction objects
 */
export const getExpensesFromSheets = async (userId) => {
  try {
    const url = `${import.meta.env.VITE_GOOGLE_SHEETS_URL}?userId=${encodeURIComponent(userId)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    // Google Sheets returns array of objects
    // Ensure 'amount' is a number for chart compatibility
    return data.map(item => ({
      ...item,
      amount: Number(item.amount)
    }));
  } catch (error) {
    console.error("Gagal mengambil data dari Sheets:", error);
    return [];
  }
};

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
