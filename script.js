document.addEventListener("DOMContentLoaded", function () {

// ==========================
// INITIAL STATE (v3)
// ==========================

let appState = loadState();

function loadState() {
  const saved = localStorage.getItem("fitnessAppState");

  if (saved) {
    const parsed = JSON.parse(saved);

    if (!parsed.version || parsed.version < 3) {

      parsed.version = 3;

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

      parsed.diet = parsed.diet || { entries: {} };

      localStorage.setItem("fitnessAppState", JSON.stringify(parsed));
    }

    return parsed;
  }

  return {
    version: 3,
    library: { exercises: [], techniques: [] },
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
    diet: { entries: {} },
    settings: { theme: "dark" }
  };
}

function saveState() {
  localStorage.setItem("fitnessAppState", JSON.stringify(appState));
}

// ==========================
// SMART WEIGHT SYSTEM + HEALTH ENGINE
// ==========================

function addOrUpdateWeight(value) {

  if (!value || isNaN(value)) return;

  const today = new Date().toISOString().split("T")[0];
  const existingIndex = appState.weights.findIndex(w => w.date === today);

  if (existingIndex !== -1) {
    appState.weights[existingIndex].value = value;
  } else {
    appState.weights.push({ date: today, value });
  }

  appState.health.profile.weight = value;

  calculateHealthMetrics();

  saveState();
  renderWeightUI();
  renderHealthUI();
}


// ==========================
// HEALTH CALCULATIONS
// ==========================

function calculateHealthMetrics() {

  const profile = appState.health.profile;
  const results = appState.health.results;

  const weight = profile.weight;
  const height = profile.height;
  const age = profile.age;
  const sex = profile.sex;
  const activity = profile.activity;
  const goal = profile.goal;

  if (!weight || !height || !age) return;

  const heightMeters = height / 100;

  // IMC
  const bmi = weight / (heightMeters * heightMeters);
  results.bmi = parseFloat(bmi.toFixed(1));

  if (bmi < 18.5) results.bmiLabel = "Abaixo do peso";
  else if (bmi < 25) results.bmiLabel = "Normal";
  else if (bmi < 30) results.bmiLabel = "Sobrepeso";
  else results.bmiLabel = "Obesidade";

  // TMB (Mifflin-St Jeor)
  let tmb;
  if (sex === "male") {
    tmb = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    tmb = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }

  results.tmb = Math.round(tmb);

  // TDEE
  const tdee = tmb * activity;
  results.tdee = Math.round(tdee);

  // Água
  results.water = Math.round(weight * 35); // ml

  // Ajuste por objetivo
  let targetCalories = tdee;

  if (goal === "cutting") targetCalories -= 400;
  if (goal === "bulking") targetCalories += 400;

  results.macros.calories = Math.round(targetCalories);

  // Proteína (2g/kg)
  const protein = weight * 2;
  results.macros.protein = Math.round(protein);

  // Gordura (0.9g/kg)
  const fats = weight * 0.9;
  results.macros.fats = Math.round(fats);

  // Carboidratos = resto das calorias
  const proteinCalories = protein * 4;
  const fatCalories = fats * 9;
  const remainingCalories = targetCalories - (proteinCalories + fatCalories);

  results.macros.carbs = Math.round(remainingCalories / 4);
}


// ==========================
// HEALTH UI (placeholder)
// ==========================

function renderHealthUI() {
  // Será implementado na próxima etapa
}


// ==========================
// WEIGHT UI
// ==========================

const weightInput = document.getElementById("weightInput");
const addWeightBtn = document.getElementById("addWeightBtn");

if (addWeightBtn) {
  addWeightBtn.addEventListener("click", () => {
    const value = parseFloat(weightInput.value);
    addOrUpdateWeight(value);
    weightInput.value = "";
  });
}

function renderWeightUI() {

  const currentWeightSpan = document.getElementById("currentWeight");

  if (!appState.weights.length) {
    currentWeightSpan.textContent = "-";
    return;
  }

  const lastWeight = appState.weights[appState.weights.length - 1].value;
  currentWeightSpan.textContent = lastWeight;
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
renderWeightUI();

});
