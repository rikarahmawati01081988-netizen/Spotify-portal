const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function start() {
  console.log("MULAI");

  const { state, saveCreds } = await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "debug" })
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (u) => {
    console.log("UPDATE:", u.connection, u.lastDisconnect?.error?.message || "");
  });

  sock.ev.on("error", (err) => {
    console.log("ERROR:", err);
  });
}

start();
