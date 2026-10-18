const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys');

const pino = require('pino');

async function main() {
  const sessionDir = './development-sessions/customer 002';
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  console.log('STATUS SESI:', state.creds.registered ? 'TERDAFTAR' : 'BELUM TERDAFTAR');

  try {
    const result = await fetchLatestBaileysVersion();
    console.log('VERSI DIREKOMENDASIKAN:', result.version.join('.'));

    const sock = makeWASocket({
      version: result.version,
      auth: state,
      browser: Browsers.ubuntu('Chrome'),
      markOnlineOnConnect: false,
      syncFullHistory: false,
      logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', ({ connection, qr, lastDisconnect }) => {
      if (qr) {
        console.log('\nQR TERSEDIA — pindai melalui Perangkat tertaut di WhatsApp:');
        require('qrcode-terminal').generate(qr, { small: true });
      }

      if (connection) console.log('KONEKSI:', connection);

      if (lastDisconnect) {
        console.log(
          'ERROR:',
          lastDisconnect.error?.output?.statusCode || lastDisconnect.error?.message
        );
      }

      if (connection === 'open') {
        console.log('BERHASIL TERHUBUNG');
        console.log('AKUN:', sock.user?.id || 'tidak diketahui');
      }
    });
  } catch (err) {
    console.error('GAGAL:', err.message);
  }
}

main().catch(err => console.error('ERROR UTAMA:', err.message));
