document.addEventListener("DOMContentLoaded", function () {

  let newWorker;

  // ==========================
  // SERVICE WORKER + UPDATE SYSTEM
  // ==========================
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js")
      .then(reg => {

        if (reg.waiting) {
          showUpdateToast(reg.waiting);
        }

        reg.addEventListener("updatefound", () => {
          newWorker = reg.installing;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              showUpdateToast(newWorker);
            }
          });
        });
      });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }

  function showUpdateToast(worker) {
    const toast = document.getElementById("updateToast");
    const btn = document.getElementById("updateBtn");

    toast.classList.add("show");

    btn.onclick = () => {
      worker.postMessage("SKIP_WAITING");
    };
  }

  // ==========================
  // RESTANTE DO SEU SCRIPT
  // ==========================

  // SPLASH
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

  // NAVBAR
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

      sections.forEach(sec => sec.classList.remove("active"));
      navItems.forEach(n => n.classList.remove("active"));

      const targetSection = document.getElementById(this.dataset.section);
      if (targetSection) targetSection.classList.add("active");

      this.classList.add("active");
      moveIndicator(this);
    });
  });

  window.addEventListener("load", () => {
    const active = document.querySelector(".nav-item.active");
    if (active) moveIndicator(active);
  });

  window.addEventListener("resize", () => {
    const active = document.querySelector(".nav-item.active");
    if (active) moveIndicator(active);
  });

});
