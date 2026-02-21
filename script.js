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
  // ADD EXERCISE
  // ==========================
  document.getElementById("addExerciseBtn").onclick = function () {

    const exercise = prompt("Digite o nome do exercício ou escolha da biblioteca:");
    if (!exercise) return;

    const technique = prompt("Digite a técnica (opcional):");

    const day = daySelector.value;

    if (!appState.workouts[day]) {
      appState.workouts[day] = [];
    }

    appState.workouts[day].push({
      exercise,
      technique
    });

    saveState();
    renderExercises();
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
