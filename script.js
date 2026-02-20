document.addEventListener("DOMContentLoaded", function () {

  const workoutsData = {
    "Dia 1 – Peito + Tríceps": [
      "Supino Inclinado Halteres",
      "Chest Press",
      "Crossover Baixo → Alto",
      "Crucifixo Máquina",
      "Tríceps Corda",
      "Tríceps Testa"
    ],
    "Dia 2 – Costas + Bíceps": [
      "Puxada Neutra",
      "Remada Cabo",
      "Pulldown",
      "Rosca Scott",
      "Rosca Martelo"
    ],
    "Dia 3 – Posterior": [
      "Stiff",
      "Flexora Deitada",
      "Flexora Unilateral",
      "Glute Bridge"
    ],
    "Dia 4 – Ombro": [
      "Elevação Lateral",
      "Elevação Cabo",
      "Crucifixo Invertido",
      "Desenvolvimento Halteres"
    ],
    "Dia 5 – Perna": [
      "Agachamento Smith",
      "Leg Press",
      "Extensora",
      "Panturrilha"
    ]
  };

  const selector = document.getElementById("daySelector");
  const exerciseList = document.getElementById("exerciseList");
  const historyList = document.getElementById("workoutHistory");

  let history = JSON.parse(localStorage.getItem("history")) || [];
  let workoutData = JSON.parse(localStorage.getItem("workoutData")) || {};
  let weightData = JSON.parse(localStorage.getItem("weightData")) || [];

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
        <button onclick="addSerie(this)">+ Série</button>
      `;
      exerciseList.appendChild(div);
    });
  }

  window.addSerie = function(button) {
    const container = button.parentElement.querySelector(".seriesContainer");
    const div = document.createElement("div");
    div.className = "serie";
    div.innerHTML = `
      <input type="number" placeholder="Peso">
      <input type="number" placeholder="Reps">
      <button onclick="this.parentElement.remove()">X</button>
    `;
    container.appendChild(div);
  };

  window.finishWorkout = function () {
    const date = new Date().toISOString().split("T")[0];
    const day = selector.value;

    let totalVolume = 0;
    workoutData[date] = workoutData[date] || {};
    workoutData[date][day] = {};

    document.querySelectorAll(".card").forEach(card => {
      const exName = card.querySelector("h3")?.textContent;
      if (!exName) return;

      const series = [];
      card.querySelectorAll(".serie").forEach(s => {
        const peso = Number(s.children[0].value);
        const reps = Number(s.children[1].value);
        if (peso && reps) {
          series.push({ peso, reps });
          totalVolume += peso * reps;
        }
      });

      if (series.length > 0) {
        const pr = Math.max(...series.map(s => s.peso));
        workoutData[date][day][exName] = { series, pr };
      }
    });

    history.push(`${date} – ${day}`);
    localStorage.setItem("history", JSON.stringify(history));
    localStorage.setItem("workoutData", JSON.stringify(workoutData));

    document.getElementById("lastVolume").textContent = totalVolume + " kg";
    renderHistory();
    alert("Treino salvo com sucesso 🚀");
  };

  function renderHistory() {
    historyList.innerHTML = "";
    history.forEach(h => {
      const li = document.createElement("li");
      li.textContent = h;
      historyList.appendChild(li);
    });
  }

  window.showSection = function(id) {
    document.querySelectorAll(".section").forEach(sec => {
      sec.classList.remove("active");
    });
    document.getElementById(id).classList.add("active");
  };

  window.addWeight = function() {
    const weight = Number(document.getElementById("weightInput").value);
    if (!weight) return;
    const date = new Date().toLocaleDateString();
    weightData.push({ date, weight });
    localStorage.setItem("weightData", JSON.stringify(weightData));
    document.getElementById("currentWeight").textContent = weight;
    renderChart();
  };

  function renderChart() {
    const ctx = document.getElementById("weightChart");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: weightData.map(w => w.date),
        datasets: [{
          label: "Peso",
          data: weightData.map(w => w.weight),
          borderColor: "#00ff88",
          fill: false
        }]
      }
    });
  }

  document.getElementById("themeToggle").addEventListener("click", function () {
    document.body.classList.toggle("dark");
  });

  selector.addEventListener("change", renderExercises);

  renderExercises();
  renderHistory();
  renderChart();
});
