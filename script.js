document.addEventListener("DOMContentLoaded", function () {

  // ==========================
  // INITIAL STATE
  // ==========================
  let appState = loadState();

  function loadState() {
    const saved = localStorage.getItem("fitnessAppState");
    if (saved) return JSON.parse(saved);

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
      settings: { theme: "dark" }
    };
  }

  function saveState() {
    localStorage.setItem("fitnessAppState", JSON.stringify(appState));
  }

  // ==========================
  // DRAWER
  // ==========================
  const drawer = document.getElementById("adminDrawer");
  document.getElementById("menuToggle").onclick = () => {
    drawer.classList.add("open");
  };
  document.getElementById("closeDrawer").onclick = () => {
    drawer.classList.remove("open");
  };

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
        appState.workouts[selectedDay].splice(this.dataset.index,1);
        saveState();
        renderExercises();
      };
    });
  }

  // ==========================
// ADD EXERCISE MODAL
// ==========================

// ELEMENTOS DO MODAL
const modal = document.getElementById("exerciseModal");
const exerciseListEl = document.getElementById("exerciseList");
const techniqueListEl = document.getElementById("techniqueList");
const exerciseSearch = document.getElementById("exerciseSearch");
const techniqueSearch = document.getElementById("techniqueSearch");

let selectedExercise = null;
let selectedTechnique = null;
  
const selectedExerciseBox = document.getElementById("selectedExerciseBox");
const selectedTechniqueBox = document.getElementById("selectedTechniqueBox");

function renderExerciseOptions(filter = "") {
  exerciseListEl.innerHTML = "";

  let filtered = appState.library.exercises
    .filter(ex => ex.toLowerCase().includes(filter.toLowerCase()));

  // Se houver selecionado, coloca no topo
  if (selectedExercise) {
    filtered = [
      selectedExercise,
      ...filtered.filter(ex => ex !== selectedExercise)
    ];
  }

  filtered.forEach(ex => {

    const div = document.createElement("div");
    div.textContent = ex;

    if (selectedExercise === ex) {
      div.classList.add("selected");
    }

    div.onclick = () => {
      selectedExercise = ex;
      exerciseSearch.value = "";
      updateSelectedExerciseBox();
      renderExerciseOptions();
    };

    exerciseListEl.appendChild(div);
  });
}

function renderTechniqueOptions(filter = "") {
  techniqueListEl.innerHTML = "";

  let filtered = appState.library.techniques
    .filter(t => t.toLowerCase().includes(filter.toLowerCase()));

  if (selectedTechnique) {
    filtered = [
      selectedTechnique,
      ...filtered.filter(t => t !== selectedTechnique)
    ];
  }

  filtered.forEach(t => {

    const div = document.createElement("div");
    div.textContent = t;

    if (selectedTechnique === t) {
      div.classList.add("selected");
    }

    div.onclick = () => {
      selectedTechnique = t;
      techniqueSearch.value = "";
      updateSelectedTechniqueBox();
      renderTechniqueOptions();
    };

    techniqueListEl.appendChild(div);
  });
}

function updateSelectedExerciseBox() {
  if (selectedExercise) {
    selectedExerciseBox.textContent = "Selecionado: " + selectedExercise;
    selectedExerciseBox.classList.remove("hidden");
  } else {
    selectedExerciseBox.classList.add("hidden");
  }
}

function updateSelectedTechniqueBox() {
  if (selectedTechnique) {
    selectedTechniqueBox.textContent = "Técnica: " + selectedTechnique;
    selectedTechniqueBox.classList.remove("hidden");
  } else {
    selectedTechniqueBox.classList.add("hidden");
  }
}

document.getElementById("clearSelection").onclick = function () {
  selectedExercise = null;
  selectedTechnique = null;
  exerciseSearch.value = "";
  techniqueSearch.value = "";
  updateSelectedExerciseBox();
  updateSelectedTechniqueBox();
  renderExerciseOptions();
  renderTechniqueOptions();
};

  // ==========================
  // NAVBAR
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

  renderExercises();

});




