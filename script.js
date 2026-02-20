let weights = JSON.parse(localStorage.getItem("weights")) || [];
let workouts = JSON.parse(localStorage.getItem("workouts")) || [];

function showSection(id) {
  document.querySelectorAll(".section").forEach(sec => {
    sec.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
}

document.getElementById("themeToggle").onclick = () => {
  document.body.classList.toggle("dark");
};

function saveWorkout() {
  const note = document.getElementById("workoutNotes").value;
  if (!note) return;
  workouts.push({ date: new Date().toLocaleDateString(), note });
  localStorage.setItem("workouts", JSON.stringify(workouts));
  document.getElementById("workoutNotes").value = "";
  renderWorkouts();
}

function renderWorkouts() {
  const list = document.getElementById("workoutHistory");
  list.innerHTML = "";
  workouts.forEach(w => {
    const li = document.createElement("li");
    li.textContent = `${w.date} - ${w.note}`;
    list.appendChild(li);
  });
}

function addWeight() {
  const value = document.getElementById("weightInput").value;
  if (!value) return;
  weights.push({ date: new Date().toLocaleDateString(), value: Number(value) });
  localStorage.setItem("weights", JSON.stringify(weights));
  document.getElementById("weightInput").value = "";
  renderChart();
  document.getElementById("currentWeight").textContent = value;
}

function renderChart() {
  const ctx = document.getElementById("weightChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: weights.map(w => w.date),
      datasets: [{
        label: "Peso (kg)",
        data: weights.map(w => w.value),
        borderColor: "blue",
        fill: false
      }]
    }
  });
}

document.getElementById("photoUpload").addEventListener("change", function() {
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = document.createElement("img");
    img.src = e.target.result;
    document.getElementById("photoGallery").appendChild(img);
  };
  reader.readAsDataURL(this.files[0]);
});

renderWorkouts();
renderChart();