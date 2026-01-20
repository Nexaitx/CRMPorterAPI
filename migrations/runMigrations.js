const fs = require("fs");
const path = require("path");

const runMigrations = async () => {
  const dir = path.join(__dirname);
  const files = fs
    .readdirSync(dir)
    .filter(f => f !== "runMigrations.js")
    .sort();

  for (const file of files) {
    console.log(`Running migration: ${file}`);
    const migration = require(path.join(dir, file));
    await migration();
  }
};

module.exports = runMigrations;
