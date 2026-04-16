const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const express = require('express');
const cors = require('cors');

// --- KONFIGURASI ---
const SUPABASE_FUNCTION_URL = process.env.SUPABASE_FUNCTION_URL || 'https://shdqerycmjmjhoxvfokm.supabase.co/functions/v1/whatsapp-bot';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const BOT_PHONE_NUMBER = process.env.BOT_PHONE_NUMBER || '6285168845761';
const GOOGLE_SHEETS_URL = process.env.GOOGLE_SHEETS_URL || process.env.VITE_GOOGLE_SHEETS_URL || '';
const WA_SERVER_PORT = process.env.WA_SERVER_PORT || 5000;

const welcomeSentCache = new Set();
let clientReady = false;

// --- INISIALISASI CLIENT WHATSAPP ---
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.resolve(__dirname, 'session'),
    clientId: 'whatsapp-bot',
  }), // Simpan sesi agar tidak perlu scan QR tiap kali
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  }
});

// --- EVENT: QR CODE ---
client.on('qr', (qr) => {
  console.log('\n📱 Scan QR Code ini dengan WhatsApp kamu:\n');
  qrcode.generate(qr, { small: true });
});

// --- EVENT: CLIENT SIAP ---
client.on('ready', () => {
  clientReady = true;
  console.log('\n✅ Bot WhatsApp sudah online dan siap menerima pesan!');
  console.log(`📱 Nomor Bot: +${BOT_PHONE_NUMBER}`);
  console.log('💡 User bisa kirim pesan pengeluaran langsung ke nomor ini.');
  console.log('   Contoh: "beli kopi 18000" atau "bayar tagihan listrik 250rb"\n');
});

// --- EVENT: PESAN MASUK ---
client.on('message', async (msg) => {
  if (msg.isStatus || msg.from.includes('@g.us') || !msg.body) return;

  const userMessage = msg.body;
  const sender = msg.from.replace('@c.us', '');

  console.log(`📩 Pesan dari ${sender}: "${userMessage}"`);

  const senderInfo = await getSenderInfo(sender);
  if (senderInfo.shouldSendWelcome) {
    await sendWelcomeMessage(msg, senderInfo);
  }

  try {
    const response = await axios.post(
      SUPABASE_FUNCTION_URL,
      {
        message: userMessage,
        sender: sender,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        timeout: 15000,
      }
    );

    const result = response.data;

    if (result.status === 'success' && result.data) {
      const { item, amount, category } = result.data;
      const formatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

      await msg.reply(
        `✅ *Tercatat!*\n\n` +
        `📦 Item: *${item}*\n` +
        `💰 Jumlah: *${formatted}*\n` +
        `📁 Kategori: *${category}*\n\n` +
        `_Data sudah masuk ke Google Sheets kamu._`
      );
      console.log(`✅ Berhasil catat: ${item} - ${formatted} [${category}]`);
    } else if (result.status === 'no_data_found') {
      await msg.reply(getRandomReply('notFound'));
    } else {
      await msg.reply(getRandomReply('error'));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.status === 401) {
      console.error('❌ Auth Error - Check SUPABASE_ANON_KEY in .env');
    }
    await msg.reply(getRandomReply('error'));
  }
});

// --- EVENT: AUTENTIKASI BERHASIL ---
client.on('authenticated', () => {
  console.log('🔑 Autentikasi berhasil!');
});

// --- EVENT: DISCONNECTED ---
client.on('disconnected', (reason) => {
  console.log('🔌 Bot terputus:', reason);
  console.log('🔄 Mencoba reconnect...');
  client.initialize();
});

// --- HELPER FUNCTIONS ---
function normalizePhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove semua spasi, dash, dan karakter khusus
  let normalized = phone.replace(/[\s\-().]/g, '');
  
  // Jika mulai dengan +, hapus
  if (normalized.startsWith('+')) {
    normalized = normalized.substring(1);
  }
  
  // Jika mulai dengan 0 (format Indonesia), ubah ke 62
  if (normalized.startsWith('0')) {
    normalized = '62' + normalized.substring(1);
  }
  
  // Jika tidak mulai dengan 62, anggap nomor lokal Indonesia
  if (!normalized.startsWith('62')) {
    normalized = '62' + normalized;
  }
  
  // Validasi panjang (Indonesia biasanya 62 + 9-11 digit)
  if (!/^62\d{9,11}$/.test(normalized)) {
    return null; // Invalid format
  }
  
  return normalized;
}

