document.addEventListener("DOMContentLoaded", function () {

  // ==========================
  // APP STATE (BASE ESTRUTURAL)
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
      photos: [],
      settings: {
        theme: "dark",
        phase: "cut"
      }
    };
  }

  function saveState() {
    localStorage.setItem("fitnessAppState", JSON.stringify(appState));
  }

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

  // ==========================
  // NAVEGAÇÃO
  // ==========================
  document.querySelectorAll("nav button").forEach(btn => {
    btn.addEventListener("click", function () {
      const id = this.dataset.section;
      document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
      document.getElementById(id)?.classList.add("active");
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
    appState.settings.theme = document.body.classList.contains("dark") ? "dark" : "light";
    saveState();
  });

  // ==========================
  // SELECT TREINO
  // ==========================
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

  exerciseList.addEventListener("click", function(e){
    if(e.target.classList.contains("addSerieBtn")){
      const container = e.target.parentElement.querySelector(".seriesContainer");
      const div = document.createElement("div");
      div.className = "serie";
      div.innerHTML = `
        <input type="number" placeholder="Peso">
        <input type="number" placeholder="Reps">
        <button class="removeSerie">X</button>
      `;
      container.appendChild(div);
    }

    if(e.target.classList.contains("removeSerie")){
      e.target.parentElement.remove();
    }
  });

  // ==========================
  // FINALIZAR TREINO
  // ==========================
  window.finishWorkout = function () {

    const date = new Date().toISOString().split("T")[0];
    const day = selector.value;

    appState.workouts[date] = appState.workouts[date] || {};
    appState.workouts[date][day] = {};

    document.querySelectorAll("#exerciseList .card").forEach(card => {

      const exName = card.querySelector("h3").textContent;
      const series = [];

      card.querySelectorAll(".serie").forEach(s => {
        const peso = Number(s.children[0].value);
        const reps = Number(s.children[1].value);

        if (peso && reps) {
          series.push({ peso, reps });
        }
      });

      if (series.length > 0) {
        const pr = Math.max(...series.map(s => s.peso));
        appState.workouts[date][day][exName] = { series, pr };
      }

    });

    appState.history.push(`${date} – ${day}`);

    saveState();
    renderHistory();
    updateDashboard();

    alert("Treino salvo 🚀");
  };

  // ==========================
  // HISTÓRICO
  // ==========================
  function renderHistory() {
    historyList.innerHTML = "";
    appState.history.forEach(h => {
      const li = document.createElement("li");
      li.textContent = h;
      historyList.appendChild(li);
    });
  }

  // ==========================
  // DASHBOARD
  // ==========================
  function updateDashboard() {

    const now = new Date();
    const currentWeek = getWeekNumber(now);

    let weeklyVolume = 0;
    let weeklyWorkouts = 0;
    let bestPR = 0;

    Object.keys(appState.workouts).forEach(date => {

      const d = new Date(date);
      const week = getWeekNumber(d);

      if (week === currentWeek) {

        weeklyWorkouts++;

        Object.values(appState.workouts[date]).forEach(day => {
          Object.values(day).forEach(ex => {

            ex.series.forEach(s => {
              weeklyVolume += s.peso * s.reps;
            });

            if (ex.pr > bestPR) bestPR = ex.pr;

          });
        });
      }
    });

    document.getElementById("weeklyVolume").textContent =
      weeklyVolume ? weeklyVolume + " kg" : "-";

    document.getElementById("weeklyWorkouts").textContent =
      weeklyWorkouts || "-";

    document.getElementById("bestPR").textContent =
      bestPR ? bestPR + " kg" : "-";
  }

  function getWeekNumber(date) {
    const firstJan = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date - firstJan) / (24 * 60 * 60 * 1000));
    return Math.ceil((date.getDay() + 1 + days) / 7);
  }

  // ==========================
  // PESO
  // ==========================
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

  // ==========================
  // INIT
  // ==========================
  selector.addEventListener("change", renderExercises);

  renderExercises();
  renderHistory();
  renderChart();
  updateDashboard();

});
