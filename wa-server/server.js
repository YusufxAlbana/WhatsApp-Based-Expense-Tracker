const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

// --- KONFIGURASI ---
const SUPABASE_FUNCTION_URL = process.env.SUPABASE_FUNCTION_URL || 'https://shdqerycmjmjhoxvfokm.supabase.co/functions/v1/whatsapp-bot';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const BOT_PHONE_NUMBER = process.env.BOT_PHONE_NUMBER || '6285168845761';
const GOOGLE_SHEETS_URL = process.env.GOOGLE_SHEETS_URL || process.env.VITE_GOOGLE_SHEETS_URL || '';

const welcomeSentCache = new Set();

// --- INISIALISASI CLIENT WHATSAPP ---
const client = new Client({
  authStrategy: new LocalAuth(), // Simpan sesi agar tidak perlu scan QR tiap kali
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
      await msg.reply(
        `🤔 Hmm, saya tidak bisa menemukan data pengeluaran dari pesan kamu.\n\n` +
        `💡 *Tips:* Coba kirim seperti ini:\n` +
        `• _"beli nasi goreng 15000"_\n` +
        `• _"bayar wifi 350rb"_\n` +
        `• _"grab ke kantor 25000"_`
      );
    } else {
      await msg.reply('⚠️ Terjadi kesalahan saat memproses. Coba lagi ya!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    await msg.reply('❌ Maaf, bot sedang mengalami gangguan. Coba beberapa saat lagi.');
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
  const senderInfo = { sender, shouldSendWelcome: false, isRegistered: false, userName: null };
  if (welcomeSentCache.has(sender)) {
    return senderInfo;
  }

  const lookup = await lookupPhoneNumber(sender);
  if (lookup?.found) {
    senderInfo.isRegistered = true;
    senderInfo.userName = lookup.name || sender;
    if (!lookup.welcomeSent) {
      senderInfo.shouldSendWelcome = true;
      await markWelcomeSent(lookup.userId);
    }
  } else {
    senderInfo.shouldSendWelcome = true;
    welcomeSentCache.add(sender);
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

// --- JALANKAN BOT ---
console.log('🚀 Memulai WhatsApp Bot...');
console.log('⏳ Mohon tunggu, sedang memuat...\n');
client.initialize();
