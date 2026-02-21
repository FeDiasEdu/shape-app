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
      photos: [],
      settings: { theme: "dark" }
    };
  }

  function saveState() {
    localStorage.setItem("fitnessAppState", JSON.stringify(appState));
  }

  // ==========================
  // SPLASH FAILSAFE
  // ==========================
  setTimeout(() => {
    const splash = document.getElementById("splashScreen");
    if (splash) splash.style.display = "none";
  }, 2000);

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
        updateDashboardStats();
      };
    });

    updateDashboardStats();
  }

  function updateDashboardStats() {
    document.getElementById("totalWorkouts").textContent =
      Object.values(appState.workouts).reduce((total, day) => total + day.length, 0);
  }

  // ==========================
  // PESO + GRÁFICO
  // ==========================
  const weightInput = document.getElementById("weightInput");
  const addWeightBtn = document.getElementById("addWeightBtn");
  const currentWeightEl = document.getElementById("currentWeight");

  let weightChartInstance = null;

  addWeightBtn.addEventListener("click", () => {

    const value = parseFloat(weightInput.value);
    if (!value) return;

    appState.weights.push({
      date: new Date().toISOString(),
      value
    });

    saveState();
    weightInput.value = "";

    updateDashboardWeight();
    renderWeightChart();
  });

  function updateDashboardWeight() {
    if (appState.weights.length > 0) {
      currentWeightEl.textContent =
        appState.weights[appState.weights.length - 1].value;
    }
  }

  function renderWeightChart() {

    const ctx = document.getElementById("weightChart");
    if (!ctx) return;

    if (weightChartInstance) {
      weightChartInstance.destroy();
    }

    weightChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: appState.weights.map(w =>
          new Date(w.date).toLocaleDateString()
        ),
        datasets: [{
          label: "Peso",
          data: appState.weights.map(w => w.value),
          borderColor: "#00ff88",
          backgroundColor: "rgba(0,255,136,0.2)",
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  updateDashboardWeight();
  renderWeightChart();

  // ==========================
  // FOTOS
  // ==========================
  const photoUpload = document.getElementById("photoUpload");
  const photoGallery = document.getElementById("photoGallery");

  photoUpload.addEventListener("change", function () {

    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {

      const imgData = e.target.result;

      const img = document.createElement("img");
      img.src = imgData;
      img.style.width = "100%";
      img.style.borderRadius = "12px";
      img.style.marginBottom = "10px";

      photoGallery.appendChild(img);

      appState.photos.push(imgData);
      saveState();
    };

    reader.readAsDataURL(file);
  });

  appState.photos.forEach(imgData => {
    const img = document.createElement("img");
    img.src = imgData;
    img.style.width = "100%";
    img.style.borderRadius = "12px";
    img.style.marginBottom = "10px";
    photoGallery.appendChild(img);
  });

  // ==========================
  // MODAL BIBLIOTECA REUTILIZÁVEL
  // ==========================
  function openLibraryManager(type) {

    const isExercise = type === "exercises";
    const list = appState.library[type];

    const modal = document.createElement("div");
    modal.className = "modal show";

    modal.innerHTML = `
      <div class="modal-content">
        <h3>Gerenciar ${isExercise ? "Exercícios" : "Técnicas"}</h3>

        <input type="text" id="newItemInput" placeholder="Novo item..." />

        <div class="modal-list" id="libraryList"></div>

        <div class="modal-actions">
          <button id="closeLibModal">Fechar</button>
          <button id="addLibItem" class="primary">Adicionar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const listContainer = modal.querySelector("#libraryList");
    const input = modal.querySelector("#newItemInput");

    function renderList() {
      listContainer.innerHTML = "";

      list.forEach((item, index) => {
        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        div.innerHTML = `
          <span>${item}</span>
          <button data-index="${index}">X</button>
        `;
        listContainer.appendChild(div);
      });

      listContainer.querySelectorAll("button").forEach(btn => {
        btn.onclick = function () {
          list.splice(this.dataset.index, 1);
          saveState();
          renderList();
        };
      });
    }

    renderList();

    modal.querySelector("#addLibItem").onclick = () => {
      const value = input.value.trim();
      if (!value) return;
      list.push(value);
      input.value = "";
      saveState();
      renderList();
    };

    modal.querySelector("#closeLibModal").onclick = () => {
      document.body.removeChild(modal);
    };
  }

  document.getElementById("manageExercises").onclick = () => {
    openLibraryManager("exercises");
  };

  document.getElementById("manageTechniques").onclick = () => {
    openLibraryManager("techniques");
  };

  // ==========================
  // SERVICE WORKER + UPDATE
  // ==========================
  if ("serviceWorker" in navigator) {

    let newWorker;

    navigator.serviceWorker.register("service-worker.js").then(registration => {

      registration.addEventListener("updatefound", () => {

        newWorker = registration.installing;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            document.getElementById("updateToast").classList.add("show");
          }
        });

      });

    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });

    document.getElementById("updateBtn").onclick = () => {
      if (newWorker) {
        newWorker.postMessage({ type: "SKIP_WAITING" });
      }
    };
  }

  renderExercises();
  updateDashboardStats();

});
