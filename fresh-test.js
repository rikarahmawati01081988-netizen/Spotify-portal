const {
  default: makeWASocket,
  useMultiFileAuthState,
  Browsers
} = require("@whiskeysockets/baileys");

const pino = require("pino");

async function start() {
  const { state, saveCreds } =
    await useMultiFileAuthState("./diagnostic-session");

  console.log("REGISTERED:", state.creds.registered);

  const sock = makeWASocket({
    auth: state,
    browser: Browsers.macOS("Chrome"),
    logger: pino({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, qr, lastDisconnect }) => {
    console.log("CONNECTION:", connection);
    console.log("QR:", !!qr);

    if (lastDisconnect?.error) {
      console.log(
        "ERROR:",
        JSON.stringify(lastDisconnect.error, null, 2)
      );
    }
  });
}

start().catch(console.error);
