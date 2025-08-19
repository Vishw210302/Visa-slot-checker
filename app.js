let express = require("express");
let logger = require("morgan");
const puppeteer = require("puppeteer");
const cron = require("node-cron");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

let app = express();
app.use(logger("dev"));

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "dev-client",
    dataPath: "./.wwebjs_auth",
  }),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", (qr) => {
  console.log("⚡ Scan this QR only once:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("✅ WhatsApp client is ready! (Session loaded)");
});

client.on("authenticated", () => {
  console.log("🔐 Session authenticated and will be saved to .wwebjs_auth");
});

client.initialize();

async function callSlotsApiBrowser() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const data = await page.evaluate(async () => {
    const res = await fetch("https://app.checkvisaslots.com/slots/v3", {
      method: "GET",
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        extversion: "4.6.5.1",
        priority: "u=1, i",
        "sec-ch-ua":
          '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "x-api-key": "KY1F21",
      },
    });
    return res.json();
  });

  await browser.close();
  return data;
}

cron.schedule("* * * * *", async () => {
  console.log("🔍 Checking slots...");

  const data = await callSlotsApiBrowser();

  const hasSlotVacLocation = data.slotDetails.filter(
    (item) => item.visa_location.endsWith("VAC") && item.slots > 0
  );

  if (hasSlotVacLocation.length > 0) {
    const number = "919173211901";
    const chatId = number + "@c.us";

    const msg = `🚨 Slots Available!\n\n${hasSlotVacLocation
      .map((s) => `${s.visa_location}: ${s.slots} slots`)
      .join("\n")}`;

    // Send WhatsApp alert
    client
      .sendMessage(chatId, msg)
      .then(() => console.log("✅ WhatsApp alert sent"))
      .catch((err) => console.error("❌ WhatsApp send error:", err));
  }
});

module.exports = app;
