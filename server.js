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
const MATRIX_URL = (process.env.MATRIX_URL || "").replace(/\/$/, "");
const MATRIX_KEY = process.env.MATRIX_KEY || "";
const GALLERY_URL = (process.env.GALLERY_URL || "").replace(/\/$/, "");
const GALLERY_KEY = process.env.GALLERY_KEY || "";

const SYSTEM =
  "তুমি আমার ব্যক্তিগত এআই অ্যাসিস্ট্যান্ট। সবসময় সহজ, বন্ধুত্বপূর্ণ বাংলায় উত্তর দাও। উত্তর ছোট ও কাজের মতো রাখো। " +
  "আমার তিনটা সাইট: RS Gallery (পোশাকের অনলাইন শপ), RS Wallet (পেমেন্ট খাতা, যেখানে সাইটগুলোর ডিপোজিট জমা হয়), RS Growth Matrix (টাস্কভিত্তিক সাইট)। " +
  "Wallet-এর ব্যালেন্স, জমা-খরচ, পেন্ডিং ডিপোজিট বা সাইটভিত্তিক ডিপোজিট জানতে চাইলে get_wallet_summary ব্যবহার করো। " +
  "RS Growth Matrix-এর ইউজার সংখ্যা, উইথড্র ও ডিপোজিট রিকোয়েস্ট, টাস্কের Pending/Success/Cancelled সংখ্যা বা মোট ইউজার ব্যালেন্স জানতে চাইলে get_matrix_summary ব্যবহার করো। " +
  "RS Gallery-র প্রোডাক্ট সংখ্যা, বিক্রি, অর্ডার ও অর্ডারের ধাপ, কাস্টমার সংখ্যা, ভিজিটর বা লাভ জানতে চাইলে get_gallery_summary ব্যবহার করো। " +
  "RS Gallery-তে কাস্টমার মানে ফোন নম্বর ধরে আলাদা আলাদা অর্ডারকারী। প্রোডাক্টের নিজস্ব কোনো ধাপ নেই, অর্ডারের ধাপ আছে (New, Delivered, Returned, Cancelled, Failed বা অন্য যা যা দেখা যায়), সেটাই বলো। " +
  "trafficSources হলো লিংকভিত্তিক সব সময়ের মোট ভিজিট, আজকের নয়। আজকের মোট ভিজিটর হলো visitorsToday। এই পার্থক্য পরিষ্কার করে বলো। " +
  "সব সাইট ঠিকঠাক চলছে কি না জানতে চাইলে get_sites_health ব্যবহার করো। ঘুমিয়ে থাকা সাইট জাগতে ৩০-৫০ সেকেন্ড লাগে, এটা সমস্যা নয়, এভাবে জানিয়ে দাও। " +
  "অর্ডার, ডিপোজিট ও উইথড্রের বিস্তারিত তালিকা অ্যাপ নিজে কার্ড আকারে দেখাবে। তুমি শুধু ছোট সারাংশ দাও (সংখ্যা ও মোট টাকা), প্রতিটা অর্ডারের ঠিকানা বা ফোন আবার লিখবে না। কেউ নির্দিষ্ট অর্ডারের ঠিকানা বা ফোন জানতে চাইলে তখন বলো। " +
  "সংখ্যা নিজে বানাবে না, সবসময় টুল থেকে আনো। approved মানে অনুমোদিত/সফল, pending মানে অপেক্ষমাণ, rejected মানে বাতিল। টাকার অঙ্ক টাকায় বলো। " +
  "টুলে যা নেই তা না থাকার কথা সৎভাবে বলো। না জানলে সৎভাবে বলো।";

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: "get_wallet_summary",
        description:
          "RS Wallet থেকে বর্তমান ব্যালেন্স, মোট ও আজকের জমা-খরচ, পেন্ডিং ডিপোজিট এবং প্রতিটি সাইটের (rsgallery, rsmatrix) আজকের ও সব সময়ের ডিপোজিটের সংখ্যা ও পরিমাণ আনে।",
      },
      {
        name: "get_matrix_summary",
        description:
          "RS Growth Matrix থেকে মোট/আজকের সক্রিয়/নতুন ইউজার, পেন্ডিং উইথড্র ও ডিপোজিট রিকোয়েস্ট (সংখ্যা, পরিমাণ, বিস্তারিত তালিকা), টাস্কের Pending/Success/Cancelled সংখ্যা, অপেক্ষমাণ প্রমোশন টাস্ক, মোট ইউজার ব্যালেন্স এবং আজকের অফার ইনকাম আনে।",
      },
      {
        name: "get_gallery_summary",
        description:
          "RS Gallery থেকে মোট প্রোডাক্ট সংখ্যা, মোট বিক্রিত পিস, সবচেয়ে বেশি বিক্রিত ৫টা প্রোডাক্ট, মোট ও আজকের অর্ডার ও বিক্রি, অর্ডারের ধাপভিত্তিক সংখ্যা, অগ্রিম ডেলিভারি চার্জ, লাভ, সাম্প্রতিক ১০টা অর্ডারের পূর্ণ বিবরণ (নাম, ফোন, ঠিকানা), মোট ও পুনরায় কেনা কাস্টমার, আজকের ভিজিটর ও লিংকভিত্তিক ভিজিট আনে।",
      },
      {
        name: "get_sites_health",
        description:
          "RS Wallet, RS Growth Matrix ও RS Gallery এই তিনটা সাইট এই মুহূর্তে চালু আছে কি না এবং সাড়া দিতে কত সময় নিচ্ছে তা পরীক্ষা করে।",
      },
    ],
  },
];

