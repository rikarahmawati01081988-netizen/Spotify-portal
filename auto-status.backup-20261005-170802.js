const fs = require("fs");

const FILE = "./auto-status.json";

function loadStatuses() {
  if (!fs.existsSync(FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveStatuses(statuses) {
  fs.writeFileSync(FILE, JSON.stringify(statuses, null, 2));
}

function setStatus(name, activity) {
  const statuses = loadStatuses();
  statuses[name.toLowerCase()] = {
    name,
    activity,
    updatedAt: new Date().toISOString()
  };
  saveStatuses(statuses);
}

function getStatus(name) {
  return loadStatuses()[name.toLowerCase()] || null;
}

function deleteStatus(name) {
  const statuses = loadStatuses();
  delete statuses[name.toLowerCase()];
  saveStatuses(statuses);
}

module.exports = {
  setStatus,
  getStatus,
  deleteStatus
};
