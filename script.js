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
  renderExercises();
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
// HEALTH UI + PROFILE SYSTEM
// ==========================

const heightInput = document.getElementById("heightInput");
const ageInput = document.getElementById("ageInput");
const sexInput = document.getElementById("sexInput");
const activityInput = document.getElementById("activityInput");
const goalInput = document.getElementById("goalInput");
const saveProfileBtn = document.getElementById("saveProfileBtn");

function renderHealthUI() {

  const results = appState.health.results;
  const profile = appState.health.profile;

  // Perfil
  if (heightInput) heightInput.value = profile.height || "";
  if (ageInput) ageInput.value = profile.age || "";
  if (sexInput) sexInput.value = profile.sex;
  if (activityInput) activityInput.value = String(profile.activity);
  if (goalInput) goalInput.value = profile.goal;

  // Resultados
  document.getElementById("bmiResult").textContent = results.bmi || "-";
  document.getElementById("bmiLabel").textContent = results.bmiLabel || "-";
  document.getElementById("tmbResult").textContent = results.tmb || "-";
  document.getElementById("tdeeResult").textContent = results.tdee || "-";
  document.getElementById("waterResult").textContent = results.water || "-";

  document.getElementById("caloriesResult").textContent = results.macros.calories || "-";
  document.getElementById("proteinResult").textContent = results.macros.protein || "-";
  document.getElementById("carbsResult").textContent = results.macros.carbs || "-";
  document.getElementById("fatsResult").textContent = results.macros.fats || "-";

  // Diet também depende de metas/macros
  renderDietUI();
}

if (saveProfileBtn) {
  saveProfileBtn.addEventListener("click", () => {

    appState.health.profile.height = parseFloat(heightInput.value) || null;
    appState.health.profile.age = parseInt(ageInput.value) || null;
    appState.health.profile.sex = sexInput.value;
    appState.health.profile.activity = parseFloat(activityInput.value);
    appState.health.profile.goal = goalInput.value;

    calculateHealthMetrics();

    saveState();
    renderHealthUI();
  });
}


// ==========================
// DIET SYSTEM (Daily Log)
// ==========================

const dietTodayEl = document.getElementById("dietToday");
const dietListEl = document.getElementById("dietList");

const foodNameInput = document.getElementById("foodNameInput");
const foodQtyInput = document.getElementById("foodQtyInput");
const foodCaloriesInput = document.getElementById("foodCaloriesInput");
const foodProteinInput = document.getElementById("foodProteinInput");
const foodCarbsInput = document.getElementById("foodCarbsInput");
const foodFatsInput = document.getElementById("foodFatsInput");
const addFoodBtn = document.getElementById("addFoodBtn");

const waterAddInput = document.getElementById("waterAddInput");
const addWaterBtn = document.getElementById("addWaterBtn");

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function ensureDietDay(dayKey) {
  if (!appState.diet) appState.diet = { entries: {} };
  if (!appState.diet.entries) appState.diet.entries = {};

  if (!appState.diet.entries[dayKey]) {
    appState.diet.entries[dayKey] = {
      items: [],
      waterMl: 0
    };
  }

  // sane default
  if (!Array.isArray(appState.diet.entries[dayKey].items)) {
    appState.diet.entries[dayKey].items = [];
  }
  if (typeof appState.diet.entries[dayKey].waterMl !== "number") {
    appState.diet.entries[dayKey].waterMl = 0;
  }
}

function addDietItem(item) {
  const dayKey = getTodayKey();
  ensureDietDay(dayKey);

  appState.diet.entries[dayKey].items.push(item);

  saveState();
  renderDietUI();
}

function removeDietItem(index) {
  const dayKey = getTodayKey();
  ensureDietDay(dayKey);

  appState.diet.entries[dayKey].items.splice(index, 1);

  saveState();
  renderDietUI();
}

function addWater(ml) {
  const dayKey = getTodayKey();
  ensureDietDay(dayKey);

  appState.diet.entries[dayKey].waterMl += ml;

  saveState();
  renderDietUI();
}

