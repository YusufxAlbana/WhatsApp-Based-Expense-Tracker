const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

// --- KONFIGURASI ---
const SUPABASE_FUNCTION_URL = "https://shdqerycmjmjhoxvfokm.supabase.co/functions/v1/whatsapp-bot";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZHFlcnljbWptamhveHZmb2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMjg1MjksImV4cCI6MjA5MTYwNDUyOX0.baeiB8wYnbc_P_AnZJNngL8MZfQr_VaCuVKbNVJRCuw";

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
  console.log('💡 Kirim pesan pengeluaran ke nomor ini untuk dicatat otomatis.');
  console.log('   Contoh: "beli kopi 18000" atau "bayar tagihan listrik 250rb"\n');
});

// --- EVENT: PESAN MASUK ---
client.on('message', async (msg) => {
  // Abaikan pesan dari broadcast, grup, atau yang bukan teks
  if (msg.isStatus || msg.from.includes('@g.us') || !msg.body) return;

  const userMessage = msg.body;
  const sender = msg.from.replace('@c.us', ''); // Nomor HP pengirim

  console.log(`📩 Pesan dari ${sender}: "${userMessage}"`);

  try {
    // Kirim pesan ke Supabase Edge Function (yang menghubungi Groq AI)
    const response = await axios.post(
      SUPABASE_FUNCTION_URL,
      {
        message: userMessage,
        sender: sender,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        timeout: 15000, // 15 detik timeout
      }
    );

    const result = response.data;

    if (result.status === "success" && result.data) {
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

    } else if (result.status === "no_data_found") {
      await msg.reply(
        `🤔 Hmm, saya tidak bisa menemukan data pengeluaran dari pesan kamu.\n\n` +
        `💡 *Tips:* Coba kirim seperti ini:\n` +
        `• _"beli nasi goreng 15000"_\n` +
        `• _"bayar wifi 350rb"_\n` +
        `• _"grab ke kantor 25000"_`
      );
    } else {
      await msg.reply(`⚠️ Terjadi kesalahan saat memproses. Coba lagi ya!`);
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    await msg.reply(`❌ Maaf, bot sedang mengalami gangguan. Coba beberapa saat lagi.`);
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

// --- JALANKAN BOT ---
console.log('🚀 Memulai WhatsApp Bot...');
console.log('⏳ Mohon tunggu, sedang memuat...\n');
client.initialize();
