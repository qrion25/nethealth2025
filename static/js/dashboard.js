// static/js/dashboard.js

// =====================
// Theme Logo Auto-Swap
// =====================
function initThemeLogoSwap() {
  const logo = document.querySelector('.theme-logo');
  if (!logo) return;

  const darkSrc = logo.dataset.dark;
  const lightSrc = logo.dataset.light;

  // Detect current theme and apply correct logo immediately
    let logoTimer;
    const applyLogo = () => {
      clearTimeout(logoTimer);
      logoTimer = setTimeout(() => {
        const isDark = document.body.classList.contains('theme-dark');
        logo.src = isDark ? darkSrc : lightSrc;
      }, 100);
    };

  // Observe theme class changes on <body>
  const observer = new MutationObserver(applyLogo);
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // Initial set
  applyLogo();
}

document.addEventListener('DOMContentLoaded', initThemeLogoSwap);

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

// ------------------ Time ------------------
function updateClock() {
  const el = $("timeValue");
  if (!el) return;
  el.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ------------------ Weather ------------------
async function loadWeather() {
  const iconEl = $("weatherIcon");
  const outfitEl = $("outfitSuggestion");
  const tempEl = $("tempValue");

  try {
    const data = await fetchJSON("/api/weather");
    if (!data || typeof data.temperature_f === "undefined") {
      safeSetText("tempValue", "--°");
      if (iconEl) iconEl.className = "fas fa-question-circle subtle";
      if (outfitEl) outfitEl.textContent = "Temperature unavailable";
      return;
    }

    const temp = data.current?.temp_f ?? data.temperature_f;
    const cond = (data.conditions ?? data.condition ?? "").toLowerCase();
    const loc = data.location || "—";
    const conditionCode = data.current?.condition?.code ?? null;

    safeSetText("tempValue", `${temp}°`);
    safeSetText("locationValue", loc);
    safeSetText("conditionValue", data.conditions || "—");

    // Weather icon detection
    let iconClass = "fa-question-circle";
    if (cond.includes("clear") || cond.includes("sun")) iconClass = "fa-sun";
    else if (cond.includes("cloud") || cond.includes("overcast")) iconClass = "fa-cloud";
    else if (cond.includes("rain") || cond.includes("drizzle")) iconClass = "fa-cloud-showers-heavy";
    else if (cond.includes("snow")) iconClass = "fa-snowflake";
    else if (cond.includes("storm") || cond.includes("thunder")) iconClass = "fa-bolt";
    else if (cond.includes("fog") || cond.includes("mist") || cond.includes("haze")) iconClass = "fa-smog";
    else if (cond.includes("wind")) iconClass = "fa-wind";

    // WeatherAPI code map override (for precision)
    const codeMap = {
      1000: "fa-sun", 1003: "fa-cloud-sun", 1006: "fa-cloud", 1009: "fa-cloud",
      1030: "fa-smog", 1063: "fa-cloud-showers-heavy", 1087: "fa-bolt",
      1114: "fa-snowflake", 1135: "fa-smog", 1183: "fa-cloud-showers-heavy",
      1195: "fa-cloud-showers-heavy", 1204: "fa-snowflake", 1276: "fa-bolt", 1282: "fa-bolt"
    };
    if (conditionCode && codeMap[conditionCode]) iconClass = codeMap[conditionCode];

    // Outfit suggestion logic
    const outfit = getOutfitSuggestion(temp);

    // Temperature → accent color
    let color = "var(--accent)";
    if (temp <= 40) color = "#2674f2ff";
    else if (temp <= 50) color = "#59a0e3ff";
    else if (temp <= 60) color = "#3cbeb4ff";
    else if (temp <= 65) color = "#10B981";
    else if (temp <= 80) color = "#F59E0B";
    else color = "#EF4444";

    // Animate weather icon and text updates
    if (iconEl) {
      iconEl.style.opacity = 0;
      setTimeout(() => {
        iconEl.className = `fas ${iconClass}`;
        iconEl.style.color = color;
        iconEl.style.opacity = 1;
        iconEl.classList.add("pulse-update");
        setTimeout(() => iconEl.classList.remove("pulse-update"), 600);
      }, 200);
    }

    if (tempEl) {
      tempEl.style.color = color;
      tempEl.classList.add("pulse-update");
      setTimeout(() => tempEl.classList.remove("pulse-update"), 600);
    }

    if (outfitEl) {
      outfitEl.textContent = outfit;
      outfitEl.style.color = color;
      outfitEl.classList.add("pulse-update");
      setTimeout(() => outfitEl.classList.remove("pulse-update"), 600);
    }

  } catch (err) {
    console.warn("Weather load failed", err);
    safeSetText("tempValue", "--°");
    if (iconEl) iconEl.className = "fas fa-question-circle subtle";
    if (outfitEl) outfitEl.textContent = "Temperature unavailable";
  }
}

/** Dynamic Outfit Suggestion System */
function getOutfitSuggestion(temp) {
  const outfits = [
    { min: 100, text: "Stay hydrated, out of the sun, or inside if possible. Bathing suit and hat." },
    { min: 96, text: "Tank top and athletic shorts — beach or pool weather" },
    { min: 92, text: "Light tank top and shorts" },
    { min: 88, text: "T-shirt and shorts" },
    { min: 84, text: "Short-sleeve shirt, light cottons" },
    { min: 80, text: "T-shirt and chinos" },
    { min: 76, text: "Light shirt or tee, comfy jeans" },
    { min: 72, text: "T-shirt with thin overshirt" },
    { min: 68, text: "T-shirt or light long-sleeve, comfy pants" },
    { min: 64, text: "Long-sleeve top, light sweater" },
    { min: 60, text: "Sweater or fleece recommended" },
    { min: 56, text: "Sweater weather" },
    { min: 52, text: "Light coat and long pants" },
    { min: 48, text: "Medium coat or thick hoodie" },
    { min: 44, text: "Coat and scarf recommended" },
    { min: 40, text: "Heavy coat weather" },
    { min: 36, text: "Winter jacket and gloves" },
    { min: 32, text: "Puffer jacket, hat, and scarf" },
    { min: 28, text: "Bundle up — thermal layers needed" },
    { min: 20, text: "Freezing — thermal layers essential" },
    { min: 10, text: "Extreme cold — stay indoors if possible" },
    { min: -10, text: "Subzero danger — full winter gear required" },
  ];

  for (const o of outfits) {
    if (temp >= o.min) return o.text;
  }

  return "Bundle up — it's freezing outside!";
}


// ------------------ Quotes ------------------
let quotes = [];
let quoteIndex = -1;
let quoteBusy = false;

async function loadQuotes() {
  try {
    const payload = await fetchJSON("/api/quotes");
    quotes = payload.quotes || [];
  } catch {
    quotes = [
      { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
      { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
      { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
    ];
  }

  rotateQuote();

  // Enable refresh button once quotes are ready
  const refresh = $("quoteRefresh");
  if (refresh) {
    refresh.disabled = false;
    refresh.addEventListener("click", () => {
      if (quoteBusy) return;
      refresh.classList.add("spinning");
      rotateQuote(true); // force a different quote
      setTimeout(() => refresh.classList.remove("spinning"), 650);
    });
  }
}

function rotateQuote(force = false) {
  if (!quotes.length || quoteBusy) return;
  
  const qt = $("quoteText");
  const qa = $("quoteAuthor");
  const region = $("quoteRegion");
  
  // Check if elements exist before proceeding
  if (!qt || !qa) return;
  
  quoteBusy = true;

  let nextIndex;
  
  if (force && quotes.length > 1) {
    // When forced, guarantee a different quote
    do {
      nextIndex = Math.floor(Math.random() * quotes.length);
    } while (nextIndex === quoteIndex);
  } else {
    // Normal rotation can be same or different
    nextIndex = Math.floor(Math.random() * quotes.length);
  }

  quoteIndex = nextIndex;

  const { text, author } = quotes[quoteIndex];
  const FADE_MS = 600;

  // Start fade out
  qt.classList.add("fade");
  qa.classList.add("fade");

  setTimeout(() => {
    // Update content
    qt.textContent = `"${text}"`;
    qa.textContent = `— ${author || "Unknown"}`;

    // Fade back in
    qt.classList.remove("fade");
    qa.classList.remove("fade");

    // Update aria-live region if present
    if (region && region.getAttribute("aria-live")) {
      region.setAttribute("data-last-quote", `${text} ${author || ""}`);
    }
    
    // Reset busy flag AFTER fade completes
    quoteBusy = false;
  }, FADE_MS);
}

// ------------------ Prices Ticker ------------------
async function loadPrices() {
  let prices = [];
  try {
    const payload = await fetchJSON("/api/prices");
    prices = payload.prices || [];
  } catch {
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
  // duplicate content for seamless scroll
  track.innerHTML = html + html;

}

// ------------------ Ticker Interactivity (drag-scroll) ------------------
function enableTickerDrag() {
  const track = document.getElementById("tickerTrack");
  if (!track) return;

  const container = track.parentElement;
  if (!container) return;

  // Ensure proper scroll container class (matches CSS)
  container.classList.add("ticker-container");
  container.style.overflowX = "auto";
  container.style.scrollBehavior = "smooth";

  let isDown = false;
  let startX;
  let scrollLeft;

  // Mouse events
  container.addEventListener("mousedown", (e) => {
    isDown = true;
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
    container.classList.add("active");
    track.style.animationPlayState = "paused"; // pause animation
  });

  container.addEventListener("mouseleave", () => {
    isDown = false;
    container.classList.remove("active");
    track.style.animationPlayState = "running";
  });

  container.addEventListener("mouseup", () => {
    isDown = false;
    container.classList.remove("active");
    track.style.animationPlayState = "running";
  });

  container.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5; // drag sensitivity
    container.scrollLeft = scrollLeft - walk;
  });

  // Touch events for mobile support
  let touchStartX = 0;
  let touchScrollLeft = 0;

  container.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].pageX - container.offsetLeft;
    touchScrollLeft = container.scrollLeft;
    track.style.animationPlayState = "paused";
  });

  container.addEventListener("touchend", () => {
    track.style.animationPlayState = "running";
  });

  container.addEventListener("touchmove", (e) => {
    const x = e.touches[0].pageX - container.offsetLeft;
    const walk = (x - touchStartX) * 1.5;
    container.scrollLeft = touchScrollLeft - walk;
  });
}

