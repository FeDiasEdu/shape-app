document.addEventListener("DOMContentLoaded", function () {

  let refreshing = false;
  let newWorker = null;

  // ==========================
  // SERVICE WORKER + UPDATE
  // ==========================
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js")
      .then(registration => {

        // Caso já exista um worker esperando
        if (registration.waiting) {
          newWorker = registration.waiting;
          showUpdateToast();
        }

        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;

          installingWorker.addEventListener("statechange", () => {
            if (
              installingWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              newWorker = installingWorker;
              showUpdateToast();
            }
          });
        });
      });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }

  function showUpdateToast() {
    const toast = document.getElementById("updateToast");
    const btn = document.getElementById("updateBtn");
  
    if (!toast || !btn) return;
  
    toast.classList.add("show");
  
    btn.onclick = () => {
      if (newWorker) {
  
        btn.textContent = "Atualizando...";
        btn.disabled = true;
  
        // envia mensagem para ativar novo SW
        newWorker.postMessage({ type: "SKIP_WAITING" });
  
        // força reload após pequeno delay
        setTimeout(() => {
          window.location.reload();
        }, 300);
      }
    };
  }

  // ==========================
  // SPLASH
  // ==========================
  setTimeout(() => {
    const splash = document.getElementById("splashScreen");
    if (splash) splash.style.display = "none";
  }, 1200);

  // ==========================
  // NAVBAR
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

      sections.forEach(sec => sec.classList.remove("active"));
      navItems.forEach(n => n.classList.remove("active"));

      const target = document.getElementById(this.dataset.section);
      if (target) target.classList.add("active");

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