function computeDietTotals(dayKey) {
  ensureDietDay(dayKey);

  const items = appState.diet.entries[dayKey].items;

  const totals = items.reduce((acc, it) => {
    acc.calories += Number(it.calories) || 0;
    acc.protein += Number(it.protein) || 0;
    acc.carbs += Number(it.carbs) || 0;
    acc.fats += Number(it.fats) || 0;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

  totals.waterMl = appState.diet.entries[dayKey].waterMl || 0;

  // arredonda para exibição
  totals.calories = Math.round(totals.calories);
  totals.protein = Math.round(totals.protein);
  totals.carbs = Math.round(totals.carbs);
  totals.fats = Math.round(totals.fats);
  totals.waterMl = Math.round(totals.waterMl);

  return totals;
}

function renderDietUI() {
  // Se a section não existe (ex: versão antiga do HTML), não quebra
  if (!dietListEl) return;

  const dayKey = getTodayKey();
  ensureDietDay(dayKey);

  if (dietTodayEl) dietTodayEl.textContent = dayKey;

  const totals = computeDietTotals(dayKey);

  // Targets vindos do Health Engine (se existir)
  const macros = appState.health?.results?.macros || {};
  const waterTarget = appState.health?.results?.water || 0;

  const targetCalories = macros.calories || 0;
  const targetProtein = macros.protein || 0;
  const targetCarbs = macros.carbs || 0;
  const targetFats = macros.fats || 0;

  // Totais
  document.getElementById("dietTotalCalories").textContent = totals.calories;
  document.getElementById("dietTotalProtein").textContent = totals.protein;
  document.getElementById("dietTotalCarbs").textContent = totals.carbs;
  document.getElementById("dietTotalFats").textContent = totals.fats;
  document.getElementById("dietWaterConsumed").textContent = totals.waterMl;

  // Targets
  document.getElementById("dietTargetCalories").textContent = targetCalories ? targetCalories : "-";
  document.getElementById("dietTargetProtein").textContent = targetProtein ? targetProtein : "-";
  document.getElementById("dietTargetCarbs").textContent = targetCarbs ? targetCarbs : "-";
  document.getElementById("dietTargetFats").textContent = targetFats ? targetFats : "-";
  document.getElementById("dietWaterTarget").textContent = waterTarget ? waterTarget : "-";

  // Lista
  dietListEl.innerHTML = "";

  const items = appState.diet.entries[dayKey].items;

  if (!items.length) {
    const empty = document.createElement("p");
    empty.style.opacity = "0.75";
    empty.textContent = "Nenhum item registrado hoje.";
    dietListEl.appendChild(empty);
    return;
  }

  items.forEach((it, idx) => {
    const row = document.createElement("div");
    row.className = "exercise-item"; // reaproveita o estilo atual de item

    row.innerHTML = `
      <div>
        <strong>${it.name || "Item"}</strong>
        <br>
        <small>${it.qty || ""}</small>
        <br>
        <small>
          ${Number(it.calories) || 0} kcal • P ${Number(it.protein) || 0}g • C ${Number(it.carbs) || 0}g • G ${Number(it.fats) || 0}g
        </small>
      </div>
      <button data-index="${idx}">Remover</button>
    `;

    row.querySelector("button").onclick = () => removeDietItem(idx);
    dietListEl.appendChild(row);
  });
}


// ==========================
// DIET EVENTS
// ==========================

if (addFoodBtn) {
  addFoodBtn.addEventListener("click", () => {

    const name = (foodNameInput.value || "").trim();
    if (!name) {
      alert("Informe o nome do alimento.");
      return;
    }

    const item = {
      name,
      qty: (foodQtyInput.value || "").trim(),
      calories: parseFloat(foodCaloriesInput.value) || 0,
      protein: parseFloat(foodProteinInput.value) || 0,
      carbs: parseFloat(foodCarbsInput.value) || 0,
      fats: parseFloat(foodFatsInput.value) || 0
    };

    addDietItem(item);

    foodNameInput.value = "";
    foodQtyInput.value = "";
    foodCaloriesInput.value = "";
    foodProteinInput.value = "";
    foodCarbsInput.value = "";
    foodFatsInput.value = "";
  });
}

if (addWaterBtn) {
  addWaterBtn.addEventListener("click", () => {
    const ml = parseInt(waterAddInput.value) || 0;
    if (ml <= 0) {
      alert("Informe um valor de água em ml.");
      return;
    }
    addWater(ml);
    waterAddInput.value = "";
  });
}

    appState.health.profile.height = parseFloat(heightInput.value) || null;
    appState.health.profile.age = parseInt(ageInput.value) || null;
    appState.health.profile.sex = sexInput.value;
    appState.health.profile.activity = parseFloat(activityInput.value);
    appState.health.profile.goal = goalInput.value;

    calculateHealthMetrics();

    saveState();
    renderHealthUI();
  });
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


