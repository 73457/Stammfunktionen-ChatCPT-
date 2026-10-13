"use strict";

const state = {
  functions: [],
  graphs: [],
  includeFalse: true,
  checked: false
};

const elements = {
  setup: document.querySelector("#setup"),
  exercise: document.querySelector("#exercise"),
  includeFalse: document.querySelector("#include-false"),
  functionCount: document.querySelector("#function-count"),
  start: document.querySelector("#start-button"),
  equations: document.querySelector("#equations-list"),
  graphs: document.querySelector("#graphs-list"),
  graphCount: document.querySelector("#graph-count"),
  progressText: document.querySelector("#progress-text"),
  progressBar: document.querySelector("#progress-bar"),
  status: document.querySelector("#status-message"),
  check: document.querySelector("#check-button"),
  reset: document.querySelector("#reset-button"),
  results: document.querySelector("#results"),
  resultTitle: document.querySelector("#result-title"),
  scorePill: document.querySelector("#score-pill"),
  resultSummary: document.querySelector("#result-summary"),
  feedback: document.querySelector("#feedback-list"),
  newRound: document.querySelector("#new-round-button"),
  changeSettings: document.querySelector("#change-settings-button")
};

const COLORS = ["#315ee8", "#e36b42", "#159a78", "#9a5bd4", "#d39b22"];

// Zufallszahlen und lesbare mathematische Terme
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function choose(items) {
  return items[randomInt(0, items.length - 1)];
}

function shuffle(items) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function formatNumber(value) {
  if (Number.isInteger(value)) {
    return String(value).replace("-", "−");
  }

  return String(Number(value.toFixed(2)))
    .replace(".", ",")
    .replace("-", "−");
}

function formatTerm(coefficient, variable, first = false) {
  if (coefficient === 0) return "";

  const sign = coefficient < 0
    ? "−"
    : (first ? "" : "+ ");

  const absolute = Math.abs(coefficient);
  const number = variable && absolute === 1
    ? ""
    : formatNumber(absolute);

  return `${sign}${number}${variable || ""}`;
}

function polynomialToString(coefficients) {
  // Koeffizienten stehen in absteigender Reihenfolge.
  // Beispiel: [2, -3, 1] bedeutet 2x² - 3x + 1.
  const degree = coefficients.length - 1;
  const pieces = [];

  coefficients.forEach((coefficient, index) => {
    const power = degree - index;

    if (Math.abs(coefficient) < 1e-9) return;

    const variable = power === 0
      ? ""
      : power === 1
        ? "x"
        : `x^${power}`;

    pieces.push(
      formatTerm(coefficient, variable, pieces.length === 0)
    );
  });

  return pieces.length ? pieces.join(" ") : "0";
}

// Berechnet den Funktionswert mit dem Horner-Schema.
function evaluatePolynomial(coefficients, x) {
  return coefficients.reduce(
    (value, coefficient) => value * x + coefficient,
    0
  );
}

// Leitet ein Polynom ab.
function derivative(coefficients) {
  const degree = coefficients.length - 1;

  if (degree <= 0) return [0];

  return coefficients
    .slice(0, -1)
    .map((coefficient, index) =>
      coefficient * (degree - index)
    );
}

// Berechnet eine Stammfunktion inklusive Integrationskonstante.
function antiderivative(coefficients, constant = 0) {
  const degree = coefficients.length - 1;

  const result = coefficients.map(
    (coefficient, index) =>
      coefficient / (degree - index + 1)
  );

  result.push(constant);
  return result;
}

// Erzeugt Funktionen für die beiden Schwierigkeitsgrade.
function createFunction(level) {
  // Level 2 enthält zusätzlich quadratische Funktionen.
  if (level === "hard" && Math.random() < 0.65) {
    const a = choose([-2, -1, 1, 2]);
    const b = randomInt(-3, 3);
    const c = randomInt(-4, 4);

    return {
      coefficients: [a, b, c],
      label: ""
    };
  }

  // Level 1: lineare Funktion f(x) = ax + b.
  const a = choose([-3, -2, -1, 1, 2, 3]);
  const b = randomInt(-4, 4);

  return {
    coefficients: [a, b],
    label: ""
  };
}

