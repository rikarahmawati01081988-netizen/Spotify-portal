const {
  default: makeWASocket,
  useMultiFileAuthState,
  Browsers
} = require("@whiskeysockets/baileys");

const pino = require("pino");

const PHONE = "6288287247274";

async function start() {
  console.log("=== DIAGNOSTIK BAILEYS ===");

  const { state, saveCreds } =
    await useMultiFileAuthState("./session");

  console.log("SESSION TERDAFTAR:", state.creds.registered);

  const sock = makeWASocket({
    auth: state,
    browser: Browsers.macOS("Chrome"),
    printQRInTerminal: false,
    logger: pino({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  let requested = false;

  sock.ev.on("connection.update", async (update) => {
    const { connection, qr, lastDisconnect } = update;

    console.log("CONNECTION:", connection);
    console.log("QR EVENT:", !!qr);

    if (
      !state.creds.registered &&
      !requested &&
      (connection === "connecting" || qr)
    ) {
      requested = true;

      try {
        console.log("MEMINTA PAIRING CODE...");

        const code = await sock.requestPairingCode(PHONE);

        console.log("==============================");
        console.log("PAIRING CODE:", code);
        console.log("==============================");
      } catch (err) {
        console.log("PAIRING ERROR:");
        console.log(err);
      }
    }

    if (connection === "open") {
      console.log("=== BERHASIL TERHUBUNG ===");
    }

    if (connection === "close") {
      console.log("=== KONEKSI DITUTUP ===");

      if (lastDisconnect?.error) {
        console.log(
          "DISCONNECT DETAIL:",
          JSON.stringify(lastDisconnect.error, null, 2)
        );
      }
    }
  });
}

start().catch((err) => {
  console.error("START ERROR:", err);
});