// ------------------ System (client best-effort) ------------------
async function updateSystem() {
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
  } catch {}

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
  } catch {}

  const netBar = $("networkBar");
  const netTxt = $("networkText");
  const online = navigator.onLine;
  if (netBar) {
    netBar.style.width = online ? "90%" : "0%";
    netBar.className = `fill ${online ? "good" : "danger"}`;
  }
  if (netTxt) netTxt.textContent = online ? "Connected" : "Offline";
}

window.addEventListener("online", updateSystem);
window.addEventListener("offline", updateSystem);

// ---- Network latency (client-measured) ----
function classifyLatency(ms) {
  if (ms <= 60) return "good";
  if (ms <= 150) return "warning";
  return "danger";
}

function updateSpeedUI(ms) {
  const bar = document.getElementById("speedBar");
  const txt = document.getElementById("speedText");
  if (!bar || !txt) return;

  if (typeof ms !== "number" || Number.isNaN(ms)) {
    bar.style.width = "0%";
    bar.className = "fill danger";
    txt.textContent = "— ms";
    return;
  }

  const pct = Math.max(20, Math.min(100, 100 - (ms / 300) * 80));
  bar.style.width = `${pct}%`;
  bar.className = `fill ${classifyLatency(ms)}`;
  txt.textContent = `${Math.round(ms)} ms`;
}