// Sorgt dafür, dass die Gleichungen einer Runde verschieden sind.
function makeUniqueFunctions(count, level) {
  const functions = [];
  const used = new Set();
  let attempts = 0;

  while (functions.length < count && attempts < 500) {
    attempts++;

    const fn = createFunction(level);
    const key = fn.coefficients.join(",");

    if (used.has(key)) continue;

    used.add(key);
    fn.label = `f${functions.length + 1}`;
    fn.text =
      `f${functions.length + 1}(x) = ` +
      polynomialToString(fn.coefficients);

    functions.push(fn);
  }

  return functions;
}

function makeGraph(coefficients, targetId, isFalse = false) {
  return {
    id: `g-${Math.random().toString(36).slice(2, 10)}`,
    coefficients,
    targetId,
    isFalse,
    selected: [],
    result: null
  };
}

// Erstellt eine neue Aufgabenrunde.
function buildRound() {
  const level = document.querySelector(
    'input[name="level"]:checked'
  ).value;

  const count = Number(elements.functionCount.value);

  state.includeFalse = elements.includeFalse.checked;
  state.checked = false;
  state.functions = makeUniqueFunctions(count, level);
  state.graphs = [];

  // Für jede Funktion werden mehrere Stammfunktionen erzeugt.
  // Diese unterscheiden sich nur durch die Konstante C.
  state.functions.forEach((fn, index) => {
    const base = antiderivative(fn.coefficients, 0);
    const constants = shuffle([-4, -2, 1, 3, 5]).slice(0, 2);

    constants.forEach((constant) => {
      const coefficients = [...base];
      coefficients[coefficients.length - 1] += constant;

      state.graphs.push(
        makeGraph(coefficients, fn.label)
      );
    });

    // Für jede zweite Funktion gibt es einen dritten passenden Graphen.
    if (index % 2 === 0) {
      const coefficients = [...base];

      coefficients[coefficients.length - 1] +=
        choose([-5, -1, 2, 4]);

      state.graphs.push(
        makeGraph(coefficients, fn.label)
      );
    }
  });

  if (state.includeFalse) {
    const falseCount = Math.max(2, Math.ceil(count * 0.6));

    for (let i = 0; i < falseCount; i++) {
      const source = choose(state.functions);
      let wrongCoefficients;

      if (source.coefficients.length === 2) {
        // Falsche quadratische Stammfunktion.
        wrongCoefficients = [
          choose([-2, -1, 1, 2]) / 2,
          randomInt(-3, 3),
          randomInt(-4, 4)
        ];
      } else {
        // Falsche kubische Stammfunktion.
        wrongCoefficients = [
          choose([-2, -1, 1, 2]) / 3,
          randomInt(-2, 2),
          randomInt(-3, 3),
          randomInt(-4, 4)
        ];
      }

      // Sicherheitsprüfung: Die Ableitung darf keiner
      // der angebotenen Funktionen entsprechen.
      const wrongDerivative = derivative(wrongCoefficients);

      const matchesFunction = state.functions.some(fn =>
        samePolynomial(wrongDerivative, fn.coefficients)
      );

      if (matchesFunction) {
        wrongCoefficients[wrongCoefficients.length - 2] += 2;
      }

      state.graphs.push(
        makeGraph(wrongCoefficients, null, true)
      );
    }
  }

  state.graphs = shuffle(state.graphs);
  renderRound();
}

// Vergleicht zwei Polynome, auch wenn sie unterschiedlich
// viele Koeffizienten enthalten.
function samePolynomial(a, b) {
  const maxLength = Math.max(a.length, b.length);

  for (let i = 0; i < maxLength; i++) {
    const av = a[a.length - maxLength + i] || 0;
    const bv = b[b.length - maxLength + i] || 0;

    if (Math.abs(av - bv) > 1e-8) return false;
  }

  return true;
}

