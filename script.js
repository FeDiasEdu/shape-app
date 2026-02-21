document.addEventListener("DOMContentLoaded", function () {

// =====================================================
// INITIAL STATE (v3)  — MANTIDO + MIGRAÇÃO SEGURA
// =====================================================

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

// =====================================================
// DRAWER — MANTIDO
// =====================================================

const drawer = document.getElementById("adminDrawer");
document.getElementById("menuToggle").onclick = () => drawer.classList.add("open");
document.getElementById("closeDrawer").onclick = () => drawer.classList.remove("open");

// =====================================================
// NAVBAR — MANTIDO
// =====================================================

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

// =====================================================
// SERVICE WORKER UPDATE SYSTEM — RESTAURADO COMPLETO
// =====================================================

if ("serviceWorker" in navigator) {

  navigator.serviceWorker.register("service-worker.js")
    .then(registration => {

      if (registration.waiting) {
        showUpdateToast(registration.waiting);
      }

      registration.addEventListener("updatefound", () => {

        const newWorker = registration.installing;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            showUpdateToast(newWorker);
          }
        });

      });
    });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}

function showUpdateToast(worker) {

  const toast = document.getElementById("updateToast");
  const btn = document.getElementById("updateBtn");

  if (!toast || !btn) return;

  toast.classList.add("show");

  btn.onclick = () => {
    worker.postMessage({ type: "SKIP_WAITING" });
    toast.classList.remove("show");
  };
}

// =====================================================
// SMART WEIGHT SYSTEM + CHART
// =====================================================

let weightChartInstance = null;

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

  const sorted = [...appState.weights].sort((a,b)=> new Date(a.date)-new Date(b.date));
  currentWeightSpan.textContent = sorted[sorted.length-1].value;

  renderWeightChart(sorted);
}

function renderWeightChart(data) {

  const ctx = document.getElementById("weightChart");
  if (!ctx) return;

  if (weightChartInstance) weightChartInstance.destroy();

  weightChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map(d => d.date),
      datasets: [{
        data: data.map(d => d.value),
        borderColor: "#00ff88",
        backgroundColor: "rgba(0,255,136,0.15)",
        tension: 0.4,
        fill: true,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display:false } }
    }
  });
}

// =====================================================
// HEALTH ENGINE
// =====================================================

function calculateHealthMetrics() {

  const p = appState.health.profile;
  const r = appState.health.results;

  if (!p.weight || !p.height || !p.age) return;

  const h = p.height/100;
  const bmi = p.weight/(h*h);

  r.bmi = parseFloat(bmi.toFixed(1));
  r.bmiLabel = bmi <18.5?"Abaixo do peso": bmi<25?"Normal": bmi<30?"Sobrepeso":"Obesidade";

  const tmb = p.sex==="male"
    ? (10*p.weight)+(6.25*p.height)-(5*p.age)+5
    : (10*p.weight)+(6.25*p.height)-(5*p.age)-161;

  r.tmb = Math.round(tmb);
  r.tdee = Math.round(tmb*p.activity);
  r.water = Math.round(p.weight*35);

  let calories = r.tdee;
  if (p.goal==="cutting") calories-=400;
  if (p.goal==="bulking") calories+=400;

  r.macros.calories = calories;
  r.macros.protein = Math.round(p.weight*2);
  r.macros.fats = Math.round(p.weight*0.9);

  const remaining = calories - ((r.macros.protein*4)+(r.macros.fats*9));
  r.macros.carbs = Math.round(remaining/4);
}

function renderHealthUI() {
  renderDietUI();
}

// =====================================================
// DIET + PROGRESS BARS
// =====================================================

function getTodayKey(){
  return new Date().toISOString().split("T")[0];
}

function ensureDietDay(day){
  if(!appState.diet.entries[day])
    appState.diet.entries[day]={items:[],waterMl:0};
}

function computeDietTotals(day){
  ensureDietDay(day);
  const items=appState.diet.entries[day].items;

  const totals=items.reduce((a,i)=>{
    a.calories+=Number(i.calories)||0;
    a.protein+=Number(i.protein)||0;
    a.carbs+=Number(i.carbs)||0;
    a.fats+=Number(i.fats)||0;
    return a;
  },{calories:0,protein:0,carbs:0,fats:0});

  totals.waterMl=appState.diet.entries[day].waterMl||0;
  return totals;
}

function updateBar(id,current,target){
  const bar=document.getElementById(id);
  if(!bar||!target)return;
  let percent=(current/target)*100;
  if(percent>100)percent=100;
  bar.style.width=percent+"%";
  if(current>target)bar.classList.add("over");
  else bar.classList.remove("over");
}

function renderDietUI(){
  const day=getTodayKey();
  const totals=computeDietTotals(day);

  const macros=appState.health.results.macros;
  const waterTarget=appState.health.results.water;

  updateBar("barCalories",totals.calories,macros.calories);
  updateBar("barProtein",totals.protein,macros.protein);
  updateBar("barCarbs",totals.carbs,macros.carbs);
  updateBar("barFats",totals.fats,macros.fats);
  updateBar("barWater",totals.waterMl,waterTarget);
}

// =====================================================
// INIT
// =====================================================

renderWeightUI();
renderHealthUI();

});
