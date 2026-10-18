const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestWaWebVersion,
  Browsers,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");

const SESSION = "./customer-sessions/customer 002";
const PHONE = "NOMOR_CUSTOMER_DI_CONFIG";

async function start() {
  console.log("MENGAMBIL VERSI WA WEB...");

  const { version } = await fetchLatestWaWebVersion();
  console.log("VERSI:", version.join("."));

  const { state, saveCreds } =
    await useMultiFileAuthState(SESSION);

  const sock = makeWASocket({
    version,
    browser: Browsers.macOS("Chrome"),
    auth: state,
    markOnlineOnConnect: true,
    logger: pino({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  let pairingRequested = false;

  sock.ev.on("connection.update", async update => {
    const { connection, lastDisconnect, qr } = update;

    console.log("KONEKSI:", connection);

    if (qr && !state.creds.registered && !pairingRequested) {
      pairingRequested = true;

      try {
        console.log("MEMINTA PAIRING CODE...");

        const code =
          await sock.requestPairingCode(PHONE);

        console.log("================================");
        console.log("🔐 KODE PAIRING:", code);
        console.log("================================");
        console.log("Masukkan kode tersebut di WhatsApp.");
      } catch (error) {
        console.log("ERROR PAIRING:", error.message);
      }
    }

    if (connection === "close") {
      const statusCode =
        lastDisconnect?.error?.output?.statusCode;

      console.log("DISCONNECT CODE:", statusCode ?? "unknown");

      if (statusCode === DisconnectReason.loggedOut) {
        console.log("❌ SESSION LOGOUT.");
        return;
      }

      console.log("🔄 RESTART SOCKET...");
      start().catch(error =>
        console.log("ERROR RESTART:", error.message)
      );
    }

    if (connection === "open") {
      console.log("BERHASIL TERHUBUNG 🟢");
    }
  });
}

start().catch(error =>
  console.log("ERROR START:", error.message)
);
