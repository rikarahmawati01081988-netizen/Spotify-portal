const {
  default: makeWASocket,
  useMultiFileAuthState,
  Browsers,
  fetchLatestWaWebVersion
} = require("@whiskeysockets/baileys");

async function start() {
  const { state, saveCreds } =
    await useMultiFileAuthState("./test-session");

  const { version } = await fetchLatestWaWebVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    browser: Browsers.ubuntu("Chrome"),
    markOnlineOnConnect: false,
    logger: require("pino")({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
  console.log("STATUS:", connection);

  if (lastDisconnect) {
    console.log(
      "DISCONNECT:",
      JSON.stringify(lastDisconnect.error, null, 2)
    );
  }

  if (connection === "open") {
    console.log("BERHASIL OPEN");
    console.log("USER:", sock.user);
  }
});

if (!state.creds.registered) {
  console.log("MENUNGGU SOCKET SIAP...");
  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log("MEMINTA CODE...");
  const code = await sock.requestPairingCode("6288287247274");
  console.log("PAIRING CODE:", code);
}
}
start();
