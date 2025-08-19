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

// async function callSlotsApiBrowser() {
//   const browser = await puppeteer.launch({ headless: true });
//   const page = await browser.newPage();

//   const data = await page.evaluate(async () => {
//     const res = await fetch("https://app.checkvisaslots.com/slots/v3", {
//       method: "GET",
//       headers: {
//         accept: "*/*",
//         "accept-language": "en-US,en;q=0.9",
//         extversion: "4.6.5.1",
//         priority: "u=1, i",
//         "sec-ch-ua":
//           '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
//         "sec-ch-ua-mobile": "?0",
//         "sec-ch-ua-platform": '"Windows"',
//         "sec-fetch-dest": "empty",
//         "sec-fetch-mode": "cors",
//         "sec-fetch-site": "cross-site",
//         "x-api-key": "KY1F21",
//       },
//     });
//     return res.json();
//   });

//   await browser.close();
//   return data;
// }

// ✅ Cron job every 1 minute
async function callSlotsApiBrowser() {
  const data = {
    slotDetails: [
      {
        createdon: "Tue, 19 Aug 2025 09:53:41 GMT",
        imghash: "S2W2v0U9b3q0Q8F9R2",
        slots: 0,
        visa_location: "CHENNAI",
      },
      {
        createdon: "Tue, 19 Aug 2025 09:53:25 GMT",
        imghash: "N2Q2L0U923n088a5A0",
        slots: 2,
        visa_location: "CHENNAI VAC",
      },
      {
        createdon: "Tue, 19 Aug 2025 09:52:49 GMT",
        imghash: "y2V210p953d0P7z4w1",
        slots: 0,
        visa_location: "HYDERABAD",
      },
      {
        createdon: "Tue, 19 Aug 2025 09:53:57 GMT",
        imghash: "n2n2R0K903J0W9J4C6",
        slots: 1,
        visa_location: "HYDERABAD VAC",
      },
      {
        createdon: "Tue, 19 Aug 2025 09:52:00 GMT",
        imghash: "W2d2B0g9Q3F0q6q0T5",
        slots: 0,
        visa_location: "KOLKATA",
      },
      {
        createdon: "Tue, 19 Aug 2025 09:53:50 GMT",
        imghash: "I2q2e0b9H3Y0f9g1k5",
        slots: 0,
        visa_location: "KOLKATA VAC",
      },
      {
        createdon: "Tue, 19 Aug 2025 09:52:47 GMT",
        imghash: "V2T2J0n9F3t0J7m3b7",
        slots: 0,
        visa_location: "MUMBAI",
      },
      {
        createdon: "Tue, 19 Aug 2025 09:53:58 GMT",
        imghash: "W2K2X0d9p3e0o9L4f8",
        slots: 2,
        visa_location: "MUMBAI VAC",
      },
      {
        createdon: "Tue, 19 Aug 2025 09:53:36 GMT",
        imghash: "62C200I923Z0C8E715",
        slots: 0,
        visa_location: "NEW DELHI",
      },
      {
        createdon: "Tue, 19 Aug 2025 09:54:00 GMT",
        imghash: "V2V2M0f923y039Y5O2",
        slots: 0,
        visa_location: "NEW DELHI VAC",
      },
    ],
    userActivity: { remaining: 414, retrieve: 0, slots: 25, upload: 10 },
    userDetails: {
      appointment_type: "Regular",
      subscription: "FREE",
      visa_type: "F-1",
    },
  };
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
