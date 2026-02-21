document.addEventListener("DOMContentLoaded", function () {

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }

  setTimeout(() => {
    const splash = document.getElementById("splashScreen");
    if (splash) splash.style.display = "none";
  }, 1200);

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

  const indicator = document.querySelector(".nav-indicator");
  const navItems = document.querySelectorAll(".nav-item");

  function moveIndicator(element) {
    const rect = element.getBoundingClientRect();
    const parentRect = element.parentElement.getBoundingClientRect();
    indicator.style.width = rect.width + "px";
    indicator.style.transform =
      `translateX(${rect.left - parentRect.left}px)`;
  }

  navItems.forEach(btn => {
    btn.addEventListener("click", function () {

      document.querySelectorAll(".section").forEach(sec => {
        sec.classList.remove("active");
      });

      navItems.forEach(n => n.classList.remove("active"));

      const id = this.dataset.section;
      document.getElementById(id)?.classList.add("active");
      this.classList.add("active");

      moveIndicator(this);
    });
  });

  window.addEventListener("load", () => {
    const active = document.querySelector(".nav-item.active");
    if (active) moveIndicator(active);
  });

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