// Zeichnet Gleichungen, Graphen und Auswahlfelder.
function renderRound() {
  elements.setup.classList.add("hidden");
  elements.exercise.classList.remove("hidden");
  elements.results.classList.add("hidden");

  elements.equations.innerHTML = "";
  elements.graphs.innerHTML = "";

  elements.check.disabled = false;
  elements.check.textContent = "Auswertung starten";

  elements.status.textContent = state.includeFalse
    ? "Falsche Graphen dürfen ohne Zuordnung bleiben."
    : "Ordne jeden Graphen einer Gleichung zu, bevor du auswertest.";

  state.functions.forEach(fn => {
    const item = document.createElement("div");
    item.className = "equation-item";

    const label = document.createElement("span");
    label.className = "equation-label";
    label.textContent = fn.label;

    const formula = document.createElement("div");
    formula.className = "equation-formula";
    formula.textContent = fn.text.split(" = ")[1];

    item.append(label, formula);
    elements.equations.append(item);
  });

  state.graphs.forEach((graph, index) => {
    const card = document.createElement("article");
    card.className = "graph-card";
    card.dataset.graphId = graph.id;

    const header = document.createElement("div");
    header.className = "graph-card-header";

    const title = document.createElement("strong");
    title.textContent = `Graph ${index + 1}`;

    const graphTag = document.createElement("span");
    graphTag.className = "small-tag";
    graphTag.textContent = "F(x)";

    header.append(title, graphTag);

    const canvas = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );

    canvas.setAttribute("class", "graph-canvas");
    canvas.setAttribute("viewBox", "0 0 320 194");
    canvas.setAttribute("role", "img");
    canvas.setAttribute(
      "aria-label",
      `Koordinatensystem mit Graph ${index + 1}`
    );

    drawGraph(
      canvas,
      graph.coefficients,
      COLORS[index % COLORS.length]
    );

    const options = document.createElement("div");
    options.className = "graph-options";

    const optionTitle = document.createElement("span");
    optionTitle.className = "graph-options-title";
    optionTitle.textContent = "Welche Funktion gehört dazu?";

    const optionGrid = document.createElement("div");
    optionGrid.className = "assignment-options";

    state.functions.forEach(fn => {
      const label = document.createElement("label");
      label.className = "assignment-option";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = fn.label;
      checkbox.setAttribute(
        "aria-label",
        `Graph ${index + 1} gehört zu ${fn.label}`
      );

      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          graph.selected.push(fn.label);
        } else {
          graph.selected = graph.selected.filter(
            value => value !== fn.label
          );
        }

        graph.result = null;
        card.classList.remove("is-correct", "is-wrong");

        const oldFeedback = card.querySelector(".graph-feedback");
        if (oldFeedback) oldFeedback.remove();

        updateProgress();

        // Wird nach der Auswertung etwas geändert,
        // muss erneut ausgewertet werden.
        if (state.checked) {
          state.checked = false;
          elements.results.classList.add("hidden");
          elements.check.disabled = false;
          elements.check.textContent = "Auswertung starten";
          elements.status.textContent =
            "Deine Auswahl wurde geändert. Werte erneut aus.";
        }
      });

      const text = document.createElement("span");
      text.textContent = fn.label;

      label.append(checkbox, text);
      optionGrid.append(label);
    });

    options.append(optionTitle, optionGrid);
    card.append(header, canvas, options);
    elements.graphs.append(card);
  });

  elements.graphCount.textContent =
    `${state.graphs.length} Graphen`;

  updateProgress();
}

