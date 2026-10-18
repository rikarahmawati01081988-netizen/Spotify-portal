const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestWaWebVersion,
  Browsers
} = require("@whiskeysockets/baileys");

const pino = require("pino");

async function start() {
  console.log("=== PAIRING CODE TEST ===");

  const { version } = await fetchLatestWaWebVersion();

  const { state, saveCreds } =
    await useMultiFileAuthState("./session-test-clean");

  const sock = makeWASocket({
    version,
    auth: state,
    browser: Browsers.macOS("Chrome"),
    markOnlineOnConnect: true,
    logger: pino({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  let requested = false;

  sock.ev.on(
    "connection.update",
    async ({ connection, qr, lastDisconnect }) => {
      console.log("KONEKSI:", connection);

      if (qr && !requested) {
        requested = true;

        try {
          console.log("MEMINTA PAIRING CODE...");

          const code = await sock.requestPairingCode("639532206565");

          console.log("==============================");
          console.log("KODE PAIRING:", code);
          console.log("==============================");
        } catch (error) {
          console.log("ERROR PAIRING:", error.message);
        }
      }

      if (connection === "open") {
        console.log("BERHASIL TERHUBUNG 🟢");
      }

      if (connection === "close") {
        const statusCode =
          lastDisconnect?.error?.output?.statusCode;

        console.log("STATUS CLOSE:", statusCode);

        if (statusCode === 515) {
          console.log("🔄 515 — RESTART KONEKSI...");

          setTimeout(() => {
            start().catch(console.error);
          }, 2000);
        }
      }

      if (lastDisconnect) {
        console.log(
          "ERROR:",
          JSON.stringify(lastDisconnect.error, null, 2)
        );
      }
    }
  );
}

start().catch(console.error);