const DETAIL_WORDS = /অর্ডার|ডিপোজিট|উইথড্র|তালিকা|বিস্তারিত|ঠিকানা|রিপোর্ট|order|deposit|withdraw/i;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(baseUrl, key, p) {
  const r = await fetch(baseUrl + p, {
    headers: { "x-assistant-key": key },
    signal: AbortSignal.timeout(60000),
  });
  return await r.json();
}

async function fetchSummary(baseUrl, key, extraPath) {
  if (!baseUrl || !key) {
    return { error: "এই সাইটের সংযোগ সেট করা নেই" };
  }
  const main = await fetchJson(baseUrl, key, "/api/assistant/summary");
  if (!extraPath || !main || main.ok === false) return main;
  try {
    const extra = await fetchJson(baseUrl, key, extraPath);
    if (extra && extra.ok !== false) return Object.assign({}, main, extra);
  } catch (e) {
    console.error("বিস্তারিত আনা যায়নি:", extraPath, e.message);
  }
  return main;
}

async function checkSite(name, url, pathPart) {
  if (!url) return { site: name, ok: false, note: "লিংক সেট করা নেই" };
  const t0 = Date.now();
  try {
    const r = await fetch(url + pathPart, { signal: AbortSignal.timeout(55000) });
    const ms = Date.now() - t0;
    return {
      site: name,
      ok: r.ok,
      httpStatus: r.status,
      responseSeconds: Math.round(ms / 100) / 10,
      note: ms > 8000 ? "ঘুমিয়ে ছিল, এখন জেগেছে" : "ঠিকঠাক সাড়া দিচ্ছে",
    };
  } catch (e) {
    return { site: name, ok: false, note: "সাড়া দেয়নি" };
  }
}

async function getSitesHealth() {
  const sites = await Promise.all([
    checkSite("RS Wallet", WALLET_URL, "/health"),
    checkSite("RS Growth Matrix", MATRIX_URL, "/ping"),
    checkSite("RS Gallery", GALLERY_URL, "/"),
  ]);
  return { sites: sites };
}

async function runTool(name) {
  if (name === "get_wallet_summary") return await fetchSummary(WALLET_URL, ASSISTANT_KEY);
  if (name === "get_matrix_summary") return await fetchSummary(MATRIX_URL, MATRIX_KEY, "/api/assistant/details");
  if (name === "get_gallery_summary") return await fetchSummary(GALLERY_URL, GALLERY_KEY, "/api/assistant/orders");
  if (name === "get_sites_health") return await getSitesHealth();
  return { error: "অজানা টুল" };
}

function buildCard(name, r) {
  if (!r || r.ok === false || r.error) return null;
  if (name === "get_gallery_summary" && Array.isArray(r.latestOrders)) {
    return {
      type: "gallery",
      stats: {
        totalOrders: r.orders && r.orders.total,
        todayOrders: r.ordersToday,
        newToday: r.newToday,
        active: r.activeOrders,
        visitors: r.visitorsToday,
        sources: r.trafficSources || [],
      },
      orders: r.latestOrders,
    };
  }
  if (
    name === "get_matrix_summary" &&
    (Array.isArray(r.pendingDeposits) || Array.isArray(r.pendingWithdrawals))
  ) {
    return {
      type: "matrix",
      stats: {
        depCount: r.deposits && r.deposits.pendingCount,
        depAmount: r.deposits && r.deposits.pendingAmount,
        wdCount: r.withdrawals && r.withdrawals.pendingCount,
        wdAmount: r.withdrawals && r.withdrawals.pendingAmount,
        users: r.users && r.users.total,
      },
      deposits: r.pendingDeposits || [],
      withdrawals: r.pendingWithdrawals || [],
    };
  }
  return null;
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
    const lastUser = messages.length ? String(messages[messages.length - 1].text || "") : "";
    const wantCards = DETAIL_WORDS.test(lastUser);
    const cards = [];

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
        return res.json({ reply: text, cards: cards });
      }

      contents.push(content);
      const responses = await Promise.all(
        calls.map(async (c) => {
          let result;
          try {
            result = await runTool(c.functionCall.name);
          } catch (e) {
            console.error("টুল ত্রুটি:", c.functionCall.name, e.message);
            result = { error: "সাইটে পৌঁছানো যায়নি (সার্ভার ঘুমিয়ে থাকতে পারে, একটু পরে আবার চেষ্টা করুন)" };
          }
          if (wantCards) {
            const card = buildCard(c.functionCall.name, result);
            if (card) cards.push(card);
          }
          return {
            functionResponse: { name: c.functionCall.name, response: { result } },
          };
        })
      );
      contents.push({ role: "user", parts: responses });
    }
    res.json({ reply: "দুঃখিত, উত্তর তৈরি করতে পারিনি। আবার চেষ্টা করুন।", cards: [] });
  } catch (e) {
    console.error("চ্যাট ত্রুটি:", e.message);
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("চালু হয়েছে"));
