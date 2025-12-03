// static/js/dashboard.js

// =====================
// Theme Logo Auto-Swap
// =====================
function initThemeLogoSwap() {
  const logo = document.querySelector(".theme-logo");
  if (!logo) return;

  const darkSrc = logo.dataset.dark;
  const lightSrc = logo.dataset.light;

  let logoTimer;

  const applyLogo = () => {
    clearTimeout(logoTimer);
    logoTimer = setTimeout(() => {
      const isDark = document.body.classList.contains("theme-dark");
      logo.src = isDark ? darkSrc : lightSrc;
    }, 100);
  };

  const observer = new MutationObserver(applyLogo);
  observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

  applyLogo();
}

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

function pulseElement(el, color) {
  if (!el) return;
  if (color) el.style.color = color;
  el.classList.add("pulse-update");
  setTimeout(() => el.classList.remove("pulse-update"), 600);
}

// ------------------ Time ------------------
function updateClock() {
  const el = $("timeValue");
  if (!el) return;
  el.textContent = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ------------------ Weather ------------------
let weatherData = null; // Store for flip card

async function loadWeather() {
  const iconEl = $("weatherIcon");
  const outfitEl = $("outfitSuggestion");
  const tempEl = $("tempValue");
  const feelsEl = $("feelsLike");

  // Show loading state for forecast
  const hourlyContainer = $("hourlyForecast");
  const dailyContainer = $("dailyForecast");
  if (hourlyContainer) hourlyContainer.innerHTML = '<div class="forecast-loading"><i class="fas fa-circle-notch fa-spin"></i></div>';
  if (dailyContainer) dailyContainer.innerHTML = '<div class="forecast-loading"><i class="fas fa-circle-notch fa-spin"></i></div>';

  try {
    const data = await fetchJSON("/api/weather");
    weatherData = data; // Store for flip card rendering

    if (!data || typeof data.temperature_f === "undefined") {
      safeSetText("tempValue", "--°");
      if (iconEl) iconEl.className = "fas fa-question-circle subtle";
      if (outfitEl) outfitEl.textContent = "Temperature unavailable";
      return;
    }

    const temp = data.temperature_f;
    const feelsLike = data.feels_like_f;
    const humidity = data.humidity;
    const windMph = data.wind_mph;
    const cond = (data.conditions ?? "").toLowerCase();
    const loc = data.location || "—";
    const conditionCode = data.code ?? null;

    safeSetText("tempValue", `${temp}°`);
    safeSetText("locationValue", loc);
    safeSetText("conditionValue", data.conditions || "—");
    
    // Feels like
    if (feelsEl && feelsLike !== "--") {
      feelsEl.textContent = `Feels like ${feelsLike}°`;
    }

    // Weather icon detection
    let iconClass = getWeatherIcon(cond, conditionCode);

    // Smart outfit suggestion (uses feels like, humidity, wind, conditions)
    const outfit = getOutfitSuggestion(feelsLike !== "--" ? feelsLike : temp, humidity, windMph, cond);

    // Temperature → accent color
    const displayTemp = feelsLike !== "--" ? feelsLike : temp;
    let color = getTempColor(displayTemp);

    // Animate weather icon
    if (iconEl) {
      iconEl.style.opacity = 0;
      setTimeout(() => {
        iconEl.className = `fas ${iconClass}`;
        iconEl.style.color = color;
        iconEl.style.opacity = 1;
        pulseElement(iconEl);
      }, 200);
    }

    // Animate temp and outfit
    pulseElement(tempEl, color);

    if (outfitEl) {
      outfitEl.textContent = outfit;
      pulseElement(outfitEl, color);
    }

    // Render forecast on back of card
    renderHourlyForecast(data.hourly || []);
    renderDailyForecast(data.daily || []);

  } catch (err) {
    console.warn("Weather load failed", err);
    safeSetText("tempValue", "--°");
    if (iconEl) iconEl.className = "fas fa-question-circle subtle";
    if (outfitEl) outfitEl.textContent = "Temperature unavailable";
    if (hourlyContainer) hourlyContainer.innerHTML = '<p class="subtle">Failed to load forecast</p>';
    if (dailyContainer) dailyContainer.innerHTML = '<p class="subtle">Failed to load forecast</p>';
  }
}

function getWeatherIcon(cond, code) {
  // Code-based mapping first
  const codeMap = {
    1000: "fa-sun",
    1003: "fa-cloud-sun",
    1006: "fa-cloud",
    1009: "fa-cloud",
    1030: "fa-smog",
    1063: "fa-cloud-rain",
    1066: "fa-snowflake",
    1087: "fa-bolt",
    1114: "fa-snowflake",
    1135: "fa-smog",
    1150: "fa-cloud-rain",
    1183: "fa-cloud-rain",
    1189: "fa-cloud-showers-heavy",
    1195: "fa-cloud-showers-heavy",
    1204: "fa-snowflake",
    1225: "fa-snowflake",
    1276: "fa-bolt",
    1282: "fa-bolt",
  };
  
  if (code && codeMap[code]) return codeMap[code];

  // Text-based fallback
  if (cond.includes("clear") || cond.includes("sunny")) return "fa-sun";
  if (cond.includes("partly")) return "fa-cloud-sun";
  if (cond.includes("cloud") || cond.includes("overcast")) return "fa-cloud";
  if (cond.includes("rain") || cond.includes("drizzle")) return "fa-cloud-showers-heavy";
  if (cond.includes("snow") || cond.includes("sleet") || cond.includes("ice")) return "fa-snowflake";
  if (cond.includes("storm") || cond.includes("thunder")) return "fa-bolt";
  if (cond.includes("fog") || cond.includes("mist") || cond.includes("haze")) return "fa-smog";
  if (cond.includes("wind")) return "fa-wind";

  return "fa-question-circle";
}

function getTempColor(temp) {
  if (temp <= 32) return "#60A5FA"; // Freezing - light blue
  if (temp <= 40) return "#2674f2"; // Cold blue
  if (temp <= 50) return "#59a0e3"; // Cool blue
  if (temp <= 60) return "#3cbeb4"; // Teal
  if (temp <= 70) return "#10B981"; // Green
  if (temp <= 80) return "#F59E0B"; // Warm orange
  if (temp <= 90) return "#F97316"; // Hot orange
  return "#EF4444"; // Very hot red
}

/** Smart Outfit Suggestion - factors in feels like, humidity, wind, conditions */
function getOutfitSuggestion(feelsLike, humidity, windMph, conditions) {
  let suggestion = "";
  let extras = [];

  // Base suggestion from feels-like temperature
  if (feelsLike >= 100) {
    suggestion = "Minimal clothing, stay cool and hydrated.";
  } else if (feelsLike >= 90) {
    suggestion = "Tank top and shorts.";
  } else if (feelsLike >= 80) {
    suggestion = "T-shirt and light shorts.";
  } else if (feelsLike >= 70) {
    suggestion = "T-shirt and comfortable pants.";
  } else if (feelsLike >= 60) {
    suggestion = "Light layers or long sleeves.";
  } else if (feelsLike >= 50) {
    suggestion = "Sweater or light jacket.";
  } else if (feelsLike >= 40) {
    suggestion = "Warm coat recommended.";
  } else if (feelsLike >= 30) {
    suggestion = "Heavy coat, hat, and gloves.";
  } else if (feelsLike >= 20) {
    suggestion = "Bundle up with thermal layers.";
  } else {
    suggestion = "Extreme cold — full winter gear.";
  }

  // Humidity modifiers
  if (humidity >= 80 && feelsLike >= 70) {
    extras.push("breathable fabrics");
  } else if (humidity <= 20 && feelsLike < 50) {
    extras.push("moisturizing lip balm");
  }

  // Wind modifiers
  if (windMph >= 20) {
    extras.push("windbreaker");
  } else if (windMph >= 15 && feelsLike < 60) {
    extras.push("wind-resistant layer");
  }

  // Condition modifiers
  if (conditions.includes("rain") || conditions.includes("drizzle") || conditions.includes("shower")) {
    extras.push("umbrella");
  }
  if (conditions.includes("snow") || conditions.includes("sleet")) {
    extras.push("waterproof boots");
  }
  if (conditions.includes("sunny") && feelsLike >= 70) {
    extras.push("sunglasses");
  }

  // Combine suggestion with extras
  if (extras.length > 0) {
    suggestion += ` Bring ${extras.join(", ")}.`;
  }

  return suggestion;
}

// Render hourly forecast
function renderHourlyForecast(hourly) {
  const container = $("hourlyForecast");
  if (!container) return;

  if (!hourly || hourly.length === 0) {
    container.innerHTML = '<p class="subtle">No hourly data available.</p>';
    return;
  }

  container.innerHTML = hourly.map((hour, index) => {
    const icon = getWeatherIcon(hour.condition.toLowerCase(), hour.code);
    return `
      <div class="hour-item" style="animation-delay: ${index * 0.05}s">
        <span class="hour-time">${formatHour(hour.time)}</span>
        <i class="fas ${icon} hour-icon" aria-hidden="true"></i>
        <span class="hour-temp">${hour.temp_f}°</span>
      </div>
    `;
  }).join("");
}

// Render daily forecast
function renderDailyForecast(daily) {
  const container = $("dailyForecast");
  if (!container) return;

  if (!daily || daily.length === 0) {
    container.innerHTML = '<p class="subtle">No forecast data available.</p>';
    return;
  }

  container.innerHTML = daily.map((day, index) => {
    const icon = getWeatherIcon(day.condition.toLowerCase(), day.code);
    const dayName = index === 0 ? "Today" : index === 1 ? "Tomorrow" : formatDayName(day.date);
    // Shorten condition text for display
    const shortCondition = day.condition.replace("Patchy ", "").replace("Moderate ", "").replace("Heavy ", "");
    // Rain chance indicator
    const rainChance = day.chance_of_rain > 30 
      ? `<span class="rain-chance"><i class="fas fa-droplet"></i> ${day.chance_of_rain}%</span>` 
      : '';
    return `
      <div class="day-item">
        <span class="day-name">${dayName}</span>
        <i class="fas ${icon} day-icon" aria-hidden="true"></i>
        <span class="day-condition">${shortCondition}${rainChance}</span>
        <span class="day-high">${day.high_f}°</span>
        <span class="day-low">${day.low_f}°</span>
      </div>
    `;
  }).join("");
}

// Format hour for display (e.g., "14:00" -> "2 PM")
function formatHour(timeStr) {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}${ampm}`;
}

// Format date to day name
function formatDayName(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

// Flip card handler
function initWeatherFlipCard() {
  const card = document.querySelector(".weather-flip-card");
  const flipBackBtn = $("flipBackBtn");
  const weatherRefreshBtn = $("weatherRefreshBtn");
  
  if (!card) return;

  // Click anywhere on front to flip
  card.addEventListener("click", (e) => {
    // Don't flip if clicking buttons
    if (e.target.closest("#flipBackBtn") || e.target.closest("#weatherRefreshBtn")) return;
    
    if (!card.classList.contains("flipped")) {
      card.classList.add("flipped");
      card.setAttribute("aria-pressed", "true");
    }
  });

  // Keyboard accessibility
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      card.classList.toggle("flipped");
      card.setAttribute("aria-pressed", card.classList.contains("flipped"));
    }
    if (e.key === "Escape" && card.classList.contains("flipped")) {
      card.classList.remove("flipped");
      card.setAttribute("aria-pressed", "false");
    }
  });

  // Back button to flip back
  if (flipBackBtn) {
    flipBackBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      card.classList.remove("flipped");
      card.setAttribute("aria-pressed", "false");
    });
  }

  // Weather refresh button
  if (weatherRefreshBtn) {
    weatherRefreshBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Don't flip the card
      const icon = weatherRefreshBtn.querySelector("i");
      if (icon) icon.classList.add("spinning");
      loadWeather().finally(() => {
        setTimeout(() => {
          if (icon) icon.classList.remove("spinning");
        }, 600);
      });
    });
  }
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

  const refresh = $("quoteRefresh");
  if (refresh) {
    refresh.disabled = false;
    refresh.addEventListener("click", () => {
      if (quoteBusy) return;
      refresh.classList.add("spinning");
      rotateQuote(true);
      setTimeout(() => refresh.classList.remove("spinning"), 650);
    });
  }
}

function rotateQuote(force = false) {
  if (!quotes.length || quoteBusy) return;

  const qt = $("quoteText");
  const qa = $("quoteAuthor");
  const region = $("quoteRegion");
  if (!qt || !qa) return;

  quoteBusy = true;

  let nextIndex;
  if (force && quotes.length > 1) {
    do {
      nextIndex = Math.floor(Math.random() * quotes.length);
    } while (nextIndex === quoteIndex);
  } else {
    nextIndex = Math.floor(Math.random() * quotes.length);
  }

  quoteIndex = nextIndex;

  const { text, author } = quotes[quoteIndex];
  const FADE_MS = 600;

  qt.classList.add("fade");
  qa.classList.add("fade");

  setTimeout(() => {
    qt.textContent = `"${text}"`;
    qa.textContent = `— ${author || "Unknown"}`;
    qt.classList.remove("fade");
    qa.classList.remove("fade");

    if (region && region.getAttribute("aria-live")) {
      region.setAttribute("data-last-quote", `${text} ${author || ""}`);
    }

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
      { item: "Eggs (1 dozen)", price: 3.99, change: 0.1, direction: "up" },
      { item: "Milk (1 gal)", price: 4.29, change: -0.05, direction: "down" },
      { item: "Bread (1 lb)", price: 2.49, change: 0.0, direction: "flat" },
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
  track.innerHTML = html + html; // duplicate for seamless scroll
}

// ------------------ Ticker Interactivity (drag-scroll) ------------------
function enableTickerDrag() {
  const track = document.getElementById("tickerTrack");
  if (!track) return;

  const container = track.parentElement;
  if (!container) return;

  container.classList.add("ticker-container");
  container.style.overflowX = "auto";
  container.style.scrollBehavior = "smooth";

  let isDown = false;
  let startX;
  let scrollLeft;

  container.addEventListener("mousedown", (e) => {
    isDown = true;
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
    container.classList.add("active");
    track.style.animationPlayState = "paused";
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
    const walk = (x - startX) * 1.5;
    container.scrollLeft = scrollLeft - walk;
  });

  // Touch events
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
  } catch {
    // ignore battery errors
  }

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
  } catch {
    // ignore memory errors
  }

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
  if (ms <= 50) return { class: "good", label: "Excellent" };
  if (ms <= 100) return { class: "good", label: "Good" };
  if (ms <= 200) return { class: "warning", label: "Fair" };
  return { class: "danger", label: "Slow" };
}

function updateSpeedUI(ms) {
  const bar = document.getElementById("speedBar");
  const txt = document.getElementById("speedText");
  if (!bar || !txt) return;

  if (typeof ms !== "number" || Number.isNaN(ms)) {
    bar.style.width = "0%";
    bar.className = "fill danger";
    txt.textContent = "—";
    return;
  }

  const pct = Math.max(20, Math.min(100, 100 - (ms / 300) * 80));
  const rating = classifyLatency(ms);
  bar.style.width = `${pct}%`;
  bar.className = `fill ${rating.class}`;
  txt.textContent = rating.label;
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
      document.createTextNode(cpuText.join(" · ") || "—"),
    );

    const up = typeof data.uptime_seconds === "number" ? fmtUptime(data.uptime_seconds) : "—";
    document.getElementById("internalUptime")?.replaceChildren(
      document.createTextNode(up),
    );

    const mem = data.memory || {};
    const memPct = Math.max(0, Math.min(100, Number(mem.percent) || 0));
    const memBar = document.getElementById("internalMemBar");
    if (memBar) {
      memBar.style.width = `${memPct}%`;
      memBar.className = `fill ${memPct < 60 ? "good" : memPct < 80 ? "warning" : "danger"}`;
    }
    const memText = `${fmtBytesMB(mem.used_mb)} / ${fmtBytesMB(mem.total_mb)} (${memPct.toFixed(
      0,
    )}%)`;
    document.getElementById("internalMemText")?.replaceChildren(
      document.createTextNode(memText),
    );

    const sto = data.storage || {};
    const stoPct = Math.max(0, Math.min(100, Number(sto.percent) || 0));
    const stoBar = document.getElementById("internalDiskBar");
    if (stoBar) {
      stoBar.style.width = `${stoPct}%`;
      stoBar.className = `fill ${stoPct < 70 ? "good" : stoPct < 90 ? "warning" : "danger"}`;
    }
    const stoText = `${fmtBytesGB(sto.used_gb)} / ${fmtBytesGB(sto.total_gb)} (${stoPct.toFixed(
      0,
    )}%)`;
    document.getElementById("internalDiskText")?.replaceChildren(
      document.createTextNode(stoText),
    );

    const net = data.network || {};
    const online = net.online ? "Online" : "Offline";
    const label = net.interface_friendly || net.interface || "";
    const iface = label ? ` · ${label}` : "";

    const latencyVal = Number.isFinite(net.rtt_ms)
      ? net.rtt_ms
      : Number.isFinite(net.latency_ms)
        ? net.latency_ms
        : null;

    const down = Number.isFinite(net.downlink_mbps) ? ` · ${net.downlink_mbps.toFixed(1)} Mbps` : "";
    const eff = net.effective_type ? ` · ${net.effective_type}` : "";
    const lat = latencyVal !== null ? ` · ${classifyLatency(latencyVal).label}` : "";

    document.getElementById("internalNet")?.replaceChildren(
      document.createTextNode(`${online}${iface}${eff}${down}${lat}`),
    );

  } catch (e) {
    console.warn("Failed to load /api/system", e);
  }
}

// ------------------ Network Devices ------------------
function getDeviceIcon(deviceType) {
  const iconMap = {
    "Router/AP": "fa-wifi",
    "Mobile Device": "fa-mobile-screen",
    Computer: "fa-laptop",
    "Smart Device": "fa-lightbulb",
    "Gaming Console": "fa-gamepad",
    Printer: "fa-print",
    "TV/Streaming": "fa-tv",
    Unknown: "fa-question-circle",
  };
  return iconMap[deviceType] || "fa-question-circle";
}

async function loadNetworkDevices() {
  const grid = document.getElementById("devicesGrid");
  if (!grid) return;

  try {
    const data = await fetchJSON("/api/network/devices");
    const devices = data.devices || [];

    if (devices.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-network-wired empty-icon"></i>
          <p>No devices found in ARP cache</p>
          <p class="subtle">Try accessing other devices on your network first</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = devices
      .map(
        (device) => `
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
          ${
            device.interface !== "N/A"
              ? `
          <div class="device-detail">
            <span class="label">Interface</span>
            <span class="value">${device.interface}</span>
          </div>
          `
              : ""
          }
        </div>
      </div>
    `,
      )
      .join("");
  } catch (error) {
    console.error("Error loading network devices:", error);
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle empty-icon"></i>
        <p>Failed to load network devices</p>
        <p class="subtle">Please try refreshing the page</p>
      </div>
    `;
  }
}

