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
          macros: { calories: 0, protein: 0, carbs: 0, fats: 0 }
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
        macros: { calories: 0, protein: 0, carbs: 0, fats: 0 }
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
// SMART WEIGHT SYSTEM
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

  const { weight, height, age, sex, activity, goal } = profile;

  if (!weight || !height || !age) return;

  const heightMeters = height / 100;

  const bmi = weight / (heightMeters * heightMeters);
  results.bmi = parseFloat(bmi.toFixed(1));

  if (bmi < 18.5) results.bmiLabel = "Abaixo do peso";
  else if (bmi < 25) results.bmiLabel = "Normal";
  else if (bmi < 30) results.bmiLabel = "Sobrepeso";
  else results.bmiLabel = "Obesidade";

  let tmb = sex === "male"
    ? (10 * weight) + (6.25 * height) - (5 * age) + 5
    : (10 * weight) + (6.25 * height) - (5 * age) - 161;

  results.tmb = Math.round(tmb);

  const tdee = tmb * activity;
  results.tdee = Math.round(tdee);

  results.water = Math.round(weight * 35);

  let targetCalories = tdee;
  if (goal === "cutting") targetCalories -= 400;
  if (goal === "bulking") targetCalories += 400;

  results.macros.calories = Math.round(targetCalories);

  const protein = weight * 2;
  const fats = weight * 0.9;

  results.macros.protein = Math.round(protein);
  results.macros.fats = Math.round(fats);

  const remainingCalories = targetCalories - ((protein * 4) + (fats * 9));
  results.macros.carbs = Math.round(remainingCalories / 4);
}

// ==========================
// HEALTH UI
// ==========================

const heightInput = document.getElementById("heightInput");
const ageInput = document.getElementById("ageInput");
const sexInput = document.getElementById("sexInput");
const activityInput = document.getElementById("activityInput");
const goalInput = document.getElementById("goalInput");
const saveProfileBtn = document.getElementById("saveProfileBtn");

function renderHealthUI() {

  const { profile, results } = appState.health;

  if (heightInput) heightInput.value = profile.height || "";
  if (ageInput) ageInput.value = profile.age || "";
  if (sexInput) sexInput.value = profile.sex;
  if (activityInput) activityInput.value = String(profile.activity);
  if (goalInput) goalInput.value = profile.goal;

  document.getElementById("bmiResult").textContent = results.bmi || "-";
  document.getElementById("bmiLabel").textContent = results.bmiLabel || "-";
  document.getElementById("tmbResult").textContent = results.tmb || "-";
  document.getElementById("tdeeResult").textContent = results.tdee || "-";
  document.getElementById("waterResult").textContent = results.water || "-";

  document.getElementById("caloriesResult").textContent = results.macros.calories || "-";
  document.getElementById("proteinResult").textContent = results.macros.protein || "-";
  document.getElementById("carbsResult").textContent = results.macros.carbs || "-";
  document.getElementById("fatsResult").textContent = results.macros.fats || "-";

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
// DIET SYSTEM
// ==========================

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function ensureDietDay(dayKey) {
  if (!appState.diet.entries[dayKey]) {
    appState.diet.entries[dayKey] = { items: [], waterMl: 0 };
  }
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

  return totals;
}

function updateBar(id, current, target) {
  const bar = document.getElementById(id);
  if (!bar || !target) return;

  let percent = (current / target) * 100;
  if (percent > 100) percent = 100;

  bar.style.width = percent + "%";

  if (current > target) bar.classList.add("over");
  else bar.classList.remove("over");
}

function renderDietUI() {

  const dayKey = getTodayKey();
  ensureDietDay(dayKey);

  const totals = computeDietTotals(dayKey);

  const macros = appState.health.results.macros;
  const waterTarget = appState.health.results.water;

  updateBar("barCalories", totals.calories, macros.calories);
  updateBar("barProtein", totals.protein, macros.protein);
  updateBar("barCarbs", totals.carbs, macros.carbs);
  updateBar("barFats", totals.fats, macros.fats);
  updateBar("barWater", totals.waterMl, waterTarget);
}

// ==========================
// WEIGHT UI + CHART
// ==========================

let weightChartInstance = null;

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
    renderWeightChart([]);
    return;
  }

  // Ordena por data
  const sortedWeights = [...appState.weights].sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  );

  const lastWeight = sortedWeights[sortedWeights.length - 1].value;
  currentWeightSpan.textContent = lastWeight;

  renderWeightChart(sortedWeights);
}

function renderWeightChart(weightData) {

  const ctx = document.getElementById("weightChart");
  if (!ctx) return;

  if (weightChartInstance) {
    weightChartInstance.destroy();
  }

  if (!weightData.length) return;

  const labels = weightData.map(w => formatDate(w.date));
  const values = weightData.map(w => w.value);

  weightChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Peso (kg)",
        data: values,
        borderColor: "#00ff88",
        backgroundColor: "rgba(0,255,136,0.15)",
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: "#00ff88",
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: "#111",
          titleColor: "#00ff88",
          bodyColor: "#fff",
          padding: 10,
          displayColors: false
        }
      },
      scales: {
        x: {
          ticks: {
            color: "#aaa"
          },
          grid: {
            display: false
          }
        },
        y: {
          ticks: {
            color: "#aaa"
          },
          grid: {
            color: "rgba(255,255,255,0.05)"
          }
        }
      }
    }
  });
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  });
}

// ==========================
// INIT
// ==========================

renderWeightUI();
renderHealthUI();

});

