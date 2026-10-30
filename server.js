const express = require("express");
const path = require("path");
const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const FALLBACK = process.env.GEMINI_FALLBACK_MODEL || "";
const PASS = process.env.APP_PASSWORD || "";
const WALLET_URL = (process.env.WALLET_URL || "").replace(/\/$/, "");
const ASSISTANT_KEY = process.env.ASSISTANT_KEY || "";

const SYSTEM =
  "তুমি আমার ব্যক্তিগত এআই অ্যাসিস্ট্যান্ট। সবসময় সহজ, বন্ধুত্বপূর্ণ বাংলায় উত্তর দাও। উত্তর ছোট ও কাজের মতো রাখো। " +
  "আমার ব্যবসার ডিপোজিট, ব্যালেন্স, পেন্ডিং বা সাইটের (rsgallery = RS Gallery, rsmatrix = RS Growth Matrix) হিসাব জানতে চাইলে get_wallet_summary টুল ব্যবহার করো, নিজে সংখ্যা বানাবে না। " +
  "approved মানে অনুমোদিত/সফল, pending মানে অপেক্ষমাণ, rejected মানে বাতিল। টাকার অঙ্ক টাকায় বলো। " +
  "টুলে যা নেই (যেমন ইউজারের উইথড্র রিকোয়েস্ট) তা না থাকার কথা সৎভাবে বলো। না জানলে সৎভাবে বলো।";

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: "get_wallet_summary",
        description:
          "RS Wallet থেকে বর্তমান ব্যালেন্স, মোট ও আজকের জমা-খরচ, পেন্ডিং ডিপোজিট এবং প্রতিটি সাইটের (rsgallery, rsmatrix) আজকের ও সব সময়ের ডিপোজিটের সংখ্যা ও পরিমাণ আনে।",
      },
    ],
  },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getWalletSummary() {
  if (!WALLET_URL || !ASSISTANT_KEY) {
    return { error: "Wallet-এর সংযোগ সেট করা নেই" };
  }
  const r = await fetch(WALLET_URL + "/api/assistant/summary", {
    headers: { "x-assistant-key": ASSISTANT_KEY },
    signal: AbortSignal.timeout(60000),
  });
  return await r.json();
}

let useThinkingCfg = true;

async function callGemini(contents) {
  let lastErr = "Gemini-তে সমস্যা হয়েছে";
  const order = FALLBACK ? [MODEL, FALLBACK, MODEL, FALLBACK] : [MODEL, MODEL, MODEL];

  for (let attempt = 0; attempt < order.length; attempt++) {
    const model = order[attempt];
    const body = {
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents,
      tools: TOOLS,
    };
    if (useThinkingCfg) {
      body.generationConfig = { thinkingConfig: { thinkingLevel: "low" } };
    }

    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15000),
        }
      );
      const data = await r.json();
      if (r.ok) return data;

      const msg = (data.error && data.error.message) || "";
      console.error("Gemini ত্রুটি:", r.status, model, msg.slice(0, 300));
      lastErr = msg || lastErr;

      if (r.status === 400 && useThinkingCfg && /thinking/i.test(msg)) {
        useThinkingCfg = false;
        attempt--;
        continue;
      }
      if (r.status === 429 || r.status === 500 || r.status === 503 || r.status === 404) {
        await sleep(800);
        continue;
      }
      throw new Error(lastErr);
    } catch (e) {
      if (e.name === "TimeoutError" || e.name === "AbortError") {
        console.error("Gemini timeout:", model);
        lastErr = "Gemini সময়মতো উত্তর দেয়নি";
        continue;
      }
      throw e;
    }
  }
  throw new Error(lastErr + " (একটু পরে আবার পাঠান)");
}

// পরীক্ষার পেজ: /test?p=আপনার_পাসওয়ার্ড
app.get("/test", async (req, res) => {
  if (PASS && req.query.p !== PASS) {
    return res.status(401).send("পাসওয়ার্ড লাগবে: /test?p=...");
  }
  try {
    const d = await callGemini([
      { role: "user", parts: [{ text: "শুধু বলো: কাজ করছে" }] },
    ]);
    res.type("text/plain").send(JSON.stringify(d, null, 2).slice(0, 2000));
  } catch (e) {
    res.type("text/plain").send("ত্রুটি: " + e.message);
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    if (PASS && req.headers["x-app-password"] !== PASS) {
      return res.status(401).json({ error: "পাসওয়ার্ড ভুল" });
    }
    const messages = (req.body.messages || []).slice(-30);
    const contents = messages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    for (let i = 0; i < 4; i++) {
      const data = await callGemini(contents);
      const content =
        data.candidates && data.candidates[0] && data.candidates[0].content;
      const parts = (content && content.parts) || [];
      const calls = parts.filter((p) => p.functionCall);

      if (!calls.length) {
        const text =
          parts.map((p) => p.text || "").join("") || "উত্তর পাওয়া যায়নি";
        return res.json({ reply: text });
      }

      contents.push(content);
      const responses = [];
      for (const c of calls) {
        let result;
        try {
          if (c.functionCall.name === "get_wallet_summary") {
            result = await getWalletSummary();
          } else {
            result = { error: "অজানা টুল" };
          }
        } catch (e) {
          console.error("Wallet ত্রুটি:", e.message);
          result = { error: "Wallet-এ পৌঁছানো যায়নি" };
        }
        responses.push({
          functionResponse: { name: c.functionCall.name, response: { result } },
        });
      }
      contents.push({ role: "user", parts: responses });
    }
    res.json({ reply: "দুঃখিত, উত্তর তৈরি করতে পারিনি। আবার চেষ্টা করুন।" });
  } catch (e) {
    console.error("চ্যাট ত্রুটি:", e.message);
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("চালু হয়েছে"));
