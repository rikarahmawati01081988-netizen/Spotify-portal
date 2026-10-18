console.log("BOT MULAI MENJALANKAN SCRIPT");

const {
  default: makeWASocket,
  useMultiFileAuthState
} = require("@whiskeysockets/baileys");

const pino = require("pino");

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("./session-test-minimal");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection }) => {
    if (connection === "open") {
      console.log("BOT TERHUBUNG 🟢");
    }
  });

  async function getGroupAdmins(jid) {
    const metadata = await sock.groupMetadata(jid);

    return metadata.participants
      .filter(p =>
        p.admin === "admin" ||
        p.admin === "superadmin"
      )
      .map(p => p.id);
  }

  async function isGroupAdmin(jid, participant) {
    if (!jid.endsWith("@g.us")) return false;

    const admins = await getGroupAdmins(jid);
    return admins.includes(participant);
  }

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg?.message) continue;
      if (msg.key.fromMe) continue;

      const jid = msg.key.remoteJid;
      const sender = msg.key.participant || msg.key.remoteJid;

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      console.log("PESAN:", text);

if (text.trim().toLowerCase() === "!menu") {
  await sock.sendMessage(jid, {
    text:
`🤖 KING MARKET BOT

📦 SEWA BOT BY KING

1. Sewa Bot 1 Hari — Rp2.000
2. Sewa Bot 1 Bulan — Rp10.000

💬 Untuk membeli:
Ketik !beli

🤖 KING BOT`
  });

  continue;
}

      if (text.trim().toLowerCase() === "!admin") {
        if (!jid.endsWith("@g.us")) {
          await sock.sendMessage(jid, {
            text: "❌ Perintah ini hanya bisa digunakan di grup."
          });
          continue;
        }

        try {
          const admin = await isGroupAdmin(jid, sender);

          if (admin) {
            await sock.sendMessage(jid, {
              text: "👑 Kamu terdeteksi sebagai ADMIN grup."
            });
          } else {
            await sock.sendMessage(jid, {
              text: "👤 Kamu bukan admin grup."
            });
          }
        } catch (error) {
          console.log("ERROR ADMIN:", error.message);

          await sock.sendMessage(jid, {
            text: "⚠️ Gagal membaca data admin grup."
          });
        }
      }
    }
  });
}

startBot();
