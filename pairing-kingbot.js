process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  delay
} = require('@whiskeysockets/baileys');
const pino = require('pino');

const BOT_NUMBER = '6285184017791';

async function startPairing() {
  try {
    console.log('🔄 Memuat modul auth state...');
    const { state, saveCreds } = await useMultiFileAuthState('test-session');

    console.log('🔌 Menginisialisasi soket Baileys...');
    const sock = makeWASocket({
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      auth: state,
      browser: ['Ubuntu', 'Chrome', '20.0.04'],
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000
    });

    if (!sock.authState.creds.registered) {
      console.log('\n⏳ Menyiapkan sambungan aman untuk Pairing Code King Bot...');
      await delay(6000);

      try {
        console.log('📡 Meminta kode pairing ke server WhatsApp...');
        let code = await sock.requestPairingCode(BOT_NUMBER);
        code = code?.match(/.{1,4}/g)?.join('-') || code;
        console.log(`\n==============================================`);
        console.log(`🔑 KODE PAIRING KING BOT: \x1b[32m\x1b[1m${code}\x1b[0m`);
        console.log(`==============================================\n`);
      } catch (err) {
        console.error('❌ Gagal meminta kode pairing:', err.message);
      }
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === 'open') {
        console.log('\n✅ KING BOT BERHASIL TERHUBUNG VIA PAIRING!');
      } else if (connection === 'close') {
        console.log('⚠️ Koneksi tertutup:', lastDisconnect?.error?.output?.statusCode);
      }
    });
  } catch (e) {
    console.error('❌ Error utama di startPairing:', e);
  }
}

startPairing();