const creativeReplies = {
  notFound: [
    `🤔 Hmm, saya bingung. Itu uang atau filosofi hidup? Coba lagi dengan format yang jelas ya!\n\n💡 Contoh: "beli kopi 15000"`,
    `🛸 Pesan kamu like aliens' language. Mau tolong, tapi AI saya masih belajar. Coba ulangi? 😅\n\n📝 Format: "item nominal" (contoh: "grab 50rb")`,
    `💭 Wow, itu deep. Tapi untuk pencatat pengeluaran, kamu harus lebih specific. Nominalnya berapa sih? 🤑\n\n✨ Contoh: "beli mie ayam 12000"`,
    `🎭 Keren sih cara kamu ngomong, tapi bot saya kok jadi bingung. Mau coba bahasa angka? 🔢\n\n💡 Contoh: "beli pizza 75000"`,
    `🧠 Pesan kamu bikin saya overthink. Tapi nominalnya? Terang-terangan dong! 💰\n\n📌 Coba: "nonton bioskop 80000"`,
    `❓ Maaf, saya bukan ChatGPT. Cuma bot penghitung duit. Nominal-nya berapa? 🤷\n\n💎 Format: "item harga" (contoh: "bensin 100rb")`,
    `😵 Jujur, itu kalimatnya lebih ribet dari rumus matematika. Sederhanain dong? 📝\n\n✅ Gini: "beli snack 25000"`,
    `🎪 Kreativ sih, tapi di sini cuma ada angka dan barang. Nominal + item aja cukup! 💸\n\n📌 Contoh: "kuota internet 50000"`
  ],
  error: [
    `⚠️ Oops! Server saya sedang main hide and seek. Coba lagi dalam beberapa detik ya! 🙈`,
    `🔥 Bot saya lagi overheating. Tunggu sebentar dan coba lagi! 🧊`,
    `⚡ Koneksi saya berubah jadi internet explorer. Coba ulang dalam 5 detik! ⏰`,
    `🌪️ Ada yang error di server saya. Let me fix this... Coba lagi! 🔧`,
    `🛠️ Ah, technical difficulties! Coba ulang pake pesan lain. Semoga lebih beruntung! 🍀`,
    `😬 Maaf, bot saya tiba-tiba amnesia. Ulang lagi ya? Pasti next time lebih bagus! 💪`,
    `🎯 Gagal kali ini, tapi jangan menyerah! Coba ulangi pesannya! 🚀`
  ]
};

function getRandomReply(type) {
  const replies = creativeReplies[type] || [];
  return replies[Math.floor(Math.random() * replies.length)] || 'Ada error. Coba lagi!';
}

