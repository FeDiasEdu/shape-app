document.addEventListener("DOMContentLoaded", function () {

  const workoutsData = {
    dia1: [
      "Supino Inclinado Halteres – 26kg",
      "Chest Press – 40kg",
      "Crossover Baixo → Alto – 7kg",
      "Crucifixo Máquina – 60kg",
      "Tríceps Corda – 17,5–21kg",
      "Tríceps Testa – 25kg"
    ],
    dia2: [
      "Puxada Neutra – 60kg",
      "Remada Cabo – 24kg",
      "Pulldown – 26kg",
      "Rosca Scott – 25kg",
      "Rosca Martelo – 12kg"
    ],
    dia3: [
      "Stiff",
      "Flexora Deitada",
      "Flexora Unilateral – 10kg",
      "Glute Bridge"
    ],
    dia4: [
      "Elevação Lateral – 12kg",
      "Elevação Cabo",
      "Crucifixo Invertido – 5kg",
      "Desenvolvimento Halteres"
    ],
    dia5: [
      "Agachamento Smith – 80kg",
      "Leg Press – 200kg",
      "Extensora – 57kg",
      "Panturrilha – 190kg"
    ]
  };

  let workoutHistory = JSON.parse(localStorage.getItem("history")) || [];

  const selector = document.getElementById("daySelector");
  const exerciseList = document.getElementById("exerciseList");
  const historyList = document.getElementById("workoutHistory");

  function renderExercises() {
    const day = selector.value;
    exerciseList.innerHTML = "";

    workoutsData[day].forEach(ex => {
      const div = document.createElement("div");
      div.innerHTML = `
        <label>
          <input type="checkbox"> ${ex}
        </label>
      `;
      exerciseList.appendChild(div);
    });
  }

  function renderHistory() {
    historyList.innerHTML = "";
    workoutHistory.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      historyList.appendChild(li);
    });
  }

  window.finishWorkout = function () {
    const date = new Date().toLocaleDateString();
    const dayName = selector.options[selector.selectedIndex].text;
    workoutHistory.push(`${date} – ${dayName}`);
    localStorage.setItem("history", JSON.stringify(workoutHistory));
    renderHistory();
    alert("Treino finalizado!");
  };

  selector.addEventListener("change", renderExercises);

  renderExercises();
  renderHistory();
});
