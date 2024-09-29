const fs = require('fs-extra');
const path = require('path');

const statsFile = path.join(__dirname, 'userStats.json');

async function initializeStats() {
  if (!await fs.pathExists(statsFile)) {
    await fs.writeJson(statsFile, {});
  }
}

async function getUserStats(username) {
  await initializeStats();
  const stats = await fs.readJson(statsFile);
  return stats[username] || { imagesProcessed: 0, lastReset: new Date().toISOString() };
}

async function updateUserStats(username, imagesProcessed) {
  await initializeStats();
  const stats = await fs.readJson(statsFile);
  const userStats = stats[username] || { imagesProcessed: 0, lastReset: new Date().toISOString() };
  
  const lastReset = new Date(userStats.lastReset);
  const now = new Date();
  
  if (now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    userStats.imagesProcessed = 0;
    userStats.lastReset = now.toISOString();
  }
  
  userStats.imagesProcessed += imagesProcessed;
  stats[username] = userStats;
  
  await fs.writeJson(statsFile, stats);
  return userStats.imagesProcessed;
}

module.exports = { getUserStats, updateUserStats };