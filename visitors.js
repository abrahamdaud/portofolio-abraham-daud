const THEME_PALETTES = {
  dark: {
    color1: 0x758484,
    color2: 0x602e06
  },
  light: {
    color1: 0x2ea86f,
    color2: 0xd9e021
  }
};

let vantaEffect = null;
let isLightMode = false;
let pendingRaf = null;

function syncVantaColors(mode) {
  const palette = THEME_PALETTES[mode];
  if (!palette) return;

  if (!vantaEffect && window.VANTA && window.VANTA.CELLS) {
    vantaEffect = VANTA.CELLS({
      el: "#vanta-right",
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.00,
      minWidth: 200.00,
      scale: 1.00,
      scaleMobile: 1.50,
      color1: palette.color1,
      color2: palette.color2,
      size: 0.90,
      speed: 1.00
    });
  } else if (vantaEffect && typeof vantaEffect.setOptions === "function") {
    vantaEffect.setOptions({
      color1: palette.color1,
      color2: palette.color2
    });
  }
}

function applyTheme(light) {
  isLightMode = light;
  document.body.classList.toggle("light-mode", isLightMode);
  themeToggleBtn.setAttribute("aria-pressed", String(isLightMode));

  if (pendingRaf) {
    cancelAnimationFrame(pendingRaf);
  }

  pendingRaf = requestAnimationFrame(() => {
    syncVantaColors(isLightMode ? "light" : "dark");
    pendingRaf = null;
  });
}

function syncVantaResize() {
  if (vantaEffect && typeof vantaEffect.resize === "function") {
    vantaEffect.resize();
  }
}

const themeToggleBtn = document.getElementById("themeToggle");
applyTheme(false);

themeToggleBtn.addEventListener("click", () => {
  applyTheme(!isLightMode);
});

window.addEventListener("resize", syncVantaResize, { passive: true });
window.addEventListener("orientationchange", () => {
  setTimeout(syncVantaResize, 150);
}, { passive: true });
