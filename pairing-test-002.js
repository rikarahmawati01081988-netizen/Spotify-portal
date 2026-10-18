const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys');
const pino = require('pino');

async function main() {
  const { state, saveCreds } = await useMultiFileAuthState(
    './development-sessions/customer 002'
  );

  if (state.creds.registered) {
    console.log('Sesi sudah terdaftar. Hentikan pengujian.');
    return;
  }

  const { version } = await fetchLatestBaileysVersion();
  console.log('Versi:', version.join('.'));

  const sock = makeWASocket({
    version,
    auth: state,
    browser: Browsers.ubuntu('Chrome'),
    markOnlineOnConnect: false,
    syncFullHistory: false,
    logger: pino({ level: 'silent' })
  });

  sock.ev.on('creds.update', saveCreds);

  let requested = false;
  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    console.log('KONEKSI:', connection || '-');

    if (lastDisconnect) {
      console.log(
        'ERROR:',
        lastDisconnect.error?.output?.statusCode || lastDisconnect.error?.message
      );
    }

    if (
      connection === 'open'
    ) {
      console.log('BERHASIL TERHUBUNG:', sock.user?.id);
    }

    if (
      connection === 'connecting' &&
      !requested &&
      !state.creds.registered
    ) {
      requested = true;
      try {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const code = await sock.requestPairingCode('6283185720495');
        console.log('KODE PAIRING:', code);
        console.log('Masukkan kode di WhatsApp HP yang ingin ditautkan.');
      } catch (err) {
        requested = false;
        console.log('GAGAL PAIRING:', err.message);
      }
    }
  });
}

main().catch(err => console.log('ERROR UTAMA:', err.message));
