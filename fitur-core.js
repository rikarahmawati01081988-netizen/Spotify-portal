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

