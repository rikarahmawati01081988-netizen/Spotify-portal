const {
  default: makeWASocket,
  useMultiFileAuthState,
  Browsers,
  fetchLatestWaWebVersion
} = require("@whiskeysockets/baileys");

const pino = require("pino");

async function start() {
  const { version } = await fetchLatestWaWebVersion();

  console.log("WA WEB:", version.join("."));

  const { state, saveCreds } =
    await useMultiFileAuthState("./diagnostic-session");

  console.log("REGISTERED:", state.creds.registered);

  const sock = makeWASocket({
    version,
    auth: state,
    browser: Browsers.ubuntu("Chrome"),
    logger: pino({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  let requested = false;

  sock.ev.on(
    "connection.update",
    async ({ connection, qr, lastDisconnect }) => {
      console.log("CONNECTION:", connection);
      console.log("QR:", !!qr);

      if (
        !state.creds.registered &&
        !requested &&
        (connection === "connecting" || qr)
      ) {
        requested = true;

        try {
          const code = await sock.requestPairingCode("6288287247274");
          console.log("==============================");
          console.log("PAIRING CODE:", code);
          console.log("==============================");
        } catch (err) {
          console.log("PAIRING ERROR:", err);
        }
      }

      if (lastDisconnect?.error) {
        console.log(
          "ERROR:",
          JSON.stringify(lastDisconnect.error, null, 2)
        );
      }
    }
  );
}

start().catch(console.error);
