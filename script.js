document.addEventListener("DOMContentLoaded", function () {

  let appState = loadState();

  function loadState() {
    const saved = localStorage.getItem("fitnessAppState");
    if (saved) return JSON.parse(saved);

    return {
      library: {
        exercises: ["Supino Reto","Agachamento"],
        techniques: ["Drop Set","Rest Pause"]
      },
      workouts: {},
      weights: [],
      photos: []
    };
  }

  function saveState() {
    localStorage.setItem("fitnessAppState", JSON.stringify(appState));
  }

  // ================= NAVIGATION =================
  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".section");

  navItems.forEach(btn => {
    btn.addEventListener("click", function () {
      sections.forEach(sec => sec.classList.remove("active"));
      navItems.forEach(n => n.classList.remove("active"));
      document.getElementById(this.dataset.section).classList.add("active");
      this.classList.add("active");
    });
  });

  // ================= DAY SELECTOR =================
  const daySelector = document.getElementById("daySelector");
  const days = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];

  days.forEach(day => {
    const option = document.createElement("option");
    option.value = day;
    option.textContent = day;
    daySelector.appendChild(option);
  });

  daySelector.addEventListener("change", renderExercises);

  function renderExercises() {

    const container = document.getElementById("exerciseContainer");
    container.innerHTML = "";

    const selectedDay = daySelector.value;

    if (!appState.workouts[selectedDay]) {
      appState.workouts[selectedDay] = [];
    }

    appState.workouts[selectedDay].forEach((item, index) => {

      const div = document.createElement("div");
      div.className = "exercise-item";

      div.innerHTML = `
        <div>
          <strong>${item.exercise}</strong>
          <br>
          <small>${item.technique || "Sem técnica"}</small>
        </div>
        <button data-index="${index}">Remover</button>
      `;

      container.appendChild(div);
    });

    container.querySelectorAll("button").forEach(btn => {
      btn.onclick = function () {
        appState.workouts[selectedDay].splice(this.dataset.index, 1);
        saveState();
        renderExercises();
      };
    });
  }

  // ================= PESO =================
  const weightInput = document.getElementById("weightInput");
  const addWeightBtn = document.getElementById("addWeightBtn");
  const currentWeightEl = document.getElementById("currentWeight");

  let chart;

  addWeightBtn.addEventListener("click", () => {

    const value = parseFloat(weightInput.value);
    if (!value) return;

    appState.weights.push({
      date: new Date().toLocaleDateString(),
      value
    });

    saveState();
    weightInput.value = "";
    updateWeight();
  });

  function updateWeight() {

    if (appState.weights.length > 0) {
      currentWeightEl.textContent =
        appState.weights[appState.weights.length - 1].value;
    }

    const ctx = document.getElementById("weightChart");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: appState.weights.map(w => w.date),
        datasets: [{
          data: appState.weights.map(w => w.value),
          borderColor: "#00ff88"
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  updateWeight();

  // ================= FOTOS =================
  const photoUpload = document.getElementById("photoUpload");
  const photoGallery = document.getElementById("photoGallery");

  photoUpload.addEventListener("change", function () {

    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {

      const img = document.createElement("img");
      img.src = e.target.result;
      img.style.width = "100%";
      img.style.borderRadius = "12px";
      img.style.marginBottom = "10px";

      photoGallery.appendChild(img);

      appState.photos.push(e.target.result);
      saveState();
    };

    reader.readAsDataURL(file);
  });

  appState.photos.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    img.style.width = "100%";
    img.style.borderRadius = "12px";
    img.style.marginBottom = "10px";
    photoGallery.appendChild(img);
  });

  renderExercises();

});
