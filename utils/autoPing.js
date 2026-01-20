const https = require("https");

const AUTO_PING_INTERVAL = 10 * 60 * 1000; // 10 minutes

const autoPing = (url) => {
  setInterval(() => {
    https
      .get(url, (res) => {
        console.log(`🔁 Auto-ping status: ${res.statusCode}`);
      })
      .on("error", (err) => {
        console.error("❌ Auto-ping error:", err.message);
      });
  }, AUTO_PING_INTERVAL);
};

module.exports = autoPing;