// Zeichnet einen Funktionsgraphen in ein SVG-Koordinatensystem.
function drawGraph(svg, coefficients, color) {
  const width = 320;
  const height = 194;

  const margin = {
    left: 28,
    right: 12,
    top: 12,
    bottom: 24
  };

  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const xMin = -4.5;
  const xMax = 4.5;
  const samples = [];

  for (let i = 0; i <= 120; i++) {
    const x = xMin + (xMax - xMin) * i / 120;

    samples.push({
      x,
      y: evaluatePolynomial(coefficients, x)
    });
  }

  let yMin = Math.min(...samples.map(point => point.y));
  let yMax = Math.max(...samples.map(point => point.y));

  if (!Number.isFinite(yMin) || !Number.isFinite(yMax)) {
    yMin = -5;
    yMax = 5;
  }

  if (Math.abs(yMax - yMin) < 1) {
    yMin -= 2;
    yMax += 2;
  }

  const padding = (yMax - yMin) * 0.12;
  yMin -= padding;
  yMax += padding;

  const sx = x =>
    margin.left + (x - xMin) / (xMax - xMin) * plotWidth;

  const sy = y =>
    margin.top + (yMax - y) / (yMax - yMin) * plotHeight;

  // Vertikales Raster.
  for (let x = -4; x <= 4; x++) {
    addSvg(svg, "line", {
      x1: sx(x),
      y1: margin.top,
      x2: sx(x),
      y2: height - margin.bottom,
      stroke: "#e9edf4",
      "stroke-width": 1
    });
  }

  // Horizontales Raster.
  for (let y = -4; y <= 4; y++) {
    const py = sy(y);

    if (py >= margin.top && py <= height - margin.bottom) {
      addSvg(svg, "line", {
        x1: margin.left,
        y1: py,
        x2: width - margin.right,
        y2: py,
        stroke: "#e9edf4",
        "stroke-width": 1
      });
    }
  }

  // x-Achse, wenn y = 0 im sichtbaren Bereich liegt.
  if (yMin <= 0 && yMax >= 0) {
    addSvg(svg, "line", {
      x1: margin.left,
      y1: sy(0),
      x2: width - margin.right,
      y2: sy(0),
      stroke: "#8d99ad",
      "stroke-width": 1.3
    });
  }

  // y-Achse.
  addSvg(svg, "line", {
    x1: sx(0),
    y1: margin.top,
    x2: sx(0),
    y2: height - margin.bottom,
    stroke: "#8d99ad",
    "stroke-width": 1.3
  });

  // Aus vielen Punkten entsteht eine glatte Kurve.
  const path = samples.map((point, index) =>
    `${index === 0 ? "M" : "L"} ` +
    `${sx(point.x).toFixed(2)} ${sy(point.y).toFixed(2)}`
  ).join(" ");

  addSvg(svg, "path", {
    d: path,
    fill: "none",
    stroke: color,
    "stroke-width": 3,
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  });

  addSvg(svg, "text", {
    x: width - 13,
    y: Math.max(11, Math.min(height - 27, sy(0) - 6)),
    fill: "#66738a",
    "font-size": 10,
    "text-anchor": "end"
  }).textContent = "x";

  addSvg(svg, "text", {
    x: sx(0) + 5,
    y: 13,
    fill: "#66738a",
    "font-size": 10
  }).textContent = "y";
}

// Hilfsfunktion zum Erzeugen von SVG-Elementen.
function addSvg(parent, tag, attributes) {
  const node = document.createElementNS(
    "http://www.w3.org/2000/svg",
    tag
  );

  Object.entries(attributes).forEach(([name, value]) => {
    node.setAttribute(name, value);
  });

  parent.append(node);
  return node;
}

// Aktualisiert die Fortschrittsanzeige.
function updateProgress() {
  const assigned = state.graphs.filter(
    graph => graph.selected.length > 0
  ).length;

  elements.progressText.textContent =
    `${assigned} von ${state.graphs.length} Graphen`;

  elements.progressBar.style.width =
    `${state.graphs.length
      ? assigned / state.graphs.length * 100
      : 0}%`;
}

