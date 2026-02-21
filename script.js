document.addEventListener("DOMContentLoaded", function () {

  // ==========================
// INITIAL STATE (v3)
// ==========================

let appState = loadState();

function loadState() {
  const saved = localStorage.getItem("fitnessAppState");

  if (saved) {
    const parsed = JSON.parse(saved);

    // 🔄 MIGRAÇÃO AUTOMÁTICA PARA v3
    if (!parsed.version || parsed.version < 3) {

      parsed.version = 3;

      // Ajusta weights para novo formato
      if (Array.isArray(parsed.weights) && parsed.weights.length > 0) {
        if (typeof parsed.weights[0] === "number") {
          parsed.weights = parsed.weights.map(value => ({
            date: new Date().toISOString().split("T")[0],
            value
          }));
        }
      } else {
        parsed.weights = [];
      }

      // Cria estrutura health se não existir
      parsed.health = parsed.health || {
        profile: {
          weight: null,
          height: null,
          age: null,
          sex: "male",
          activity: 1.55,
          goal: "maintenance"
        },
        results: {
          bmi: 0,
          bmiLabel: "",
          tmb: 0,
          tdee: 0,
          water: 0,
          macros: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0
          }
        }
      };

      // Cria estrutura diet
      parsed.diet = parsed.diet || {
        entries: {}
      };

      localStorage.setItem("fitnessAppState", JSON.stringify(parsed));
    }

    return parsed;
  }

  // 🆕 ESTADO INICIAL LIMPO
  return {
    version: 3,
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
    health: {
      profile: {
        weight: null,
        height: null,
        age: null,
        sex: "male",
        activity: 1.55,
        goal: "maintenance"
      },
      results: {
        bmi: 0,
        bmiLabel: "",
        tmb: 0,
        tdee: 0,
        water: 0,
        macros: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0
        }
      }
    },
    diet: {
      entries: {}
    },
    settings: { theme: "dark" }
  };
}

function saveState() {
  localStorage.setItem("fitnessAppState", JSON.stringify(appState));
}

  function saveState() {
    localStorage.setItem("fitnessAppState", JSON.stringify(appState));
  }

  // ==========================
  // DRAWER
  // ==========================
  const drawer = document.getElementById("adminDrawer");
  document.getElementById("menuToggle").onclick = () => drawer.classList.add("open");
  document.getElementById("closeDrawer").onclick = () => drawer.classList.remove("open");

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
      };
    });
  }

  // ==========================
  // MODAL ELEMENTS
  // ==========================
  const modal = document.getElementById("exerciseModal");
  const exerciseListEl = document.getElementById("exerciseList");
  const techniqueListEl = document.getElementById("techniqueList");
  const exerciseSearch = document.getElementById("exerciseSearch");
  const techniqueSearch = document.getElementById("techniqueSearch");
  const selectedExerciseBox = document.getElementById("selectedExerciseBox");
  const selectedTechniqueBox = document.getElementById("selectedTechniqueBox");

  let selectedExercise = null;
  let selectedTechnique = null;

  // ==========================
  // OPEN MODAL
  // ==========================
  document.getElementById("addExerciseBtn").onclick = function () {

    selectedExercise = null;
    selectedTechnique = null;

    exerciseSearch.value = "";
    techniqueSearch.value = "";

    updateSelectedExerciseBox();
    updateSelectedTechniqueBox();

    renderExerciseOptions();
    renderTechniqueOptions();

    modal.classList.add("show");
  };

  // CLOSE MODAL
  document.getElementById("cancelExercise").onclick = function () {
    modal.classList.remove("show");
  };

  // ==========================
  // SEARCH FILTER
  // ==========================
  exerciseSearch.addEventListener("input", function (e) {
    renderExerciseOptions(e.target.value);
  });

  techniqueSearch.addEventListener("input", function (e) {
    renderTechniqueOptions(e.target.value);
  });

  // ==========================
  // RENDER EXERCISES LIST
  // ==========================
  function renderExerciseOptions(filter = "") {

    exerciseListEl.innerHTML = "";

    let filtered = appState.library.exercises
      .filter(ex => ex.toLowerCase().includes(filter.toLowerCase()));

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

  // ==========================
  // RENDER TECHNIQUES LIST
  // ==========================
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

  // ==========================
  // UPDATE SELECTED BOXES
  // ==========================
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

  // ==========================
  // CLEAR SELECTION
  // ==========================
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
  // SAVE EXERCISE
  // ==========================
  document.getElementById("saveExercise").onclick = function () {

    if (!selectedExercise) {
      alert("Selecione um exercício.");
      return;
    }

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