// ----------------------
// Settings Modal (API Key)
// ----------------------
function initSettingsModal() {
  const modal = document.getElementById("settingsModal");
  const openBtn = document.getElementById("settingsBtn");
  const closeBtn = document.getElementById("closeSettingsModal");
  const saveBtn = document.getElementById("saveApiKeyBtn");
  const input = document.getElementById("apiKeyInput");
  const toggleVisibility = document.getElementById("toggleApiKeyVisibility");
  const statusEl = document.getElementById("apiStatus");

  if (!modal || !openBtn) return;

  const close = () => modal.classList.add("hidden");

  // Check API status on open
  async function checkApiStatus() {
    statusEl.className = "api-status";
    statusEl.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Checking...';

    try {
      const data = await fetchJSON("/api/settings/api_status");

      if (data.configured && data.valid) {
        statusEl.className = "api-status success";
        statusEl.innerHTML = '<i class="fas fa-check-circle"></i> API key is configured and working';
      } else if (data.configured && data.valid === false) {
        statusEl.className = "api-status error";
        statusEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${data.message}`;
      } else if (!data.configured) {
        statusEl.className = "api-status warning";
        statusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> No API key configured';
      } else {
        statusEl.className = "api-status";
        statusEl.innerHTML = `<i class="fas fa-info-circle"></i> ${data.message}`;
      }
    } catch (e) {
      statusEl.className = "api-status error";
      statusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Could not check status';
    }
  }

  openBtn.onclick = () => {
    modal.classList.remove("hidden");
    input.value = "";
    checkApiStatus();
  };

  closeBtn.onclick = close;

  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  // Toggle password visibility
  if (toggleVisibility) {
    toggleVisibility.onclick = () => {
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      toggleVisibility.querySelector("i").className = isPassword ? "fas fa-eye-slash" : "fas fa-eye";
    };
  }

  // Save API key
  saveBtn.onclick = async () => {
    const apiKey = input.value.trim();
    if (!apiKey) {
      statusEl.className = "api-status error";
      statusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please enter an API key';
      return;
    }

    // Show saving state
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Saving...';
    statusEl.className = "api-status";
    statusEl.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Validating...';

    try {
      const response = await fetch("/api/settings/update_api_key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey }),
      });

      const data = await response.json();

      if (response.ok) {
        // Verify the key works
        await checkApiStatus();
        
        // Clear input on success
        input.value = "";
        
        // Reload weather data
        setTimeout(() => {
          loadWeather();
        }, 500);
      } else {
        statusEl.className = "api-status error";
        statusEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${data.error || "Failed to save"}`;
      }
    } catch (e) {
      console.error("API key save failed", e);
      statusEl.className = "api-status error";
      statusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Failed to save API key';
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Save API Key';
    }
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveBtn.click();
    if (e.key === "Escape") close();
  });
}

