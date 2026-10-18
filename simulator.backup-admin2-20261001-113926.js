const fs = require("fs");

const remindersFile = "./reminders.json";

let reminders = JSON.parse(
  fs.readFileSync(remindersFile, "utf8")
);

function saveReminders() {
  fs.writeFileSync(
    remindersFile,
    JSON.stringify(reminders, null, 2)
  );
}

const readline = require("readline");
const { checkSpam } = require("./antiSpam");

// =========================
// BAD WORDS
// =========================

const kataKasar = JSON.parse(
  fs.readFileSync("./badwords.json", "utf8")
);

function containsToxic(text) {
  const lower = text.toLowerCase();
  console.log("DEBUG:", JSON.stringify(text));

  return kataKasar.some(kata =>
    new RegExp(`\\b${kata}\\b`, "i").test(lower)
  );
}

// =========================
// DATA BOT
// =========================

let groupOpen = null;

const config = JSON.parse(
  fs.readFileSync("./config.json", "utf8")
);

function saveConfig() {
  config.antiToxic = fitur.antiToxic;
  config.antiLink = fitur.antiLink;
  config.antiSpam = fitur.antiSpam;
  config.welcome = fitur.welcome
  config.openHour = openHour;
  config.closeHour = closeHour;

  fs.writeFileSync(
    "./config.json",
    JSON.stringify(config, null, 2)
  );
}

const warnings = {};

// =========================
// ADMIN SIMULASI
// =========================

const groupAdmins = {
  "admin1": true,
  "admin2": true
};

function isAdmin(name) {
function setAdmin(name, status) {
  groupAdmins[name.toLowerCase()] = status;
}
  return groupAdmins[name.toLowerCase()] === true;
}
function setAdmin(name, status) {
  groupAdmins[name.toLowerCase()] = status;
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
  const time = new Date().toLocaleTimeString("id-ID");
  activityLog.push(`[${time}] ${type}: ${detail}`);

  if (activityLog.length > 50) {
    activityLog.shift();
  }
}

const fitur = {
  antiToxic: config.antiToxic,
  antiLink: config.antiLink,
  antiSpam: config.antiSpam,
  welcome: config.welcome
};

let openHour = config.openHour;
let closeHour = config.closeHour;

const admins = ["admin", "owner"];

const members = [
  "Budi",
  "Andi",
  "Siti",
  "Rizky"
];

function isAdmin(name) {
  return admins.includes(name.toLowerCase());
}

const waChannelPattern =
  /https?:\/\/(www\.)?whatsapp\.com\/channel\/[A-Za-z0-9_-]+/i;

// =========================
// LINK
// =========================

function isLink(text) {
  return /(https?:\/\/|www\.)\S+/i.test(text);
}

function isSocialLink(text) {
  return waChannelPattern.test(text);
}

// =========================
// TOXIC
// =========================

function toxicMessage(name) {
  warnings[name] = (warnings[name] || 0) + 1;

  if (warnings[name] < 5) {
    console.log(
      `⚠️ ${name}: Peringatan ${warnings[name]}/5`
    );
  } else {
    console.log(`🚫 ${name} dikeluarkan!`);
    warnings[name] = 0;
  }
}

// =========================
// SCHEDULE
// =========================

function checkSchedule() {
  const hour = new Date().getHours();
  const open = hour >= openHour && hour < closeHour;

  if (groupOpen !== open) {
    groupOpen = open;

    if (open) {
      console.log("🟢 Grup dibuka.");
    } else {
      console.log("🔴 Grup ditutup. Waktunya tidur 😴");
    }
  }
}

checkSchedule();
setInterval(checkSchedule, 60000);

// CEK PENGINGAT OTOMATIS
function checkReminders() {
  const now = new Date();
  const currentTime =
    String(now.getHours()).padStart(2, "0") +
    ":" +
    String(now.getMinutes()).padStart(2, "0");

  const due = reminders.filter(
    reminder => reminder.time === currentTime
  );

  for (const reminder of due) {
console.log(`
[GROUP]
📢 PENGINGAT OTOMATIS
⏰ ${reminder.time}
📝 ${reminder.message}

👥 ${members.map(name => "@" + name).join(" ")}
    `);
   }
  if (due.length > 0) {
    reminders = reminders.filter(
      reminder => reminder.time !== currentTime
    );

    saveReminders();
  }
}

setInterval(checkReminders, 60000);

// =========================
// HELP
// =========================

function showHelp() {
  console.log(`
========== BOT SIMULATOR ==========

!ping
!status
!config
!join Nama
!toxic Nama
!help
exit

Tes pesan:
Nama: pesan

Contoh:
Budi: halo

Anti-spam:
Kirim 5 pesan dari nama yang sama
dalam waktu 30 detik.

===================================
  `);
}

