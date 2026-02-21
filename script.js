document.addEventListener("DOMContentLoaded", function () {

  // ==========================
  // SERVICE WORKER
  // ==========================
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }

  // ==========================
  // SPLASH
  // ==========================
  setTimeout(() => {
    const splash = document.getElementById("splashScreen");
    if (splash) splash.style.display = "none";
  }, 1200);

  // ==========================
  // STATE
  // ==========================
  let appState = loadState();

  function loadState() {
    const saved = localStorage.getItem("fitnessAppState");
    if (saved) return JSON.parse(saved);

    return {
      version: 1,
      workouts: {},
      history: [],
      weights: [],
      settings: { theme: "dark" }
    };
  }

  function saveState() {
    localStorage.setItem("fitnessAppState", JSON.stringify(appState));
  }

  // ==========================
  // NAVBAR + TROCA DE SECTION
  // ==========================
  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".section");
  const indicator = document.querySelector(".nav-indicator");

  function moveIndicator(element) {
    if (!indicator) return;
    indicator.style.width = element.offsetWidth + "px";
    indicator.style.left = element.offsetLeft + "px";
  }

  navItems.forEach(btn => {
    btn.addEventListener("click", function () {

      const targetId = this.dataset.section;

      // remove active das sections
      sections.forEach(sec => sec.classList.remove("active"));

      // remove active dos botões
      navItems.forEach(n => n.classList.remove("active"));

      // ativa section correta
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.classList.add("active");
      }

      // ativa botão
      this.classList.add("active");

      moveIndicator(this);
    });
  });

  // posiciona indicador ao carregar
  window.addEventListener("load", () => {
    const active = document.querySelector(".nav-item.active");
    if (active) moveIndicator(active);
  });

  window.addEventListener("resize", () => {
    const active = document.querySelector(".nav-item.active");
    if (active) moveIndicator(active);
  });

  // ==========================
  // TEMA
  // ==========================
  if (appState.settings.theme === "dark") {
    document.body.classList.add("dark");
  }

  document.getElementById("themeToggle")?.addEventListener("click", function () {
    document.body.classList.toggle("dark");
    appState.settings.theme =
      document.body.classList.contains("dark") ? "dark" : "light";
    saveState();
  });

});
