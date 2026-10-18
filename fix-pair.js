const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function run() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ['Ubuntu', 'Chrome', '20.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    if (!sock.authState.creds.registered) {
        const phoneNumber = await question('\n📱 Masukkan Nomor WA Bot (Contoh: 628xxx): ');
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(cleanNumber);
                console.log(`\n🔑 KODE PAIRING KAMU: \x1b[32m\x1b[1m${code}\x1b[0m\n`);
            } catch (err) {
                console.log('❌ Gagal:', err.message);
            }
        }, 4000);
    }

    sock.ev.on('connection.update', (update) => {
        if (update.connection === 'open') {
            console.log('\n🎉 BERHASIL TERHUBUNG!\n');
            process.exit(0);
        }
    });
}
run();