// Auto-prompt for API key if not configured
async function checkFirstTimeSetup() {
  try {
    const data = await fetchJSON("/api/settings/api_status");
    
    if (!data.configured) {
      // Show a subtle notification on the settings button
      const settingsBtn = document.getElementById("settingsBtn");
      if (settingsBtn) {
        settingsBtn.classList.add("needs-attention");
      }
    }
  } catch (e) {
    // Silently fail
  }
}

// ----------------------
// Location Change Modal
// ----------------------
function initLocationModal() {
  const modal = document.getElementById("locationModal");
  const openBtn = document.getElementById("changeLocationBtn");
  const closeBtn = document.getElementById("closeLocationModal");
  const saveBtn = document.getElementById("saveLocationBtn");
  const input = document.getElementById("locationInput");

  if (!modal || !openBtn || !closeBtn || !saveBtn || !input) return;

  const close = () => modal.classList.add("hidden");

  openBtn.onclick = () => {
    modal.classList.remove("hidden");
    input.value = "";
    input.focus();
  };

  closeBtn.onclick = close;

  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  saveBtn.onclick = async () => {
    const loc = input.value.trim();
    if (!loc) return;

    try {
      await fetch("/api/settings/update_location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: loc }),
      });

      close();
      location.reload();
    } catch (e) {
      console.error("Location update failed", e);
    }
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveBtn.click();
    if (e.key === "Escape") close();
  });
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
  timers.push(setInterval(loadNetworkDevices, 2 * 60 * 1000));
  timers.push(setInterval(loadWeather, 10 * 60 * 1000)); // Refresh weather every 10 min
}

function clearTimers() {
  timers.forEach(clearInterval);
  timers = [];
}

function init() {
  window.NetHealthTheme?.initThemeUI();

  updateClock();
  loadWeather();
  loadQuotes();
  loadPrices();
  updateSystem();
  loadSystemFromServer();
  measureLatency();
  loadNetworkDevices();

  startTimers();
  enableTickerDrag();
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearTimers();
  } else {
    updateClock();
    loadWeather();
    loadPrices();
    updateSystem();
    loadSystemFromServer();
    measureLatency();
    loadNetworkDevices();
    startTimers();
  }
});

// Single bootstrap for everything
document.addEventListener("DOMContentLoaded", () => {
  initThemeLogoSwap();
  initLocationModal();
  initSettingsModal();  // Add this line
  initWeatherFlipCard();
  init();
  
  // Check if first-time setup needed
  setTimeout(checkFirstTimeSetup, 2000);
});