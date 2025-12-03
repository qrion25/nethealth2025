// static/js/themes.js

const FONT_MAP = {
  playfair: { label: "Playfair Display", css: "'Playfair Display', Georgia, serif" },
  inter:    { label: "Inter", css: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" },
  poppins:  { label: "Poppins", css: "'Poppins', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" },
  satoshi:  { label: "Satoshi", css: "'Satoshi', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" },

  // NEW: matches your buttons
  mono:     { label: "Monospace", css: "ui-monospace, SFMono-Regular, Menlo, monospace" },
  system:   { label: "System UI", css: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" },
};

const THEME_NAMES = ["nethealth", "sunset", "forest", "terminal"];

function syncToggleUI() {
  const isDark = document.body.classList.contains("theme-dark");
  const btn = document.getElementById("themeToggle");
  if (btn) {
    const icon = btn.querySelector("i");
    const text = btn.querySelector("span");
    if (icon) icon.className = isDark ? "fas fa-sun" : "fas fa-moon";
    if (text) text.textContent = isDark ? "Light" : "Dark";
  }
}

function applyDarkMode(isDark) {
  document.body.classList.toggle("theme-dark", isDark);
  document.body.classList.toggle("theme-light", !isDark);
  localStorage.setItem("nh.dark", isDark ? "1" : "0");
  syncToggleUI();
}

function applyTheme(name) {
  const theme = THEME_NAMES.includes(name) ? name : "nethealth";
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("nh.theme", theme);
}

function applyFont(key) {
  const font = FONT_MAP[key] || FONT_MAP.inter;
  document.documentElement.style.setProperty("--font-base", font.css);
  document.documentElement.style.setProperty("--font-display", font.css);
  localStorage.setItem("nh.font", key);

  document.querySelectorAll("[data-font]").forEach(el => {
    el.classList.toggle("is-active", el.dataset.font === key);
  });
}

function toggleDark() {
  const isDark = !document.body.classList.contains("theme-dark");
  applyDarkMode(isDark);
}

function initThemeUI() {
  // Restore saved prefs
  applyDarkMode(localStorage.getItem("nh.dark") === "1");
  applyTheme(localStorage.getItem("nh.theme") || "nethealth");
  
  // NEW: Store initial font for event triggering
  const savedFont = localStorage.getItem("nh.font") || "inter";
  
  // Apply font styles
  const font = FONT_MAP[savedFont] || FONT_MAP.inter;
  document.documentElement.style.setProperty("--font-base", font.css);
  document.documentElement.style.setProperty("--font-display", font.css);
  
  // Update active state
  document.querySelectorAll("[data-font]").forEach(el => {
    el.classList.toggle("is-active", el.dataset.font === savedFont);
  });
  
  syncToggleUI();

  // NEW: Trigger initial font event after a brief delay to ensure DOM is ready
  setTimeout(() => {
    const initialEvent = new CustomEvent('fontChanged', { 
      detail: { font: savedFont },
      bubbles: true 
    });
    document.dispatchEvent(initialEvent);
  }, 100);

  // Theme chips
  document.querySelectorAll("[data-theme-chip]").forEach(chip => {
    chip.addEventListener("click", () => {
      const name = chip.getAttribute("data-theme-chip");
      applyTheme(name);
      document.querySelectorAll("[data-theme-chip]").forEach(c =>
        c.classList.toggle("is-active", c === chip)
      );
    });
  });

  // Font chips (updated to use applyFont which now triggers the event)
  document.querySelectorAll("[data-font]").forEach(chip => {
    chip.addEventListener("click", () => applyFont(chip.dataset.font));
  });

  // Dark toggle button
  document.getElementById("themeToggle")?.addEventListener("click", toggleDark);
}

window.NetHealthTheme = { applyTheme, applyFont, applyDarkMode, initThemeUI };