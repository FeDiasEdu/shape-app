document.addEventListener("DOMContentLoaded", function () {

  // =====================================================
  // INITIAL STATE (v3) — MIGRAÇÃO SEGURA + DEFAULTS
  // =====================================================

  let appState = loadState();

  function loadState() {
    const saved = localStorage.getItem("fitnessAppState");

    const defaultState = {
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
      weights: [], // [{date:"YYYY-MM-DD", value:Number}]
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
      diet: {
        entries: {} // { "YYYY-MM-DD": { items:[...], waterMl:Number } }
      },
      photos: [], // [{ id, date, dataUrl }]
      settings: { theme: "dark" }
    };

    if (!saved) return defaultState;

    const parsed = JSON.parse(saved);

    // -------- MIGRAÇÕES --------
    if (!parsed.version || parsed.version < 3) parsed.version = 3;

    // library defaults
    if (!parsed.library) parsed.library = defaultState.library;
    if (!Array.isArray(parsed.library.exercises) || !parsed.library.exercises.length) parsed.library.exercises = defaultState.library.exercises;
    if (!Array.isArray(parsed.library.techniques) || !parsed.library.techniques.length) parsed.library.techniques = defaultState.library.techniques;

    // weights: number[] => [{date,value}]
    if (Array.isArray(parsed.weights) && parsed.weights.length > 0) {
      if (typeof parsed.weights[0] === "number") {
        const today = new Date().toISOString().split("T")[0];
        parsed.weights = parsed.weights.map(v => ({ date: today, value: v }));
      }
    } else {
      parsed.weights = [];
    }

    // health
    if (!parsed.health) parsed.health = defaultState.health;
    if (!parsed.health.profile) parsed.health.profile = defaultState.health.profile;
    if (!parsed.health.results) parsed.health.results = defaultState.health.results;

    // diet
    if (!parsed.diet) parsed.diet = defaultState.diet;
    if (!parsed.diet.entries) parsed.diet.entries = {};

    // photos
    if (!Array.isArray(parsed.photos)) parsed.photos = [];

    // workouts
    if (!parsed.workouts) parsed.workouts = {};

    // settings
    if (!parsed.settings) parsed.settings = defaultState.settings;

    localStorage.setItem("fitnessAppState", JSON.stringify(parsed));
    return parsed;
  }

  function saveState() {
    localStorage.setItem("fitnessAppState", JSON.stringify(appState));
  }

  // =====================================================
  // DRAWER — MANTIDO
  // =====================================================

  const drawer = document.getElementById("adminDrawer");
  const menuToggle = document.getElementById("menuToggle");
  const closeDrawer = document.getElementById("closeDrawer");

  if (menuToggle && drawer) menuToggle.onclick = () => drawer.classList.add("open");
  if (closeDrawer && drawer) closeDrawer.onclick = () => drawer.classList.remove("open");

  // =====================================================
  // NAVBAR (SEÇÕES) — MANTIDO
  // =====================================================

  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".section");

  navItems.forEach(btn => {
    btn.addEventListener("click", function () {
      sections.forEach(sec => sec.classList.remove("active"));
      navItems.forEach(n => n.classList.remove("active"));

      const target = document.getElementById(this.dataset.section);
      if (target) target.classList.add("active");
      this.classList.add("active");
    });
  });

  // =====================================================
  // NUTRITION INTERNAL TABS (Nutrição / Dieta)
  // =====================================================

  const nutritionTabs = document.querySelectorAll(".nutrition-tab");
  const nutritionContents = document.querySelectorAll(".nutrition-content");

  nutritionTabs.forEach(tab => {
    tab.addEventListener("click", function () {
      nutritionTabs.forEach(t => t.classList.remove("active"));
      nutritionContents.forEach(c => c.classList.remove("active"));

      this.classList.add("active");
      const target = document.getElementById(this.dataset.tab);
      if (target) target.classList.add("active");
    });
  });

  // =====================================================
  // WORKOUTS — DAY SELECTOR (RESTAURADO)
  // =====================================================

  const daySelector = document.getElementById("daySelector");
  const days = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];

  if (daySelector) {
    daySelector.innerHTML = "";
    days.forEach(day => {
      const option = document.createElement("option");
      option.value = day;
      option.textContent = day;
      daySelector.appendChild(option);
    });

    // define padrão baseado no dia atual
    const jsDay = new Date().getDay(); // 0 domingo ... 6 sábado
    const defaultDay = jsDay === 0 ? "Domingo" : days[jsDay - 1];
    daySelector.value = defaultDay;

    daySelector.addEventListener("change", renderExercises);
  }

  function renderExercises() {
    const container = document.getElementById("exerciseContainer");
    if (!container || !daySelector) return;

    container.innerHTML = "";
    const selectedDay = daySelector.value;

    if (!appState.workouts[selectedDay]) appState.workouts[selectedDay] = [];

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
        appState.workouts[selectedDay].splice(Number(this.dataset.index), 1);
        saveState();
        renderExercises();
      };
    });
  }

  // =====================================================
  // MODAL EXERCÍCIO — RESTAURADO
  // =====================================================

  const modal = document.getElementById("exerciseModal");
  const exerciseListEl = document.getElementById("exerciseList");
  const techniqueListEl = document.getElementById("techniqueList");
  const exerciseSearch = document.getElementById("exerciseSearch");
  const techniqueSearch = document.getElementById("techniqueSearch");
  const selectedExerciseBox = document.getElementById("selectedExerciseBox");
  const selectedTechniqueBox = document.getElementById("selectedTechniqueBox");

  let selectedExercise = null;
  let selectedTechnique = null;

  const addExerciseBtn = document.getElementById("addExerciseBtn");
  const cancelExerciseBtn = document.getElementById("cancelExercise");
  const saveExerciseBtn = document.getElementById("saveExercise");
  const clearSelectionBtn = document.getElementById("clearSelection");

  if (addExerciseBtn) {
    addExerciseBtn.onclick = function () {
      selectedExercise = null;
      selectedTechnique = null;
      if (exerciseSearch) exerciseSearch.value = "";
      if (techniqueSearch) techniqueSearch.value = "";

      updateSelectedExerciseBox();
      updateSelectedTechniqueBox();

      renderExerciseOptions();
      renderTechniqueOptions();

      if (modal) modal.classList.add("show");
    };
  }

  if (cancelExerciseBtn) {
    cancelExerciseBtn.onclick = function () {
      if (modal) modal.classList.remove("show");
    };
  }

  if (exerciseSearch) {
    exerciseSearch.addEventListener("input", e => renderExerciseOptions(e.target.value));
  }
  if (techniqueSearch) {
    techniqueSearch.addEventListener("input", e => renderTechniqueOptions(e.target.value));
  }

  function renderExerciseOptions(filter = "") {
    if (!exerciseListEl) return;
    exerciseListEl.innerHTML = "";

    let filtered = appState.library.exercises
      .filter(ex => ex.toLowerCase().includes(filter.toLowerCase()));

    if (selectedExercise) {
      filtered = [selectedExercise, ...filtered.filter(ex => ex !== selectedExercise)];
    }

    filtered.forEach(ex => {
      const div = document.createElement("div");
      div.textContent = ex;
      if (selectedExercise === ex) div.classList.add("selected");

      div.onclick = () => {
        selectedExercise = ex;
        if (exerciseSearch) exerciseSearch.value = "";
        updateSelectedExerciseBox();
        renderExerciseOptions();
      };

      exerciseListEl.appendChild(div);
    });
  }

  function renderTechniqueOptions(filter = "") {
    if (!techniqueListEl) return;
    techniqueListEl.innerHTML = "";

    let filtered = appState.library.techniques
      .filter(t => t.toLowerCase().includes(filter.toLowerCase()));

    if (selectedTechnique) {
      filtered = [selectedTechnique, ...filtered.filter(t => t !== selectedTechnique)];
    }

    filtered.forEach(t => {
      const div = document.createElement("div");
      div.textContent = t;
      if (selectedTechnique === t) div.classList.add("selected");

      div.onclick = () => {
        selectedTechnique = t;
        if (techniqueSearch) techniqueSearch.value = "";
        updateSelectedTechniqueBox();
        renderTechniqueOptions();
      };

      techniqueListEl.appendChild(div);
    });
  }

  function updateSelectedExerciseBox() {
    if (!selectedExerciseBox) return;
    if (selectedExercise) {
      selectedExerciseBox.textContent = "Selecionado: " + selectedExercise;
      selectedExerciseBox.classList.remove("hidden");
    } else {
      selectedExerciseBox.classList.add("hidden");
    }
  }

  function updateSelectedTechniqueBox() {
    if (!selectedTechniqueBox) return;
    if (selectedTechnique) {
      selectedTechniqueBox.textContent = "Técnica: " + selectedTechnique;
      selectedTechniqueBox.classList.remove("hidden");
    } else {
      selectedTechniqueBox.classList.add("hidden");
    }
  }

  if (clearSelectionBtn) {
    clearSelectionBtn.onclick = function () {
      selectedExercise = null;
      selectedTechnique = null;
      if (exerciseSearch) exerciseSearch.value = "";
      if (techniqueSearch) techniqueSearch.value = "";
      updateSelectedExerciseBox();
      updateSelectedTechniqueBox();
      renderExerciseOptions();
      renderTechniqueOptions();
    };
  }

  if (saveExerciseBtn) {
    saveExerciseBtn.onclick = function () {
      if (!selectedExercise) {
        alert("Selecione um exercício.");
        return;
      }

      if (!daySelector) return;
      const day = daySelector.value;

      if (!appState.workouts[day]) appState.workouts[day] = [];

      appState.workouts[day].push({
        exercise: selectedExercise,
        technique: selectedTechnique
      });

      saveState();
      renderExercises();
      if (modal) modal.classList.remove("show");
    };
  }

  // =====================================================
  // WEIGHT SYSTEM — por dia + gráfico responsivo
  // =====================================================

  let weightChartInstance = null;

  function getTodayKey() {
    return new Date().toISOString().split("T")[0];
  }

  function addOrUpdateWeight(value) {
    if (!value || isNaN(value)) return;

    const today = getTodayKey();
    const idx = appState.weights.findIndex(w => w.date === today);

    if (idx !== -1) appState.weights[idx].value = value;
    else appState.weights.push({ date: today, value });

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

  function formatDateShort(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }

  function renderWeightUI() {
    const currentWeightSpan = document.getElementById("currentWeight");
    if (!currentWeightSpan) return;

    if (!appState.weights.length) {
      currentWeightSpan.textContent = "-";
      renderWeightChart([]);
      return;
    }

    const sorted = [...appState.weights].sort((a, b) => new Date(a.date) - new Date(b.date));
    const last = sorted[sorted.length - 1].value;

    currentWeightSpan.textContent = last;

    // garante sync para Nutrição
    appState.health.profile.weight = last;

    renderWeightChart(sorted);
  }

  function renderWeightChart(data) {
    const canvas = document.getElementById("weightChart");
    if (!canvas || typeof Chart === "undefined") return;

    // reduz altura no mobile (sem depender de CSS)
    canvas.height = 220;

    if (weightChartInstance) weightChartInstance.destroy();

    if (!data.length) return;

    const labels = data.map(d => formatDateShort(d.date));
    const values = data.map(d => d.value);

    weightChartInstance = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Peso (kg)",
          data: values,
          borderColor: "#00ff88",
          backgroundColor: "rgba(0,255,136,0.12)",
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { ticks: { color: "#aaa" }, grid: { display: false } },
          y: { ticks: { color: "#aaa" }, grid: { color: "rgba(255,255,255,0.06)" } }
        }
      }
    });
  }

  // =====================================================
  // HEALTH ENGINE + UI (Salvar Perfil funcionando)
  // =====================================================

  function calculateHealthMetrics() {
    const p = appState.health.profile;
    const r = appState.health.results;

    if (!p.weight || !p.height || !p.age) return;

    const h = p.height / 100;
    const bmi = p.weight / (h * h);

    r.bmi = parseFloat(bmi.toFixed(1));
    if (bmi < 18.5) r.bmiLabel = "Abaixo do peso";
    else if (bmi < 25) r.bmiLabel = "Normal";
    else if (bmi < 30) r.bmiLabel = "Sobrepeso";
    else r.bmiLabel = "Obesidade";

    const tmb = (p.sex === "male")
      ? (10 * p.weight) + (6.25 * p.height) - (5 * p.age) + 5
      : (10 * p.weight) + (6.25 * p.height) - (5 * p.age) - 161;

    r.tmb = Math.round(tmb);
    r.tdee = Math.round(tmb * p.activity);
    r.water = Math.round(p.weight * 35);

    let calories = r.tdee;
    if (p.goal === "cutting") calories -= 400;
    if (p.goal === "bulking") calories += 400;

    r.macros.calories = Math.round(calories);
    r.macros.protein = Math.round(p.weight * 2);
    r.macros.fats = Math.round(p.weight * 0.9);

    const remaining = calories - ((r.macros.protein * 4) + (r.macros.fats * 9));
    r.macros.carbs = Math.max(0, Math.round(remaining / 4));
  }

  const heightInput = document.getElementById("heightInput");
  const ageInput = document.getElementById("ageInput");
  const sexInput = document.getElementById("sexInput");
  const activityInput = document.getElementById("activityInput");
  const goalInput = document.getElementById("goalInput");
  const saveProfileBtn = document.getElementById("saveProfileBtn");

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

  function renderHealthUI() {
    const p = appState.health.profile;
    const r = appState.health.results;

    if (heightInput) heightInput.value = p.height ?? "";
    if (ageInput) ageInput.value = p.age ?? "";
    if (sexInput) sexInput.value = p.sex;
    if (activityInput) activityInput.value = String(p.activity);
    if (goalInput) goalInput.value = p.goal;

    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = (value || value === 0) ? value : "-";
    };

    set("bmiResult", r.bmi || "-");
    set("bmiLabel", r.bmiLabel || "-");
    set("tmbResult", r.tmb || "-");
    set("tdeeResult", r.tdee || "-");
    set("waterResult", r.water || "-");

    set("caloriesResult", r.macros.calories || "-");
    set("proteinResult", r.macros.protein || "-");
    set("carbsResult", r.macros.carbs || "-");
    set("fatsResult", r.macros.fats || "-");

    renderDietUI();
  }

  // =====================================================
  // DIET SYSTEM (Adicionar alimento/água funcionando)
  // =====================================================

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
  const addWaterBtn2 = document.getElementById("addWaterBtn");

  function ensureDietDay(dayKey) {
    if (!appState.diet.entries[dayKey]) {
      appState.diet.entries[dayKey] = { items: [], waterMl: 0 };
    }
    if (!Array.isArray(appState.diet.entries[dayKey].items)) {
      appState.diet.entries[dayKey].items = [];
    }
    if (typeof appState.diet.entries[dayKey].waterMl !== "number") {
      appState.diet.entries[dayKey].waterMl = 0;
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
    if (!bar) return;

    if (!target || target <= 0) {
      bar.style.width = "0%";
      bar.classList.remove("over");
      return;
    }

    let percent = (current / target) * 100;
    if (percent > 100) percent = 100;
    bar.style.width = percent + "%";

    if (current > target) bar.classList.add("over");
    else bar.classList.remove("over");
  }

  function renderDietUI() {
    if (!dietListEl) return;

    const dayKey = getTodayKey();
    ensureDietDay(dayKey);

    if (dietTodayEl) dietTodayEl.textContent = dayKey;

    const totals = computeDietTotals(dayKey);

    const macros = appState.health.results.macros || {};
    const waterTarget = appState.health.results.water || 0;

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    setText("dietTotalCalories", Math.round(totals.calories));
    setText("dietTotalProtein", Math.round(totals.protein));
    setText("dietTotalCarbs", Math.round(totals.carbs));
    setText("dietTotalFats", Math.round(totals.fats));
    setText("dietWaterConsumed", Math.round(totals.waterMl));

    setText("dietTargetCalories", macros.calories ? macros.calories : "-");
    setText("dietTargetProtein", macros.protein ? macros.protein : "-");
    setText("dietTargetCarbs", macros.carbs ? macros.carbs : "-");
    setText("dietTargetFats", macros.fats ? macros.fats : "-");
    setText("dietWaterTarget", waterTarget ? waterTarget : "-");

    updateBar("barCalories", totals.calories, macros.calories);
    updateBar("barProtein", totals.protein, macros.protein);
    updateBar("barCarbs", totals.carbs, macros.carbs);
    updateBar("barFats", totals.fats, macros.fats);
    updateBar("barWater", totals.waterMl, waterTarget);

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
      row.className = "exercise-item";
      row.innerHTML = `
        <div>
          <strong>${it.name || "Item"}</strong><br>
          <small>${it.qty || ""}</small><br>
          <small>${Number(it.calories) || 0} kcal • P ${Number(it.protein) || 0}g • C ${Number(it.carbs) || 0}g • G ${Number(it.fats) || 0}g</small>
        </div>
        <button data-index="${idx}">Remover</button>
      `;
      row.querySelector("button").onclick = () => {
        appState.diet.entries[dayKey].items.splice(idx, 1);
        saveState();
        renderDietUI();
      };
      dietListEl.appendChild(row);
    });
  }

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

      const dayKey = getTodayKey();
      ensureDietDay(dayKey);
      appState.diet.entries[dayKey].items.push(item);

      saveState();
      renderDietUI();

      foodNameInput.value = "";
      foodQtyInput.value = "";
      foodCaloriesInput.value = "";
      foodProteinInput.value = "";
      foodCarbsInput.value = "";
      foodFatsInput.value = "";
    });
  }

  if (addWaterBtn2) {
    addWaterBtn2.addEventListener("click", () => {
      const ml = parseInt(waterAddInput.value) || 0;
      if (ml <= 0) {
        alert("Informe um valor de água em ml.");
        return;
      }

      const dayKey = getTodayKey();
      ensureDietDay(dayKey);
      appState.diet.entries[dayKey].waterMl += ml;

      saveState();
      renderDietUI();
      waterAddInput.value = "";
    });
  }

  // =====================================================
  // PHOTOS — SALVAR + GALERIA (LocalStorage)
  // =====================================================

  const photoUpload = document.getElementById("photoUpload");
  const photoGallery = document.getElementById("photoGallery");

  function renderPhotos() {
    if (!photoGallery) return;
    photoGallery.innerHTML = "";

    if (!appState.photos.length) {
      const p = document.createElement("p");
      p.style.opacity = "0.75";
      p.textContent = "Nenhuma foto salva ainda.";
      photoGallery.appendChild(p);
      return;
    }

    appState.photos.slice().reverse().forEach(ph => {
      const wrap = document.createElement("div");
      wrap.className = "card";

      wrap.innerHTML = `
        <img src="${ph.dataUrl}" alt="Foto" style="width:100%; border-radius:12px; margin-bottom:10px;">
        <small style="opacity:.75;">${ph.date}</small>
        <div style="margin-top:10px; display:flex; justify-content:flex-end;">
          <button data-id="${ph.id}">Remover</button>
        </div>
      `;

      wrap.querySelector("button").onclick = () => {
        appState.photos = appState.photos.filter(x => x.id !== ph.id);
        saveState();
        renderPhotos();
      };

      photoGallery.appendChild(wrap);
    });
  }

  if (photoUpload) {
    photoUpload.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      // Aviso de limite do LocalStorage (sem travar)
      if (file.size > 2.5 * 1024 * 1024) {
        alert("Arquivo grande. Para evitar travamentos no LocalStorage, use fotos menores (até ~2MB).");
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;

        // limite de segurança para não explodir storage
        if (appState.photos.length >= 30) {
          appState.photos.shift();
        }

        appState.photos.push({
          id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
          date: new Date().toLocaleDateString("pt-BR"),
          dataUrl
        });

        saveState();
        renderPhotos();
        photoUpload.value = "";
      };

      reader.readAsDataURL(file);
    });
  }

  // =====================================================
  // INIT (ORDEM CERTA)
  // =====================================================

  renderExercises();
  renderWeightUI();

  // se já tem peso, tenta recalcular
  calculateHealthMetrics();
  renderHealthUI();

  renderDietUI();
  renderPhotos();

});
