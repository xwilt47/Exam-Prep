const introScreen = document.getElementById("introScreen");
const studyScreen = document.getElementById("studyScreen");
const introStatus = document.getElementById("introStatus");
const studyStatus = document.getElementById("studyStatus");
const quizExplanation = document.getElementById("quizExplanation");
const cardCount = document.getElementById("cardCount");
const quizCount = document.getElementById("quizCount");
const progressText = document.getElementById("progressText");
const helperText = document.getElementById("helperText");
const questionText = document.getElementById("questionText");
const answerText = document.getElementById("answerText");
const quizQuestionText = document.getElementById("quizQuestionText");
const quizOptions = document.getElementById("quizOptions");
const quizWrap = document.getElementById("quizWrap");
const quizResultBadge = document.getElementById("quizResultBadge");
const flashcard = document.getElementById("flashcard");
const startButton = document.getElementById("startButton");
const quizButton = document.getElementById("quizButton");
const backButton = document.getElementById("backButton");
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");
const flashcardSelectWrap = document.getElementById("flashcardSelectWrap");
const flashcardSelect = document.getElementById("flashcardSelect");
const quizSelectWrap = document.getElementById("quizSelectWrap");
const quizSelect = document.getElementById("quizSelect");
const quizCountSelect = document.getElementById("quizCountSelect");
const flashcardShuffle = document.getElementById("flashcardShuffle");
const quizShuffle = document.getElementById("quizShuffle");

let flashcards = [];
let multipleChoiceQuestions = [];
let currentIndex = 0;
let activeMode = "flashcards";
let flashcardsReady = false;
let multipleChoiceReady = false;

let datasets = { flashcards: [], multipleChoice: [] };

function getMissingDatasetMessage(mode) {
  return mode === "multiple-choice"
    ? "Oops, no multiple-choice JSON was detected. Add multiple-choice.json and reload the page."
    : "Oops, no flashcard JSON was detected. Add flashcards.json and reload the page.";
}

function shuffleArray(items) {
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const currentValue = shuffledItems[index];

    shuffledItems[index] = shuffledItems[randomIndex];
    shuffledItems[randomIndex] = currentValue;
  }

  return shuffledItems;
}