async function measureLatency() {
  try {
    const t0 = performance.now();
    const res = await fetch("/api/health", { cache: "no-store" });
    const t1 = performance.now();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    updateSpeedUI(t1 - t0);
  } catch {
    updateSpeedUI(NaN);
  }
}

// -------- Internal System (server-provided) --------
function fmtBytesMB(x) {
  if (x == null) return "—";
  return `${Math.round(x)}MB`;
}
function fmtBytesGB(x) {
  if (x == null) return "—";
  return `${Math.round(x)}GB`;
}
function fmtUptime(seconds) {
  if (!seconds && seconds !== 0) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return d ? `${d}d ${h}h` : `${h}h ${m}m`;
}

async function loadSystemFromServer() {
  try {
    const data = await fetchJSON("/api/system");

    const cpuText = [];
    if (data.cpu) cpuText.push(data.cpu);
    if (typeof data.cpu_cores === "number") cpuText.push(`${data.cpu_cores} cores`);
    document.getElementById("internalCpu")?.replaceChildren(
      document.createTextNode(cpuText.join(" · ") || "—")
    );

    const up = typeof data.uptime_seconds === "number" ? fmtUptime(data.uptime_seconds) : "—";
    document.getElementById("internalUptime")?.replaceChildren(document.createTextNode(up));

    const mem = data.memory || {};
    const memPct = Math.max(0, Math.min(100, Number(mem.percent) || 0));
    const memBar = document.getElementById("internalMemBar");
    if (memBar) {
      memBar.style.width = `${memPct}%`;
      memBar.className = `fill ${memPct < 60 ? "good" : memPct < 80 ? "warning" : "danger"}`;
    }
    const memText = `${fmtBytesMB(mem.used_mb)} / ${fmtBytesMB(mem.total_mb)} (${memPct.toFixed(0)}%)`;
    document.getElementById("internalMemText")?.replaceChildren(document.createTextNode(memText));

    const sto = data.storage || {};
    const stoPct = Math.max(0, Math.min(100, Number(sto.percent) || 0));
    const stoBar = document.getElementById("internalDiskBar");
    if (stoBar) {
      stoBar.style.width = `${stoPct}%`;
      stoBar.className = `fill ${stoPct < 70 ? "good" : stoPct < 90 ? "warning" : "danger"}`;
    }
    const stoText = `${fmtBytesGB(sto.used_gb)} / ${fmtBytesGB(sto.total_gb)} (${stoPct.toFixed(0)}%)`;
    document.getElementById("internalDiskText")?.replaceChildren(document.createTextNode(stoText));

    const net = data.network || {};
    const online = net.online ? "Online" : "Offline";
    const label = net.interface_friendly || net.interface || "";
    const iface = label ? ` · ${label}` : "";

    const latencyVal = Number.isFinite(net.rtt_ms)
      ? Math.round(net.rtt_ms)
      : (Number.isFinite(net.latency_ms) ? Math.round(net.latency_ms) : null);

    const down = Number.isFinite(net.downlink_mbps) ? ` · ${net.downlink_mbps.toFixed(1)} Mbps` : "";
    const eff  = net.effective_type ? ` · ${net.effective_type}` : "";
    const lat  = (latencyVal !== null) ? ` · ${latencyVal} ms` : "";

    document.getElementById("internalNet")?.replaceChildren(
      document.createTextNode(`${online}${iface}${eff}${down}${lat}`)
    );
  } catch (e) {
    console.warn("Failed to load /api/system", e);
  }
}

