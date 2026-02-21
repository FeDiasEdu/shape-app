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
  }

  // ==========================
  // BACKUP EXPORT
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

  // ==========================
  // BACKUP IMPORT
  // ==========================
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

      } catch (err) {
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
    appState.settings.theme = document.body.classList.contains("dark") ? "dark" : "light";
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

  function renderExercises() {
    exerciseList.innerHTML = "";
    workoutsData[selector.value].forEach(ex => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <h3>${ex}</h3>
        <div class="seriesContainer"></div>
        <button class="primary addSerieBtn">+ Série</button>
      `;
      exerciseList.appendChild(div);
    });
  }

  window.finishWorkout = function () {
    const date = new Date().toISOString().split("T")[0];
    const day = selector.value;

    appState.workouts[date] = appState.workouts[date] || {};
    appState.workouts[date][day] = {};

    appState.history.push(`${date} – ${day}`);
    saveState();

    renderHistory();
    updateDashboard();
    alert("Treino salvo 🚀");
  };

  function renderHistory() {
    historyList.innerHTML = "";
    appState.history.forEach(h => {
      const li = document.createElement("li");
      li.textContent = h;
      historyList.appendChild(li);
    });
  }

  function updateDashboard() {
    document.getElementById("weeklyWorkouts").textContent =
      Object.keys(appState.workouts).length || "-";
  }

  window.addWeight = function() {
    const weight = Number(weightInput.value);
    if (!weight) return;

    const date = new Date().toLocaleDateString();
    appState.weights.push({ date, weight });
    saveState();

    document.getElementById("currentWeight").textContent = weight;
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

  selector.addEventListener("change", renderExercises);

  renderExercises();
  renderHistory();
  renderChart();
  updateDashboard();

});
