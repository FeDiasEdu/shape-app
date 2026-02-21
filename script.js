document.addEventListener("DOMContentLoaded", function () {

  // ==========================
  // SERVICE WORKER
  // ==========================
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }

  // ==========================
  // APP STATE
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
    createAutoBackup();
  }

  // ==========================
  // AUTO BACKUP SYSTEM
  // ==========================
  const AUTO_BACKUP_KEY = "fitnessAutoBackups";
  const MAX_BACKUPS = 5;

  function getAutoBackups() {
    return JSON.parse(localStorage.getItem(AUTO_BACKUP_KEY)) || [];
  }

  function createAutoBackup() {
    let backups = getAutoBackups();

    backups.unshift({
      date: new Date().toISOString(),
      data: JSON.parse(JSON.stringify(appState))
    });

    if (backups.length > MAX_BACKUPS) {
      backups = backups.slice(0, MAX_BACKUPS);
    }

    localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(backups));
    renderBackupList();
  }

  window.restoreAutoBackup = function (index) {
    const backups = getAutoBackups();

    if (!backups[index]) return;

    if (!confirm("Deseja restaurar este backup?")) return;

    appState = backups[index].data;
    saveState();
    location.reload();
  };

  function renderBackupList() {
    const container = document.getElementById("autoBackupList");
    if (!container) return;

    const backups = getAutoBackups();

    container.innerHTML = "";

    backups.forEach((b, index) => {
      const div = document.createElement("div");
      div.className = "backupItem";
      div.innerHTML = `
        <p>${new Date(b.date).toLocaleString()}</p>
        <button onclick="restoreAutoBackup(${index})">Restaurar</button>
      `;
      container.appendChild(div);
    });
  }

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
        alert("Backup restaurado com sucesso!");
        location.reload();

      } catch {
        alert("Erro ao importar arquivo.");
      }
    };

    reader.readAsText(file);
  };

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
  // TREINOS BASE
  // ==========================
  const workoutsData = {
    "Dia 1 – Peito + Tríceps": ["Supino Inclinado Halteres","Chest Press","Crossover Baixo → Alto","Crucifixo Máquina","Tríceps Corda","Tríceps Testa"],
    "Dia 2 – Costas + Bíceps": ["Puxada Neutra","Remada Cabo","Pulldown","Rosca Scott","Rosca Martelo"],
    "Dia 3 – Posterior": ["Stiff","Flexora Deitada","Flexora Unilateral","Glute Bridge"],
    "Dia 4 – Ombro": ["Elevação Lateral","Elevação Cabo","Crucifixo Invertido","Desenvolvimento Halteres"],
    "Dia 5 – Perna": ["Agachamento Smith","Leg Press","Extensora","Panturrilha"]
  };

  Object.keys(workoutsData).forEach(day => {
    const option = document.createElement("option");
    option.value = day;
    option.textContent = day;
    selector.appendChild(option);
  });

  window.finishWorkout = function () {
    const date = new Date().toISOString().split("T")[0];
    const day = selector.value;

    appState.workouts[date] = appState.workouts[date] || {};
    appState.workouts[date][day] = {};
    appState.history.push(`${date} – ${day}`);

    saveState();
    renderHistory();
  };

  function renderHistory() {
    historyList.innerHTML = "";
    appState.history.forEach(h => {
      const li = document.createElement("li");
      li.textContent = h;
      historyList.appendChild(li);
    });
  }

  window.addWeight = function() {
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

  selector.addEventListener("change", () => {});

  renderHistory();
  renderChart();
  renderBackupList();

  // ==========================
  // AUTO BACKUP TIMER
  // ==========================
  setInterval(() => {
    createAutoBackup();
    console.log("Backup automático criado");
  }, 300000); // 5 minutos

});
