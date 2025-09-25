// static/js/theme.js

// Fonts to load/use (make sure index.html includes the font links)
const FONT_MAP = {
  playfair: { label: "Playfair Display", css: "'Playfair Display', Georgia, serif" },
  inter:    { label: "Inter", css: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" },
  poppins:  { label: "Poppins", css: "'Poppins', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" },
  satoshi:  { label: "Satoshi", css: "'Satoshi', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" }
};

// Named color themes (tie to [data-theme] in CSS)
const THEME_NAMES = ["nethealth", "sunset", "forest", "terminal"];

function applyDarkMode(isDark) {
  document.body.classList.toggle("theme-dark", isDark);
  document.body.classList.toggle("theme-light", !isDark);
  localStorage.setItem("nh.dark", isDark ? "1" : "0");
}

function applyTheme(name) {
  const theme = THEME_NAMES.includes(name) ? name : "nethealth";
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("nh.theme", theme);
}

function applyFont(key) {
  const font = FONT_MAP[key] || FONT_MAP.inter;
  // base copy
  document.documentElement.style.setProperty("--font-base", font.css);
  // display elements (headings/cards) can also use base for coherence
  document.documentElement.style.setProperty("--font-display", font.css);
  localStorage.setItem("nh.font", key);
  // reflect UI chip state if present
  document.querySelectorAll("[data-font]").forEach(el => {
    el.classList.toggle("is-active", el.dataset.font === key);
  });
}

function toggleDark(e) {
  const isDark = !document.body.classList.contains("theme-dark");
  applyDarkMode(isDark);
  // optional button label/icon control
  const btn = document.getElementById("themeToggle");
  if (btn) {
    const icon = btn.querySelector("i");
    const text = btn.querySelector("span");
    if (icon) icon.className = isDark ? "fas fa-sun" : "fas fa-moon";
    if (text) text.textContent = isDark ? "Light" : "Dark";
  }
}

function initThemeUI() {
  // Restore saved prefs
  applyDarkMode(localStorage.getItem("nh.dark") === "1");
  applyTheme(localStorage.getItem("nh.theme") || "nethealth");
  applyFont(localStorage.getItem("nh.font") || "inter");

  // Wire theme chips
  document.querySelectorAll("[data-theme-chip]").forEach(chip => {
    chip.addEventListener("click", () => {
      const name = chip.getAttribute("data-theme-chip");
      applyTheme(name);
      document.querySelectorAll("[data-theme-chip]").forEach(c => c.classList.toggle("is-active", c === chip));
    });
  });

  // Wire font chips
  document.querySelectorAll("[data-font]").forEach(chip => {
    chip.addEventListener("click", () => applyFont(chip.dataset.font));
  });

  // Wire dark toggle
  document.getElementById("themeToggle")?.addEventListener("click", toggleDark);
}

window.NetHealthTheme = { applyTheme, applyFont, applyDarkMode, initThemeUI };