const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function start() {
  console.log("1. MULAI");

  const { state, saveCreds } = await useMultiFileAuthState("./session");
  console.log("2. SESSION OK");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" })
  });

  console.log("3. SOCKET DIBUAT");

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    console.log("4. CONNECTION:", update.connection);
  });
}

start();