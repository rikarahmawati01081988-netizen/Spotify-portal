const spamData = {};

function checkSpam(name) {
  const now = Date.now();

  if (!spamData[name]) {
    spamData[name] = [];
  }

  spamData[name] = spamData[name].filter(
    time => now - time < 30000
  );

  spamData[name].push(now);

  if (spamData[name].length >= 5) {
    spamData[name] = [];

    return true;
  }

  return false;
}

function resetSpam(name) {
  delete spamData[name];
}

module.exports = {
  checkSpam,
  resetSpam
};
