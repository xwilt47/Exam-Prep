/**
 * app.js
 * Main entry point for the KCNA study app.
 * Wires up DOM references, instantiates the DatasetLoader, FlashcardController,
 * and QuizController, then registers all event listeners before booting with
 * initStudyData().
 */
import DatasetLoader from './lib/DatasetLoader.js';
import FlashcardController from './lib/FlashcardController.js';
import QuizController from './lib/QuizController.js';
import { shuffleArray } from './lib/utils.js';

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------
const introScreen      = document.getElementById("introScreen");
const studyScreen      = document.getElementById("studyScreen");
const introStatus      = document.getElementById("introStatus");
const studyStatus      = document.getElementById("studyStatus");
const quizExplanation  = document.getElementById("quizExplanation");
const cardCount        = document.getElementById("cardCount");
const quizCount        = document.getElementById("quizCount");
const progressText     = document.getElementById("progressText");
const helperText       = document.getElementById("helperText");
const questionText     = document.getElementById("questionText");
const answerText       = document.getElementById("answerText");
const quizQuestionText = document.getElementById("quizQuestionText");
const quizOptions      = document.getElementById("quizOptions");
const quizWrap         = document.getElementById("quizWrap");
const quizResultBadge  = document.getElementById("quizResultBadge");
const flashcardEl      = document.getElementById("flashcard");
const startButton      = document.getElementById("startButton");
const quizButton       = document.getElementById("quizButton");
const backButton       = document.getElementById("backButton");
const prevButton       = document.getElementById("prevButton");
const nextButton       = document.getElementById("nextButton");
const flashcardSelectWrap = document.getElementById("flashcardSelectWrap");
const flashcardSelect     = document.getElementById("flashcardSelect");
const quizSelectWrap      = document.getElementById("quizSelectWrap");
const quizSelect          = document.getElementById("quizSelect");
const quizCountSelect     = document.getElementById("quizCountSelect");
const flashcardShuffle    = document.getElementById("flashcardShuffle");
const quizShuffle         = document.getElementById("quizShuffle");
const testModeToggle      = document.getElementById("testModeToggle");
const testCounters        = document.getElementById("testCounters");
const correctCountSpan    = document.getElementById("correctCount");
const wrongCountSpan      = document.getElementById("wrongCount");

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------
const loader = new DatasetLoader();

const fcController = new FlashcardController({
  flashcardEl, questionText, answerText,
  progressText, helperText, studyStatus,
  quizExplanation, prevButton, nextButton,
});

const quizController = new QuizController({
  quizQuestionText, quizOptions, quizResultBadge,
  quizExplanation, progressText, helperText,
  studyStatus, prevButton, nextButton,
  correctCountSpan, wrongCountSpan, testModeToggle,
});

// ---------------------------------------------------------------------------
// App state
// ---------------------------------------------------------------------------
let datasets    = { flashcards: [], multipleChoice: [] };
let currentIndex = 0;
let activeMode   = "flashcards";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isTestMode() {
  return Boolean(testModeToggle && testModeToggle.checked);
}

function getMissingDatasetMessage(mode) {
  return mode === "multiple-choice"
    ? "Oops, no multiple-choice JSON was detected. Add multiple-choice.json and reload the page."
    : "Oops, no flashcard JSON was detected. Add flashcards.json and reload the page.";
}

function updateModeButtonState(button, ready) {
  button.disabled = !ready;
  button.classList.toggle("is-ready", ready);
}

function populateSelect(select, entries) {
  select.innerHTML = "";
  entries.forEach((entry, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = entry.label;
    select.appendChild(option);
  });
}

function applySelectedDataset(mode) {
  const isFlashcard = mode === "flashcards";
  const entries = isFlashcard ? datasets.flashcards : datasets.multipleChoice;
  const select  = isFlashcard ? flashcardSelect : quizSelect;
  const entry   = entries[Number(select.value) || 0] || { items: [] };

  if (isFlashcard) {
    fcController.items = entry.items;
    updateModeButtonState(startButton, fcController.ready);
    cardCount.textContent = `${fcController.items.length} flashcards ready`;
  } else {
    quizController.items = entry.items;
    updateModeButtonState(quizButton, quizController.ready);
    quizCount.textContent = `${quizController.items.length} quiz questions ready`;
  }
}

function updateIntroStatus() {
  if (fcController.ready && quizController.ready) {
    introStatus.textContent = "Flashcards and multiple choice are ready.";
  } else if (fcController.ready) {
    introStatus.textContent = `Flashcards are ready. ${getMissingDatasetMessage("multiple-choice")}`;
  } else if (quizController.ready) {
    introStatus.textContent = `Multiple choice is ready. ${getMissingDatasetMessage("flashcards")}`;
  } else {
    introStatus.textContent = "Oops, no study JSON was detected. Add flashcards.json or multiple-choice.json and reload the page.";
  }
}

