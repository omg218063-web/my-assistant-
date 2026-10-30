const express = require("express");
const path = require("path");
const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
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

async function getWalletSummary() {
  if (!WALLET_URL || !ASSISTANT_KEY) {
    return { error: "Wallet-এর সংযোগ সেট করা নেই" };
  }
  const r = await fetch(WALLET_URL + "/api/assistant/summary", {
    headers: { "x-assistant-key": ASSISTANT_KEY },
  });
  return await r.json();
}

async function callGemini(contents) {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents,
        tools: TOOLS,
      }),
    }
  );
  const data = await r.json();
  if (!r.ok) {
    throw new Error((data.error && data.error.message) || "সমস্যা হয়েছে");
  }
  return data;
}

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
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("চালু হয়েছে"));
