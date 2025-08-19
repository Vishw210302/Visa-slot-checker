let express = require("express");
let logger = require("morgan");
const puppeteer = require("puppeteer");
const cors = require("cors");

let app = express();
app.use(cors());
app.use(logger("dev"));
app.use(express.json());

async function callSlotsApiBrowser() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
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
  } catch (error) {
    await browser.close();
    throw error;
  }
}

app.get("/api/checkslot", async (req, res) => {
  try {
    console.log("🔍 Checking slots...");

    const data = await callSlotsApiBrowser();

    // Filter for VAC locations with available slots
    const hasSlotVacLocation = data.slotDetails.filter(
      (item) => item.visa_location.endsWith("VAC") && item.slots > 0
    );

    // Prepare response
    const response = {
      hasSlot: hasSlotVacLocation.length > 0,
      data: hasSlotVacLocation.map((slot) => ({
        visa_location: slot.visa_location,
        slots: slot.slots,
        createdon: slot.createdon,
        imghash: slot.imghash
      })),
      userActivity: data.userActivity || null
    };

    console.log(`✅ Slots check completed. Found ${hasSlotVacLocation.length} locations with slots.`);
    
    res.json(response);
  } catch (error) {
    console.error("❌ Error checking slots:", error);
    res.status(500).json({
      hasSlot: false,
      data: [],
      userActivity: null,
      error: "Failed to check slots"
    });
  }
});

// Test endpoint with mock data
app.get("/api/test", (req, res) => {
  // Mock data based on your example
  const mockResponse = {
    hasSlot: true,
    data: [
      {
        visa_location: "MUMBAI VAC",
        slots: 3,
        createdon: "Tue, 19 Aug 2025 09:53:58 GMT",
        imghash: "W2K2X0d9p3e0o9L4f8"
      },
      {
        visa_location: "CHENNAI VAC", 
        slots: 2,
        createdon: "Tue, 19 Aug 2025 09:53:25 GMT",
        imghash: "N2Q2L0U923n088a5A0"
      }
    ],
    userActivity: {
      remaining: 414,
      retrieve: 0,
      slots: 25,
      upload: 10
    }
  };

  res.json(mockResponse);
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

module.exports = app;
