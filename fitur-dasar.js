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

const fitur = {
  antiLink: true,
  antiToxic: true,
  antiSpam: true,
  welcome: true
};

let groupOpen = null;

const groupAdmins = {
  admin1: true,
  admin2: true
};

const adminStatus = {
  admin1: "online",
  admin2: "online"
};

function isAdmin(name) {
  return groupAdmins[name.toLowerCase()] === true;
}

function setAdmin(name, status) {
  groupAdmins[name.toLowerCase()] = status;
}

function getAdminStatus(name) {
  const key = name.toLowerCase();

  if (!isAdmin(name)) {
    return null;
  }

  return adminStatus[key] || "online";
}

let openHour = 7
let closeHour = 23

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
}

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
╔══════════════════════════════════╗
║        🤖 KING BOT - HELP        ║
╚══════════════════════════════════╝

📌 UMUM
!ping
  Fungsi : Cek apakah bot aktif.
  Contoh : !ping

!status
  Fungsi : Melihat status bot.
  Contoh : !status

!config
  Fungsi : Melihat konfigurasi bot.
  Contoh : !config

!help
  Fungsi : Menampilkan panduan semua fitur.
  Contoh : !help


👥 GRUP
!join Nama
  Fungsi : Simulasi member baru masuk.
  Contoh : !join Budi

!leave Nama
  Fungsi : Simulasi member keluar.
  Contoh : !leave Budi


🛡️ KEAMANAN
!antilink on/off
  Fungsi : Mengatur anti-link.
  Contoh : !antilink on

!antitoxic on/off
  Fungsi : Mengatur anti-toxic.
  Contoh : !antitoxic off

!antispam on/off
  Fungsi : Mengatur anti-spam.
  Contoh : !antispam on


👑 ADMIN
!setadmin Nama
  Fungsi : Menjadikan member sebagai admin.
  Contoh : !setadmin Budi

!deladmin Nama
  Fungsi : Menghapus status admin.
  Contoh : !deladmin Budi

!panel
  Fungsi : Membuka panel khusus admin.
  Contoh : Budi: !panel


⏰ JADWAL
!jam buka HH
  Fungsi : Mengatur jam buka grup.
  Contoh : !jam buka 07

!jam tutup HH
  Fungsi : Mengatur jam tutup grup.
  Contoh : !jam tutup 23


⏱️ PENGINGAT
!ingatkan HH:MM Pesan
  Fungsi : Membuat pengingat.
  Contoh : admin: !ingatkan 20:00 Waktunya belajar

!pengingat
  Fungsi : Melihat daftar pengingat.
  Contoh : !pengingat


☣️ TOXIC MANUAL
!toxic Nama
  Fungsi : Simulasi deteksi toxic.
  Contoh : !toxic Budi


💬 TES PESAN
Nama: pesan
  Fungsi : Simulasi pesan dari member.
  Contoh : Budi: halo


🚨 ANTI-SPAM
  Fungsi : Mendeteksi spam.
  Cara tes : Kirim 5 pesan dari nama yang sama
             dalam waktu 30 detik.


🚪 KELUAR
exit
  Fungsi : Menutup simulator.


══════════════════════════════════
💡 Gunakan perintah sesuai contoh.
══════════════════════════════════
  `);
}

// =========================
// READLINE
// =========================