// ------------------ Network Devices ------------------
function getDeviceIcon(deviceType) {
  const iconMap = {
    'Router/AP': 'fa-wifi',
    'Mobile Device': 'fa-mobile-screen',
    'Computer': 'fa-laptop',
    'Smart Device': 'fa-lightbulb',
    'Gaming Console': 'fa-gamepad',
    'Printer': 'fa-print',
    'Unknown': 'fa-question-circle'
  };
  return iconMap[deviceType] || 'fa-question-circle';
}

async function loadNetworkDevices() {
  const grid = document.getElementById('devicesGrid');
  if (!grid) return;

  try {
    const data = await fetchJSON('/api/network/devices');
    const devices = data.devices || [];

    if (devices.length === 0) {
      grid.innerHTML = '<p class="subtle" style="text-align:center;">No devices found in ARP cache. Try accessing other devices on your network first.</p>';
      return;
    }

    grid.innerHTML = devices.map(device => `
      <div class="device-card">
        <div class="device-header">
          <i class="fas ${getDeviceIcon(device.device_type)} device-icon" aria-hidden="true"></i>
          <div class="device-info">
            <h3>${device.ip}</h3>
            <p class="device-type">${device.device_type}</p>
          </div>
        </div>
        <div class="device-details">
          <div class="device-detail">
            <span class="label">MAC Address</span>
            <span class="value">${device.mac}</span>
          </div>
          <div class="device-detail">
            <span class="label">Vendor</span>
            <span class="value">${device.vendor}</span>
          </div>
          ${device.interface !== 'N/A' ? `
          <div class="device-detail">
            <span class="label">Interface</span>
            <span class="value">${device.interface}</span>
          </div>
          ` : ''}
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error loading network devices:', error);
    grid.innerHTML = '<p class="subtle" style="text-align:center;">Failed to load network devices.</p>';
  }
}

// ------------------ Init + lifecycle ------------------
let timers = [];

function startTimers() {
  timers.push(setInterval(updateClock, 1000));
  timers.push(setInterval(() => rotateQuote(), 15000));
  timers.push(setInterval(loadPrices, 5 * 60 * 1000));
  timers.push(setInterval(updateSystem, 30 * 1000));
  timers.push(setInterval(loadSystemFromServer, 60 * 1000));
  timers.push(setInterval(measureLatency, 30 * 1000));
  timers.push(setInterval(loadNetworkDevices, 2 * 60 * 1000)); // Refresh every 2 minutes
}

function clearTimers() {
  timers.forEach(clearInterval);
  timers = [];
}

function init() {
  // Init theme system
  window.NetHealthTheme?.initThemeUI();

  // First paints
  updateClock();
  loadWeather();
  loadQuotes();        // also wires the refresh button
  loadPrices();
  updateSystem();
  loadSystemFromServer();
  measureLatency();
  loadNetworkDevices();

  // Timers
  startTimers();

  // enable drag-scroll behavior for ticker
  enableTickerDrag();
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearTimers();
  } else {
    updateClock();
    loadPrices();
    updateSystem();
    loadSystemFromServer();
    measureLatency();
    loadNetworkDevices();
    startTimers();
  }
});

document.addEventListener("DOMContentLoaded", init);