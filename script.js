document.addEventListener("DOMContentLoaded", function () {

  let appState = loadState();

  function loadState() {
    const saved = localStorage.getItem("fitnessAppState");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.photos) parsed.photos = [];
      if (!parsed.weights) parsed.weights = [];
      return parsed;
    }

    return {
      version: 2,
      library: {
        exercises: ["Supino Reto","Supino Inclinado","Agachamento"],
        techniques: ["Drop Set","Rest Pause"]
      },
      workouts: {},
      weights: [],
      photos: [],
      settings: { theme: "dark" }
    };
  }

  function saveState() {
    localStorage.setItem("fitnessAppState", JSON.stringify(appState));
  }

  // ================= NAV =================
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

    const today = new Date().toLocaleDateString();

    const existing = appState.weights.find(w => w.date === today);

    if (existing) {
      existing.value = value;
    } else {
      appState.weights.push({
        date: today,
        value
      });
    }

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

  function renderPhotos() {

    photoGallery.innerHTML = "";

    appState.photos.forEach((src, index) => {

      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      wrapper.style.marginBottom = "10px";

      const img = document.createElement("img");
      img.src = src;
      img.style.width = "100%";
      img.style.borderRadius = "12px";

      const btn = document.createElement("button");
      btn.textContent = "X";
      btn.style.position = "absolute";
      btn.style.top = "8px";
      btn.style.right = "8px";
      btn.style.background = "red";
      btn.style.color = "white";
      btn.style.borderRadius = "50%";
      btn.style.width = "28px";
      btn.style.height = "28px";

      btn.onclick = () => {
        appState.photos.splice(index, 1);
        saveState();
        renderPhotos();
      };

      wrapper.appendChild(img);
      wrapper.appendChild(btn);
      photoGallery.appendChild(wrapper);
    });
  }

  photoUpload.addEventListener("change", function () {

    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
      appState.photos.push(e.target.result);
      saveState();
      renderPhotos();
    };

    reader.readAsDataURL(file);
  });

  renderPhotos();

  renderExercises();

});