function updateTestModeUI() {
  const active = isTestMode();
  if (testCounters) {
    testCounters.classList.toggle("hidden", !active || studyScreen.classList.contains("hidden"));
  }
  if (prevButton) {
    prevButton.disabled = Boolean(active && !studyScreen.classList.contains("hidden"));
  }
}

function showStudyError(message) {
  questionText.textContent     = "No questions loaded";
  answerText.textContent       = "Check your JSON file";
  quizQuestionText.textContent = "No questions loaded";
  quizOptions.innerHTML        = "";
  progressText.textContent     = "Card 0 of 0";
  helperText.textContent       = message;
  studyStatus.textContent      = message;
  studyStatus.classList.remove("hidden");
  quizExplanation.classList.add("hidden");
  quizResultBadge.className = "quiz-result hidden";
  flashcardEl.classList.remove("is-flipped");
  flashcardEl.disabled = true;
  prevButton.disabled  = true;
  nextButton.disabled  = true;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
function renderStudyView() {
  flashcardEl.classList.add("hidden");
  quizWrap.classList.add("hidden");
  questionText.textContent = "";
  answerText.textContent   = "";
  flashcardEl.classList.remove("is-flipped");

  if (activeMode === "flashcards") {
    flashcardEl.classList.remove("hidden");
    if (!fcController.render(currentIndex, isTestMode())) {
      showStudyError("Oops, no flashcards are available.");
    }
    return;
  }

  quizWrap.classList.remove("hidden");
  if (!quizController.render(currentIndex, isTestMode())) {
    showStudyError(getMissingDatasetMessage("multiple-choice"));
  }
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
function getActiveLength() {
  return activeMode === "flashcards"
    ? fcController.items.length
    : quizController.items.length;
}

function showNextCard() {
  const len = getActiveLength();
  if (len === 0) return;
  currentIndex = currentIndex === len - 1 ? 0 : currentIndex + 1;
  renderStudyView();
}

function showPreviousCard() {
  if (getActiveLength() === 0 || currentIndex === 0) return;
  currentIndex -= 1;
  renderStudyView();
}

// ---------------------------------------------------------------------------
// Screen transitions
// ---------------------------------------------------------------------------
function goToStudyMode(mode) {
  activeMode   = mode;
  currentIndex = 0;
  introScreen.classList.add("hidden");
  studyScreen.classList.remove("hidden");

  if (isTestMode()) quizController.resetScore();

  updateTestModeUI();

  if (mode === "flashcards" && fcController.ready) {
    if (flashcardShuffle.checked) fcController.items = shuffleArray(fcController.items);
    nextButton.disabled = false;
    renderStudyView();
  } else if (mode === "multiple-choice" && quizController.ready) {
    const pool       = quizShuffle.checked ? shuffleArray(quizController.items) : [...quizController.items];
    const countValue = quizCountSelect.value;
    quizController.items = countValue === "all" ? pool : pool.slice(0, Number(countValue));
    nextButton.disabled = false;
    renderStudyView();
  } else {
    showStudyError(getMissingDatasetMessage(mode));
  }
}

function goToIntroMode() {
  studyScreen.classList.add("hidden");
  introScreen.classList.remove("hidden");
  updateTestModeUI();
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------
async function initStudyData() {
  const { flashcards: fcSets, multipleChoice: mcSets } = await loader.loadStudyData();

  datasets.flashcards     = fcSets;
  datasets.multipleChoice = mcSets;

  populateSelect(flashcardSelect, datasets.flashcards);
  populateSelect(quizSelect, datasets.multipleChoice);

  flashcardSelectWrap.classList.toggle("hidden", datasets.flashcards.length <= 1);
  quizSelectWrap.classList.toggle("hidden", datasets.multipleChoice.length <= 1);

  applySelectedDataset("flashcards");
  applySelectedDataset("multiple-choice");
  updateIntroStatus();

  if (fcController.ready) {
    activeMode = "flashcards";
    renderStudyView();
  } else if (quizController.ready) {
    activeMode = "multiple-choice";
    renderStudyView();
  } else {
    showStudyError("Oops, no study JSON was detected.");
  }
}

// ---------------------------------------------------------------------------
// Event listeners
// ---------------------------------------------------------------------------
flashcardEl.addEventListener("click", () => {
  if (activeMode !== "flashcards" || !fcController.ready) return;
  fcController.flip(flashcardEl, helperText);
});

flashcardSelect.addEventListener("change", () => {
  applySelectedDataset("flashcards");
  updateIntroStatus();
});

quizSelect.addEventListener("change", () => {
  applySelectedDataset("multiple-choice");
  updateIntroStatus();
});

if (testModeToggle) {
  testModeToggle.addEventListener("change", () => {
    if (testModeToggle.checked) quizController.resetScore();
    updateTestModeUI();
  });
}

startButton.addEventListener("click", () => goToStudyMode("flashcards"));
quizButton.addEventListener("click",  () => goToStudyMode("multiple-choice"));
backButton.addEventListener("click",  goToIntroMode);
nextButton.addEventListener("click",  showNextCard);
prevButton.addEventListener("click",  showPreviousCard);

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
initStudyData();