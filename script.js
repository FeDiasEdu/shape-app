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

    if (currentStateString !== lastSavedStateString) {
      lastSavedStateString = currentStateString;
    }
  }

  // ==========================
  // NAVBAR + INDICADOR
  // ==========================
  const indicator = document.querySelector(".nav-indicator");
  const navItems = document.querySelectorAll(".nav-item");

  function moveIndicator(element) {
    if (!indicator || !element) return;

    indicator.style.width = element.offsetWidth + "px";
    indicator.style.left = element.offsetLeft + "px";
  }

  navItems.forEach(btn => {
    btn.addEventListener("click", function () {

      // troca section
      document.querySelectorAll(".section").forEach(sec => {
        sec.classList.remove("active");
      });

      navItems.forEach(n => n.classList.remove("active"));

      const id = this.dataset.section;
      const section = document.getElementById(id);
      if (section) section.classList.add("active");

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

  // ==========================
  // RESTANTE DO APP ORIGINAL
  // ==========================
  const selector = document.getElementById("daySelector");
  const exerciseList = document.getElementById("exerciseList");
  const historyList = document.getElementById("workoutHistory");
  const weightInput = document.getElementById("weightInput");
  const weightChartCanvas = document.getElementById("weightChart");

  let weightChartInstance = null;

  const workoutsData = {
    "Dia 1 – Peito + Tríceps": ["Supino Inclinado Halteres","Chest Press","Crossover Baixo → Alto","Crucifixo Máquina","Tríceps Corda","Tríceps Testa"],
    "Dia 2 – Costas + Bíceps": ["Puxada Neutra","Remada Cabo","Pulldown","Rosca Scott","Rosca Martelo"],
    "Dia 3 – Posterior": ["Stiff","Flexora Deitada","Flexora Unilateral","Glute Bridge"],
    "Dia 4 – Ombro": ["Elevação Lateral","Elevação Cabo","Crucifixo Invertido","Desenvolvimento Halteres"],
    "Dia 5 – Perna": ["Agachamento Smith","Leg Press","Extensora","Panturrilha"]
  };

  if (selector) {
    Object.keys(workoutsData).forEach(day => {
      const option = document.createElement("option");
      option.value = day;
      option.textContent = day;
      selector.appendChild(option);
    });

    selector.addEventListener("change", renderExercises);
    renderExercises();
  }

  function renderExercises() {
    if (!exerciseList) return;
    exerciseList.innerHTML = "";

    workoutsData[selector.value].forEach(ex => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `<h3>${ex}</h3>`;
      exerciseList.appendChild(div);
    });
  }

  window.finishWorkout = function () {
    const date = new Date().toISOString().split("T")[0];
    if (!selector) return;

    appState.history.push(`${date} – ${selector.value}`);
    saveState();
    renderHistory();
  };

  function renderHistory() {
    if (!historyList) return;

    historyList.innerHTML = "";
    appState.history.forEach(h => {
      const li = document.createElement("li");
      li.textContent = h;
      historyList.appendChild(li);
    });
  }

  window.addWeight = function() {
    if (!weightInput) return;

    const weight = Number(weightInput.value);
    if (!weight) return;

    const date = new Date().toLocaleDateString();
    appState.weights.push({ date, weight });

    saveState();
    renderChart();
  };

  function renderChart() {
    if (!weightChartCanvas) return;

    if (weightChartInstance) weightChartInstance.destroy();

    weightChartInstance = new Chart(weightChartCanvas, {
      type: "line",
      data: {
        labels: appState.weights.map(w => w.date),
        datasets: [{
          label: "Peso",
          data: appState.weights.map(w => w.weight),
          borderColor: "#00ff88",
          tension: 0.3
        }]
      }
    });
  }

  renderHistory();
  renderChart();

});
