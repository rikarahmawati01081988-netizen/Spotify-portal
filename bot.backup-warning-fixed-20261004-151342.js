console.log("BOT MULAI MENJALANKAN SCRIPT");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestWaWebVersion,
  Browsers
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs");
const config = require("./config.json");
const { loadCustomer } = require("./package-manager");

async function startBot() {
  const customer = loadCustomer("customer-001");
  console.log("CUSTOMER:", customer ? customer.customerId : "TIDAK DITEMUKAN");
  console.log("PACKAGE:", customer ? customer.package : "TIDAK ADA");
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

  let openHour = 7;
  let closeHour = 23;
  const warningsFile = "./warnings.json";
  const warnings = fs.existsSync(warningsFile)
    ? JSON.parse(fs.readFileSync(warningsFile, "utf8"))
    : {};

  function saveWarnings() {
    fs.writeFileSync(
      warningsFile,
      JSON.stringify(warnings, null, 2)
    );
  }

  function addWarning(sender) {
    warnings[sender] = (warnings[sender] || 0) + 1;
    saveWarnings();
    return warnings[sender];
  }

  function clearWarning(sender) {
    delete warnings[sender];
    saveWarnings();
  }
  const spamTracker = {};

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

  async function isBotAdmin(jid) {
    if (!jid.endsWith("@g.us")) return false;

    const metadata = await sock.groupMetadata(jid);
    const botLid = sock.user?.lid?.split(":")[0] + "@lid";

    const botParticipant = metadata.participants.find(
      p => p.id.split(":")[0] === botLid.split(":")[0]
    );

    return !!botParticipant &&
      (
        botParticipant.admin === "admin" ||
        botParticipant.admin === "superadmin"
      );
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

      if (text.trim().toLowerCase() === "!botadmin") {
        if (!jid.endsWith("@g.us")) {
          await sock.sendMessage(jid, {
            text: "ℹ️ Perintah ini hanya bisa dipakai di grup."
          });
          continue;
        }

        try {
          const metadata = await sock.groupMetadata(jid);
          const botLid = sock.user?.lid?.split(":")[0] + "@lid";

          const botParticipant = metadata.participants.find(
            p => p.id === botLid ||
                 p.id.split(":")[0] === botLid.split(":")[0]
          );

          console.log("SOCK USER:", JSON.stringify(sock.user, null, 2));
          console.log(
            "SEMUA PARTICIPANT:",
            metadata.participants.map(p => ({
              id: p.id,
              admin: p.admin
            }))
          );

          const botAdmin =
            botParticipant &&
            (botParticipant.admin === "admin" ||
             botParticipant.admin === "superadmin");

          await sock.sendMessage(jid, {
            text: botAdmin
              ? "👑 Bot adalah ADMIN grup."
              : "❌ Bot bukan ADMIN grup."
          });
        } catch (error) {
          console.log("ERROR BOTADMIN:", error.message);

          await sock.sendMessage(jid, {
            text: "⚠️ Gagal mengecek status admin bot."
          });
        }

        continue;
      }

stats.messages++;
logActivity("MESSAGE", `${sender}: ${text}`);

const groupInviteLink =
  /https?:\/\/(chat\.whatsapp\.com|whatsapp\.com\/invite)\/[^\s]+/i.test(text);

if (customer?.features?.antiLink === true && groupInviteLink && jid.endsWith("@g.us")) {
  stats.links++;
  logActivity("GROUP_LINK", `${sender}: ${text}`);

  try {
    await sock.sendMessage(jid, {
      delete: msg.key
    });
  } catch (error) {
    console.log("GAGAL HAPUS LINK GRUP:", error.message);
  }

  await sock.sendMessage(jid, {
    text: "🚫 Link undangan grup WhatsApp tidak diperbolehkan."
  });

  continue;
}

const mentionedJid =
  msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];

const botLid = sock.user?.lid?.split(":")[0] + "@lid";

const mentionedBot = mentionedJid.some(
  id => id === botLid || id.split(":")[0] === botLid.split(":")[0]
);

if (jid.endsWith("@g.us") && mentionedBot) {
  const senderIsAdmin = await isGroupAdmin(jid, sender);

  if (!senderIsAdmin) {
    addWarning(sender);

    logActivity(
      "BOT_RULE",
      `${sender}: mention bot (${warnings[sender]}/5)`
    );

    await sock.sendMessage(jid, {
      text:
        `⚠️ @${sender.split("@")[0]} jangan chat atau mention bot.\n` +
        `📛 Pelanggaran: ${warnings[sender]}/5`,
      mentions: [sender]
    });

    continue;
  }
}

const badWords = JSON.parse(fs.readFileSync("./badwords.json", "utf8"));

function containsToxic(text) {
  return badWords.some(word => {
    const escaped = word.trim().replace(/[.*+?^${}()|[]\]/g, "\\$&");
    if (!escaped) return false;
    return new RegExp(`\\b${escaped}\\b`, "i").test(text);
  });
}

const lowerText = text.toLowerCase();

if (
  jid.endsWith("@g.us") &&
    containsToxic(lowerText)
) {
  stats.toxic++;
  addWarning(sender);

  logActivity(
    "PELANGGARAN",
    `${sender}: toxic (${warnings[sender]}/5)`
  );

  try {
    await sock.sendMessage(jid, {
      delete: msg.key
    });
  } catch (error) {
    console.log("GAGAL HAPUS TOXIC:", error.message);
  }

  await sock.sendMessage(jid, {
    text:
      `⚠️ @${sender.split("@")[0]} melakukan pelanggaran kata kasar.\\n` +
      `📛 Pelanggaran: ${warnings[sender]}/5`,
    mentions: [sender]
  });

  if (warnings[sender] >= 5) {
    try {
      const botAdmin = await isBotAdmin(jid);

      if (botAdmin) {
        await sock.groupParticipantsUpdate(
          jid,
          [sender],
          "remove"
        );

        await sock.sendMessage(jid, {
          text:
            `🚫 @${sender.split("@")[0]} dikeluarkan karena mencapai 5 pelanggaran.`,
          mentions: [sender]
        });

        clearWarning(sender);
      } else {
        await sock.sendMessage(jid, {
          text: "⚠️ Bot bukan admin, jadi tidak bisa mengeluarkan anggota."
        });
      }
    } catch (error) {
      console.log("GAGAL KICK:", error.message);

      await sock.sendMessage(jid, {
        text: "⚠️ Gagal mengeluarkan anggota. Pastikan bot adalah admin grup."
      });
    }
  }

  continue;
}

const nowMs = Date.now();
const spamKey = `${jid}:${sender}`;

if (!spamTracker[spamKey]) {
  spamTracker[spamKey] = {
    text: lowerText,
    count: 1,
    time: nowMs
  };
} else if (
  spamTracker[spamKey].text === lowerText &&
  nowMs - spamTracker[spamKey].time <= 10000
) {
  spamTracker[spamKey].count++;
  spamTracker[spamKey].time = nowMs;
} else {
  spamTracker[spamKey] = {
    text: lowerText,
    count: 1,
    time: nowMs
  };
}

if (
  jid.endsWith("@g.us") &&
  (
    text.length > 500 ||
    spamTracker[spamKey].count >= 3
  )
) {
  stats.spam++;
  addWarning(sender);

  logActivity(
    "PELANGGARAN",
    `${sender}: spam (${warnings[sender]}/5)`
  );

  try {
    await sock.sendMessage(jid, {
      delete: msg.key
    });
  } catch (error) {
    console.log("GAGAL HAPUS SPAM:", error.message);
  }

  await sock.sendMessage(jid, {
    text:
      `🚨 @${sender.split("@")[0]} terdeteksi spam.\\n` +
      `📛 Pelanggaran: ${warnings[sender]}/5`,
    mentions: [sender]
  });

  if (warnings[sender] >= 5) {
    try {
      const botAdmin = await isBotAdmin(jid);

      if (botAdmin) {
        await sock.groupParticipantsUpdate(
          jid,
          [sender],
          "remove"
        );

        await sock.sendMessage(jid, {
          text:
            `🚫 @${sender.split("@")[0]} dikeluarkan karena mencapai 5 pelanggaran.`,
          mentions: [sender]
        });

        clearWarning(sender);
      } else {
        await sock.sendMessage(jid, {
          text: "⚠️ Bot bukan admin, jadi tidak bisa mengeluarkan anggota."
        });
      }
    } catch (error) {
      console.log("GAGAL KICK:", error.message);

      await sock.sendMessage(jid, {
        text: "⚠️ Gagal mengeluarkan anggota. Pastikan bot adalah admin grup."
      });
    }
  }

  continue;
}

const faqText = text.trim().toLowerCase();

if (
  faqText.includes("admin dimana") ||
  faqText.includes("admin di mana") ||
  faqText.includes("admin ada") ||
  faqText.includes("mana admin") ||
  faqText.includes("admin online")
) {
  if (jid.endsWith("@g.us")) {
    try {
      const admins = await getGroupAdmins(jid);

      if (admins.length > 0) {
        await sock.sendMessage(jid, {
          text: "😴 Admin sedang tidur."
        });
      } else {
        await sock.sendMessage(jid, {
          text: "❌ Tidak ada admin yang terdeteksi."
        });
      }
    } catch (error) {
      console.log("ERROR AUTO FAQ:", error.message);
    }
  } else {
    await sock.sendMessage(jid, {
      text: "ℹ️ Auto FAQ admin hanya berlaku di grup."
    });
  }

  continue;
}

if (text.trim().toLowerCase() === "!stats") {
  await sock.sendMessage(jid, {
    text:
`📊 KING BOT STATS

💬 Pesan: ${stats.messages}
⚙️ Commands: ${stats.commands}
👋 Joins: ${stats.joins}
☠️ Toxic: ${stats.toxic}
🚫 Spam: ${stats.spam}
🔗 Links: ${stats.links}`
  });

  continue;
}

if (text.trim().toLowerCase() === "!owner") {
  await sock.sendMessage(jid, {
    text: `╭━━━ 👑 KING BOT ━━━╮
┃     OWNER INFO     ┃
╰━━━━━━━━━━━━━━━━━━╯

👑 Owner : ${config.ownerName}
🤖 Bot   : KING BOT
🟢 Status: Aktif

📱 WhatsApp:
${config.ownerNumber}

🛠️ Bantuan:
Ketik !help

━━━━━━━━━━━━━━━━━━
Smart • Secure • Helpful`
  });

  continue;
}

if (text.trim().toLowerCase() === "!info") {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  await sock.sendMessage(jid, {
    text: `╭━━━ 🤖 KING BOT ━━━╮
┃      BOT INFO      ┃
╰━━━━━━━━━━━━━━━━━━╯

🟢 Status : ONLINE
⏱️ Uptime : ${hours}j ${minutes}m
💬 Pesan  : ${stats.messages}
⚡ Command: ${stats.commands}
👑 Admin  : Terdeteksi

🛡️ Smart • Secure • Helpful`
  });

  continue;
}

if (text.trim().toLowerCase() === "!rules") {
  if (!jid.endsWith("@g.us")) {
    await sock.sendMessage(jid, {
      text: "⚠️ !rules hanya bisa digunakan di grup."
    });
    continue;
  }

  try {
    const metadata = await sock.groupMetadata(jid);
    const description = metadata.desc?.trim() || "Belum ada deskripsi grup.";

    await sock.sendMessage(jid, {
      text: `╭━━━ 📜 GROUP RULES ━━━╮
┃       ${metadata.subject}
╰━━━━━━━━━━━━━━━━━━━━╯

${description}

🤖 ATURAN KING BOT
• 🚫 Jangan chat/mention/call bot.
• ⚠️ Pelanggaran berulang dapat mendapat peringatan.
• 👑 Admin grup mendapat pengecualian aturan bot.

🛡️ KING BOT
Smart • Secure • Helpful`
    });
  } catch (error) {
    console.log("GAGAL AMBIL RULES:", error.message);
    await sock.sendMessage(jid, {
      text: "⚠️ Gagal mengambil deskripsi grup."
    });
  }

  continue;
}

if (text.trim().toLowerCase() === "!help") {
  await sock.sendMessage(jid, {
    text:
`╭━━━ 🤖 KING BOT ━━━╮
┃     PUSAT BANTUAN
╰━━━━━━━━━━━━━━━━━━╯

📌 PERINTAH UMUM
• !menu — Buka menu utama
• !help — Tampilkan bantuan
• !ping — Cek respons bot
• !status — Cek status bot
• !config — Lihat konfigurasi
• !stats — Lihat statistik bot
• !log — Lihat activity log
• !admin — Cek informasi admin

🛡️ MODERASI
• !antitoxic on/off — Anti-toxic
• !antilink on/off — Anti-link
• !antispam on/off — Anti-spam
• !welcome on/off — Welcome member

⏰ REMINDER
• !ingatkan HH:MM Pesan
• !pengingat — Lihat pengingat
• !hapusingat N — Hapus pengingat (admin)

👑 ADMIN
• !panel — Panel kontrol admin
• !toxic Nama — Catat pelanggaran
• !jam buka — Atur jam buka
• !jam tutup — Atur jam tutup
• !join Nama — Simulasi/fitur join
• !leave Nama — Simulasi/fitur leave

🤖 AUTO FAQ
Tanyakan hal seperti:
• admin dimana
• admin ada?
• mana admin?
• admin online?

💡 Tips:
Gunakan !menu untuk melihat menu utama.
Gunakan !help kapan saja untuk melihat daftar perintah.

👑 KING BOT
Smart • Secure • Helpful`
  });

  continue;
}

if (text.trim().toLowerCase() === "!log") {
  await sock.sendMessage(jid, {
    text: activityLog.length
      ? "📋 ACTIVITY LOG\n\n" + activityLog.slice(-20).join("\n")
      : "📋 Activity Log masih kosong."
  });

  continue;
}

if (text.trim().toLowerCase() === "!ping") {
  await sock.sendMessage(jid, {
    text: "🏓 Pong!"
  });
  continue;
}

if (text.trim().toLowerCase() === "!status") {
  await sock.sendMessage(jid, {
    text: "🟢 KING BOT ONLINE"
  });
  continue;
}

if (text.trim().toLowerCase() === "!config") {
  await sock.sendMessage(jid, {
    text:
`⚙️ CONFIG KING BOT

🤖 Status: ON
🛡️ Anti Toxic: ON
🔗 Anti Link: ON
🚫 Anti Spam: ON
👋 Welcome: ON`
  });
  continue;
}

if (text.trim().toLowerCase().startsWith("!toxic ")) {
  const name = text.trim().slice(7).trim();

  if (!name) {
    await sock.sendMessage(jid, {
      text: "❌ Format: !toxic Nama"
    });
    continue;
  }

  await sock.sendMessage(jid, {
    text: `⚠️ Peringatan toxic untuk ${name} dicatat.`
  });

  stats.toxic++;
  logActivity("TOXIC", name);

  continue;
}

if (text.trim().toLowerCase().startsWith("!ingatkan ")) {
  const data = text.trim().slice(10).trim();
  const parts = data.split(" ");
  const time = parts.shift();
  const message = parts.join(" ");

  if (!/^\d{2}:\d{2}$/.test(time) || !message) {
    await sock.sendMessage(jid, {
      text: "❌ Format: !ingatkan HH:MM Pesan"
    });
    continue;
  }

  const remindersFile = "./reminders.json";
  let reminders = [];

  try {
    reminders = JSON.parse(
      require("fs").readFileSync(remindersFile, "utf8")
    );
  } catch {
    reminders = [];
  }

  reminders.push({
    jid,
    time,
    message
  });

  require("fs").writeFileSync(
    remindersFile,
    JSON.stringify(reminders, null, 2)
  );

  await sock.sendMessage(jid, {
    text: `⏰ Pengingat dibuat untuk ${time}`
  });

  logActivity("REMINDER", `${time} - ${message}`);
  continue;
}

if (text.trim().toLowerCase() === "!pengingat") {
  let reminders = [];

  try {
    reminders = JSON.parse(
      require("fs").readFileSync("./reminders.json", "utf8")
    );
  } catch {
    reminders = [];
  }

  if (reminders.length === 0) {
    await sock.sendMessage(jid, {
      text: "📭 Tidak ada pengingat."
    });
    continue;
  }

  const daftar = reminders.map((r, i) =>
    `${i + 1}. ⏰ ${r.time} — ${r.message}`
  ).join("\n");

  await sock.sendMessage(jid, {
    text: "📋 DAFTAR PENGINGAT\n\n" + daftar
  });

  continue;
}

if (text.trim().toLowerCase().startsWith("!hapusingat ")) {
  const admin = await isGroupAdmin(jid, sender);

  if (!admin) {
    await sock.sendMessage(jid, {
      text: "🚫 Hanya ADMIN yang bisa menghapus pengingat."
    });
    continue;
  }

  const id = parseInt(
    text.trim().slice(12).trim(),
    10
  );

  let reminders = [];

  try {
    reminders = JSON.parse(
      require("fs").readFileSync("./reminders.json", "utf8")
    );
  } catch {
    reminders = [];
  }

  if (
    isNaN(id) ||
    id < 1 ||
    id > reminders.length
  ) {
    await sock.sendMessage(jid, {
      text: "❌ ID pengingat tidak valid."
    });
    continue;
  }

  const removed = reminders.splice(id - 1, 1)[0];

  require("fs").writeFileSync(
    "./reminders.json",
    JSON.stringify(reminders, null, 2)
  );

  await sock.sendMessage(jid, {
    text: `🗑️ Pengingat ${id} dihapus.`
  });

  logActivity(
    "REMINDER DELETE",
    `${removed.time} - ${removed.message}`
  );

  continue;
}

if (text.trim().toLowerCase().startsWith("!jam buka ")) {
  const hour = parseInt(text.trim().slice(10));

  if (isNaN(hour) || hour < 0 || hour > 23) {
    await sock.sendMessage(jid, {
      text: "❌ Format: !jam buka HH"
    });
    continue;
  }

  openHour = hour;

  await sock.sendMessage(jid, {
    text: `🕐 Jam buka diatur ke ${openHour}:00`
  });

  continue;
}

if (text.trim().toLowerCase().startsWith("!jam tutup ")) {
  const hour = parseInt(text.trim().slice(11));

  if (isNaN(hour) || hour < 0 || hour > 23) {
    await sock.sendMessage(jid, {
      text: "❌ Format: !jam tutup HH"
    });
    continue;
  }

  closeHour = hour;

  await sock.sendMessage(jid, {
    text: `🌙 Jam tutup diatur ke ${closeHour}:00`
  });

  continue;
}

if (text.trim().toLowerCase().startsWith("!join ")) {
  const name = text.trim().slice(6).trim();

  await sock.sendMessage(jid, {
    text: name
      ? `👋 ${name} bergabung ke grup.`
      : "❌ Format: !join Nama"
  });

  if (name) {
    stats.joins++;
    logActivity("JOIN", name);
  }

  continue;
}

if (text.trim().toLowerCase().startsWith("!leave ")) {
  const name = text.trim().slice(7).trim();

  await sock.sendMessage(jid, {
    text: name
      ? `👋 ${name} keluar dari grup.`
      : "❌ Format: !leave Nama"
  });

  if (name) {
    logActivity("LEAVE", name);
  }

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

if (text.trim().toLowerCase() === "!panel") {
  const admin = await isGroupAdmin(jid, sender);

  if (!admin) {
    await sock.sendMessage(jid, {
      text: "❌ Kamu bukan admin grup."
    });
    continue;
  }

  await sock.sendMessage(jid, {
    text:
`👑 KING BOT ADMIN PANEL

📊 !stats
📋 !log
⚙️ !config
🔗 !antilink
🛡️ !antitoxic
🚫 !antispam`
  });

  continue;
}

if (text.trim().toLowerCase() === "!welcome on") {
  await sock.sendMessage(jid, {
    text: "👋 Welcome: ON"
  });
  continue;
}

if (text.trim().toLowerCase() === "!welcome off") {
  await sock.sendMessage(jid, {
    text: "👋 Welcome: OFF"
  });
  continue;
}

if (text.trim().toLowerCase() === "!antilink on") {
  await sock.sendMessage(jid, { text: "🔗 Anti-link: ON" });
  continue;
}

if (text.trim().toLowerCase() === "!antilink off") {
  await sock.sendMessage(jid, { text: "🔗 Anti-link: OFF" });
  continue;
}

if (text.trim().toLowerCase() === "!antitoxic on") {
  await sock.sendMessage(jid, { text: "🛡️ Anti-toxic: ON" });
  continue;
}

if (text.trim().toLowerCase() === "!antitoxic off") {
  await sock.sendMessage(jid, { text: "🛡️ Anti-toxic: OFF" });
  continue;
}

if (text.trim().toLowerCase() === "!antispam on") {
  await sock.sendMessage(jid, { text: "🚫 Anti-spam: ON" });
  continue;
}

if (text.trim().toLowerCase() === "!antispam off") {
  await sock.sendMessage(jid, { text: "🚫 Anti-spam: OFF" });
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

const welcomeTracker = {};
sock.ev.on("group-participants.update", async (update) => {
  if (update.action !== "add") return;

  const jid = update.id;
  const now = Date.now();

  if (!welcomeTracker[jid]) {
    welcomeTracker[jid] = [];
  }

  welcomeTracker[jid] = welcomeTracker[jid].filter(
    time => now - time <= 30 * 60 * 1000
  );

  welcomeTracker[jid].push(now);

  // 5 atau lebih member masuk dalam 30 menit = tahan welcome
  if (welcomeTracker[jid].length >= 5) {
    console.log(
      `SMART WELCOME: ${welcomeTracker[jid].length} member masuk, welcome ditahan.`
    );

    stats.joins += update.participants.length;

    for (const participant of update.participants) {
      logActivity("WELCOME_BLOCKED", participant);
    }

    return;
  }

    for (const participant of update.participants) {
      let groupRules = "Belum ada deskripsi grup."; 
      try {
        const metadata = await sock.groupMetadata(jid);
        groupRules = metadata.desc?.trim() || groupRules;
      } catch (error) {
        console.log("GAGAL AMBIL RULES WELCOME:", error.message);
      }

      await sock.sendMessage(jid, {
        text: `👋 Halo @${participant.split("@")[0]}! 🥳
Selamat datang di grup!

📜 RULES GRUP
${groupRules}

🤖 ATURAN KING BOT
• 🚫 Jangan chat/mention/call bot.
• ⚠️ Pelanggaran berulang dapat mendapat peringatan.
• 👑 Admin mendapat pengecualian aturan bot.

🛡️ KING BOT siap membantu.`,
        mentions: [participant]
      });
    stats.joins++;
    logActivity("WELCOME", participant);
   }
 });
}

startBot();
