document.addEventListener("DOMContentLoaded", function () {

  // ==========================
  // INITIAL STATE
  // ==========================
  let appState = loadState();

  function loadState() {
    const saved = localStorage.getItem("fitnessAppState");

    if (saved) {
      const parsed = JSON.parse(saved);

      if (!parsed.library) parsed.library = { exercises: [], techniques: [] };
      if (!parsed.workouts) parsed.workouts = {};
      if (!parsed.weights) parsed.weights = [];
      if (!parsed.photos) parsed.photos = [];

      return parsed;
    }

    return {
      version: 2,
      library: {
        exercises: [
          "Supino Reto","Supino Inclinado","Supino Declinado","Crucifixo",
          "Cross Over","Peck Deck","Puxada Frente","Remada Curvada",
          "Barra Fixa","Desenvolvimento","Elevação Lateral",
          "Rosca Direta","Rosca Scott","Rosca Martelo",
          "Tríceps Corda","Tríceps Testa",
          "Agachamento","Leg Press","Stiff","Levantamento Terra",
          "Panturrilha em Pé","Panturrilha Sentado"
        ],
        techniques: [
          "Drop Set","Rest Pause","Bi-set","Tri-set","FST-7",
          "Cluster","Pirâmide Crescente","Pirâmide Decrescente",
          "Negativa","Isometria","Tempo Controlado",
          "Série Forçada","GVT"
        ]
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

  // ==========================
  // NAVIGATION
  // ==========================
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

  // ==========================
  // DAY SELECTOR
  // ==========================
  const daySelector = document.getElementById("daySelector");
  const days = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];

  days.forEach(day => {
    const option = document.createElement("option");
    option.value = day;
    option.textContent = day;
    daySelector.appendChild(option);
  });

  daySelector.addEventListener("change", renderExercises);

  // ==========================
  // RENDER EXERCISES
  // ==========================
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
        updateDashboardStats();
      };
    });

    updateDashboardStats();
  }

  function updateDashboardStats() {
    document.getElementById("totalWorkouts").textContent =
      Object.values(appState.workouts)
        .reduce((total, day) => total + day.length, 0);
  }

  // ==========================
  // MODAL EXERCISE (ORIGINAL)
  // ==========================
  const modal = document.getElementById("exerciseModal");
  const addExerciseBtn = document.getElementById("addExerciseBtn");
  const cancelExercise = document.getElementById("cancelExercise");
  const saveExerciseBtn = document.getElementById("saveExercise");
  const exerciseListEl = document.getElementById("exerciseList");
  const techniqueListEl = document.getElementById("techniqueList");

  let selectedExercise = null;
  let selectedTechnique = null;

  addExerciseBtn.onclick = function () {
    selectedExercise = null;
    selectedTechnique = null;
    renderExerciseOptions();
    renderTechniqueOptions();
    modal.classList.add("show");
  };

  cancelExercise.onclick = function () {
    modal.classList.remove("show");
  };

  function renderExerciseOptions() {
    exerciseListEl.innerHTML = "";
    appState.library.exercises.forEach(ex => {
      const div = document.createElement("div");
      div.textContent = ex;
      div.onclick = () => selectedExercise = ex;
      exerciseListEl.appendChild(div);
    });
  }

  function renderTechniqueOptions() {
    techniqueListEl.innerHTML = "";
    appState.library.techniques.forEach(t => {
      const div = document.createElement("div");
      div.textContent = t;
      div.onclick = () => selectedTechnique = t;
      techniqueListEl.appendChild(div);
    });
  }

  saveExerciseBtn.onclick = function () {

    if (!selectedExercise) return;

    const day = daySelector.value;

    if (!appState.workouts[day]) {
      appState.workouts[day] = [];
    }

    appState.workouts[day].push({
      exercise: selectedExercise,
      technique: selectedTechnique
    });

    saveState();
    renderExercises();
    modal.classList.remove("show");
  };

  // ==========================
  // PESO (1 POR DIA)
  // ==========================
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
      appState.weights.push({ date: today, value });
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

  // ==========================
  // FOTOS (COM EXCLUIR)
  // ==========================
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
