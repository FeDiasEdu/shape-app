document.addEventListener("DOMContentLoaded", function () {

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }

  setTimeout(() => {
    const splash = document.getElementById("splashScreen");
    if (splash) splash.style.display = "none";
  }, 1200);

  let appState = loadState();
  let lastSavedStateString = JSON.stringify(appState);

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
    const currentStateString = JSON.stringify(appState);
    localStorage.setItem("fitnessAppState", currentStateString);
  }

  // NAVBAR
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", function () {

      document.querySelectorAll(".section").forEach(sec => {
        sec.classList.remove("active");
      });

      document.querySelectorAll(".nav-item").forEach(n => {
        n.classList.remove("active");
      });

      const id = this.dataset.section;
      document.getElementById(id)?.classList.add("active");
      this.classList.add("active");
    });
  });

  // TEMA
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
