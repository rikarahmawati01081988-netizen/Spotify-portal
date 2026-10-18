const {
  default: makeWASocket,
  useMultiFileAuthState,
  Browsers
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const QRCode = require("qrcode");

async function start() {
  const { state, saveCreds } =
    await useMultiFileAuthState("./diagnostic-session");

  const sock = makeWASocket({
    auth: state,
    browser: Browsers.macOS("Chrome"),
    logger: pino({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({ connection, qr }) => {
    console.log("CONNECTION:", connection);

    if (qr) {
      console.log("QR DITERIMA. MENYIMPAN...");

      await QRCode.toFile("./wa-qr.png", qr, {
        width: 1600,
        margin: 4,
        errorCorrectionLevel: "H"
      });

      console.log("QR TERSIMPAN:");
      console.log("~/wa-bot/wa-qr.png");
    }

    if (connection === "open") {
      console.log("BERHASIL TERHUBUNG 🟢");
    }
  });
}

start().catch(console.error);
