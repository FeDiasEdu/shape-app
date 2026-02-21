window.showSection = function (id) {
  document.querySelectorAll(".section").forEach(sec => {
    sec.classList.remove("active");
  });
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
};

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

  window.finishWorkout = function () {
    const date = new Date().toISOString().split("T")[0];
    const day = selector.value;

    let totalVolume = 0;

    workoutData[date] = workoutData[date] || {};
    workoutData[date][day] = {};

    document.querySelectorAll("#exerciseList .card").forEach(card => {
      const exName = card.querySelector("h3").textContent;
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

    const lastVolume = getLastWorkoutVolume(day, date);

    if (lastVolume !== null) {
      const diff = ((totalVolume - lastVolume) / lastVolume) * 100;
      const arrow = diff >= 0 ? "↑" : "↓";
      const color = diff >= 0 ? "lime" : "red";
      document.getElementById("lastVolume").innerHTML =
        `<span style="color:${color}">${totalVolume} kg (${arrow} ${diff.toFixed(1)}%)</span>`;
    } else {
      document.getElementById("lastVolume").textContent =
        totalVolume + " kg";
    }

    history.push(`${date} – ${day}`);

    localStorage.setItem("history", JSON.stringify(history));
    localStorage.setItem("workoutData", JSON.stringify(workoutData));

    renderHistory();
    updateDashboard();
    
    alert("Treino salvo 🚀");
  };

  function getLastWorkoutVolume(day, currentDate) {
    const dates = Object.keys(workoutData).sort().reverse();

    for (let d of dates) {
      if (d < currentDate && workoutData[d][day]) {
        let volume = 0;
        Object.values(workoutData[d][day]).forEach(ex => {
          ex.series.forEach(s => {
            volume += s.peso * s.reps;
          });
        });
        return volume;
      }
    }
    return null;
  }

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

    if (!ctx) return;

    new Chart(ctx, {
      type: "line",
      data: {
        labels: weightData.map(w => w.date),
        datasets: [{
          label: "Peso",
          data: weightData.map(w => w.weight),
          borderColor: "#00ff88",
          tension: 0.3
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
  updateDashboard();

function updateDashboard() {

  const now = new Date();
  const currentWeek = getWeekNumber(now);

  let weeklyVolume = 0;
  let weeklyWorkouts = 0;
  let bestPR = 0;

  Object.keys(workoutData).forEach(date => {
    const d = new Date(date);
    const week = getWeekNumber(d);

    if (week === currentWeek) {
      weeklyWorkouts++;

      Object.values(workoutData[date]).forEach(day => {
        Object.values(day).forEach(ex => {

          ex.series.forEach(s => {
            weeklyVolume += s.peso * s.reps;
          });

          if (ex.pr > bestPR) {
            bestPR = ex.pr;
          }

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

let photoData = JSON.parse(localStorage.getItem("photoData")) || [];

const photoUpload = document.getElementById("photoUpload");
const photoGallery = document.getElementById("photoGallery");
const photoSelect1 = document.getElementById("photoSelect1");
const photoSelect2 = document.getElementById("photoSelect2");

photoUpload.addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const date = new Date().toISOString().split("T")[0];

    photoData.push({
      date,
      image: e.target.result
    });

    localStorage.setItem("photoData", JSON.stringify(photoData));
    renderPhotos();
  };
  reader.readAsDataURL(file);
});

function renderPhotos() {
  photoGallery.innerHTML = "";
  photoSelect1.innerHTML = "";
  photoSelect2.innerHTML = "";

  photoData.forEach((p, index) => {
    const img = document.createElement("img");
    img.src = p.image;
    photoGallery.appendChild(img);

    const option1 = document.createElement("option");
    option1.value = index;
    option1.textContent = p.date;
    photoSelect1.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = index;
    option2.textContent = p.date;
    photoSelect2.appendChild(option2);
  });
}

window.comparePhotos = function () {
  const i1 = photoSelect1.value;
  const i2 = photoSelect2.value;

  if (i1 === i2) return;

  const container = document.getElementById("comparisonContainer");
  container.innerHTML = `
    <div class="compareBox">
      <img src="${photoData[i1].image}">
      <img src="${photoData[i2].image}">
    </div>
  `;
};

renderPhotos();

});




