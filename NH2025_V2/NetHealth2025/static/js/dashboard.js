// ------------------ Utilities ------------------
const $ = (id) => document.getElementById(id);

async function fetchJSON(url, opts = {}, timeoutMs = 6000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function safeSetText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

// ------------------ Theme ------------------
const themeToggleBtn = $("themeToggle");

function setTheme(mode) {
  // allow theme.css to own the variables, we only flip helper classes
  document.body.classList.toggle("theme-dark", mode === "dark");
  document.body.classList.toggle("theme-light", mode !== "dark");

  // update button UI if the control exists
  if (themeToggleBtn) {
    const icon = themeToggleBtn.querySelector("i");
    const text = themeToggleBtn.querySelector("span");
    if (icon && text) {
      if (mode === "dark") { icon.className = "fas fa-sun"; text.textContent = "Light"; }
      else { icon.className = "fas fa-moon"; text.textContent = "Dark"; }
    }
  }
  localStorage.setItem("theme", mode);
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    const next = document.body.classList.contains("theme-dark") ? "light" : "dark";
    setTheme(next);
  });
}

// ------------------ Time ------------------
function updateClock() {
  const el = $("timeValue");
  if (!el) return;
  el.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ------------------ Weather (placeholder -> API optional) ------------------
async function loadWeather() {
  try {
    const data = await fetchJSON("/api/weather");
    if (data && typeof data.temperature_f !== "undefined") {
      safeSetText("tempValue", `${data.temperature_f}°`);
      if (data.location) safeSetText("locationValue", data.location);
      if (data.condition) safeSetText("conditionValue", data.condition);
    } else {
      safeSetText("tempValue", "--°");
    }
  } catch {
    safeSetText("tempValue", "--°");
  }
}

// ------------------ Quotes ------------------
let quotes = [];
let quoteIndex = -1;

async function loadQuotes() {
  try {
    const payload = await fetchJSON("/api/quotes");
    quotes = payload.quotes || [];
  } catch {
    // friendly fallback
    quotes = [
      { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
      { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
      { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
    ];
  }
  rotateQuote();
}

function rotateQuote() {
  if (!quotes.length) return;

  quoteIndex = (quoteIndex + 1) % quotes.length;
  const { text, author } = quotes[quoteIndex];

  const qt = $("quoteText");
  const qa = $("quoteAuthor");
  const region = $("quoteRegion"); // optional aria-live container

  if (qt && qa) {
    qt.style.opacity = 0; qa.style.opacity = 0;
    setTimeout(() => {
      qt.textContent = `"${text}"`;
      qa.textContent = `— ${author || "Unknown"}`;
      qt.style.opacity = 1; qa.style.opacity = 1;

      if (region && region.getAttribute("aria-live")) {
        // assistive tech update
        region.setAttribute("data-last-quote", `${text} ${author || ""}`);
      }
    }, 250);
  }
}

// ------------------ Prices Ticker ------------------
async function loadPrices() {
  let prices = [];
  try {
    const payload = await fetchJSON("/api/prices");
    prices = payload.prices || [];
  } catch {
    // soft fallback if the API is offline
    prices = [
      { item: "Eggs (1 dozen)", price: 3.99, change: 0.10, direction: "up" },
      { item: "Milk (1 gal)", price: 4.29, change: -0.05, direction: "down" },
      { item: "Bread (1 lb)", price: 2.49, change: 0.00, direction: "flat" },
    ];
  }

  const track = $("tickerTrack");
  if (!track) return;

  const makePill = ({ item, price, change, direction }) => {
    const dir = direction || (change > 0 ? "up" : change < 0 ? "down" : "flat");
    const cls = dir === "up" ? "price-up" : dir === "down" ? "price-down" : "price-flat";
    const arrow = dir === "up" ? "▲" : dir === "down" ? "▼" : "—";
    const hasChange = typeof change === "number" && !Number.isNaN(change);
    const changeText = hasChange ? ` ${arrow} ${Math.abs(change).toFixed(2)}` : "";
    const value = (Number(price) || 0).toFixed(2);
    return `<span class="price-pill ${cls}">${item}: <strong>$${value}</strong>${changeText}</span>`;
  };

  const html = prices.map(makePill).join("");
  // Duplicate content for seamless loop
  track.innerHTML = html + html;
}

// ------------------ System (best-effort) ------------------
async function updateSystem() {
  // Battery
  try {
    if ("getBattery" in navigator) {
      const bat = await navigator.getBattery();
      const level = Math.round(bat.level * 100);
      const bar = $("batteryBar");
      const txt = $("batteryText");
      if (bar) {
        bar.style.width = `${level}%`;
        bar.className = `fill ${level < 20 ? "danger" : level < 50 ? "warning" : "good"}`;
      }
      if (txt) txt.textContent = `${level}%`;
    }
  } catch { /* noop */ }

  // Memory (Chrome only)
  try {
    if (performance && performance.memory) {
      const usedMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      const totalMB = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024);
      const pct = Math.min(100, Math.round((usedMB / (totalMB || 1)) * 100));
      const bar = $("memoryBar");
      const txt = $("memoryText");
      if (bar) {
        bar.style.width = `${pct}%`;
        bar.className = `fill ${pct < 60 ? "good" : pct < 80 ? "warning" : "danger"}`;
      }
      if (txt) txt.textContent = `${usedMB}MB`;
    }
  } catch { /* noop */ }

  // Network (online/offline quick hint)
  const netBar = $("networkBar");
  const netTxt = $("networkText");
  const online = navigator.onLine;
  if (netBar) {
    netBar.style.width = online ? "90%" : "0%";
    netBar.className = `fill ${online ? "good" : "danger"}`;
  }
  if (netTxt) netTxt.textContent = online ? "Connected" : "Offline";
}

// reflect connectivity immediately
window.addEventListener("online", updateSystem);
window.addEventListener("offline", updateSystem);

// ------------------ Init + lifecycle ------------------
let timers = [];

function startTimers() {
  timers.push(setInterval(updateClock, 1000));
  timers.push(setInterval(rotateQuote, 15000));
  timers.push(setInterval(loadPrices, 5 * 60 * 1000));
  timers.push(setInterval(updateSystem, 30 * 1000));
}

function clearTimers() {
  timers.forEach(clearInterval);
  timers = [];
}

function init() {
  // theme
  const saved = localStorage.getItem("theme");
  setTheme(saved === "dark" ? "dark" : "light");

  // first paints
  updateClock();
  loadWeather();
  loadQuotes();
  loadPrices();
  updateSystem();

  // timers
  startTimers();
}

// Pause heavy work when tab is hidden (saves battery/CPU)
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearTimers();
  } else {
    updateClock();
    loadPrices();
    updateSystem();
    startTimers();
  }
});

// Kick off when DOM is ready (safer than IIFE if scripts are deferred or loaded early)
document.addEventListener("DOMContentLoaded", init);