function updateModeButtonState(button, isReady) {
  button.disabled = !isReady;
  button.classList.toggle("is-ready", isReady);
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

async function loadDatasetFile(filename, key) {
  const path = `./data/${filename}`;

  try {
    const response = await fetch(path, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // flexible parsing: accept several common shapes
    let items = [];

    if (Array.isArray(data[key])) {
      items = data[key];
    } else if (key === "flashcards") {
      if (Array.isArray(data.flashcard)) items = data.flashcard;
      else if (Array.isArray(data.cards)) items = data.cards;
    } else if (key === "multipleChoice") {
      if (Array.isArray(data.multiple_choice)) items = data.multiple_choice;
      else if (Array.isArray(data.questions)) items = data.questions;
    }

    // if the file itself is just an array, accept that too
    if (!items.length && Array.isArray(data)) {
      items = data;
    }

    const label = typeof data.label === "string" && data.label.trim()
      ? data.label.trim()
      : filename.replace(".json", "");

    if (!items.length) {
      console.warn(`No items found for ${filename} using key '${key}'; parsed keys: ${Object.keys(data).join(", ")}`);
    }

    return { label, file: filename, items };
  } catch (error) {
    console.error(`Unable to load ${path}:`, error);
    return { label: filename.replace(".json", ""), file: filename, items: [] };
  }
}

function updateIntroStatus() {
  if (flashcardsReady && multipleChoiceReady) {
    introStatus.textContent = "Flashcards and multiple choice are ready.";
  } else if (flashcardsReady) {
    introStatus.textContent = `Flashcards are ready. ${getMissingDatasetMessage("multiple-choice")}`;
  } else if (multipleChoiceReady) {
    introStatus.textContent = `Multiple choice is ready. ${getMissingDatasetMessage("flashcards")}`;
  } else {
    introStatus.textContent = "Oops, no study JSON was detected. Add flashcards.json or multiple-choice.json and reload the page.";
  }
}

function applySelectedDataset(mode) {
  const isFlashcard = mode === "flashcards";
  const entries = isFlashcard ? datasets.flashcards : datasets.multipleChoice;
  const select = isFlashcard ? flashcardSelect : quizSelect;
  const selectedIndex = Number(select.value) || 0;
  const entry = entries[selectedIndex] || { items: [] };

  if (isFlashcard) {
    flashcards = entry.items;
    flashcardsReady = flashcards.length > 0;
    updateModeButtonState(startButton, flashcardsReady);
    cardCount.textContent = `${flashcards.length} flashcards ready`;
  } else {
    multipleChoiceQuestions = entry.items;
    multipleChoiceReady = multipleChoiceQuestions.length > 0;
    updateModeButtonState(quizButton, multipleChoiceReady);
    quizCount.textContent = `${multipleChoiceQuestions.length} quiz questions ready`;
  }
}

async function loadStudyData() {
  let index;

  try {
    const resp = await fetch("./data/index.json", { cache: "no-store" });

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    index = await resp.json();

    if (!Array.isArray(index.flashcards) || !Array.isArray(index.multipleChoice)) {
      throw new Error("Invalid index.json structure.");
    }
    console.debug("loadStudyData: loaded index.json", index);
  } catch {
    index = { flashcards: ["flashcards.json"], multipleChoice: ["multiple-choice.json"] };
    console.warn("loadStudyData: failed to load data/index.json, using fallback index", index);
  }

  const [fcSets, mcSets] = await Promise.all([
    Promise.all(index.flashcards.map((f) => loadDatasetFile(`flashcards/${f}`, "flashcards"))),
    Promise.all(index.multipleChoice.map((f) => loadDatasetFile(`multiple_choice/${f}`, "multipleChoice")))
  ]);

  console.debug("loadStudyData: loaded dataset descriptors", {
    flashcards: fcSets.map(s => ({ file: s.file, label: s.label, count: s.items.length })),
    multipleChoice: mcSets.map(s => ({ file: s.file, label: s.label, count: s.items.length }))
  });
  datasets.flashcards = fcSets;
  datasets.multipleChoice = mcSets;

  populateSelect(flashcardSelect, datasets.flashcards);
  populateSelect(quizSelect, datasets.multipleChoice);

  flashcardSelectWrap.classList.toggle("hidden", datasets.flashcards.length <= 1);
  quizSelectWrap.classList.toggle("hidden", datasets.multipleChoice.length <= 1);

  applySelectedDataset("flashcards");
  applySelectedDataset("multiple-choice");

  updateIntroStatus();

  if (flashcardsReady) {
    activeMode = "flashcards";
    renderStudyView();
  } else if (multipleChoiceReady) {
    activeMode = "multiple-choice";
    renderStudyView();
  } else {
    showStudyError("Oops, no study JSON was detected.");
  }
}

function getActiveItems() {
  return activeMode === "flashcards" ? flashcards : multipleChoiceQuestions;
}

function renderFlashcard() {
  const items = getActiveItems();

  if (!flashcardsReady || items.length === 0) {
    showStudyError("Oops, no flashcards are available.");
    return;
  }

  const currentCard = items[currentIndex];
  questionText.textContent = currentCard.question;
  answerText.textContent = currentCard.answer;
  progressText.textContent = `Card ${currentIndex + 1} of ${items.length}`;
  helperText.textContent = "Click the card to reveal the answer.";
  flashcard.classList.remove("is-flipped");
  flashcard.disabled = false;
  studyStatus.classList.add("hidden");
  quizExplanation.classList.add("hidden");
  prevButton.disabled = currentIndex === 0;
  nextButton.textContent = currentIndex === items.length - 1 ? "Restart" : "Next";
}

function renderMultipleChoice() {
  const items = getActiveItems();

  if (!multipleChoiceReady || items.length === 0) {
    showStudyError(getMissingDatasetMessage("multiple-choice"));
    return;
  }

  const currentQuestion = items[currentIndex];
  const shuffledOptions = shuffleArray(
    currentQuestion.options.map((option, index) => ({
      text: option,
      isCorrect: index === currentQuestion.correctIndex
    }))
  );

  quizQuestionText.textContent = currentQuestion.question;
  progressText.textContent = `Question ${currentIndex + 1} of ${items.length}`;
  helperText.textContent = "Choose the best answer.";
  studyStatus.classList.add("hidden");
  quizExplanation.classList.add("hidden");
  quizExplanation.textContent = "";
  quizResultBadge.className = "quiz-result hidden";
  quizResultBadge.textContent = "";
  prevButton.disabled = currentIndex === 0;
  nextButton.textContent = currentIndex === items.length - 1 ? "Restart" : "Next";
  nextButton.disabled = false;

  quizOptions.innerHTML = "";

  shuffledOptions.forEach((option) => {
    const optionButton = document.createElement("button");
    optionButton.type = "button";
    optionButton.className = "quiz-option";
    optionButton.textContent = option.text;
    optionButton.dataset.correct = String(option.isCorrect);
    optionButton.addEventListener("click", () => handleQuizAnswer(optionButton));
    quizOptions.appendChild(optionButton);
  });
}

function renderStudyView() {
  flashcard.classList.add("hidden");
  quizWrap.classList.add("hidden");
  questionText.textContent = "";
  answerText.textContent = "";
  flashcard.classList.remove("is-flipped");

  if (activeMode === "flashcards") {
    flashcard.classList.remove("hidden");
    renderFlashcard();
    return;
  }

  quizWrap.classList.remove("hidden");
  renderMultipleChoice();
}

function handleQuizAnswer(selectedButton) {
  const currentQuestion = multipleChoiceQuestions[currentIndex];
  const optionButtons = [...quizOptions.querySelectorAll(".quiz-option")];
  const correctButton = optionButtons.find((button) => button.dataset.correct === "true");
  const isCorrect = selectedButton.dataset.correct === "true";

  optionButtons.forEach((button) => {
    button.disabled = true;
  });

  if (correctButton) {
    correctButton.classList.add("is-correct");
  }

  if (isCorrect) {
    selectedButton.classList.add("is-correct");
    quizResultBadge.textContent = "✓";
    quizResultBadge.className = "quiz-result is-correct";
    helperText.textContent = "Correct. Use Next to continue.";
    quizExplanation.textContent = currentQuestion.explanation;
  } else {
    selectedButton.classList.add("is-wrong");
    quizResultBadge.textContent = "X";
    quizResultBadge.className = "quiz-result is-wrong";
    helperText.textContent = "Incorrect. Review the explanation, then continue.";
    quizExplanation.textContent = `Correct answer: ${currentQuestion.options[currentQuestion.correctIndex]}. ${currentQuestion.explanation}`;
  }

  quizExplanation.classList.remove("hidden");
}

function showStudyError(message) {
  questionText.textContent = "No questions loaded";
  answerText.textContent = "Check your JSON file";
  quizQuestionText.textContent = "No questions loaded";
  quizOptions.innerHTML = "";
  progressText.textContent = "Card 0 of 0";
  helperText.textContent = message;
  studyStatus.textContent = message;
  studyStatus.classList.remove("hidden");
  quizExplanation.classList.add("hidden");
  quizResultBadge.className = "quiz-result hidden";
  flashcard.classList.remove("is-flipped");
  flashcard.disabled = true;
  prevButton.disabled = true;
  nextButton.disabled = true;
}

function goToStudyMode(mode) {
  activeMode = mode;
  currentIndex = 0;
  introScreen.classList.add("hidden");
  studyScreen.classList.remove("hidden");

  if (mode === "flashcards" && flashcardsReady) {
    if (flashcardShuffle.checked) flashcards = shuffleArray(flashcards);
    nextButton.disabled = false;
    renderStudyView();
  } else if (mode === "multiple-choice" && multipleChoiceReady) {
    const pool = quizShuffle.checked ? shuffleArray(multipleChoiceQuestions) : [...multipleChoiceQuestions];
    const countValue = quizCountSelect.value;
    multipleChoiceQuestions = countValue === "all" ? pool : pool.slice(0, Number(countValue));
    nextButton.disabled = false;
    renderStudyView();
  } else {
    showStudyError(getMissingDatasetMessage(mode));
  }
}

function goToIntroMode() {
  studyScreen.classList.add("hidden");
  introScreen.classList.remove("hidden");
}

function showNextCard() {
  const items = getActiveItems();

  if (items.length === 0) {
    return;
  }

  if (currentIndex === items.length - 1) {
    currentIndex = 0;
  } else {
    currentIndex += 1;
  }

  renderStudyView();
}

function showPreviousCard() {
  const items = getActiveItems();

  if (items.length === 0 || currentIndex === 0) {
    return;
  }

  currentIndex -= 1;
  renderStudyView();
}

flashcard.addEventListener("click", () => {
  if (activeMode !== "flashcards" || !flashcardsReady) {
    return;
  }

  const isFlipped = flashcard.classList.toggle("is-flipped");
  helperText.textContent = isFlipped ? "Answer revealed. Use Next to continue." : "Click the card to reveal the answer.";
});

flashcardSelect.addEventListener("change", () => {
  applySelectedDataset("flashcards");
  updateIntroStatus();
});

quizSelect.addEventListener("change", () => {
  applySelectedDataset("multiple-choice");
  updateIntroStatus();
});

startButton.addEventListener("click", () => goToStudyMode("flashcards"));
quizButton.addEventListener("click", () => goToStudyMode("multiple-choice"));
backButton.addEventListener("click", goToIntroMode);
nextButton.addEventListener("click", showNextCard);
prevButton.addEventListener("click", showPreviousCard);

// Initialize: load datasets and prepare the intro screen
loadStudyData();

loadStudyData();