// =========================
// READLINE
// =========================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("🤖 BOT SIMULATOR AKTIF");
console.log("Ketik !help untuk melihat perintah.");

// =========================
// PESAN
// =========================

rl.on("line", (text) => {

  const lower = text.toLowerCase().trim();
if (text.trim() && !text.trim().startsWith("!")) {
  stats.messages++;
}  
  if (lower === "!menu") {
      console.log(`
╔══════════════════════════════╗
          👑 KING BOT
╚══════════════════════════════╝

🏓 !ping
Fungsi: Mengecek apakah bot aktif.
Contoh: 🏓 Pong! Bot aktif.

📊 !status
Fungsi: Melihat status bot.

⚙️ !config
Fungsi: Melihat konfigurasi bot.

👋 !join Budi
Fungsi: Memberi salam kepada Budi.
Contoh: 👋 Halo Budi! Selamat datang di grup 👑

🛡️ KEAMANAN
🔗 Anti-Link
🚫 Anti-Toxic
🚨 Anti-Spam
👋 Auto Welcome

⏰ PENGINGAT
🔔 !ingatkan 19:00 Belajar
📋 !pengingat
🗑️ !hapusingat 1

🕐 JADWAL GRUP
🔓 !jam buka 08
🔒 !jam tutup 22

━━━━━━━━━━━━━━━━━━━━
          👑 KING BOT
   Simple • Secure • Automatic
━━━━━━━━━━━━━━━━━━━━
      `);
      return;
    }


  // DETEKSI PRIVATE MESSAGE
  let messageType = "GROUP";

  if (text.trim().startsWith("[PRIVATE]")) {
    messageType = "PRIVATE";
  }

  const cleanText = text
    .replace(/^\s*\[PRIVATE\]\s*/, "")
    .trim();

  // STATS
  if (cleanText.toLowerCase() === "!stats") {
    stats.commands++;
    logActivity("COMMAND", "!stats");

    console.log(`
╔══════════════════════════════╗
          📊 KING BOT STATS
╚══════════════════════════════╝

💬 Pesan    : ${stats.messages}
⚙️ Command  : ${stats.commands}
👋 Join     : ${stats.joins}
☣️ Toxic    : ${stats.toxic}
🚨 Spam     : ${stats.spam}
🔗 Link     : ${stats.links}
📝 Activity : ${activityLog.length}

━━━━━━━━━━━━━━━━━━━━
          👑 KING BOT
━━━━━━━━━━━━━━━━━━━━
`);
    return;
  }

  // ACTIVITY LOG
  if (cleanText.toLowerCase() === "!log") {
    stats.commands++;
    logActivity("COMMAND", "!log");

    console.log(`
╔══════════════════════════════╗
          📝 ACTIVITY LOG
╚══════════════════════════════╝

${activityLog.length > 0 ? activityLog.join("\n") : "📭 Belum ada aktivitas."}

━━━━━━━━━━━━━━━━━━━━
`);
    return;
  }

    
  // PANEL KONFIGURASI
  if (cleanText.toLowerCase() === "admin: !panel") {
    console.log(`
╔══════════════════════════════╗
        ⚙️ KING BOT PANEL
╚══════════════════════════════╝

🛡️ KEAMANAN
🔗 Anti-Link   : ${typeof config !== "undefined" && config.antilink !== undefined ? (config.antilink ? "ON" : "OFF") : "AKTIF"}
🚫 Anti-Toxic  : ${typeof config !== "undefined" && config.antitoxic !== undefined ? (config.antitoxic ? "ON" : "OFF") : "AKTIF"}
🚨 Anti-Spam   : ${typeof config !== "undefined" && config.antispam !== undefined ? (config.antispam ? "ON" : "OFF") : "AKTIF"}
👋 Welcome     : ${typeof config !== "undefined" && config.welcome !== undefined ? (config.welcome ? "ON" : "OFF") : "AKTIF"}

⏰ JADWAL
🔓 Jam buka    : ${typeof config !== "undefined" && config.jamBuka !== undefined ? config.jamBuka : "08:00"}
🔒 Jam tutup   : ${typeof config !== "undefined" && config.jamTutup !== undefined ? config.jamTutup : "22:00"}

━━━━━━━━━━━━━━━━━━━━
Gunakan perintah admin untuk mengubah pengaturan.
━━━━━━━━━━━━━━━━━━━━
    `);
    return;
  }

  // GOODBYE / LEAVE
  if (cleanText.toLowerCase().startsWith("!leave ")) {
    const name = cleanText.slice(7).trim() || "Member";
    console.log(`👋 ${name} telah meninggalkan grup.`);
    console.log("💬 Seandainya kita tidak pernah bertemu, mungkin tak ada bagian diriku yang hilang saat kau pergi.");
    return;
  }

  // EXIT
  if (lower === "exit") {
    console.log("👋 Bot dimatikan.");
    process.exit(0);
  }

// ADMIN ON/OFF FITUR
if (lower.includes(": !antilink ")) {
  const parts = text.split(":");
  const name = parts[0].trim();
  const action = parts.slice(1).join(":").trim().toLowerCase();

  if (!admins.includes(name.toLowerCase())) {
    console.log(`🚫 ${name}, kamu bukan admin!`);
    return;
  }

if (action === "!antilink on") {
  fitur.antiLink = true;
  saveConfig();
  console.log("🔗 Anti-link: ON");
  return;
}

if (action === "!antilink off") {
  fitur.antiLink = false;
  saveConfig();
  console.log("🔗 Anti-link: OFF");
  return;
}

  console.log("❌ Gunakan: !antilink on/off");
  return;
}

// UBAH JAM BUKA/TUTUP
if (lower.startsWith("admin: !jam ")) {
  const parts = text.split(":");
  const name = parts[0].trim();
  const args = parts[1].trim().toLowerCase().split(/\s+/);

  if (!admins.includes(name.toLowerCase())) {
    console.log(`🚫 ${name}, kamu bukan admin!`);
    return;
  }

  const tipe = args[1];
  const jam = Number(args[2]);

  if (
    (tipe !== "buka" && tipe !== "tutup") ||
    !Number.isInteger(jam) ||
    jam < 0 ||
    jam > 23
  ) {
    console.log("❌ Format: admin: !jam buka/tutup 0-23");
    return;
  }

if (tipe === "buka") {
  openHour = jam;
  saveConfig();
  console.log(`🟢 Jam buka: ${jam}:00`);
} else {
  closeHour = jam;
  saveConfig();
  console.log(`🔴 Jam tutup: ${jam}:00`);
}

  return;
}

// ANTI-TOXIC ON/OFF
if (lower.includes(": !antitoxic ")) {
  const parts = text.split(":");
  const name = parts[0].trim();
  const action = parts.slice(1).join(":").trim().toLowerCase();

  if (!admins.includes(name.toLowerCase())) {
    console.log(`🚫 ${name}, kamu bukan admin!`);
    return;
  }

if (action === "!antitoxic on") {
  fitur.antiToxic = true;
  saveConfig();
  console.log("☣️ Anti-toxic: ON");
  return;
}

if (action === "!antitoxic off") {
  fitur.antiToxic = false;
  saveConfig();
  console.log("☣️ Anti-toxic: OFF");
  return;
}

  console.log("❌ Gunakan: !antitoxic on/off");
  return;
}

// ANTI-SPAM ON/OFF
if (lower.includes(": !antispam ")) {
  const parts = text.split(":");
  const name = parts[0].trim();
  const action = parts.slice(1).join(":").trim().toLowerCase();

  if (!admins.includes(name.toLowerCase())) {
    console.log(`🚫 ${name}, kamu bukan admin!`);
    return;
  }

if (action === "!antispam on") {
  fitur.antiSpam = true;
  saveConfig();
  console.log("🚨 Anti-spam: ON");
  return;
}

if (action === "!antispam off") {
  fitur.antiSpam = false;
  saveConfig();
  console.log("🚨 Anti-spam: OFF");
  return;
}

  console.log("❌ Gunakan: !antispam on/off");
  return;
}

// WELCOME ON/OFF
if (lower.includes(": !welcome ")) {
  const parts = text.split(":");
  const name = parts[0].trim();
  const action = parts.slice(1).join(":").trim().toLowerCase();

  if (!admins.includes(name.toLowerCase())) {
    console.log(`🚫 ${name}, kamu bukan admin!`);
    return;
  }

  if (action === "!welcome on") {
    fitur.welcome = true;
    saveConfig();
    console.log("👋 Welcome: ON");
    return;
  }

  if (action === "!welcome off") {
    fitur.welcome = false;
    saveConfig();
    console.log("👋 Welcome: OFF");
    return;
  }

  console.log("❌ Gunakan: admin: !welcome on/off");
  return;
}

  // PING
if (lower.includes(": !admin")) {
  const parts = text.split(":");
  const name = parts[0].trim();

  if (!admins.includes(name.toLowerCase())) {
    console.log(`🚫 ${name}, kamu bukan admin!`);
    return;
  }

  console.log(`👑 ${name} adalah admin.`);
  return;
}

if (lower === "!ping" || lower.endsWith(": !ping")) {
  console.log("🏓 Pong!");
  return;
}

// STATUS
if (lower === "!status" || lower === "!config") {
  console.log(`
╔════════════════════════════╗
║       🤖 BOT CONFIG        ║
╠════════════════════════════╣
║ ☣️ Anti-toxic : ${fitur.antiToxic ? "ON" : "OFF"}
║ 🔗 Anti-link  : ${fitur.antiLink ? "ON" : "OFF"}
║ 🚨 Anti-spam  : ${fitur.antiSpam ? "ON" : "OFF"}
║ 👋 Welcome    : ${fitur.welcome ? "ON" : "OFF"}
║ 🟢 Jam buka   : ${String(openHour).padStart(2, "0")}:00
║ 🔴 Jam tutup  : ${String(closeHour).padStart(2, "0")}:00
╚════════════════════════════╝
  `);
  return;
}

  // HELP
  if (lower === "!help") {
    showHelp();
    return;
  }

// PENGINGAT - BUAT

if (
  lower.startsWith("admin: !ingatkan ") ||
  cleanText.toLowerCase().startsWith("admin: !ingatkan ")
) {

const inputText = messageType === "PRIVATE"
  ? cleanText
  : text;

const parts = inputText.split(":");
  const name = parts[0].trim();
  const command = parts.slice(1).join(":").trim();

  if (!isAdmin(name)) {
    console.log(`🚫 ${name}, kamu bukan admin!`);
    return;
  }

  const match = command.match(
    /^!ingatkan\s+([01]\d|2[0-3]):([0-5]\d)\s+(.+)$/
  );

  if (!match) {
    console.log(
      "❌ Format: admin: !ingatkan HH:MM Pesan"
    );
    return;
  }

  const time = match[1] + ":" + match[2];
  const message = match[3].trim();

  reminders.push({
    id: Date.now(),
    time,
    message
  });

  saveReminders();

  console.log(`
⏰ Pengingat dibuat!

🕐 Waktu : ${time}
📝 Pesan : ${message}
  `);

  return;
}

// LIHAT PENGINGAT
if (lower === "!pengingat") {
  if (reminders.length === 0) {
    console.log("📭 Tidak ada pengingat.");
    return;
  }

  console.log("\n⏰ DAFTAR PENGINGAT");

  reminders.forEach((reminder, index) => {
    console.log(
      `${index + 1}. [${reminder.time}] ${reminder.message}`
    );
  });

  console.log("");
  return;
}

// HAPUS PENGINGAT
if (lower.startsWith("admin: !hapusingat ")) {
  const parts = text.split(":");
  const name = parts[0].trim();
  const command = parts.slice(1).join(":").trim();

  if (!isAdmin(name)) {
    console.log(`🚫 ${name}, kamu bukan admin!`);
    return;
  }

  const index = Number(
    command.replace("!hapusingat", "").trim()
  ) - 1;

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= reminders.length
  ) {
    console.log("❌ ID pengingat tidak valid.");
    return;
  }

  const removed = reminders.splice(index, 1)[0];

  saveReminders();

  console.log(`
🗑️ Pengingat dihapus!

⏰ ${removed.time}
📝 ${removed.message}
  `);

  return;
}

// JOIN
if (lower.startsWith("!join ")) {
  const name = text.substring(6).trim();

  if (!name) {
    console.log("❌ Nama belum diberikan.");
    return;
  }

  if (!fitur.welcome) {
    return;
  }

  console.log(`
👋 Halo ${name}!
Selamat datang di grup 🤖

📌 Baca aturan grup terlebih dahulu.
💬 Ketik !help untuk melihat perintah bot.
  `);

  return;
}

  // TOXIC MANUAL
  if (lower.startsWith("!toxic ")) {
    const name = text.substring(7).trim();

    if (name) {
      toxicMessage(name);
    } else {
      console.log("❌ Nama belum diberikan.");
    }

    return;
  }

  // PESAN NORMAL
  const parts = text.split(":");

  if (parts.length >= 2) {
    const name = parts[0].trim();
    const message = parts.slice(1).join(":").trim();

    if (!name || !message) {
      console.log("❌ Format: Nama: pesan");
      return;
    }

// ANTI-LINK
if (fitur.antiLink && isLink(message)) {

  const isAdmin = admins.includes(
    name.toLowerCase()
  );

  if (isAdmin) {
    console.log(`👑 Link dari admin ${name} diizinkan.`);
    return;
  }

  if (isSocialLink(message)) {
    console.log(`📢 Link Saluran WhatsApp dari ${name} diizinkan.`);
    return;
  }

  console.log(`🚫 Link dari ${name} dihapus!`);
  return;
}

    // ANTI-TOXIC
    if (fitur.antiToxic && containsToxic(message)) {
      console.log(`⚠️ ${name} mengirim kata kasar!`);
      toxicMessage(name);
      return;
    }

    // ANTI-SPAM
    if (fitur.antiSpam && checkSpam(name)) {
      console.log(`🚨 ${name} terdeteksi SPAM!`);
      toxicMessage(name);
      return;
    }

    console.log(`💬 ${name}: ${message}`);
    return;
  }

  console.log("❓ Perintah tidak dikenal. Ketik !help.");
});
