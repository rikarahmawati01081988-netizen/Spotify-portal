const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestWaWebVersion
} = require("@whiskeysockets/baileys");

const pino = require("pino");

async function start() {
  console.log("=== PAIRING TEST MINIMAL ===");

  const { version } = await fetchLatestWaWebVersion();
  console.log("VERSI WA WEB:", version.join("."));

  const { state, saveCreds } =
    await useMultiFileAuthState("./session-test-minimal");

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    console.log("KONEKSI:", connection);
    if (qr) console.log("QR TERSEDIA");

    if (connection === "open") {
      console.log("BERHASIL TERHUBUNG 🟢");
    }

    if (lastDisconnect) {
      console.log(
        "ERROR:",
        JSON.stringify(lastDisconnect.error, null, 2)
      );
    }
  });
}

start().catch(err => {
  console.error("ERROR START:", err);
});