async function lookupPhoneNumber(phone) {
  if (!GOOGLE_SHEETS_URL) return null;
  try {
    const url = new URL(GOOGLE_SHEETS_URL);
    url.searchParams.set('action', 'lookupPhone');
    url.searchParams.set('phone', phone);

    const response = await axios.get(url.toString(), { timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error('lookupPhoneNumber error:', error.message);
    return null;
  }
}

async function markWelcomeSent(userId) {
  if (!GOOGLE_SHEETS_URL || !userId) return false;
  try {
    const response = await axios.post(GOOGLE_SHEETS_URL, {
      action: 'markWelcomeSent',
      userId,
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    return response.data?.success === true;
  } catch (error) {
    console.error('markWelcomeSent error:', error.message);
    return false;
  }
}

async function getSenderInfo(sender) {
  const normalizedSender = normalizePhoneNumber(sender);
  if (!normalizedSender) {
    console.warn(`⚠️ Invalid phone format: ${sender}`);
    return { sender: normalizedSender, shouldSendWelcome: false, isRegistered: false, userName: null };
  }

  const senderInfo = { sender: normalizedSender, shouldSendWelcome: false, isRegistered: false, userName: null };
  if (welcomeSentCache.has(normalizedSender)) {
    return senderInfo;
  }

  const lookup = await lookupPhoneNumber(normalizedSender);
  if (lookup?.found) {
    senderInfo.isRegistered = true;
    senderInfo.userName = lookup.name || normalizedSender;
    if (!lookup.welcomeSent) {
      senderInfo.shouldSendWelcome = true;
      await markWelcomeSent(lookup.userId);
    }
  } else {
    senderInfo.shouldSendWelcome = true;
    welcomeSentCache.add(normalizedSender);
  }

  return senderInfo;
}

async function sendWelcomeMessage(msg, senderInfo) {
  try {
    const greeting = senderInfo.isRegistered
      ? `Halo ${senderInfo.userName}!`
      : 'Halo!';

    const instructions = senderInfo.isRegistered
      ? 'Terima kasih telah menghubungkan nomor WhatsApp kamu dengan akun LedgerLink.'
      : 'Nomor kamu belum terdaftar di sistem. Kamu tetap bisa kirim pengeluaran, tapi untuk melihat data penuh, silakan daftar di web.';

    const welcomeMessage =
      `👋 *${greeting}*\n\n` +
      `${instructions}\n\n` +
      `Saya adalah bot pencatat pengeluaran otomatis. Kirim pesan pengeluaran kamu dan saya akan catat dengan AI!\n\n` +
      `💡 *Contoh penggunaan:*\n` +
      `• "beli kopi 15000"\n` +
      `• "bayar wifi 350rb"\n` +
      `• "grab ke kantor 25000"\n\n` +
      `📊 Data akan tersimpan di dashboard kamu.\n` +
      `🔗 Login di: https://ledgerlink.app\n\n` +
      `_Kirim pesan apa saja untuk mulai mencatat pengeluaran!_`;

    await msg.reply(welcomeMessage);
    console.log(`🎉 Welcome message sent to ${senderInfo.sender}`);
  } catch (error) {
    console.error('Error sending welcome message:', error);
  }
}

async function sendDirectWelcomeMessage(phone) {
  if (!clientReady) {
    console.error('❌ WhatsApp client belum ready');
    return false;
  }

  try {
    const chatId = phone + '@c.us';
    
    const welcomeMessage =
      `👋 *Selamat Bergabung!*\n\n` +
      `Terima kasih telah mendaftar di LedgerLink. User bisa kirim pesan pengeluaran langsung ke nomor ini.\n\n` +
      `💡 *Contoh:*\n` +
      `• "beli kopi 18000"\n` +
      `• "bayar tagihan listrik 250rb"\n` +
      `• "grab 25000"\n\n` +
      `📊 Data akan tersimpan di dashboard kamu secara otomatis.\n\n` +
      `_Silakan mulai mencatat pengeluaran sekarang!_`;

    await client.sendMessage(chatId, welcomeMessage);
    console.log(`✅ Welcome message sent to ${phone}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending welcome message to ${phone}:`, error.message);
    return false;
  }
}

// --- EXPRESS SERVER ---
const app = express();
app.use(express.json());
app.use(cors());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: clientReady ? 'ready' : 'initializing', port: WA_SERVER_PORT });
});

// Send welcome message endpoint (called during user registration)
app.post('/send-welcome', async (req, res) => {
  let { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, error: 'Phone number required' });
  }

  // Normalize phone number
  phone = normalizePhoneNumber(phone);
  if (!phone) {
    return res.status(400).json({ success: false, error: 'Invalid phone number format. Expected Indonesian number like +62857XXXXXXXX or 0857XXXXXXXX.' });
  }

  if (!clientReady) {
    console.warn('⚠️ WhatsApp client not ready for /send-welcome request');
    return res.status(503).json({ success: false, error: 'WhatsApp bot not ready yet. The bot is initializing - please wait a moment and try registering again.' });
  }

  try {
    const success = await sendDirectWelcomeMessage(phone);
    if (success) {
      return res.json({ success: true, message: 'Welcome message sent' });
    } else {
      console.error(`❌ Failed to send message to ${phone}`);
      return res.status(500).json({ success: false, error: 'Failed to send WhatsApp message. Please verify the phone number is correct and connected to WhatsApp.' });
    }
  } catch (error) {
    console.error('Error in /send-welcome:', error.message);
    return res.status(500).json({ success: false, error: 'Server error while sending message. Please try again.' });
  }
});

// --- JALANKAN BOT & SERVER ---
console.log('🚀 Memulai WhatsApp Bot...');
console.log('⏳ Mohon tunggu, sedang memuat...\n');
client.initialize();

app.listen(WA_SERVER_PORT, () => {
  console.log(`🌐 HTTP Server running on port ${WA_SERVER_PORT}`);
});
