const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestWaWebVersion,
  Browsers
} = require("@whiskeysockets/baileys");

const pino = require("pino");

async function start() {
  console.log("MENGAMBIL VERSI WA WEB...");

  const { version } = await fetchLatestWaWebVersion();

  console.log("VERSI:", version.join("."));

  const { state, saveCreds } =
    await useMultiFileAuthState("./customer-sessions/customer 002");

  const sock = makeWASocket({
    version,
    browser: Browsers.macOS("Chrome"),
    auth: state,
    logger: pino({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  let pairingRequested = false;

sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    console.log("KONEKSI:", connection);

if ((connection === "connecting" || qr) && !pairingRequested) {
  pairingRequested = true;

  try {
    console.log("MEMINTA PAIRING CODE...");

    const code = await sock.requestPairingCode("NOMOR_KAMU");

    console.log("================================");
    console.log("KODE PAIRING:", code);
    console.log("================================");
  } catch (error) {
    console.log("ERROR PAIRING:", error.message);
  }
}

    if (lastDisconnect) {
      console.log(
        "ERROR:",
        JSON.stringify(lastDisconnect.error, null, 2)
      );
    }

    if (connection === "open") {
      console.log("BERHASIL TERHUBUNG 🟢");
    }
  });
}

start().catch(err => {
  console.error("ERROR START:", err);
});
