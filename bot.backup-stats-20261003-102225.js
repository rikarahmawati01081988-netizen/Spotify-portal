console.log("BOT MULAI MENJALANKAN SCRIPT");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestWaWebVersion,
  Browsers
} = require("@whiskeysockets/baileys");

const pino = require("pino");

async function startBot() {
const { version } = await fetchLatestWaWebVersion();
console.log("VERSI WA WEB:", version.join("."));

  const { state, saveCreds } =
    await useMultiFileAuthState("./session-test-minimal");

const sock = makeWASocket({
  version,
  auth: state,
  browser: Browsers.macOS("Chrome"),
  markOnlineOnConnect: true,
  logger: pino({ level: "silent" })
});

  sock.ev.on("creds.update", saveCreds);

sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
  console.log("KONEKSI:", connection);

  if (lastDisconnect) {
    console.log(
      "ERROR:",
      JSON.stringify(lastDisconnect.error, null, 2)
    );
  }

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

  const stats = {
    messages: 0,
    commands: 0,
    joins: 0,
    toxic: 0,
    spam: 0,
    links: 0
  };

  const activityLog = [];

  function logActivity(type, detail) {
    activityLog.push(
      `[${new Date().toLocaleTimeString()}] ${type}: ${detail}`
    );

    if (activityLog.length > 100) {
      activityLog.shift();
    }
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

stats.messages++;
logActivity("MESSAGE", `${sender}: ${text}`);

const faqText = text.trim().toLowerCase();

if (
  faqText.includes("admin dimana") ||
  faqText.includes("admin di mana") ||
  faqText.includes("admin ada") ||
  faqText.includes("mana admin") ||
  faqText.includes("admin online")
) {
  await sock.sendMessage(jid, {
    text: "😴 Admin sedang tidur."
  });

  continue;
}

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
