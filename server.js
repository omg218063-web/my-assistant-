<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#07080d">
<title>RS Assistant</title>
<style>
  :root {
    --bg: #07080d;
    --g1: #f6d98a;
    --g2: #c8921f;
    --glass: rgba(255,255,255,0.06);
    --line: rgba(255,255,255,0.11);
    --text: #eceef5;
    --muted: #8b90a3;
  }
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { height: 100%; margin: 0; background: var(--bg); color: var(--text);
    font-family: "Noto Sans Bengali", system-ui, -apple-system, "Segoe UI", sans-serif; }

  #bg { position: fixed; inset: 0; overflow: hidden; z-index: 0; pointer-events: none; }
  #bg::before, #bg::after { content: ""; position: absolute; width: 380px; height: 380px; border-radius: 50%; filter: blur(90px); opacity: .35; }
  #bg::before { background: #c8921f; top: -140px; left: -120px; animation: float1 14s ease-in-out infinite alternate; }
  #bg::after { background: #5b3df5; bottom: -160px; right: -140px; animation: float2 17s ease-in-out infinite alternate; }
  @keyframes float1 { to { transform: translate(90px, 120px); } }
  @keyframes float2 { to { transform: translate(-100px, -110px); } }

  #app { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; max-width: 760px; margin: 0 auto; }

  header { display: flex; align-items: center; justify-content: space-between; gap: 10px;
    padding: calc(12px + env(safe-area-inset-top, 0px)) 14px 12px;
    background: rgba(7,8,13,0.55); backdrop-filter: blur(14px); border-bottom: 1px solid var(--line); }
  .brand { display: flex; align-items: center; gap: 11px; min-width: 0; }
  .logo { display: inline-block; flex: none; filter: drop-shadow(0 4px 14px rgba(200,146,31,.45)); }
  .logo svg, .logo img { width: 100%; height: 100%; display: block; object-fit: contain; border-radius: 10px; }
  .title { font-weight: 800; font-size: 18px; letter-spacing: .3px; }
  .sub { font-size: 11.5px; color: var(--muted); margin-top: 1px; }
  .grad {
    background: linear-gradient(90deg, #f6d98a, #ff8fb1, #7dd3fc, #a78bfa, #f6d98a);
    background-size: 300% 100%;
    -webkit-background-clip: text; background-clip: text;
    color: transparent; -webkit-text-fill-color: transparent;
    animation: flow 6s linear infinite;
  }
  @keyframes flow { to { background-position: 300% 0; } }

  .actions { display: flex; gap: 8px; flex: none; }
  .pill { display: flex; align-items: center; gap: 7px; background: var(--glass); border: 1px solid var(--line);
    color: var(--text); border-radius: 999px; padding: 8px 13px; font-size: 13px; font-family: inherit; }
  .pill .dot { width: 8px; height: 8px; border-radius: 50%; background: #5b6074; transition: .3s; }
  .pill.active { border-color: rgba(52,211,153,.6); box-shadow: 0 0 18px rgba(52,211,153,.25); }
  .pill.active .dot { background: #34d399; box-shadow: 0 0 10px #34d399; }

  #chat { flex: 1; overflow-y: auto; padding: 14px 14px 6px; scroll-behavior: smooth; }
  #chat::-webkit-scrollbar { width: 0; }

  .row { display: flex; gap: 10px; margin: 14px 0; align-items: flex-start; animation: rise .4s ease both; }
  .row.user { justify-content: flex-end; }
  @keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  .av { width: 30px; height: 30px; flex: none; border-radius: 10px; text-align: center;
    background: linear-gradient(135deg, var(--g1), var(--g2)); color: #1a1204; font: 800 12px/30px sans-serif; }
  .bubble { max-width: 82%; padding: 12px 15px; border-radius: 18px; line-height: 1.65; font-size: 15.5px;
    white-space: pre-wrap; word-wrap: break-word; }
  .user .bubble { background: linear-gradient(135deg, #f6d98a, #d4a23a); color: #1b1405; font-weight: 500; border-bottom-right-radius: 6px; }
  .bot .bubble { background: var(--glass); border: 1px solid var(--line); backdrop-filter: blur(12px); border-top-left-radius: 6px; }
  .bot .bubble.err { border-color: rgba(248,113,113,.5); color: #fecaca; }
  .bubble b { color: var(--g1); }

  .typing { display: flex; align-items: center; gap: 10px; }
  .typing .dots { display: flex; gap: 5px; }
  .typing .dots span { width: 8px; height: 8px; border-radius: 50%; background: linear-gradient(135deg, var(--g1), var(--g2)); animation: bounce 1.2s infinite ease-in-out; }
  .typing .dots span:nth-child(2) { animation-delay: .15s; }
  .typing .dots span:nth-child(3) { animation-delay: .3s; }
  @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); opacity: .45; } 30% { transform: translateY(-7px); opacity: 1; } }
  .typing .lbl { font-size: 13px; background: linear-gradient(90deg, #6b7088 20%, #fff 50%, #6b7088 80%); background-size: 200% 100%;
    -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; animation: shimmer 1.6s linear infinite; }
  @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

  #welcome { text-align: center; padding: 26px 6px 10px; animation: rise .6s ease both; }
  #welcome .big { display: flex; justify-content: center; margin-bottom: 14px; }
  #welcome h1 { margin: 0; font-size: 26px; }
  #welcome p { color: var(--muted); margin: 8px 0 22px; font-size: 14.5px; }
  .cards { display: grid; gap: 11px; text-align: left; }
  .card { display: flex; align-items: center; gap: 14px; padding: 15px; border-radius: 18px; cursor: pointer;
    background: var(--glass); border: 1px solid var(--line); color: var(--text); font-family: inherit; width: 100%;
    transition: transform .15s, border-color .3s, box-shadow .3s; }
  .card:active { transform: scale(.98); }
  .card:hover { border-color: rgba(246,217,138,.5); box-shadow: 0 0 22px rgba(200,146,31,.18); }
  .card .ic { width: 46px; height: 46px; border-radius: 14px; display: grid; place-items: center; font-size: 22px;
    background: linear-gradient(135deg, rgba(246,217,138,.2), rgba(91,61,245,.2)); border: 1px solid var(--line); flex: none; }
  .card .nm { font-weight: 700; font-size: 15.5px; }
  .card .ds { color: var(--muted); font-size: 12.5px; margin-top: 2px; }
  .card .ar { margin-left: auto; color: var(--g1); font-size: 18px; }

  #chips { display: flex; gap: 8px; overflow-x: auto; padding: 8px 14px 4px; }
  #chips::-webkit-scrollbar { height: 0; }
  .chip { flex: none; display: flex; align-items: center; gap: 7px; padding: 8px 13px; border-radius: 999px; font-size: 13px; cursor: pointer;
    background: var(--glass); border: 1px solid var(--line); color: var(--text); font-family: inherit; }

  #bar { display: flex; align-items: center; gap: 9px; padding: 8px 12px calc(12px + env(safe-area-inset-bottom, 0px)); }
  .field { flex: 1; display: flex; align-items: center; background: rgba(255,255,255,0.07); border: 1px solid var(--line);
    border-radius: 999px; padding: 4px 6px 4px 18px; backdrop-filter: blur(14px); transition: border-color .3s, box-shadow .3s; }
  .field:focus-within { border-color: rgba(246,217,138,.55); box-shadow: 0 0 20px rgba(200,146,31,.2); }
  #input { flex: 1; background: none; border: none; outline: none; color: var(--text); font-size: 16px; padding: 11px 0; font-family: inherit; min-width: 0; }
  #input::placeholder { color: #70758a; }
  .round { width: 46px; height: 46px; flex: none; border: none; border-radius: 50%; font-size: 19px; color: #1a1204; cursor: pointer;
    background: linear-gradient(135deg, var(--g1), var(--g2)); box-shadow: 0 6px 18px rgba(200,146,31,.35); }
  .round:active { transform: scale(.93); }
  #mic { background: var(--glass); border: 1px solid var(--line); box-shadow: none; color: var(--text); position: relative; }
  #mic.on { background: #ef4444; border-color: #ef4444; color: #fff; animation: pulse 1.3s infinite; }
  @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(239,68,68,.6); } 100% { box-shadow: 0 0 0 16px rgba(239,68,68,0); } }
</style>
</head>
<body>
<div id="bg"></div>
<div id="app">
  <header>
    <div class="brand">
      <div id="brandLogo"></div>
      <div>
        <div class="title grad">RS Assistant</div>
        <div class="sub">আপনার ব্যক্তিগত সহকারী</div>
      </div>
    </div>
    <div class="actions">
      <button id="voice" class="pill"><span class="dot"></span>ভয়েস</button>
      <button id="clear" class="pill">✚ নতুন</button>
    </div>
  </header>

  <div id="chat"></div>
  <div id="chips"></div>

  <div id="bar">
    <button id="mic" class="round">🎤</button>
    <div class="field">
      <input id="input" placeholder="এখানে লিখুন..." autocomplete="off">
    </div>
    <button id="send" class="round">➤</button>
  </div>
</div>

<script>
const chat = document.getElementById("chat");
const input = document.getElementById("input");
const mic = document.getElementById("mic");
const voiceBtn = document.getElementById("voice");
const chipsBox = document.getElementById("chips");

const SITES = [
  { name: "RS Gallery", icon: "🛍️", desc: "অর্ডার ও পেমেন্টের অবস্থা", q: "আজ RS Gallery-তে কয়টা ডিপোজিট এসেছে আর তার অবস্থা কী?" },
  { name: "RS Wallet", icon: "💳", desc: "ব্যালেন্স ও জমা-খরচ", q: "আমার RS Wallet-এর বর্তমান ব্যালেন্স আর আজকের জমা-খরচ কত?" },
  { name: "RS Growth Matrix", icon: "📈", desc: "ডিপোজিট ও টাস্ক", q: "আজ RS Growth Matrix-এ কয়টা ডিপোজিট এসেছে আর কয়টা পেন্ডিং?" }
];

function logo(size, id) {
  return '<span class="logo" style="width:' + size + 'px;height:' + size + 'px">' +
    '<img src="logo.png" alt="" style="display:none" onload="this.style.display=\'block\';this.nextElementSibling.style.display=\'none\'">' +
    '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><linearGradient id="lg' + id + '" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#fbe8a6"/><stop offset="1" stop-color="#c8921f"/></linearGradient></defs>' +
    '<path d="M32 3 57 17.5v29L32 61 7 46.5v-29z" fill="#0d0f17" stroke="url(#lg' + id + ')" stroke-width="2.5"/>' +
    '<text x="32" y="40" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="22" fill="url(#lg' + id + ')">RS</text>' +
    '</svg></span>';
}
document.getElementById("brandLogo").innerHTML = logo(42, "h");

let history = [];
try { history = JSON.parse(localStorage.getItem("history") || "[]"); } catch (e) {}
let voiceOn = false;
let rec = null;
let busy = false;

function save() {
  try { localStorage.setItem("history", JSON.stringify(history.slice(-60))); } catch (e) {}
}
function esc(s) {
  return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; });
}
function fmt(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"); }
function scrollDown() { chat.scrollTop = chat.scrollHeight; }

function removeWelcome() {
  const w = document.getElementById("welcome");
  if (w) w.remove();
}

function showWelcome() {
  const w = document.createElement("div");
  w.id = "welcome";
  w.innerHTML =
    '<div class="big">' + logo(84, "w") + '</div>' +
    '<h1 class="grad">স্বাগতম! আমি আপনার RS Assistant</h1>' +
    '<p>আজ আপনাকে কীভাবে সাহায্য করতে পারি?</p>' +
    '<div class="cards"></div>';
  const box = w.querySelector(".cards");
  SITES.forEach(function (s) {
    const b = document.createElement("button");
    b.className = "card";
    b.innerHTML = '<span class="ic">' + s.icon + '</span><span><div class="nm">' + s.name +
      '</div><div class="ds">' + s.desc + '</div></span><span class="ar">›</span>';
    b.onclick = function () { send(s.q); };
    box.appendChild(b);
  });
  chat.appendChild(w);
}

function add(role, text) {
  removeWelcome();
  const row = document.createElement("div");
  row.className = "row " + (role === "user" ? "user" : "bot");
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  if (role === "user") {
    bubble.textContent = text;
    row.appendChild(bubble);
  } else {
    const av = document.createElement("div");
    av.className = "av";
    av.textContent = "RS";
    bubble.innerHTML = fmt(text);
    row.appendChild(av);
    row.appendChild(bubble);
  }
  chat.appendChild(row);
  scrollDown();
  return bubble;
}

function addTyping() {
  const b = add("model", "");
  b.innerHTML = '<div class="typing"><div class="dots"><span></span><span></span><span></span></div><span class="lbl">ভাবছি...</span></div>';
  scrollDown();
  return b;
}

function speak(text, done) {
  if (!window.speechSynthesis) { if (done) done(); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[*#`_]/g, ""));
  u.lang = "bn-BD";
  u.onend = function () { if (done) done(); };
  u.onerror = function () { if (done) done(); };
  window.speechSynthesis.speak(u);
}

function listen() {
  if (!rec) return;
  try {
    mic.classList.add("on");
    input.placeholder = "শুনছি...";
    rec.start();
  } catch (e) {
    mic.classList.remove("on");
    input.placeholder = "এখানে লিখুন...";
  }
}

async function send(override) {
  if (busy) return;
  const text = (typeof override === "string" ? override : input.value).trim();
  if (!text) return;
  input.value = "";
  busy = true;
  add("user", text);
  history.push({ role: "user", text: text });
  const wait = addTyping();

  let pass = "";
  try { pass = localStorage.getItem("pass") || ""; } catch (e) {}

  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-app-password": pass },
      body: JSON.stringify({ messages: history })
    });
    const data = await r.json();
    if (r.status === 401) {
      const p = prompt("পাসওয়ার্ড দিন:");
      try { localStorage.setItem("pass", p || ""); } catch (e) {}
      wait.innerHTML = "পাসওয়ার্ড দিয়েছেন, আবার পাঠান।";
      history.pop();
    } else if (data.error) {
      wait.classList.add("err");
      wait.textContent = "ত্রুটি: " + data.error;
      history.pop();
    } else {
      wait.innerHTML = fmt(data.reply);
      history.push({ role: "model", text: data.reply });
      if (voiceOn) speak(data.reply, function () { if (voiceOn) listen(); });
    }
  } catch (e) {
    wait.classList.add("err");
    wait.textContent = "ইন্টারনেট বা সার্ভারে সমস্যা।";
    history.pop();
  }
  busy = false;
  save();
  scrollDown();
}

document.getElementById("send").onclick = function () { send(); };
input.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });

document.getElementById("clear").onclick = function () {
  history = [];
  save();
  chat.innerHTML = "";
  showWelcome();
  if (window.speechSynthesis) window.speechSynthesis.cancel();
};

SITES.forEach(function (s) {
  const c = document.createElement("button");
  c.className = "chip";
  c.innerHTML = "<span>" + s.icon + "</span>" + s.name;
  c.onclick = function () { send(s.q); };
  chipsBox.appendChild(c);
});

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SR) {
  mic.style.display = "none";
  voiceBtn.style.display = "none";
} else {
  rec = new SR();
  rec.lang = "bn-BD";
  rec.onresult = function (e) { send(e.results[0][0].transcript); };
  rec.onend = function () {
    mic.classList.remove("on");
    input.placeholder = "এখানে লিখুন...";
  };
  mic.onclick = function () {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    listen();
  };
}

voiceBtn.onclick = function () {
  voiceOn = !voiceOn;
  voiceBtn.classList.toggle("active", voiceOn);
  if (voiceOn) {
    listen();
  } else {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    try { rec.stop(); } catch (e) {}
  }
};

if (history.length) {
  history.forEach(function (m) { add(m.role, m.text); });
} else {
  showWelcome();
}
</script>
</body>
</html>
