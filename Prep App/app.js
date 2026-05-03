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
const quizCount60Option   = document.getElementById("quizCount60Option");
const timerDisplay        = document.getElementById("timerDisplay");

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
let _timerId = null;
let _remainingSeconds = 0;

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
    // Show the 60-question option only for Mock exam datasets
    try {
      const fileName = (entry.file || '').toLowerCase();
      const isMock = fileName.includes('mock');
      if (quizCount60Option) {
        // hide for desktop, disable for mobile/native pickers
        quizCount60Option.hidden = !isMock;
        quizCount60Option.disabled = !isMock;
        quizCount60Option.setAttribute('aria-hidden', String(!isMock));
        // if 60 was selected but this set doesn't support it, fall back to 20
        if (!isMock && quizCountSelect.value === '60') quizCountSelect.value = '20';
      }
    } catch (e) {
      // ignore
    }
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
  if (timerDisplay) {
    // only keep timer visible when in test mode and study screen is active
    timerDisplay.classList.toggle("hidden", !active || studyScreen.classList.contains("hidden") || _remainingSeconds <= 0);
  }
  if (prevButton) {
    prevButton.disabled = Boolean(active && !studyScreen.classList.contains("hidden"));
  }
}

function _formatTime(sec) {
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function startTimer(seconds) {
  if (!timerDisplay) return;
  clearInterval(_timerId);
  _remainingSeconds = seconds;
  timerDisplay.textContent = _formatTime(_remainingSeconds);
  timerDisplay.classList.remove('hidden');
  _timerId = setInterval(() => {
    _remainingSeconds -= 1;
    if (_remainingSeconds <= 0) {
      clearInterval(_timerId);
      _timerId = null;
      timerDisplay.textContent = '00:00';
      // when timer finishes, disable navigation and show message
      nextButton.disabled = true;
      if (studyStatus) {
        studyStatus.textContent = 'Time is up. Test ended.';
        studyStatus.classList.remove('hidden');
      }
      return;
    }
    timerDisplay.textContent = _formatTime(_remainingSeconds);
  }, 1000);
}

function stopTimer() {
  if (_timerId) {
    clearInterval(_timerId);
    _timerId = null;
  }
  _remainingSeconds = 0;
  if (timerDisplay) {
    timerDisplay.classList.add('hidden');
    timerDisplay.textContent = '';
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
    const pool = quizShuffle.checked ? shuffleArray(quizController.items) : [...quizController.items];
    const countValue = quizCountSelect.value;
    const selectedEntry = datasets.multipleChoice[Number(quizSelect.value) || 0] || { file: '', items: [] };

    // Special-case: 60-question Mock Exam selection triggers 90-minute test timer
    if (countValue === 'all') {
      quizController.items = pool;
      stopTimer();
    } else if (countValue === '60' && selectedEntry.file && selectedEntry.file.toLowerCase().includes('mock')) {
      // take up to 60 random questions from the Mock_Exam pool
      quizController.items = pool.slice(0, Math.min(60, pool.length));
      if (isTestMode()) startTimer(90 * 60); // 90 minutes
    } else {
      quizController.items = pool.slice(0, Number(countValue));
      stopTimer();
    }

    nextButton.disabled = false;
    renderStudyView();
  } else {
    showStudyError(getMissingDatasetMessage(mode));
  }
}

function goToIntroMode() {
  studyScreen.classList.add("hidden");
  introScreen.classList.remove("hidden");
  stopTimer();
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
  stopTimer();
});

if (testModeToggle) {
  testModeToggle.addEventListener("change", () => {
    if (testModeToggle.checked) quizController.resetScore();
    if (!testModeToggle.checked) stopTimer();
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