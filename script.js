document.addEventListener("DOMContentLoaded", function () {

  // ==========================
  // SERVICE WORKER
  // ==========================
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }

  // ==========================
  // SPLASH SCREEN
  // ==========================
  setTimeout(() => {
    const splash = document.getElementById("splashScreen");
    if (splash) splash.style.display = "none";
  }, 1200);

  // ==========================
  // APP STATE
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
      createAutoBackup(currentStateString);
      lastSavedStateString = currentStateString;
    }
  }

  // ==========================
  // AUTO BACKUP INTELIGENTE
  // ==========================
  const AUTO_BACKUP_KEY = "fitnessAutoBackups";
  const MAX_BACKUPS = 5;

  function getAutoBackups() {
    return JSON.parse(localStorage.getItem(AUTO_BACKUP_KEY)) || [];
  }

  function createAutoBackup(stateString) {
    let backups = getAutoBackups();

    if (backups.length > 0 && backups[0].state === stateString) return;

    backups.unshift({
      date: new Date().toISOString(),
      state: stateString
    });

    if (backups.length > MAX_BACKUPS) {
      backups = backups.slice(0, MAX_BACKUPS);
    }

    localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(backups));
  }

  window.restoreAutoBackup = function (index) {
    const backups = getAutoBackups();
    if (!backups[index]) return;

    if (!confirm("Deseja restaurar este backup?")) return;

    appState = JSON.parse(backups[index].state);
    saveState();
    location.reload();
  };

  // ==========================
  // BACKUP MANUAL
  // ==========================
  window.exportBackup = function () {
    const dataStr = JSON.stringify(appState, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `fitness-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };

  window.importBackup = function () {
    const fileInput = document.getElementById("importFile");
    if (!fileInput) return;

    const file = fileInput.files[0];
    if (!file) {
      alert("Selecione um arquivo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const importedData = JSON.parse(e.target.result);
        if (!importedData.version) {
          alert("Arquivo inválido.");
          return;
        }

        appState = importedData;
        saveState();
        location.reload();
      } catch {
        alert("Erro ao importar arquivo.");
      }
    };

    reader.readAsText(file);
  };

  // ==========================
  // NAVBAR INFERIOR
  // ==========================
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
  // ELEMENTOS
  // ==========================
  const selector = document.getElementById("daySelector");
  const exerciseList = document.getElementById("exerciseList");
  const historyList = document.getElementById("workoutHistory");
  const weightInput = document.getElementById("weightInput");
  const weightChartCanvas = document.getElementById("weightChart");

  let weightChartInstance = null;

  // ==========================
  // TREINOS BASE
  // ==========================
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

  // ==========================
  // FINALIZAR TREINO
  // ==========================
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

  // ==========================
  // PESO
  // ==========================
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