// Prüft jede Zuordnung und zeigt die Ergebnisse an.
function evaluateRound() {
  const unassigned = state.graphs.filter(
    graph => graph.selected.length === 0
  ).length;

  // Ohne falsche Graphen muss jeder Graph zugeordnet sein.
  if (!state.includeFalse && unassigned > 0) {
    elements.status.textContent =
      `Es fehlen noch Zuordnungen bei ${unassigned} Graph(en). ` +
      "Ordne alle Graphen zu oder aktiviere falsche Graphen " +
      "in den Einstellungen.";
    return;
  }

  let correct = 0;

  state.graphs.forEach(graph => {
    const selected = [...graph.selected].sort();
    const expected = graph.targetId ? [graph.targetId] : [];

    const isCorrect =
      selected.length === expected.length &&
      selected.every((value, index) => value === expected[index]);

    graph.result = isCorrect;

    if (isCorrect) correct++;

    const card = elements.graphs.querySelector(
      `[data-graph-id="${graph.id}"]`
    );

    card.classList.toggle("is-correct", isCorrect);
    card.classList.toggle("is-wrong", !isCorrect);

    const feedback = document.createElement("div");
    feedback.className =
      `graph-feedback ${isCorrect ? "good" : "bad"}`;

    if (isCorrect) {
      feedback.textContent = graph.isFalse
        ? "Richtig: Dieser Graph passt zu keiner Gleichung."
        : `Richtig: gehört zu ${graph.targetId}.`;
    } else if (graph.isFalse && selected.length === 0) {
      feedback.textContent =
        "Noch nicht richtig: Dieser Graph ist ein Ablenker und bleibt leer.";
    } else if (graph.isFalse) {
      feedback.textContent =
        "Nicht ganz: Dieser Graph gehört zu keiner der Gleichungen.";
    } else {
      feedback.textContent =
        `Nicht ganz. Dieser Graph gehört zu ${graph.targetId}.`;
    }

    card.append(feedback);
  });

  const percentage = Math.round(
    correct / state.graphs.length * 100
  );

  elements.scorePill.textContent = `${percentage} %`;

  elements.resultTitle.textContent = percentage === 100
    ? "Perfekt gelöst!"
    : "Das ist dein Ergebnis";

  elements.resultSummary.textContent =
    `${correct} von ${state.graphs.length} Graphen korrekt zugeordnet. ` +
    "Jede Stammfunktion ist nur bis auf eine additive Konstante eindeutig.";

  elements.feedback.innerHTML = "";

  state.graphs.forEach((graph, index) => {
    const item = document.createElement("div");
    item.className =
      `feedback-item ${graph.result ? "good" : "bad"}`;

    const symbol = document.createElement("strong");
    symbol.textContent = graph.result ? "✓" : "!";

    const text = document.createElement("span");

    text.textContent = graph.result
      ? `Graph ${index + 1}: korrekt.`
      : `Graph ${index + 1}: ${
          graph.isFalse
            ? "Ablenker – keine Zuordnung auswählen."
            : `gehört zu ${graph.targetId}.`
        }`;

    item.append(symbol, text);
    elements.feedback.append(item);
  });

  elements.results.classList.remove("hidden");

  elements.status.textContent =
    "Auswertung abgeschlossen. Du kannst deine Auswahl ändern " +
    "oder eine neue Runde starten.";

  elements.check.disabled = true;
  elements.check.textContent = "Ausgewertet";
  state.checked = true;

  elements.results.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

// Entfernt alle bisherigen Zuordnungen.
function resetSelections() {
  state.graphs.forEach(graph => {
    graph.selected = [];
    graph.result = null;
  });

  state.checked = false;
  renderRound();
}

// Ereignisse für die Schaltflächen.
elements.start.addEventListener("click", buildRound);

elements.check.addEventListener("click", evaluateRound);

elements.reset.addEventListener("click", () => {
  resetSelections();
  elements.status.textContent =
    "Alle Zuordnungen wurden zurückgesetzt.";
});

elements.newRound.addEventListener("click", buildRound);

elements.changeSettings.addEventListener("click", () => {
  elements.exercise.classList.add("hidden");
  elements.setup.classList.remove("hidden");
  elements.results.classList.add("hidden");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});